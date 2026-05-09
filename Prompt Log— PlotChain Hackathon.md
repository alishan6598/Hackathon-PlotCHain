# Prompt Log — Ali — PlotChain Hackathon

> Extracted from 13 Claude Code sessions (May 7–8, 2026). Verbatim prompts pulled from JSONL logs. Rated on actual output quality, not intent.
> 

---

## Top 5 prompts that worked

### 1. [CLAUDE.md](http://CLAUDE.md) cold-start architect brief

**Context:** Day 1, nothing existed yet. Needed Claude to understand the full project before writing a single line of code.

**Prompt:**

```
write a claude.md file as complete, precise, and useful as possible for any developer or future Claude Code session picking up this project cold. The rewritten file must contain all of the following: stack table, architecture diagram in ASCII, directory map, every command needed to compile/deploy/seed/dev, every environment variable with purpose, coding conventions per layer (contracts / hooks / components / lib), 10+ "never do" rules specific to this stack, and open known-weirdness items.
```

**Why it worked:** Told Claude exactly what sections to include, what level of specificity, and the audience (future cold-start Claude). No ambiguity about format or depth. This single file saved every subsequent session from context bootstrapping.

**Output quality:** 5/5

**Model used:** Sonnet 4.6

**Approx tokens:** ~8K output — cheapest prompt, highest leverage

---

### 2. solc-js compile runner with import resolver

**Context:** No Hardhat, no Foundry. Needed a bare solc-js script that could resolve OpenZeppelin + ERC-721A from node_modules.

**Prompt:**

```
Read CLAUDE.md. Now write compile/compile.js — the solc-js runner with a custom import-resolver callback that resolves @openzeppelin/contracts/ and erc721a/contracts/ from node_modules. It must output ABI + bytecode JSON to compile/output/. The import-resolver must never silently fail — log unresolved paths and throw.
```

**Why it worked:** Constraint-first ("never silently fail"), named the exact output location, named the exact dependencies. Claude had zero guesswork. Produced working compile pipeline on first run.

**Output quality:** 5/5

**Model used:** Sonnet 4.6

**Approx tokens:** ~5K output

---

### 3. Four hooks, zero JSX, contract-separated

