# Comparisons Test Suite — Progress Log

## Format & Design Decisions

### File structure per error class
Each `NN-slug/` directory contains:
- `example-slug.test.ts` — Deno test file (the primary artifact). Contains compile-time checks, runtime checks, and Python/R probe runners.
- `example-slug.ts` — Standalone compile-time demonstration. Uses `@ts-expect-error` annotations to prove the type system catches errors. **Never executed** — the type checker validates it. `deriveCompileOutcomes()` in the `.test.ts` scans this file's sibling (its own source) for `@ts-expect-error` to populate the "TS compile" column.
- `probe.py` — Python/pandas probe script. Emits JSON array of `{outcome, message, result}`.
- `probe.R` — R/tidyverse probe script. Same JSON format.
- `example-slug.py`, `example-slug.R` — standalone examples (pre-existing, not used by tests)

### Test structure within each `.test.ts`
Five `Deno.test()` blocks, always in this order:
1. **`NN — Name: Tidy-TS compile-time`** — `@ts-expect-error` directives verify the type system catches the error. When the error also throws at runtime, wrap in `expect().toThrow()`. Every case label that TS catches at compile time must have a corresponding `@ts-expect-error` section using the label prefix (e.g., `// 6b:`). `deriveCompileOutcomes()` scans this block to populate the "TS compile" column.
2. **`NN — Name: Tidy-TS runtime`** — Uses `captureOutcome()` to test runtime behavior with types bypassed (`as any`). Collects results into `tsResults: ProbeResult[]`. Asserts `.outcome` as `"error"` or `"silent"`, same vocabulary as Python/R probes.
3. **`NN — Name: Python`** — Runs `probe.py` via `runPythonProbe()`, asserts each outcome. Collects into `pyResults`.
4. **`NN — Name: R`** — Runs `probe.R` via `runRProbe()`, asserts each outcome. Collects into `rResults`.
5. **`NN — Name: Summary`** — Calls `printComparisonTable()` with all collected results. Emits tagged JSON for `collect-tables.ts`.

**Module-level setup:** Declare shared data (DataFrames, schemas) at module level so both compile-time and runtime tests can use the same typed instances. For compile-time tests that need a typed DataFrame from an async operation (e.g., `readCSV`), use top-level `await`:
```ts
const LabSchema = z.object({ lab_id: z.string(), result_value: z.coerce.number() });
const labsDf = await readCSV("lab_id,result_value\nL1,100\nL2,200\n", LabSchema);
```
This gives the compile-time test a properly typed DataFrame to demonstrate `@ts-expect-error` on.

### Shared infrastructure (`test-helpers.ts`)
- `Outcome` type: `"error" | "warning" | "silent"`
- `ProbeResult`: `{ outcome, message, result }`
- `runPythonProbe()`, `runRProbe()`: execute probe scripts, parse JSON output
- `captureOutcome(fn)`: wraps a TS expression in try/catch, returns `ProbeResult` — used in runtime tests to match the probe format
- `probePath(importMetaUrl, relativePath)`: resolves probe script paths
- `deriveCompileOutcomes(importMetaUrl, labels)`: programmatically derives compile outcomes from `@ts-expect-error` annotations in the test file
- `printComparisonTable(...)`: emits `__TABLE_DATA__...__END_TABLE_DATA__` tagged JSON for programmatic collection
- `fmtResult(r)`: formats result for table display, max 30 chars. Returns "N/A" for errors.

### Collection pipeline
- `collect-tables.ts`: runs `deno test --parallel` on all comparison tests, extracts `__TABLE_DATA__...__END_TABLE_DATA__` tagged JSON from stdout, writes `all-tables.json` and `all-tables.md`. This is a build script, not a test.
- `runner.test.ts`: separate test file that runs all Python/R probes independently and asserts outcome/result values. **Uses the same `probe.py` and `probe.R` files as the per-class tests.** When probe files are modified (cases added, removed, or reordered), `runner.test.ts` must be updated to match — the expected result count and assertion values must stay in sync with the probe output.

### Key principles
- **Objectivity**: Comments describe what happens, not editorial judgments about other languages. No "Python fails here" or "TS catches this better" — just factual outcome labels.
- **Three-language parity**: All three languages use the same outcome vocabulary (`error`/`warning`/`silent`). TS runtime tests use `captureOutcome()` to produce the same structure as Python/R probes.
- **Compile-time is a bonus layer**: TS has two layers (compile-time + runtime). Python/R only have runtime. The compile-time test is TS-specific; the runtime test is the apples-to-apples comparison.
- **Assert desired behavior, not current behavior**: When the runtime *should* throw but currently doesn't, assert `"error"` so the test fails. This makes the test suite a living tracker of runtime safety gaps. **Do not assert `"silent"` just because the current code doesn't throw.** The question is always: *should this operation produce a meaningful error?* If yes, assert `"error"`.
- **Shared data at module level**: When multiple tests use the same DataFrames, declare them at module level.

