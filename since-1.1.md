# Changes Since v1.1.0

**Range**: v1.1.0 → HEAD (v1.3.0) — 103 commits

---

## Breaking Changes

### 1. snake_case → camelCase for All Statistical Test and GLM Results

All Rust structs now use `#[serde(rename_all = "camelCase")]`. Every field in every statistical test result and GLM result has been renamed:

- `test_name` → `testName`
- `test_statistic` → `testStatistic`
- `p_value` → `pValue`
- `effect_size` → `effectSize`
- `confidence_interval` → `confidenceInterval`
- `degrees_of_freedom` → `degreesOfFreedom`
- `mean_difference` → `meanDifference`
- `standard_error` → `standardError`
- `sample_size` → `sampleSize`
- `fitted_values` → `fittedValues`
- `working_residuals` → `workingResiduals`
- `dev_resids` → `devResids`
- `n_rows`/`n_cols` → `nRows`/`nCols`
- `column_names` → `columnNames`
- `term_assignments` → `termAssignments`
- etc.

Full typed interfaces were added for all test results (types.ts grew from 4 lines to 417 lines): `OneWayAnovaTestResult`, `WelchAnovaTestResult`, `TwoWayAnovaTestResult`, `ChiSquareIndependenceTestResult`, `MannWhitneyTestResult`, `WilcoxonSignedRankTestResult`, `KruskalWallisTestResult`, `PearsonCorrelationTestResult`, `SpearmanCorrelationTestResult`, `KendallCorrelationTestResult`, `TTestResult`, `ZTestResult`, `ProportionTestResult`, `ShapiroWilkTestResult`, `AndersonDarlingTestResult`, `DAgostinoPearsonTestResult`, `KolmogorovSmirnovTestResult`, `LeveneTestResult`, `FisherExactTestResult`, `TukeyHsdResult`, `GamesHowellResult`, `DunnTestResult`, plus building blocks `EffectSize`, `ConfidenceInterval`, `TestStatistic`.

### 2. Sync/Async Verb API Split

Verbs that previously accepted both sync and async formulas now have separate methods:

| Sync (rejects async at compile time) | Async |
|---|---|
| `mutate()` | `mutateAsync()` |
| `filter()` | `filterAsync()` |
| `summarise()` / `summarize()` | `summariseAsync()` / `summarizeAsync()` |
| `forEach()` / `forEachRow()` | `forEachRowAsync()` |
| — | `forEachColAsync()` |

Sync methods use an `AllSync<Formulas>` type guard with `NotAPromise<T>` to reject async functions at compile time.

### 3. GLM WASM Interface

- `glm_fit_wasm` now returns `Result<JsValue, JsValue>` instead of JSON strings (uses `serde_wasm_bindgen` for direct serialization).
- Removed `encodeWithSpecialFloats()` and `decodeWithSpecialFloats()` from TS side.
- Removed `wasm-serializer.ts` and `helpers.ts` from the wasm module entirely.
- Boolean fields (`converged`, `boundary`, `pivoted`) changed from `bool` to `u8` to avoid serde_wasm_bindgen corruption.
- Pre-computed confidence intervals added to `GlmResult`.

### 4. Arrow & Parquet Exports

- `@tidy-ts/arrow` (0.0.1 → 0.1.0): `parseArrowContent` and `zarrow` removed from public exports.
- `@tidy-ts/parquet` (0.0.1 → 0.1.0): `parseParquetContent` and `zparquet` removed from public exports.

---

## Deprecations

| Deprecated | Replacement |
|---|---|
| `toArray()` | `toRows()` |
| `replaceNA()` | `replaceNull()` / `replaceUndefined()` |
| `removeNA()` | `removeNull()` / `removeUndefined()` |
| `bind()` | `bindRows()` |
| `sample()` | `sliceSample()` |
| `head()` | `sliceHead()` |
| `tail()` | `sliceTail()` |
| `mutate()` with async formulas | `mutateAsync()` |
| `filter()` with async predicates | `filterAsync()` |
| `summarise()` with async formulas | `summariseAsync()` |

---

## Type System Overhaul

### `DataFrame<Row>` Consolidated into a Single Nominal Interface

Originally the type was split into `DataFrameBase<Row>` (interface) plus `DataFrameColumns<Row>` (intersection). This has been further consolidated: all method signatures now live directly on `DataFrameBase<Row>`, which carries a nominal brand via `unique symbol` (`[__df]: Row`) so tsc can short-circuit structural comparisons. `DataFrameColumns<Row>` remains for the columnar accessor but the intersection is no longer on the critical path for most type checks.

