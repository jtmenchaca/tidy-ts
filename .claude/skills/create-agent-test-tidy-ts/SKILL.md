---
name: create-agent-test-tidy-ts
description: How to dispatch sub-agents to test the tidy-ts-best-practices skill. Covers the strict access rules, anti-fabrication guardrails, plain-language task design, and prompt templates that produce honest, evidence-backed findings.
metadata:
  tags: agents, testing, tidy-ts, skill-evaluation, fabrication
---

## When to use

Use this skill when you're about to dispatch one or more sub-agents to evaluate the `tidy-ts-best-practices` skill — i.e., to verify the skill is sufficient for a fresh agent to do real data analysis without other context, and to surface gaps and bugs.

This skill is **not** for testing tidy-ts itself. It's for designing the experiment that tests the *skill that documents tidy-ts*.

## Why this skill exists

We have been burned, repeatedly, by sub-agents fabricating "the documented example doesn't compile" findings that turn out to be local mistakes (wrong column name, missing `await`, stray `as any`, schema misaligned with CSV headers). Verifying each false finding costs 5+ minutes. A bad prompt design produces a steady stream of these.

We have also been burned by accidentally **cheating** — writing the API names into the agent prompt itself, so the agent isn't actually exercising the skill, it's parroting the prompt.

The patterns below produce honest, useful results. Skipping them produces noise.

## The four rules

### 1. Skill-only access

Allow the agent to read only:

- `/Users/jtmenchaca/tidy-ts/.claude/skills/tidy-ts-best-practices/SKILL.md`
- Anything under `/Users/jtmenchaca/tidy-ts/.claude/skills/tidy-ts-best-practices/rules/`

Forbid: other source files, tests, README, examples directory, web search, context7, any external docs. If the skill doesn't say how to do something, that's a finding — the agent should note it and move on, not go hunting.

State this explicitly in the prompt. Agents will sneak off to read tests or examples otherwise.

### 2. Evidence-backed findings only

The agent must, for any claimed skill bug:

- Paste the exact TypeScript or runtime error, verbatim.
- Show the exact code that produced it.
- Try the documented form **verbatim** in an isolated scratch file with synthetic data first. If the isolated example compiles, the bug is in the agent's call site, not the skill. Drop the finding.
- If they wrote a workaround instead of the documented form, they must show the error that justified the workaround.

No pasted error → no finding. State this in the prompt verbatim. This single rule cuts fabrication rates dramatically.

### 3. Plain-language tasks only

The user-facing requirement should be expressed in plain English about the **data and the question**, not the API.

✅ "For the Adelie species, is there a statistically significant difference in flipper length between male and female penguins?"

❌ "Use `s.test.t.independent({ x, y, equalVar: false })` on the Adelie subset to test flipper length."

❌ "Group by species and call `summarize` with `mean: g => s.mean(g.flipper_length_mm)`."

The agent must figure out which verbs and stats functions to use. That's what's being tested. If you write the API call into the prompt, you've cheated and you're no longer testing the skill.

Watch for sneaky cheating: even mentioning `summarize`, `mutateOverGroup`, `pivotWider`, `s.test.t.independent`, `equalVar`, `removeNull` etc. tilts the experiment. Use plain words: "group by … and compute the average," "reshape so each row is …," "drop rows with missing X."

### 4. One agent per data file / domain

Each agent gets one data file and a focused set of 3–5 tasks. Don't bundle the entire library surface into one prompt — agents lose focus and the report becomes a sprawl. Run multiple agents in **parallel** when you want broad coverage.

## Prompt template

Use this verbatim, filling in the bracketed sections. Keep wording almost identical across runs so results are comparable.