### Test what the user actually hits, not the trivial definition

**This is critical.** Each test case should capture the *practical endpoint* — the downstream operation where silent corruption causes a real problem — not just the initial type mismatch or missing value.

**Bad example (trivial):** "16a: Create a mixed-type column" → all three frameworks silently create the column. This tells the reader nothing useful.

**Good example (practical):** "16a: arithmetic on union col" → TS blocks `status * 2` at compile time because `status` is `number | "HIGH"`. Python silently repeats the string (`"HIGH" * 2 = "HIGHHIGH"`). R silently coerces to character, then `as.numeric` produces NA with a warning. The reader sees what actually goes wrong.

**The pattern:** define the data problem (mixed types, nulls, missing columns, etc.), then immediately test what happens when you *use* that data in a realistic operation (arithmetic, aggregation, join, comparison). The usage is where the error manifests — that's what belongs in the table.

Other examples of this principle in practice:
- **Error class 06**: Don't test `createDataFrame` with `as any` casts — test `readCSV` with a Zod schema, which is the actual I/O boundary API. `readCSV` rejects bad data; `createDataFrame` bypasses validation.
- **Error class 12**: Don't just check that `s.mean()` on a nullable column returns `number | null` — show that arithmetic on the result (`avg * 2`) is blocked. All four aggregation functions (mean, sum, min, groupby mean) should each have their own `@ts-expect-error`.
- **Error class 15**: Don't just show that `distinct` drops columns — show that `distinct("patient_id").mutate({ doc: (r) => r.physician })` is blocked. And show that the *absence* of `keep_all` is the safety feature (no foot gun).
- **Error class 35**: After `pivotWider`, missing combinations produce null. The test should show that `r.systolic - r.diastolic` on the pivoted result is blocked at compile time, not just that the pivot fills nulls.

**Corollary: every case must reach the downstream operation.** A case that only observes a state change — "dtype unchanged", "null re-introduced", "column renamed" — without testing what happens when you *use* that state is incomplete. The fix is to extend the case to the downstream operation, not to remove it.

Examples:
- **Bad (observes state):** "11b: re-introduce null after fill" → test just checks `hasNull === true`. All three languages are silent because nothing went wrong yet. The case observes a fact about mutability, not a user mistake.
- **Good (reaches downstream):** "11b: arithmetic after re-introducing null" → after `replaceNull` + re-introducing null via mutate, test does `result_value / reference_high`. TS produces Infinity (null coerces to 0 in JS division), Python produces NaN, R produces NA. Now the case shows what actually goes wrong.
- **Bad (observes state):** "11c: dropna no narrowing" → test just counts rows after `removeNull`. The case observes a correct operation completing, not a mistake.
- **Good (reaches downstream):** "11c: arithmetic after removeNull" → after `removeNull`, test does `result_value / reference_high` on the narrowed DataFrame. All rows are valid, arithmetic works. This shows the narrowing enables safe operations — the positive complement to 11a.

### Equivalent comparisons across languages

Tests must compare the *same operation* across all three languages. Watch for cases where:
- The TS test uses a different API entry point than Python/R (e.g., `createDataFrame` vs `readCSV`)
- The TS test checks a trivial definition while Python/R test the practical endpoint
- Labels imply something the code doesn't actually test (e.g., "25b: log on string col" but the code tests log on a numeric col)

When Python/R don't have an equivalent concept (e.g., R has no async/await for error class 08), use "—" for both runtime and result columns. This is accurate, not a gap.

