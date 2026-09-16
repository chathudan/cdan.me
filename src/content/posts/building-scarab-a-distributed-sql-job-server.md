---
title: "My report queries kept blocking the app. So I built a job server to get them out of the way."
description: "How a bad afternoon of slow reports turned into Scarab — a .NET distributed SQL job server, a pre-fetch pattern keyed on account id instead of job id, and why every result table lands in Postgres."
date: 2026-09-17
tags: ["dotnet", "engineering", "distributed-systems", "side-projects"]
draft: false
cover: "/images/blog/scarab/cover.png"
coverAlt: "Scarab banner — a stylised scarab beetle rolling a glowing data ball, dark navy background with cyan accents."
coverCaption: "Scarab — queue heavy SQL reports, run them off the request path."
---

Every backend I've worked on eventually grows the same tumor: a "report" endpoint that runs a five-table join over months of data, on the same request thread and the same connection pool as everything else. It's fine for weeks. Then someone runs it during peak traffic and takes the database — and everyone else's requests — down with it.

I got tired of patching around that one query at a time. So I built the thing that gets report queries off the request path entirely.

## The actual problem

Report queries are a different animal from the rest of an app's traffic. They scan far more data, they run far longer, and if you run them inline they hold a request thread and a database connection hostage for the whole time. Add a few concurrent users hitting "export my history" at once and you've turned a report page into an incident.

The fix isn't a faster query (sometimes there isn't one) — it's getting the query off the critical path. Queue it, run it in the background, let the caller poll or come back later.