`PromisedDataFrame` now extends `DataFrame<Row>` (the full type) rather than `DataFrameBase<Row>`.

Comprehensive JSDoc was added to every method on `DataFrameBase` (~780 new lines in `dataframe.type.ts`).

### `UnifyUnion` Removed

`UnifyUnion` (previously `MergeUnionAllKeys`) was removed from all type-level code. In practice `Row` is never a union, and the type was expensive for the checker to evaluate on generics. Affected locations: `remove-na.ts` (`NarrowFields`), `interpolate.types.ts` (`InterpolateResult`), and the `DataFrameBase` imports.

### Method Types Extracted to Dedicated Files

Several method type signatures were extracted from inline definitions into their own `.types.ts` files to keep `dataframe.type.ts` focused on the interface shape:

- `remove-na.types.ts` — `RemoveNAMethod`, `RemoveNullMethod`, `RemoveUndefinedMethod` (with proper overloads for single field, variadic fields, and array-of-fields)
- `set-row-labels.types.ts` — `SetRowLabelsMethod`

### `RowAfterMutation` Rewrite

Replaced `Omit<Row, keyof Assignments> & { ... }` with a single mapped type. This fixes deferred `Exclude<keyof T, ...>` when `Row` is generic — e.g., `.select("id")` after `.mutate(...)` no longer fails.

### Generics Removed from Verb Implementations

Generics were stripped from all verb, proxy, and distribution *implementation* files (`.verb.ts`) to improve type-checking performance. Generics remain on public-facing `.types.ts` files. Verb type signatures now use `this: DataFrame<R>` with fresh generic parameters.

This was extended further to internal helpers: `withGroups()`, `withGroupsRebuilt()` (in `with-groups.ts`), and `mutateAsyncImpl()` all had their generic parameters removed and replaced with `any`, since they are internal plumbing that doesn't need compile-time type safety.

### Prettify + Tracing

Type tracing added for debugging. `Prettify` usage refined across the codebase.

---

## New DataFrame Features

### New Methods

- **`toRows()`** — returns mutable array of row objects (replaces `toArray()`)
- **`toColumns()`** — returns `{ [K in keyof Row]: Row[K][] }` columnar representation
- **`zDataFrame(shape)`** — Zod schema factory that parses columnar data into typed DataFrames. Accepts existing DataFrames (passthrough) or columnar data (validated + transformed).
- **`replaceNull(mapping)`** — replace only `null` values per column
- **`replaceUndefined(mapping)`** — replace only `undefined` values per column
- **`removeNull()`** / **`removeUndefined()`** — remove rows with null/undefined values

### New Stats Functions

- **`s.any(values, options?)`** — check if any value is true (supports `removeNull`/`removeUndefined`)
- **`s.all(values, options?)`** — check if all values are true
- **`cummin`/`cummax`** — now support `Date` and `Temporal` types (not just numbers)
- **`s.min`/`s.max`** — extended with Temporal support

### New IO Functions

- **`peek(path, options?)`** — file inspection returning markdown-formatted structure description (auto-detects .xlsx/.csv)
- **`peekXLSX(path, options?)`** — inspect XLSX structure (sheets, headers, preview rows, suggested schema)
- **`peekCSV(path, options?)`** — inspect CSV structure
- **`writeJSON()`** — exported from top-level mod.ts
- **`XLSXColumnFormat`** type exported
- CLI tool: `packages/dataframe/cli/peek.ts`

### Shared Verb Utilities

New `verb-helpers.ts` with `RowView` class (lightweight row cursor for columnar data), `buildDataFrameFromIndices()`, `compareValues()` (null-safe, type-aware comparison supporting Date and Temporal), `collectGroupIndices()`.

---

## TC39 Temporal Support

Full Temporal API support across all DataFrame verbs for: `Temporal.Instant`, `Temporal.ZonedDateTime`, `Temporal.PlainDate`, `Temporal.PlainDateTime`, `Temporal.PlainTime`.

New `temporal-helpers.ts` (358 lines) provides:
- `hasEpochMilliseconds()`, `temporalToEpochMs()`, `toEpochMs()` — epoch-capable types
- `isCalendarTemporal()`, `isWallClockTemporalWithoutCalendar()` — type classification
- `parseFrequencyForCalendar()`, `floorCalendarTemporal()` — temporal arithmetic
- `isTemporalLike()`, `isDateLike()` — type detection
- `compareTemporal()` — comparison
- `temporalAdd()`, `temporalSubtract()` — arithmetic

Temporal compatibility documented in `TEMPORAL_COMPAT.md`.

---

## XLSX / IO Fixes

