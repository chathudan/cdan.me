---
title: "I wanted to know if my strategy was actually right. So I built the system to prove it."
description: "How I ended up building a full XAU/USD analysis portal — .NET Core backend, deterministic structure engine, live data, and 5,787 real trades' worth of stress-testing."
date: 2026-09-10
tags: ["trading", "engineering", "dotnet", "side-projects"]
draft: false
cover: "/images/blog/xausd/cover.png"
coverWidth: 1280
coverHeight: 719
coverAlt: "The XAU/USD analysis portal dashboard, showing live market structure, liquidity zones, fair-value gaps, and trade-plan context."
coverCaption: "The portal — live market structure, liquidity, FVG and trade-plan context for gold."
---

> Originally published on [LinkedIn](https://www.linkedin.com/pulse/i-wanted-know-my-strategy-actually-right-so-built-siwanda-hewage-vobwc). Republished here.

I've always learned by building. When I started with forex, I did the usual — hand-marked charts, Pine Script studies on TradingView, printed screenshots covered in arrows. It worked, up to a point. Then one question started nagging at me: *why am I trusting an indicator I can't inspect?*

That question is why I ended up building my own analysis engine from scratch.

## The question that became a system

The real turning point wasn't the reading of the charts. It was backtesting.

Every strategy I could find was tested against a curated historical set — someone else's choice of what "the right conditions" looked like. That's not confidence. Confidence would be pulling live data through APIs and validating strategies against reality as it unfolded — on simulation, against real-time candles, on my own terms.

So I built a system to do exactly that.

## Months in the data

The engine chews through hundreds of thousands of candles since 2018, pulled from the OANDA API and stored in PostgreSQL with time-series extensions on a home server. Months of that work was just cleaning and aligning the data across timeframes. Nothing glamorous — but there's no shortcut if you want an honest test.

## A deliberate call: no machine learning

I chose deterministic structure analysis over ML on purpose.

The system reads five timeframes (H4, H1, M30, M15, M5) across three trading sessions, and every signal it emits has to be traceable to a specific structural read — a liquidity sweep, a fair-value gap, a shift in market structure. If I can't explain *why* it fired, I don't want it firing.

> When your signal comes from objective, explainable market structure, a model that can't tell you why is a liability, not an asset.

## What it does

Three things, in order:

1. **Reads market structure** — multi-timeframe analysis, liquidity sweeps, fair-value gaps, demand/supply zones.
2. **Generates trade plans** — entry zones, hard invalidation, targets, R:R, all graded.
3. **Back-tests and alerts** — live Telegram alerts every 60 seconds with the full plan attached.

Every signal is tagged **Aligned**, **Caution**, or **Conflict**, and the reasoning is written out — no black boxes.

<figure>
  <img src="/images/blog/xausd/plan-forming.png" alt="Trade plan visualization showing entry zone, invalidation level, and TP1/TP2 target zones with the calculated risk-reward ratio, all overlaid on a live candlestick chart." />
  <figcaption>Plan Forming — entry zone, invalidation, TP1/TP2 and R:R, all derived from objective structure.</figcaption>
</figure>

## Interrogating the edge

Once the engine was running, I built the analytics whose whole job was to question the results. Most of that work happened in **Python** — pandas and numpy make iteration fast when you're testing an edge against thousands of setups across multiple charts and timeframes:

- **Prediction calibration** — when the engine says 70%, does it actually hit 70%?
- **Score attribution** — which structural features are pulling their weight, which are noise?
- **Context back-testing** — how does the same setup perform in Asian session vs London vs New York?
- **Signal latency** — how long from setup detection to alert delivery?
- **Excursion analysis** — MAE / MFE, so I know how much heat trades take before resolving.

If the answers to those questions embarrass the system, that's the system telling me the truth. That's the whole point. Calibration runs inside the app itself, so it stays honest as new data comes in.

## Real trading pressure tests

Then I ran **5,787 real trades** through it — matched against actual broker fills.

The result included a $17.3K gross loss. That number looks bad in isolation, so let me be honest about it: it was deliberate stress-testing. Intentionally oversized positions to gather data on execution under real pressure. The losses were usually on winning setups I closed too early. Tuition, paid on purpose.

The system was right more often than I was.

<figure>
  <img src="/images/blog/xausd/execution-analytics.png" alt="Analytics report showing every trade fill graded as Aligned, Weak, or Rejected, with a full breakdown of setup performance versus trader execution." />
  <figcaption>Actual vs System — every fill graded Aligned / Weak / Rejected, with a full setup-vs-trader outcome breakdown.</figcaption>
</figure>

## Trade replay

The portal replays every trade candle-by-candle. That's when the real lesson landed:

Two example trades, both graded **Strong · Aligned**. Both would have paid. Both got closed early. The setups weren't the problem — I was.

That's not something you can see from a P&L report. You have to watch it play out.

<figure>
  <img src="/images/blog/xausd/trade-replay.png" alt="Trade replay interface showing candle-by-candle progression of a closed trade against the original plan, highlighting the exact bar where execution diverged from the setup." />
  <figcaption>Candle-by-candle replay grades every fill against the plan — surfacing exactly where execution, not the setup, cost the R.</figcaption>
</figure>

## Live alerts on the phone

The whole point of a live system is that it works when you're not sitting in front of it. Every setup that goes entry-ready lands on my phone as a full Telegram alert — direction, entry zone, stop-loss, targets, score, grade, R:R. Nothing to decide from scratch in the moment.

<figure>
  <img src="/images/blog/xausd/live-alerts.png" alt="Mobile phone lock screen showing a Telegram notification from the portal containing a complete trade plan — direction, entry zone, stop-loss, targets, score, grade, and risk-reward ratio." />
  <figcaption>Live Trader Mode alerts — full plan on the lock screen, delivered the moment a setup goes entry-ready.</figcaption>
</figure>

## Honest notes: limitations I learned

A few things the system taught me that I didn't want to hear:

**The read can be right and still get run.** Price spikes bypass deterministic structure reads, especially in illiquid conditions. The engine sees market structure. Liquidity events don't always respect market structure.

**Risk management beats the signal every time.** Sizing and hard invalidation matter more than directional accuracy. A great read badly sized is still a loss.

**Wait for the 1-minute confirmation.** M1 confirmation filters out a surprising amount of false-breakout noise.

**It's an analysis platform, not a signal service.** The system never commands trades. Every decision stays with me. That's the design, not a limitation.

## The stack

For anyone curious about the plumbing:

- **Data:** OANDA historical + live API, PostgreSQL with time-series extensions
- **Backend:** .NET Core minimal API, deterministic structure/strategy engine
- **Analytics & edge-finding:** Python (pandas, numpy) for exploring data and back-testing edges across multi-timeframe charts; live calibration runs in the app itself
- **Frontend:** Blazor with the TradingView charting library
- **Delivery:** 60-second live refresh, Telegram alerts
- **Infrastructure:** private Linux VPS behind Cloudflare, Docker for deployment

## Why any of this matters

I didn't build this to sell signals. I built it because I wanted to *know* — and no amount of watching someone else's chart was going to get me there.

If you're an engineer who trades, or a trader who codes, the punchline is the same: build the thing that answers your specific question, and let it embarrass you when the answer is uncomfortable. That's the useful part.

You can [see the live portal at xausd.cdan.me →](https://xausd.cdan.me).
