# Update OVERVIEW.md to canonical vocabulary

Status: ready-for-agent

## What to build

Bring `docs/JAMIA/comparisons/OVERVIEW.md` into line with the canonical glossary in `docs/JAMIA/comparisons/CONTEXT.md`. The doc currently uses pre-grilling wording ("probe", "test case", "Column & Schema Reference", a single category 5 mixing load-time and composition errors). After this slice, it matches the resolved terminology.

Specifically:

- Replace **probe** / **test case** with **scenario** throughout (IDs `1a`–`6g` stay).
- Rename the categories to the manuscript names: Column reference, Value type, Missing value, Join, Data loading, Schema composition.
- Split the current category 5 into two:
  - **Cat 5: Data loading** — 3 scenarios (5a, 5b, 5c from the current table; the Zod-at-readCSV cases).
  - **Cat 6: Schema composition** — 7 scenarios (5d–5j from the current table; bindRows, append, duplicate keys).
  - Renumber within cat 6: 5d → 6a, 5e → 6b, ..., 5j → 6g.
- Fix the description of scenario **1p** to match what the test actually exercises: *access non-summarized column after summarize* (a column-reference scenario, symmetric to 1h), not *residual grouping after summarize*. Update the rationale column accordingly. Keep 1p in cat 1.
- Re-tally the per-category counts and severity summaries.

## Acceptance criteria

- [ ] No instances of "probe" or "test case" remain in OVERVIEW.md (replaced with "scenario").
- [ ] Category names match the canonical set in CONTEXT.md exactly.
- [ ] Category 5 (Data loading) has exactly 3 scenarios; category 6 (Schema composition) has exactly 7. Total across all 6 categories is 65.
- [ ] Scenario 1p's description and rationale match the test code in `cat-1-column-schema-reference/cat-1-column-schema-reference.test.ts:179-185`.
- [ ] Severity summary lines at the bottom of each category section are recomputed.
- [ ] Total counts and the "78 included" / "65 scenarios" headlines remain internally consistent.

## Blocked by

- None — can start immediately.