[Zerodha's DungBeetle](https://github.com/zerodha/dungbeetle) does exactly this in Go, and I liked the shape of it enough to build my own version in C# — partly because I wanted the thing itself, and partly because I wanted to actually understand every part of a distributed job system instead of just consuming one. That became **Scarab**.

<figure>
  <img src="/images/blog/scarab/banner.svg" alt="Scarab banner — a stylised scarab beetle rolling a glowing data ball, dark navy background with cyan accents, next to the Scarab wordmark and tagline 'Distributed SQL job server'." />
  <figcaption>Scarab — rolling SQL jobs the way a dung beetle rolls its ball.</figcaption>
</figure>

## What it does

Three moving pieces:

1. **SQL tasks, not code.** Drop a tagged `.sql` file in a directory and it becomes a queueable, callable task. No controller to write, no migration for the report itself.
2. **A Redis-backed job queue.** Submit a job, get a `job_id` back immediately, a pool of background workers picks it up and runs it against a source database (MSSQL, MySQL, or Postgres).
3. **Ephemeral result tables.** Every job's output lands in its own auto-generated table — schema inferred from the query's own column types, no migration to write for that either.

```sql
-- name: enrollments_by_status_and_category
-- params: status, category
SELECT u.FullName, c.CourseName, e.Status, e.EnrolledAt
FROM Enrollments e
JOIN Users u ON u.UserId = e.UserId
JOIN Courses c ON c.CourseId = e.CourseId
WHERE e.Status = ? AND c.Category = ?
ORDER BY e.EnrolledAt DESC;
```

```bash
curl -X POST /tasks/enrollments_by_status_and_category/jobs \
  -d '{"args": ["completed", "Data"]}'
# => {"job_id": "...", "state": "PENDING"}
```

Poll `/jobs/{id}`, then read `/jobs/{id}/data` once it's `SUCCESS`. That's the whole contract.

## The use case that actually justified building this: account data, pre-fetched

The toy version of this pattern is "submit a job, get a random `job_id`, poll it." The useful version — the one that made me actually want this in production — drops the random id entirely.

Most report-style pages aren't asking for *a* report. They're asking for *this account's* report, for *this* date range: "show me account `A-4471`'s activity from Jan 1 to Mar 31." That request is going to come in again — the same user refreshing the page, a dashboard re-rendering, a support agent pulling the same range twice. There's no reason to re-run the same five-table join every single time.

So instead of letting Scarab hand back a random job id, I derive it deterministically from the thing the request is actually about:

```
job_id = hash(account_id + range_start + range_end)
```

Which turns the whole flow into a pre-fetch cache, for free:

- First request for that account+range: no job exists yet, Scarab queues it, the caller polls until it's `SUCCESS`.
- Every request after that, for as long as the TTL holds: the job already exists, already `SUCCESS`, and `/jobs/{id}/data` returns instantly — no query, no wait, no load on the source database at all.
- A slightly different range is a different hash, which is a different job, which is exactly correct — it's not stale data, it's a genuinely different result.

The account id (or user id, in a multi-tenant setup) stops being metadata about the job and becomes the actual cache key. You get warm, pre-fetched account data without hand-rolling a cache layer on top of the job system — the job system *is* the cache, because the expensive part (running the join) already happened the first time anyone asked.

## Why Postgres is the preferred result destination

Scarab supports MySQL or Postgres as a result backend (MSSQL only as a *source* — no result-table generation there), but Postgres is what I reach for by default, for reasons that turned out to be more operational than technical:

- **No practical ceiling on table count.** Every job gets its own table, named after the job. A busy install can accumulate thousands of these. Some managed databases get twitchy — or start charging differently — past a few hundred tables per schema. Postgres just doesn't care; I've never had to think about it.
- **It's easy to run.** One container, one volume, done. No cluster to reason about for what is, by design, disposable data.
- **Backup is "back up the volume."** Because results live in their own dedicated tables in their own database, the entire results store is exactly one Docker volume. Snapshot it, ship it, attach it to a different container on a different host, and you have a working point-in-time copy of every result table that existed — no export scripts, no special-casing. And because the data is regenerable (worst case, re-run the job), losing it isn't catastrophic either way — but being able to freeze and restore it that cheaply is a nice property to have for free.

None of that is exotic. It's the boring, easy-to-operate choice, which is exactly what you want for a datastore whose entire job is to disappear.

## Honest notes: things I got wrong on the way

**I didn't design for cross-instance cancellation.** Cancelling a running job only works if the API request lands on the same process instance that's executing it — which is fine for a single instance, and a real gap in the "multi-instance priority queue" story the project advertises. Fixed it by making cancellation reach into the shared Redis queue instead of relying on an in-memory token, but it's a good reminder that "distributed" isn't free just because you added a queue.

**A task with no arguments still made you send `{}`.** Small thing, but it's exactly the kind of paper cut that makes an API feel unfinished. An empty body now just means "use the defaults" — no reason to make a caller type two characters of nothing.

**The interactive API docs looked fine and did nothing.** I generate OpenAPI docs and serve them through [Scalar](https://scalar.com), and the "submit a job" endpoint rendered a beautiful documentation page — with no way to actually type a request body, because the handler read the body manually from `HttpContext` and never told OpenAPI what shape to expect. One line (`.Accepts<JobReq>("application/json")`) fixed it. Nothing was broken until I actually tried to *use* the docs I'd generated, which is the same lesson as always: generated documentation is only as honest as the thing it's describing.

<figure>
  <img src="/images/blog/scarab/scalar-demo.gif" alt="Scalar's interactive API docs: submitting a job for the user_progress task with an empty JSON body, getting back a job_id, polling the job's status until it reports SUCCESS, then reading back the result rows — all from the browser." />
  <figcaption>The fixed docs — submit a job, poll its status, read the result rows, without leaving the browser.</figcaption>
</figure>

## The stack

- **Backend:** .NET 10, ASP.NET Core Minimal API
- **Job queue:** Redis (priority queues, ETA scheduling, retries, job groups)
- **Source databases:** MSSQL, MySQL, PostgreSQL
- **Result databases:** MySQL or PostgreSQL — one auto-schema'd table per job
- **API docs:** OpenAPI + Scalar, generated from the route definitions
- **Local orchestration:** Docker Compose or a .NET Aspire AppHost — either one gets you the full stack, seeded with demo data, in one command
- **Tests:** xUnit

## Why any of this matters

None of the individual pieces here are novel — background job queues are decades old, and "cache the expensive query" is not a new idea. What made it worth building was putting them together deliberately: a job id that means something instead of a random token, a result store chosen for how boring it is to operate, and an API that only counts as done once you've actually tried to use it, not just generated docs for it.

If you're carrying a report endpoint that's one bad Tuesday away from taking your database down with it, that's the itch this scratches.

You can see the code at [github.com/chathudan/scarab](https://github.com/chathudan/scarab).