When a language handles a problem by design rather than by detection (e.g., TS's `distinct` has no `keep_all` foot gun), the comparison is still valid — it shows the design choice prevents the error entirely.

### How to decide between `"error"` and `"silent"` for TS runtime assertions

**Default to `"error"`.** The bar for asserting `"silent"` is high. Ask:
1. **Does Tidy-TS have enough information to detect the problem?** If the library receives the wrong data, sees NaN in output, or gets non-numeric input to a numeric function — it should throw. The fact that it *currently* doesn't is a gap, not an acceptable state.
2. **Is the problem purely in user-space JS semantics?** Only assert `"silent"` when the error is genuinely outside Tidy-TS's control — e.g., `number === "string"` is valid JS that evaluates to `false`. The library never sees wrong types; the comparison just returns false. There is no hook point.
3. **Would Python/R catch this?** If pandas or tidyverse throws an error for the same operation, Tidy-TS should aspire to the same. Don't let JS's permissiveness be an excuse for silent corruption.

**Examples:**
- `s.mean(stringArray)` → should throw. `s.mean` receives the data and can check types. Assert `"error"`.
- `mutate` produces NaN from JS coercion (e.g., `"BNP" * 10`) → genuinely silent. NaN is a legitimate value; mutate should not throw on NaN output. The error is in user-space JS arithmetic coercion, same category as `===`. Assert `"silent"`.
- `r.result_value === "high"` → genuinely silent. Tidy-TS cannot intercept a JS `===` operator. Assert `"silent"`.

**The recurring mistake to avoid:** Observing that current code returns without error and lazily asserting `"silent"`. That turns the test into a rubber stamp for bugs instead of a quality gate.

### Result column guidance

Every `result` field in probes and `captureOutcome()` calls should be a concise, interpretable description (ideally 6-7 words, max 30 chars) that tells the reader *what happened*. Not raw values like `true`, `0`, `"object"`, or truncated JSON.

**Good results:** "NaN propagated silently", "null coerced to 0 silently", "string repeated, not math", "all columns kept silently"
**Bad results:** `true`, `0`, `"object"`, `[{"a":1},{"b":2}...]`

For error outcomes, `fmtResult` returns "N/A" — this is correct since the error message is in the `message` field.

### Runtime behavior categories

**Row proxy access (mutate/filter callbacks)**:
- Accessing a nonexistent column via the row proxy (e.g., `r.patientId` when column is `patient_id`) throws at runtime: `Column "patientId" not found. Available columns: [...]`. Implemented via `wrapRowView()` Proxy in `verb-helpers.ts`.

**Statistical functions (`s.mean`, `s.sum`, etc.)**:
- Should validate input types and throw when given non-numeric data. Currently some return null/NaN silently — these are gaps to fix.

**Mutate output validation**:
- Mutate does not scan output values. NaN/Infinity from JS arithmetic coercion (`"pending" * 2`, `100 / null`, `undefined / 7`) are JS operator semantics — same category as `===`. No hook point.
- Exception: mutate detects Promise returns and throws. `mutateAsync` exists for this reason.

**JS operator expressions (no hook point)**:
- `number === "string"`, `string > number`, `string * number`, `null / number`, etc. — these are valid JS that evaluates to unexpected values. Tidy-TS has no way to intercept JS operators between values after valid column access. These are genuinely `"silent"`.

**String-based API (arrange, select, groupBy, join keys)**:
- These validate the column name directly and already throw at runtime with descriptive messages.

### Compile-time check completeness

Every case label (e.g., "12b: sum on NaN/NA col") must have a corresponding section in the compile-time test block. `deriveCompileOutcomes()` looks for the label prefix (e.g., "12b") in the compile-time test and checks for `@ts-expect-error`. If there's no section for a label, it defaults to "silent" — which may be wrong.

**Common gap:** A compile-time test demonstrates the error for case "a" but omits cases "b", "c", "d" even though the same type-level protection applies. Every case that TS catches at compile time must have its own `@ts-expect-error`.

### Library type bugs found and fixed

- **`RowAfterPivotWider`** (pivot-types.ts:23): Generated columns were typed as `Row[ValuesFrom]` (non-nullable) but missing pivot combinations produce `undefined` at runtime (`.fill(undefined)`). Fixed to `Row[ValuesFrom] | undefined`.
- **`ColumnValueResult` Awaited unwrapping** (mutate.types.ts): `ColumnValueResult` used `Awaited<Result>` which silently unwrapped `Promise<string>` to `string`, hiding async mistakes from downstream operations. Removed `Awaited` from sync `ColumnValueResult` so sync mutate preserves `Promise<T>` return types — enables TS2367 to catch `Promise<string> === "none"`. Created `AwaitedRowAfterMutation` for async path (`MutateAsyncMethod`) which legitimately resolves Promises.

### Inherent limitations (all three frameworks silent, no reasonable fix)

These are documented as silent/silent for all three and are not bugs:
- **29a/29b**: Empty DataFrame ops — sum/mean on empty is a design choice

## Progress

### Completed
- [x] 01 through 36 — all test files, probes, and compile-time checks
- [x] `runner.test.ts` — 74 tests, all passing (was 77 before class 23 removal, then 75 after 16b drop)
- [x] `collect-tables.ts` — generates `all-tables.json` and `all-tables.md`
- [x] Result column cleanup — all 36 tables have concise, interpretable result descriptions

### Fixes applied during review
- [x] **06**: Rewrote to use `readCSV` with Zod schema and top-level `await` to get a typed DataFrame. Compile-time test now demonstrates `@ts-expect-error` on `r.missing_col` for 6b. Runtime test uses `captureOutcome()` (sync) for proxy errors and inline async for `readCSV` rejections. 6b now shows `error` at compile time (was `silent`).
- [x] **18**: Removed 18c/18d ("wrong suffix convention" cases) from all files — `.test.ts`, `.ts`, `probe.py`, `probe.R`, and `runner.test.ts`. Reduced from 4 cases to 2. Updated `runner.test.ts` to match new probe output (both now `"error"`, was `"silent"`/`"error"`).
- [x] **10c**: Added missing compile-time check for `s.mean()` on nullable converted column. Now shows `error` (was `silent`).
- [x] **12b/c/d**: Added missing `@ts-expect-error` for sum, min, groupby mean on nullable columns. All now show `error` (were `silent`).
- [x] **15b**: Added `@ts-expect-error` showing no `keep_all` foot gun. Now shows `error` (was `silent`).
- [x] **16**: Rewrote to test arithmetic on union column (`status * 2`) instead of trivial `.toUpperCase()` method resolution. Updated Python/R probes to match.
- [x] **25b**: Fixed mislabel from "log on string col" to "log on numeric col" — the test was always testing the happy path.
- [x] **26b**: Added missing compile-time check for arithmetic on nullable after sort. Now shows `error` (was `silent`).
- [x] **35b**: Fixed `RowAfterPivotWider` type bug — pivot columns now correctly typed as nullable. Added `@ts-expect-error`. Now shows `error` (was `silent`).
- [x] **09**: Added 9c (`.reduce()` / type coercion) to LABELS, runtime, compile-time, and Python/R probes. Was 2 cases, now 3. Python 9c tests `.values` escape (string concat via numpy); R 9c tests for-loop type coercion.
- [x] **12**: Extended all 4 runtime cases to do downstream arithmetic on aggregation results (e.g., `r.avg * 2`) instead of just observing `hasNull` state. Updated Python/R probes to match. Results now show "null*2 coerced to 0" (TS), "mean*2 skipped NaN silently" (Py), "mean*2 returned NA: TRUE" (R).
- [x] **13b**: Fixed compile-time check — was showing correct usage (optional chaining `?.`), now shows `@ts-expect-error` for unguarded `.toUpperCase()` on the `site` column. 13b now shows `error` at compile time (was `silent`).
- [x] **13 (bindRows type bug)**: Fixed `MergeRows` in `bind-rows.types.ts` — keys unique to either side were asymmetric (Row1-only stayed required, Row2-only was optional `?`). Both now use `T | undefined` (required but nullable), matching the DataFrame convention. This was a library type bug, not just a test issue.
- [x] **23**: Removed entirely — TS tests were not equivalent to Python/R (TS tested `summarize`+`mutate`, Python tested `apply()`, R tested `slice_max`). Non-comparable operations. Removed from `.test.ts`, `.ts`, `probe.py`, `probe.R`, `runner.test.ts`, and `all-tables.md`.
- [x] **16b**: Dropped — was testing `Number()` coercion which is a JS built-in, not a Tidy-TS operation. TS can't catch it (`Number()` accepts `any`), so all three languages silently produce NaN. No differentiating value. Class 16 is now single-case (16a only).
- [x] **06 (all-tables.md)**: Fixed compile column for 6a and 6c from `silent` to `—`. CSV content is only known at runtime — there's nothing the compiler can check, so `—` (N/A) is correct, not `silent` (which implies the compiler saw it and let it through).
- [x] **11c**: Dropped — was testing the happy path (removeNull → arithmetic works). All three languages silent because nothing goes wrong. Correct behavior, not an error case. Class 11 is now 2 cases (11a, 11b).
- [x] **32**: Removed entirely — NaN/Infinity guards have no compile-time catch and all three languages are silent. No differentiating value.
- [x] **33**: Rewrote as single case (33a) — duplicate property in object literal caught by TS1117 at compile time. Downstream `.mutate()` shows the practical consequence.
- [x] **34**: Rewrote as single case (34a) — filter comparing union type to value outside the union (e.g., `Status === "unknown"`) caught by TS2367 (no overlap). Python/R silently return 0 rows.
- [x] **35**: Updated pivot types from `| null` to `| undefined` to match runtime behavior (`.fill(undefined)`). Updated all pivot type tests.
- [x] **08**: Rewrote to show downstream filter operation — label changed from "8a: async fn in sync mutate" to "8a: filter on async-mutated col". Added proper `@ts-expect-error` for `Promise<string> === "none"` (TS2367). Fixed `ColumnValueResult` type to preserve `Promise<T>` in sync mutate (was unwrapping via `Awaited`). Compile now shows `error` (was `silent`).