```
You are testing a Claude Code skill called `tidy-ts-best-practices`. Your job is
to do real data analysis using ONLY what that skill tells you, and report
findings about the skill afterward.

## Strict rules

1. **Skill-only access for API knowledge.** You may read files at
   `/Users/jtmenchaca/tidy-ts/.claude/skills/tidy-ts-best-practices/SKILL.md`
   and any file under
   `/Users/jtmenchaca/tidy-ts/.claude/skills/tidy-ts-best-practices/rules/`.
   Do NOT read any other source file, doc, test, README, or examples directory
   in this repo to learn the library. Do NOT use web search, context7, or any
   external docs. If the skill doesn't tell you how to do something, that's a
   finding — note it and move on.

2. **No fabricated bug reports.** If you want to claim "X documented in the
   skill doesn't compile / doesn't run," you must:
   - Paste the exact TypeScript error or runtime error you got, verbatim.
   - Show the exact code that produced it.
   - First try the documented form **verbatim** in a tiny isolated scratch
     file with synthetic data. If the isolated form compiles, the issue is in
     your call site, not the skill. Drop the finding.
   - If you write a workaround instead of the form the skill shows, you must
     show the error that justified the workaround.
   If you can't paste an error, drop the claim.

3. **Plain English task description.** You're given a data file and a goal in
   plain language. Treat that as the requirement; use the skill to figure out
   how to express it in code.

## Your task

[Plain-language task description: data file path + 3-5 numbered questions.
Do NOT mention specific tidy-ts API names. Say "group by", "average",
"reshape", "is X significantly different from Y", not "summarize" /
"pivotWider" / "s.test.t.independent".]

Write your code to a file at
`/Users/jtmenchaca/tidy-ts/packages/testing/bugs/[unique-filename].ts`.
Run it with `deno run -A <path>` and confirm it produces correct-looking output.
Type-check it with
`deno run -A /Users/jtmenchaca/tidy-ts/scripts/parse-check.ts -A
packages/testing/bugs/[unique-filename].ts`
from the repo root (`/Users/jtmenchaca/tidy-ts/`).

## What to report (under 400 words)

- The final code (or a link to it).
- One-line confirmation it ran clean and type-checked clean. If not, the
  exact errors.
- For each task, what the result was (numbers/values you computed).
- **Skill findings**: places where the skill was confusing, missing info, or
  wrong. For each, attach the evidence (the error text and the code that
  produced it) per rule 2 above. If you have no evidence, you have no finding.

Working directory: `/Users/jtmenchaca/tidy-ts/`
```

## Task design patterns

Aim each agent at a different region of the API surface so a parallel fleet covers more ground without overlapping. Good axes:

- **I/O variety**: one agent on CSV, one on XLSX, one on JSON.
- **Verb variety**: counts/groupBy, pivot/reshape, joins, time-series rolling/downsample.
- **Stats variety**: linear regression, hypothesis tests (one-sample, two-sample, ANOVA), distributions.
- **Output variety**: write-back to CSV, print formatted tables, graph rendering.

### Plain-language phrasings (use these, not the API names)

| Plain | What you must NOT write |
|---|---|
| "How many rows of each X are there?" | "use `count` / `summarize` / `nrows`" |
| "Group by X and compute the average / median / std of Y" | "summarize with `mean` / `median` / `sd`" |
| "Is Y different between group A and group B?" | "two-sample t-test", "Welch's", `equalVar` |
| "Fit a model predicting Y from X1 and X2" | "linear regression", `lm`, `glm` |
| "For each row, compute a rolling 7-day average of Y" | "rolling window", `s.rolling.mean` |
| "Reshape so each row is X and each column is Y" | "pivotWider" |
| "Combine these tables by matching on column X" | "innerJoin" / "leftJoin" |
| "Drop rows with missing X" | "removeNull" / "filter" |
| "Save the result as a CSV/Excel file" | "writeCSV" / "writeXLSX" |

### Don't ladder hints

If the agent doesn't get task 4, do NOT add API names to task 5. Resist the urge to "help" — that's the whole point of the test. If a task is consistently impossible, that's a skill finding, not an agent failure.

## Parallel dispatch checklist

When launching a fleet:

1. **Load the coverage matrix** at `packages/testing/skills/tidy-ts-best-practices/coverage.md`. The matrix lists every feature in the target skill, its current `clean`/`friction`/`bug` counts, and a tier (`hole` / `needs re-confirmation` / `covered`). Prefer features in the first two tiers when designing tasks.
2. **Run the pinned-regression check** before dispatching:
   ```
   deno run -A packages/testing/skills/tidy-ts-best-practices/regression-check.ts
   ```
   Green ⇒ proceed. Red ⇒ a previously-fixed bug has come back. Investigate and fix before adding new agents (don't pile on top of regressions).
3. Pick 2–4 data files with different shapes (numeric vs. categorical, time-series vs. cross-sectional, CSV vs. XLSX).
4. Write each prompt independently — do not share an agent across files.
5. Use `run_in_background: true` so they execute concurrently.
6. Give each agent a unique output filename so they don't clobber each other. Save to `packages/testing/skills/tidy-ts-best-practices/runs/run-NN-<intent-slug>.ts`.
7. Don't read the agent transcripts (`/private/tmp/.../*.output`) — they will overflow your context. Wait for the completion notification.

### After each agent returns

1. Append a log line to the **Chronological log** section of `coverage.md`:
   `- run-NN — YYYY-MM-DD — intent (dataset) — outcome — features`.
2. Update per-feature cells in the matrix (counts and last-touched).
3. For every **evidence-backed finding** that turns out to be real:
   - Fix the source code or the skill.
   - Add a new entry to the **Pinned regressions** table in `coverage.md`.
   - Add a matching `check(...)` block to `regression-check.ts` so the next dispatch's run-pre check would catch a regression.
4. The terms used here (`feature`, `outcome`, `hole`, `evidence-backed finding`, etc.) are pinned in [packages/testing/skills/tidy-ts-best-practices/CONTEXT.md](../../packages/testing/skills/tidy-ts-best-practices/CONTEXT.md). Use them consistently; don't invent synonyms.

## Reading the results

When agents come back, expect one of three outcomes per finding:

- **Clean** — agent ran and type-checked. The skill held up for that domain. Most agents in a healthy state report nothing.
- **Real bug** — agent pasted an error, you reproduce it from a minimal example, the documented form genuinely fails. Fix in source code (or in the skill if it really is a doc bug).
- **Fabricated bug** — agent claims X doesn't work but pasted no error, or pasted an error that's actually from their workaround, not the documented form. Reproduce the documented form in isolation; if it compiles, push back.

When in doubt, **verify the agent's claim with a minimal scratch file before acting on it**. We have a strong prior that agent claims are wrong about half the time, even with the evidence rule. Trust but verify.

## Anti-patterns

- ❌ Allowing the agent to read tests/examples/source as "context" — it stops testing the skill and starts cargo-culting from other code.
- ❌ Specifying the API in the prompt ("call `s.test.t.independent`") — you're parroting, not testing.
- ❌ Accepting "the example doesn't compile" without a pasted error.
- ❌ Bundling 12 tasks into one agent — focus erodes and the report becomes useless.
- ❌ Reading the agent's full output transcript via Bash — that file is the entire JSONL session and will blow up your context. Wait for the completion notification.
- ❌ Adding hints to later tasks when earlier ones failed — that's contaminating the experiment.
- ❌ Running agents serially when you could run them in parallel — wastes wall-clock time and you can't compare findings.

## Related

- **The skill being tested**: `.claude/skills/tidy-ts-best-practices/SKILL.md`
- **Glossary**: [`packages/testing/skills/tidy-ts-best-practices/CONTEXT.md`](../../packages/testing/skills/tidy-ts-best-practices/CONTEXT.md) — pinned terms (agent run, feature, outcome, hole, etc.)
- **Coverage matrix + log**: [`packages/testing/skills/tidy-ts-best-practices/coverage.md`](../../packages/testing/skills/tidy-ts-best-practices/coverage.md) — load before dispatching, update after.
- **Pinned regression check**: [`packages/testing/skills/tidy-ts-best-practices/regression-check.ts`](../../packages/testing/skills/tidy-ts-best-practices/regression-check.ts) — run before dispatching.
- **Drift check**: [`packages/testing/skills/tidy-ts-best-practices/drift-check.ts`](../../packages/testing/skills/tidy-ts-best-practices/drift-check.ts) — run when the matrix looks stale or after editing rule files.
- **Agent output directory**: `packages/testing/skills/tidy-ts-best-practices/runs/` (legacy files are in `packages/testing/bugs/skill-test-*.ts`).
- **Cross-session memory note on the evidence rule**: `agent-skill-test-prompt.md` in the user's auto-memory.
- **The guardrail inside the tested skill itself**: "If something in this skill doesn't compile" section in the target SKILL.md — agents see this before they get to fabricate.
