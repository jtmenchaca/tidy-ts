# Update RPython INSTRUCTIONS.md and rules.md to canonical vocabulary

Status: ready-for-agent

## What to build

Bring `docs/JAMIA/comparisons/RPython/INSTRUCTIONS.md` and `docs/JAMIA/comparisons/RPython/rules.md` in line with the canonical glossary in `docs/JAMIA/comparisons/CONTEXT.md`. This slice covers the **vocabulary swap only** — it does NOT add the three new frontmatter fields (that's issue 04, blocked on the schema change in issue 03).

Specifically:

- Replace **probe** / **test case** with **scenario** throughout.
- Replace **framework** / **tool** with **library** when referring to Tidy-TS, pandas, tidyverse, Polars, Arquero.
- Use **static code checker** for mypy and pyright (distinct from **compiler** for the TypeScript compiler).
- Rename the categories everywhere they appear to: Column reference, Value type, Missing value, Join, Data loading, Schema composition (now 6 categories, not 5).
- Use **snippet** for raw RPython entries; **reproduction** for the `.py`/`.R`+`.ts` pairs the authors write; **mapping** for the act/value of classifying a snippet into one of the six categories or as excluded.
- Use **original-language consequence** (enum: DC / IF / Crash) when describing what the snippet's bug did in its source language. Never collapse this with detection outcome.
- Distinguish **structurally absent** (bug class can't occur in TS/JS) from **bug still exists** (Tidy-TS has the same failure mode and doesn't catch it). Both are honest, neither is a "win."

## Acceptance criteria

- [ ] No instances of "probe", "test case", "framework", or "tool" (as comparator) remain in either file.
- [ ] Category lists match the six canonical names exactly.
- [ ] Snippet vs reproduction vs mapping used consistently with the CONTEXT.md definitions.
- [ ] Existing rules and instructions are preserved; only the vocabulary changes.
- [ ] The "structurally absent" vs "bug still exists" distinction is called out where the docs currently conflate them (INSTRUCTIONS.md lines 60-67, 100-106).

## Blocked by

- None — can start immediately. (Issue 04 will add the new frontmatter fields after the schema is settled in issue 03.)
