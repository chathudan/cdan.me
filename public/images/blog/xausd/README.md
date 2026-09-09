# XAU/USD blog post images

The blog post at `src/content/posts/building-my-own-xau-usd-analysis-portal.md`
references the following images. Right now each is an SVG placeholder that says
"replace with real image" so the site builds cleanly.

To swap in real images:

1. Open the original LinkedIn post: https://www.linkedin.com/pulse/i-wanted-know-my-strategy-actually-right-so-built-siwanda-hewage-vobwc
2. Right-click each image → **Save image as…**
3. Save into this folder using the filenames below (JPG or PNG both fine).
4. **Delete the corresponding `.svg` placeholder** (or the browser will keep loading it).
5. Update the image src in the blog post markdown from `.svg` to `.jpg` (or `.png`).

## Expected filenames

| # | File                       | What it shows                                                        |
|---|----------------------------|----------------------------------------------------------------------|
| 1 | `cover.jpg`                | Portal dashboard — live market structure, liquidity, FVG, plan       |
| 2 | `plan-forming.jpg`         | Plan Forming — entry zone, invalidation, TP1/TP2 and R:R             |
| 3 | `trade-replay.jpg`         | Candle-by-candle replay — graded fills, setup vs execution           |
| 4 | `live-alerts.jpg`          | Live Trader Mode alerts — full plan on the lock screen (mobile)      |
| 5 | `execution-analytics.jpg`  | Actual vs System — every fill graded, full setup-vs-trader breakdown |

**Recommended size:** 1600px wide (2400px if you want retina crispness), JPG at ~80% quality. Anything larger gets served but doesn't help — the reading column is ~72rem max.
