# Add intent statements and corruption assertions to every scenario

Status: ready-for-agent

## What to build

Apply the equivalence rule from `docs/JAMIA/comparisons/CONTEXT.md` to every scenario in the comparison suite. Two backfills:

**A. Intent statement on every scenario.** Each scenario needs a one-sentence plain-English description of the analytic task it exercises, separate from any code. The intent statement allows reviewers to verify that all library probes implement the same task.

Place the intent statement in:
- The OVERVIEW.md per-scenario table (new column or inline).
- The shared `LABELS` array (or equivalent) in each `cat-N-*.test.ts` test file so probes can reference it programmatically.

Example (scenario 3b): "Compute the difference between each lab result value and the upper reference range."

**B. Corruption assertion on every silent outcome.** Every scenario whose detection outcome is `silent continuation` for any library MUST programmatically assert what is corrupted in the output — not merely that no exception was raised. This is rule #4 of the equivalence-fair test in CONTEXT.md, and it is the most load-bearing condition.

Examples of acceptable assertions:
- "NaN count in derived column > 0"
- "Filtered row count < expected"
- "Output dtype is `object` not `float64`"
- "Aggregated value differs from `na.rm = TRUE` baseline by > tolerance"

For each library probe (pandas, R, Polars, Arquero), modify the existing silent-outcome paths to include the corruption assertion. The `outcome === "silent"` is no longer sufficient; the assertion must succeed *and* the outcome must be silent.

Update the result JSON the harness writes to include the corruption assertion result alongside the outcome, so re-runs are independently verifiable.

## Acceptance criteria

- [ ] Every scenario in OVERVIEW.md has an intent statement.
- [ ] Every scenario in the per-category test files has the intent statement available to all probes (e.g., in the `LABELS` array).
- [ ] Every scenario with at least one `silent continuation` outcome has a corruption assertion implemented in every library probe that produces that outcome.
- [ ] The harness records both `outcome` and `corruption_verified` (or equivalent) per scenario × library in the run JSON.
- [ ] Any scenario where the corruption assertion fails (i.e., the operation was actually correct) is flagged for author review — this would mean the manuscript's silent-continuation count is overstated for that case.
- [ ] No scenario relies solely on `outcome === "silent"` to claim silent corruption.

## Blocked by

- None — can start immediately, but coordinate with issue 01 (OVERVIEW vocabulary) so the intent statements land in the renamed/restructured table.