### readXLSX
- Fixed data descriptor ZIP handling (bit 3 set) where local header sizes are 0; falls back to central directory sizes.
- Fixed inline string parsing (`<is><t>...</t></is>` cells).
- Row regex changed from `(.*?)` to `([\s\S]*?)` to handle multiline cell content.

### XLSX Date Handling
- Date serialization/deserialization rewritten to use UTC math consistently, fixing timezone-dependent roundtrip bugs.
- `dateToExcelSerial()` and `toDate()` both use `Date.UTC()` to avoid DST shifts.
- Added `dateHasTime()` detection: dates with time get `yyyy-mm-dd h:mm:ss` (numFmtId 165), dates without get `yyyy-mm-dd` (numFmtId 164).

### XLSX Metadata
- `readXLSXMetadata()` now returns `columnFormats: XLSXColumnFormat[]` with per-column format codes parsed from `xl/styles.xml`.
- Full built-in Excel number format table (`BUILTIN_NUM_FMTS`) added.

### Browser Support
- `writeXLSX` now works in browser environments.

---

## New Rust Modules

### GLMM (Generalized Linear Mixed Models)

Entirely new module at `packages/dataframe/rust/stats/regression/glmm/`:

- **Families**: Gaussian, Binomial, Poisson, Negative Binomial (NB1, NB2)
- **Features**: REML estimation, crossed random effects, random slopes, nested random effects, BLUP standard errors
- **Architecture**: Laplace approximation for marginal likelihood, L-BFGS outer optimization for variance components, log-Cholesky parameterization, sparse Z matrix construction, joint (beta, theta) optimization matching glmmTMB
- **Key files**: `fitting.rs` (4,513 lines), `laplace/` submodule (approximation, beta update, gradient, likelihood, linear algebra, mode finding, REML), `random_effects.rs`, `variance_components.rs`, `types.rs`, `wasm.rs`
- **TS bindings**: `packages/dataframe/ts/wasm/glmm-functions.ts` (460 lines)

### Survival Analysis

Entirely new module at `packages/dataframe/rust/stats/survival/` (~13,000+ lines):

- **Cox Regression**: Standard and Anderson-Gill counting process (`cox_regression.rs`, `ag_cox_regression.rs`), exact method (`cox_exact.rs`)
- **Residuals**: `cox_residuals.rs`, `ag_cox_residuals.rs`, `cox_score_residuals.rs`, `cox_residuals_derived.rs`
- **Baseline Hazard**: Single-state (`cox_baseline_hazard.rs`) and multi-state (`cox_baseline_hazard_ms.rs`)
- **Survival Estimation**: Efron (`cox_survival_efron.rs`) and Kaplan product-limit (`cox_survival_kp.rs`)
- **Kaplan-Meier**: `kaplan_meier.rs`
- **Log-Rank Test**: `logrank_test.rs`
- **Concordance**: `concordance.rs` (1,347 lines)
- **PH Assumption Testing**: `proportional_hazards_test.rs` (1,070 lines)
- **Competing Risks**: Fine-Gray transformation (`fine_gray_transform.rs`)
- **Supporting**: `wald_test.rs`, `cholesky.rs`, `clustering.rs`, `data_splitting.rs`, `interpolation.rs`, `numerical_safety.rs`
- **WASM bindings**: `wasm.rs` (2,689 lines)
- **TS bindings**: `packages/dataframe/ts/wasm/survival-functions.ts` (431 lines)

### Target Trial Emulation

New module at `packages/dataframe/rust/stats/target_trial/`:

- **Pipeline**: Data expansion for sequential trials (`pipeline.rs`, `expand.rs`, `covariates.rs`, `factorize.rs`)
- **Weights**: IPW/IPTW weight estimation (`weights.rs`, 1,542 lines)
- **Outcome Models**: `outcome_models.rs`, `glm_helpers.rs`
- **Hazard/Survival**: `hazard.rs`, `survival_curves.rs`, `risk_comparison.rs`
- **Bootstrap**: `bootstrap.rs`
- **Types**: `types.rs` (566 lines)
- **TS bindings**: `packages/dataframe/ts/targetTrial/types.ts` (172 lines), `index.ts` (59 lines)

### GLM Extensions

- **Sandwich estimators**: `sandwich.rs` (672 lines) — `vcovCL`, `meatCL`, `estfun.glm`, `bread.glm` for clustered robust standard errors
- **Multinomial GLM**: `multinomial.rs` (435 lines)
- **Negative Binomial families**: `negative_binomial.rs` (926 lines) — NB1 and NB2 with custom deviance/variance/AIC
- **Quasi-Binomial**: `quasibinomial.rs` (199 lines)

### Splines

New module at `packages/dataframe/rust/stats/splines/`:

- **B-splines**: `b_splines.rs` (460 lines) — port of R's `bs()`
- **Natural splines**: `natural_splines.rs` (599 lines) — port of R's `ns()`
- **Spline design**: `spline_design.rs` (526 lines) — core design matrix computation

### GEE (Generalized Estimating Equations)

- TS wrapper: `packages/dataframe/ts/wasm/gee-functions.ts` (53 lines) — `geeglmFit()` function
- Correlation structures: independence, exchangeable, ar1, unstructured, userdefined, fixed

---

## Bug Fixes

- **Join result types**: Fixed generic indexability preservation in join result types.
- **Join generics**: Fixed right-side fields being incorrectly exposed in join generics.
- **Join docs**: Corrected left/right/outer join documentation to say non-matching cells are `undefined` (not `null`).
- **Filter → join/bindRows pipeline**: Fixed tracking of filter indexes when piping filter results into joins or bindRows.
- **XLSX data descriptor ZIPs**: Fixed reading XLSX files with data descriptor bit set.
- **XLSX inline strings**: Fixed parsing of `<is><t>...</t></is>` cells.
- **XLSX date timezone**: Fixed timezone-dependent date roundtrip bugs by using UTC math.
- **GLMM BLUP standard errors**: Fixed computation using H^{-1}.

---

## Infrastructure

### CI/CD
- New `publish.yml` workflow for JSR publishing (supports dataframe, arrow, parquet, shims).
- `ci.yml` updated: split test runs per package, uses `pnpm install`, updated cache keys.
- `deploy.yml` updated: uses `tidy-ts-ci` container image, installs pnpm/Playwright.
- Removed `draft-pdf.yml` (JOSS PDF draft workflow).

### Docker
- Added Node.js 22, pnpm 10, Playwright Chromium dependencies.
- Fixed output directory paths for monorepo structure.

### Build
- `wasmbuild` version: 0.19.2 → 0.21.1
- WASM binary size: 1.17MB → 1.88MB (reflecting new Rust modules)
- Added `temporal-polyfill@^0.3.2` dependency
- Type check scripts now use `scripts/parse-check.ts` wrapper

### Browser Bundle
- Self-contained browser bundle with inlined WASM added.

### Shims Package
- Version: 0.0.19 → 0.1.0
- `test.ts`: Lazy initialization of runtime-specific test implementation (prevents errors in browser environments).
- Simplified exports (now just `"./mod.ts"`).

### MCP Package
- Monolithic `docs/dataframe.ts` (1,199 lines) replaced with granular topic-based documentation structure.
- Updated writeXLSX and writeCSV docs for browser support.

### Documentation
- `packages/docs/dist/` removed (built assets no longer tracked).
- Comprehensive new markdown documentation added under `docs/api/` covering dataframe (12 files), io (5 files), shims (8 files), stats (8 files), stats-compare (3 files), stats-distributions (17 files), stats-tests (8 files), string utilities.

---

## Testing

### New Test Suites
- **Survival analysis**: 40+ test files in `packages/testing/survival/` mirroring R's survival package
- **Sandwich estimators**: `vcovCL`, `vcovPC`, `vcovPL` tests
- **Target trial**: coefficient, hazard, multinomial, survival tests
- **GLMM**: WASM roundtrip tests and R source fixtures
- **Temporal API**: 14 new test files covering arrange, as-of join, calendar ops, downsample, group-by, interpolate, min/max, slice, structural types, time bucket, type compat, upsample
- **Browser runtime**: browser-specific test suite
- **Type profiling**: analysis scripts and trace output
- **JIT benchmarks**: `jit-vs-baseline.ts`, `mutate-jit.ts`

### New Bug Reproduction Tests
- `array-grouped-bleed.test.ts`, `async-detect.test.ts`, `dataframe-as-column-type.test.ts`, `filter-join-bug-report.ts`, `join-suffix-types.test.ts`, `no-types-reassign.test.ts`, `read-xlsx-inline-str.test.ts`, `record-string-unknown.test.ts`, `select-union-generic.test.ts`, `tap-api-exploration.test.ts`, `type-test-20260331.ts`, `zod-parse-dataframe.test.ts`

---

## Version History

| Version | Key Theme |
|---|---|
| v1.1.0 | Baseline |
| v1.2.0 | XLSX fixes, replaceNull/replaceUndefined, toRows/toColumns, GLMM foundation, camelCase migration |
| v1.3.0 | Temporal support, sync/async split, type system overhaul, survival analysis, target trial emulation |
| HEAD | DataFrame nominal branding, UnifyUnion removal, method type extraction, comprehensive JSDoc, further generic removal from internals |
