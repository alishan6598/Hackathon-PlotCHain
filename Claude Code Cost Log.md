# Claude Code Cost Log — May 7–9, 2026

## Overview

Token usage and weekly-quota consumption for **13 Claude Code sessions** on the PlotChain project (May 7–8, 2026). Plan: [**Claude.ai](http://Claude.ai) Team** (flat-rate weekly limits, *not* pay-per-token). Model: **Claude Sonnet 4.6**.

> Earlier version of this page bucketed sessions by file modification time, which incorrectly shifted three May 7 sessions onto May 8 (long sessions saved overnight). Corrected below using each session's actual first-message timestamp.
> 

---

## [Claude.ai](http://Claude.ai) Team Plan — Weekly Quota Snapshot

From `claude.ai/settings/usage` (resets Tue 7:00 PM):

| Bucket | Used | Notes |
| --- | --- | --- |
| All models (weekly) | **15%** | Combined Sonnet + Opus + Haiku consumption |
| Sonnet only (weekly) | **11%** | Sonnet 4.6 share |
| Current session | 1% | Active rolling 5-hour window |
| Claude Design | 0% | Unused |
| Daily routine runs | 0 / 25 | Unused |

**Bottom line:** ~3 days of heavy hackathon work consumed only **15% of one week's Team quota** — well within budget for the project pace.

---

## Daily Token Usage (corrected by session start time)

| Date | Sessions | Output Tokens | Cache Reads | Cache Writes |
| --- | --- | --- | --- | --- |
| May 7, 2026 | 3 | 487,632 | 23,769,751 | 1,662,069 |
| May 8, 2026 | 10 | 1,712,397 | 141,728,846 | 9,718,694 |
| **Total** | **13** | **2,200,029** | **165,498,597** | **11,380,763** |

(May 9 in old breakdown was an artifact — the 0802d10a session actually *started* May 8 at 15:33 and was just saved next morning.)

---

## API-Equivalent Cost (Reference Only — Not Actually Billed)

If this work had been done via the Anthropic API instead of the Team plan, the equivalent cost at Sonnet 4.6 rates ($3 in / $15 out / $0.30 cache-read / $3.75 cache-write per 1M) would be:

| Date | API-Equivalent |
| --- | --- |
| May 7, 2026 | ~$20.69 |
| May 8, 2026 | ~$104.67 |
| **Total** | **~$125.36** |

⚠️ **You did not pay this.** Team plan billing is flat — these numbers only show "what this would have cost on the metered API," useful for sizing future API-based deployments.

---

## Where the Tokens Went

- **Cache reads ~165M (≈ $49 API-equiv)** — context ([CLAUDE.md](http://CLAUDE.md), file reads, long conversations) reused across turns within sessions. High volume here is *good* — it means caching saved on input tokens.
- **Cache writes ~11M (≈ $43 API-equiv)** — fresh context loads at session start. May 8 had 10 separate sessions, so writes stacked up.
- **Output ~2.2M (≈ $33 API-equiv)** — actual code, edits, and explanations Claude generated.
- **Raw input ~10K (≈ $0.03 API-equiv)** — almost everything was served from cache.

---

## Sessions by Day

**May 7 (3 sessions):**

- 07:52 — main hackathon build (smart contracts → frontend wiring)
- 11:13 — short follow-up
- 14:40 — frontend integration work

**May 8 (10 sessions):** dealer portal, admin dashboard, MintModal, Pinata seed, listing flow + `connector.getChainId` bug fix, approval gate, `setTokenURI` contract feature + UI, plan mode reviews, reflection docs.

---

## Notes

- Numbers parsed from `/home/ali/.claude/projects/-home-ali-Desktop-Hackathon-PlotCHain/*.jsonl`.
- Day attribution = first message timestamp inside each JSONL (not file mtime).
- Team-plan % comes from the live [Claude.ai](http://Claude.ai) usage dashboard screenshot.
- All sessions used Sonnet 4.6 — no Opus or Haiku consumption detected.