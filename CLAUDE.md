# CLAUDE.md

Instructions for Claude Code when working in this repository.

## Model routing

The main session runs on **Opus** (`claude-opus-4-7`) — pinned via `.claude/settings.json` (`"model": "opus"`). Coding/build/test work is delegated to a **Sonnet** subagent named `coder` (defined in `.claude/agents/coder.md`, pinned to `model: sonnet`).

- **Delegate to the `coder` subagent (Sonnet) for:**
  - Writing, editing, or refactoring code (`.astro`, `.ts`, `.js`, `.md`, CSS)
  - Running `npm run dev` / `build` / `preview` and reacting to output
  - Debugging errors, fixing type issues, resolving lint/format problems
  - Content edits to files under `src/content/` (markdown authoring)
  - Bumping dependencies, adjusting config, small tooling changes

  Call via the `Agent` tool with `subagent_type: "coder"`. The subagent's frontmatter pins the model, so you don't need to pass `model`. Give it a self-contained brief (files, exact changes, how to verify) and let it run.

- **Keep in the Opus main session (this thread):**
  - Design and architecture decisions (site structure, component boundaries, data model)
  - Visual design direction, copywriting voice, information architecture
  - Planning a new feature or breaking down an ambiguous request
  - Reviewing the `coder` subagent's output before it lands
  - Anything requiring taste, tradeoff analysis, or reading between the lines of what the user wants

**Rule of thumb:** If the task has one obviously correct outcome and success is verifiable (build passes, test green, file matches spec), delegate to `coder`. If success depends on judgment or the goal itself is fuzzy, do it in this Opus session.

Never switch models silently. If you delegate to `coder`, say so briefly ("Handing the CSS tweak to the coder subagent."). If `coder` hits a decision it can't make on its own, it should surface the question back rather than guess.

## Project shape

- **Stack:** Astro 5 (static output). No React/Vue/etc. — plain `.astro` components.
- **Content:** all long-form content lives as markdown in `src/content/` under two collections defined in `src/content/config.ts`:
  - `services/` — one file per service offered
  - `posts/` — blog posts
- **Site config:** `src/site.config.ts` holds name, tagline, nav, social links. Change branding there, not in individual pages.
- **Styles:** design tokens in `src/styles/global.css` (`--bg`, `--fg`, `--accent`, fonts). Per-component styles use scoped `<style>` blocks inside `.astro` files.
- **Deployment:** `npm run build` produces `dist/` — drop that on any static host (GitHub Pages, Netlify, Cloudflare Pages, S3). No server needed.

## Commands

```bash
npm run dev            # local dev server at http://localhost:4321
npm run build          # produce static site in dist/
npm run preview        # preview the built site locally
```

### Cleaning

Astro caches type declarations and content-collection metadata under `.astro/`, and Vite caches under `node_modules/.vite`. Stale caches occasionally cause "phantom" build errors after refactors (missing types, wrong content schemas, missing components). If a build looks wrong but the code looks right, clean first.

```bash
npm run clean          # remove dist/ and .astro/  (safest, keeps node_modules)
npm run clean:cache    # remove .astro/ and Vite cache only  (fastest reset)
npm run clean:all      # remove dist/, .astro/, node_modules/, package-lock.json  (nuclear)
npm run rebuild        # clean + build              (usual "give me a clean build")
npm run fresh          # clean:all + npm install + build  (dependency issues, mystery bugs)
```

**Which one to reach for:**
- Type or content-collection error that doesn't match reality → `npm run clean:cache`
- Verifying a truly clean production build before deploy → `npm run rebuild`
- `npm install` acting weird, or after major dependency bumps → `npm run fresh`

## Deployment

The site deploys to **GitHub Pages** at `cdan.me` via GitHub Actions. Pipeline: **gitleaks scan → Astro build → GitHub Pages deploy**. Configured in `.github/workflows/deploy.yml`.

### First-time repo setup

```bash
# from the repo root
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin git@github.com:chathudan/cdan.me.git   # or whichever repo name you pick
git push -u origin main
```

Then on GitHub:

1. **Create the repo** at https://github.com/new — name it `cdan.me` (or any name; the custom domain is what matters). Public repo = free Pages hosting.
2. **Repo → Settings → Pages** → *Build and deployment* → **Source: GitHub Actions**. The workflow already exists in `.github/workflows/deploy.yml` and will run on the next push.
3. **Repo → Settings → Pages → Custom domain** → enter `cdan.me`. Also tick *Enforce HTTPS* once GitHub finishes provisioning the TLS cert (usually a few minutes).

The `public/CNAME` file is what tells GitHub Pages which custom domain to serve — Astro copies it to `dist/CNAME` on build. Don't remove it.

### DNS at Cloudflare (cdan.me)

You already manage `cdan.me` on Cloudflare. Add these records:

| Type  | Name  | Content                     | Proxy status  |
|-------|-------|-----------------------------|---------------|
| A     | `@`   | `185.199.108.153`           | DNS only (grey) |
| A     | `@`   | `185.199.109.153`           | DNS only (grey) |
| A     | `@`   | `185.199.110.153`           | DNS only (grey) |
| A     | `@`   | `185.199.111.153`           | DNS only (grey) |
| CNAME | `www` | `chathudan.github.io`       | DNS only (grey) |

**Start with DNS-only (grey cloud)** so GitHub Pages can validate the domain and issue its own TLS cert. Once you see `https://cdan.me` working with a valid GitHub cert, you can flip the proxy on (orange cloud) with Cloudflare SSL mode set to **Full (strict)** — that gives you the Cloudflare CDN + DDoS layer in front of Pages, same pattern you use for `xausd.cdan.me`.

### The workflow in detail

`.github/workflows/deploy.yml` runs three jobs:

1. **scan** — gitleaks against the full history. Fails the workflow if anything sensitive is found.
2. **build** — `npm ci && npm run build`, uploads `dist/` as a Pages artifact.
3. **deploy** — only on `push` to `main` (PRs get scan + build only). Publishes the artifact to Pages.

PRs get validated (scan + build) without deploying — good for reviewing changes before they go live.

### Secret scanning (local + CI)

Two layers, both catch the same categories of secret (private keys, cloud tokens, DB URLs with embedded passwords, `.env`-style credentials, JWTs, etc.):

- **Local pre-commit hook** — `scripts/check-secrets.sh`, wired via husky at `.husky/pre-commit`. Runs on `git commit`. If a pattern matches, the commit is blocked with a description of what was found. Fast (grep-based), no network.
- **CI gitleaks scan** — runs on every push and PR via the `scan` job in the deploy workflow. Uses the mature [gitleaks](https://github.com/gitleaks/gitleaks) rules engine as a deeper backup.

**First-time hook setup:** `npm install` runs husky's `prepare` script, which wires up `.husky/pre-commit` as a git hook. No manual step required.

**Bypass** (only when you're certain the match is a false positive):
```bash
git commit --no-verify
```

If a genuine false positive keeps triggering, tighten the pattern in `scripts/check-secrets.sh` rather than getting used to `--no-verify`.

### Alternate hosts (not currently used, kept for reference)

If you ever want to move off GitHub Pages, `dist/` is a plain static build — works on Cloudflare Pages (`npx wrangler pages deploy dist`), Netlify (drag `dist/` to netlify.com/drop), Vercel, or self-hosted Nginx (see the VPS block below).

### Self-hosted on Linux VPS (matches your existing xausd.cdan.me stack)

Since you already run Nginx + Let's Encrypt + Cloudflare on a private VPS, this is likely the most familiar path.

**One-time server setup:**
```bash
# on the VPS
sudo mkdir -p /var/www/cdan.me
sudo chown -R $USER:$USER /var/www/cdan.me
```

Nginx site config (`/etc/nginx/sites-available/cdan.me`):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name cdan.me www.cdan.me;
    return 301 https://cdan.me$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cdan.me;

    root /var/www/cdan.me;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/cdan.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cdan.me/privkey.pem;

    # Astro writes clean-URL directories, so try file → dir/index.html → 404
    location / {
        try_files $uri $uri/ $uri.html $uri/index.html =404;
    }

    # long-cache built assets, short-cache HTML
    location ~* \.(css|js|woff2?|svg|png|jpg|jpeg|gif|ico|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_types text/css application/javascript text/html image/svg+xml;
}
```
Then:
```bash
sudo ln -s /etc/nginx/sites-available/cdan.me /etc/nginx/sites-enabled/
sudo certbot --nginx -d cdan.me -d www.cdan.me
sudo nginx -t && sudo systemctl reload nginx
```

**Deploy script (run locally):**
```bash
#!/usr/bin/env bash
# save as ./deploy.sh, chmod +x, run after npm run rebuild
set -euo pipefail
npm run rebuild
rsync -avz --delete dist/ user@your-vps-host:/var/www/cdan.me/
```

Point Cloudflare DNS `cdan.me` → your VPS IP (proxied for the CDN + DDoS layer you already use for xausd.cdan.me).

### Any other static host

`dist/` is plain HTML/CSS/JS. It works on Vercel, Render, Surge, S3+CloudFront, Firebase Hosting, and any Nginx / Apache / Caddy box. The only thing to know: the site is built with `build.format: 'directory'` (see `astro.config.mjs`), so URLs are `/about/` not `/about.html`. Any host that serves `about/index.html` for `/about/` will work — which is essentially all of them.

## Conventions

- Prefer editing existing files over adding new ones.
- New service: add a `.md` under `src/content/services/` — no code changes needed.
- New post: add a `.md` under `src/content/posts/` — same.
- If you touch the design tokens in `global.css`, verify the change across home, a service page, and a blog post before calling it done.
- Do not commit `.env`, `dist/`, or `node_modules/`.