**Context:** Frontend wiring phase. The rule "hooks contain only chain reads/writes, zero JSX" was already in [CLAUDE.md](http://CLAUDE.md).

**Prompt:**

```
Read CLAUDE.md. Write all four hooks with zero JSX inside them:
hooks/usePlotNFT.js — reads tokenURI, ownerOf, isApprovedForAll from PlotNFT contract. Also exposes a mintPlot write function for admin.
hooks/useMarketplace.js — reads listing details, commission rate. Exposes listPlot, buyPlot, delistPlot, updatePrice writes.
hooks/usePlotHistory.js — reconstructs per-token Transfer + PlotSold event history from viem getLogs. Always uses DEPLOYMENT_BLOCK.
hooks/useRoles.js — reads isAdmin, isDealer from RoleManager for the connected wallet.
```

**Why it worked:** Each hook named, each responsibility defined, the constraint (zero JSX) restated. Produced all four files that needed almost no edits.

**Output quality:** 5/5

**Model used:** Sonnet 4.6

**Approx tokens:** ~12K output

---

### 4. Four numbered critical bugs in sequence

**Context:** Map was showing fabricated statuses, NFT images weren't loading, sidebar counts were wrong.

**Prompt:**

```
Read CLAUDE.md. There are 4 critical bugs to fix. Fix all of them in order.

Bug 1 — Map showing wrong plot statuses
The map is showing plots as Listed and Sold when no transactions have happened. The sectorLayout.js mock status field is leaking into production rendering. Fix: derive status from usePlotOwners + useListings only.

Bug 2 — Sidebar count mismatch
...

Bug 3 — NFT images not showing from Pinata
...

Bug 4 — connector.getChainId not a function on list
...
```

**Why it worked:** Each bug independently numbered, root cause stated (not just symptom), fix direction given. Claude didn't have to diagnose — just execute. All four resolved in one session.

**Output quality:** 4/5

**Model used:** Sonnet 4.6

**Approx tokens:** ~65K output

---

### 5. Notion hackathon submission page via MCP

**Context:** Needed a full multi-section Notion page created from scratch using the MCP connector.

**Prompt:**

```
I have a Notion workspace connected via MCP. Create a complete hackathon submission page for PlotChain. Read CLAUDE.md and spec.md first, then create the following structure in Notion:
Page title: PlotChain — Hackathon Submission
Child pages: Project Overview, Architecture Overview, Technical Decisions, PM Brief, API Docs summary
Each child page should have real content drawn from the codebase — not placeholder text.
```

**Why it worked:** Named the tool (MCP), told it to read source files first, specified page structure and content source. Claude didn't guess — it read then wrote.

**Output quality:** 4/5

**Model used:** Sonnet 4.6

**Approx tokens:** ~21K output

---

## Bottom 3 prompts that wasted time

### 1. Symptom dump with no context

**What I asked:**

```
why this showing 7 listed 9 available when there is none
```

**What went wrong:** Claude had no idea which component was showing it, which hook was the source, or whether it was mock data or chain data leaking. Had to spend 2 back-and-forth turns just identifying the file before any fix could start. Wasted ~30K cache tokens on diagnosis that should have been pre-solved.

**What I should have done:** "In SideNavigator.jsx line 34, the listed/available counts are wrong — they're reading from sectorLayout.js mock data instead of usePlotOwners + useListings. Fix: derive counts from chain hooks only."

---

### 2. Vague visual ask with no image and no criteria

**What I asked:**

```
make my map look like this in which there is roads and things so it could be more attractive and it should give real vibe
```

**What went wrong:** No image was actually included ("like this" referred to nothing). "Real vibe" is not a spec. Claude produced something, it was wrong, led to 3 more revision rounds — each one equally vague. The map redesign consumed an entire session (1.8M file) with no durable result because the acceptance criteria kept shifting.

**What I should have done:** Share a reference screenshot, describe the specific elements wanted (street labels, zone colours, hover state, click behaviour), and define done as a checklist.

---

### 3. Multi-ask error dump

**What I asked:**

```
fix all the errors in the code make my UI interactive
```

(followed by a pasted Next.js error stack)

**What went wrong:** Two completely different tasks — "fix errors" (TypeScript/runtime bug) and "make UI interactive" (feature work) — in one prompt with no priority signal. Claude fixed the error (correct) but also started touching the UI (not asked yet), which introduced regressions. Then fixing those regressions ate another session.

**What I should have done:** One prompt per concern. First: "Fix this specific runtime error: [paste]. Don't touch anything else." Then separately: "Now make the map interactive by adding [specific feature]."

---

## Workflow patterns I'll keep using

- **Always start with "Read [CLAUDE.md](http://CLAUDE.md)"** — every session that started with this had fewer wrong assumptions
- **Number bugs independently** — Claude works sequentially through numbered lists, skips nothing
- **State the constraint before the task** — e.g. "zero JSX in hooks" before writing hooks
- **Give root cause, not just symptom** — diagnosis prompts are expensive; pre-diagnose yourself
- **One topic per session** — sessions that stayed focused on one feature area produced cleaner, mergeable output

---

## Workflow patterns I'll stop

- **"Fix this too"** appended to an existing ask — always starts a new message instead
- **Sending error output without saying which file or line caused it** — Claude wastes turns narrowing it down
- **Vague visual direction** — "more attractive", "real vibe", "like this" without an actual reference image
- **Mixing feature requests and bug fixes in one message** — they have different risk profiles and should be separate commits
- **/compact mid-session when context is still warm** — caused context loss on 3 occasions, requiring expensive re-summaries