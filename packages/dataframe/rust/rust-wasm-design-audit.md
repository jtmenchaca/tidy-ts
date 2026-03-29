# Rust → WASM Design Audit

Audit of the `packages/dataframe/rust/` (Rust) → `packages/dataframe/ts/wasm/` (TypeScript) pipeline.

**Built with**: `deno task wasmbuild` (generates `lib/tidy_ts_dataframe.{wasm,js,internal.js,d.ts}`)

---

## Architecture Overview

```
Rust source (packages/dataframe/rust/)
  ├── dataframe/        ← DataFrame ops (joins, sort, group, pivot, etc.)
  │   └── *.wasm.rs     ← #[wasm_bindgen] exports
  └── stats/
      ├── core/         ← Shared types, effect sizes, errors, calc
      ├── distributions/ ← 17 probability distributions + distributions_wasm.rs
      ├── extensions/   ← Traits (ranks, iterators)
      ├── helpers/      ← wasm_helpers.rs (parse_alternative)
      ├── regression/
      │   ├── family/   ← GLM families (gaussian, binomial, poisson, etc.)
      │   ├── glm/      ← GLM fitting + wasm.rs
      │   ├── glmm/     ← GLMM fitting + wasm.rs
      │   ├── gee/      ← GEE fitting + wasm.rs
      │   ├── shared/   ← Formula parser, model trait
      │   └── model_utilities/
      └── statistical_tests/
          └── {14 test modules}/  ← Each has impl + wasm.rs

       ↓ wasmbuild ↓

TypeScript bindings (packages/dataframe/ts/wasm/)
  ├── wasm-init.ts          ← Runtime init (Deno/Node/Browser)
  ├── wasm-loader.ts        ← Barrel re-exporter
  ├── wasm-serializer.ts    ← WASM object → plain JS serializer
  ├── statistical-tests.ts  ← 33 test function wrappers
  ├── probability-distributions.ts ← 64 distribution wrappers
  ├── glm-functions.ts      ← GLM fit + result class
  ├── glmm-functions.ts     ← GLMM fit + result class
  ├── stats-functions.ts    ← Aggregates + unique/count + GEE
  ├── grouping-functions.ts ← Group-by ops
  ├── pivot-functions.ts    ← Pivot wider/longer
  ├── sorting-functions.ts  ← Sort + filter
  └── join-functions.ts     ← Join index computation
```

## Scale

| Layer | Files | Lines |
|-------|------:|------:|
| Rust (excl. survival/) | 159 | ~43,500 |
| Rust `wasm.rs` files | 18 | ~3,200 |
| Rust `dataframe/*.wasm.rs` files | 21 | — |
| TS `wasm/` bindings | 12 | ~3,500 |

---

## Findings

### 1. Three different data-passing strategies (inconsistent)

| Strategy | Used by | Direction |
|----------|---------|-----------|
| **Typed arrays** (`Float64Array`, `Uint32Array`) | Statistical tests, distributions, dataframe ops, grouping, sorts | TS → Rust → TS |
| **JSON strings** (`JSON.stringify` → `serde_json`) | GLM, GLMM, GEE | TS → Rust (data), Rust → TS (results) |
| **WASM objects** (`__wbg_ptr` structs with getters) | Statistical test results | Rust → TS |

The typed-array approach is the best for performance. The JSON approach in GLM/GLMM/GEE is necessary for complex nested structures (formulas, categorical vars, options) but adds serialization overhead and requires `decodeWithSpecialFloats` for NaN/Infinity handling.

**Concern**: The WASM object approach (statistical test results) requires `wasm-serializer.ts` (399 lines) to manually extract every possible property. This is a maintenance burden — every new field added to a Rust result struct needs a corresponding check in the serializer.

### 2. `decodeWithSpecialFloats` is duplicated

Identical function defined in both:
- `glm-functions.ts` (line 25)
- `glmm-functions.ts` (line 10)

`encodeWithSpecialFloats` exists only in `glm-functions.ts` (line 10).

These should be in a shared location (e.g., `wasm-serializer.ts` or a new `wasm-json-helpers.ts`).

### 3. `format_error` is duplicated in Rust

Identical function in:
- `glm/wasm.rs` (line 448)
- `glmm/wasm.rs` (line 421)

```rust
fn format_error(error: &str) -> String {
    format!(r#"{{"error":"{}"}}"#, error.replace('"', r#"\""#))
}
```

Should be in `stats/helpers/wasm_helpers.rs` or a shared regression helpers module.

### 4. Two different error-handling strategies (Rust side)

| Strategy | Used by | How |
|----------|---------|-----|
| **Return NaN-filled result structs** | Statistical tests (10 `wasm.rs` files) | `unwrap_or_else` with all fields set to `NaN` |
| **Return JSON with `{error: "..."}` key** | GLM, GLMM | `format_error()` returns error JSON string |

The statistical test approach is verbose — each `unwrap_or_else` block manually constructs a full result struct with NaN values (15-25 lines per function). This is repeated across every test type.

**Recommendation**: Consider a trait or macro for "create error result" to reduce boilerplate.

### 5. `wasm-serializer.ts` is a maintenance hazard (399 lines)

`serializeTestResult()` manually checks 61 property names with `if (result.X !== undefined)` blocks. This is:
- Fragile: adding a field to a Rust struct doesn't cause a compile error if the serializer is missing it
- Not discoverable: developers must remember to update both Rust and TS
- Repetitive: many blocks are structurally identical

**Alternative approaches**:
- Have Rust return JSON strings (like GLM/GLMM do) via `serde_json::to_string`
- Use `serde-wasm-bindgen` to auto-convert Rust structs to JS objects
- Generate the serializer from the Rust type definitions

### 6. Typing inconsistencies in TS wrappers

| File | `any` count | Issue |
|------|------------:|-------|
| `sorting-functions.ts` | 16 | All params are `any` |
| `stats-functions.ts` | 11 | Most params are `any` |
| `wasm-serializer.ts` | 4 | Expected (dynamic extraction) |
| `glm-functions.ts` | 2 | Minimal |
| All others | 0 | Properly typed |

`sorting-functions.ts` and `stats-functions.ts` use `any` for everything — these should have proper types (`Float64Array`, `Uint32Array`, `number`, etc.) since the Rust signatures are known.

### 7. `stats-functions.ts` mixes unrelated domains

This file contains:
- Unique/count functions (dataframe ops)
- Mean/sum/quantile/median/IQR (stats aggregates)
- `distinct_rows_generic_typed` (a dataframe filtering op)
- GEE model fitting (regression)

GEE is a regression model but lives with simple aggregates instead of alongside GLM/GLMM. The distinct function is a dataframe op, not a stats function.

### 8. Dead/unused Rust code

| Item | Location | Status |
|------|----------|--------|
| `mean_null_hypothesis()` | `stats/core/utils.rs` | Exported but never called outside its own module |
| `common.rs` | `stats/helpers/common.rs` | Empty file (1 line: comment only), `pub mod common` commented out in `mod.rs` |

### 9. Alternative hypothesis parsing is inconsistent across wasm.rs files

Three different approaches exist:
- **`parse_alternative()`** — used by `t/wasm.rs`, `z/wasm.rs`, `proportion/wasm.rs` (wraps `AlternativeType::from_str()`)
- **Inline `match` on string** — used by `correlation/wasm.rs`
- **Pass raw string to constructor** — used by `mann_whitney/wasm.rs` (the impl handles parsing internally)

`parse_alternative` in `stats/helpers/wasm_helpers.rs` is a single function (11 lines) that wraps `AlternativeType::from_str()` with no added logic. The inconsistency suggests it was added for some tests but others predate it or took different paths.

### 10. `distributions_wasm.rs` is a monolith

All 17 distributions' WASM bindings are in a single 471-line file. This contrasts with statistical tests where each test has its own `wasm.rs`. Both approaches work, but consistency matters for discoverability as the project grows.

---

## Summary Table

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Three inconsistent data-passing strategies | Low (works, but new devs need to learn all 3) | High to unify |
| 2 | `decodeWithSpecialFloats` duplicated (TS) | Medium (bug risk on divergence) | **Low** |
| 3 | `format_error` duplicated (Rust) | Medium (bug risk on divergence) | **Low** |
| 4 | Two error-handling strategies (Rust) | Low (both work) | Medium |
| 5 | `wasm-serializer.ts` manual property extraction | **High** (maintenance burden, silent field omissions) | Medium |
| 6 | `any` types in sorting/stats TS wrappers | Medium (loses type safety) | **Low** |
| 7 | `stats-functions.ts` mixes domains (GEE, distinct) | Low (organizational) | **Low** |
| 8 | Dead Rust code (`mean_null_hypothesis`, `common.rs`) | Low | **Low** |
| 9 | `parse_alternative` indirection | Low | **Low** |
| 10 | `distributions_wasm.rs` monolith vs per-test pattern | Low (style inconsistency) | Medium |

---

## Detailed Solutions

### Finding 1: Three inconsistent data-passing strategies → consolidate to two

**Current state**: Three strategies (typed arrays, JSON strings, WASM objects).

**Target state**: Three intentional strategies, each for a clear use case:
- **Typed arrays** (`&[f64]`, `&[u32]`, `&mut [u32]`) for bulk numeric data — zero-copy, best perf. Used by: aggregates, sorts, filters, distributions, simple stats (sum, mean, quantile)
- **WASM objects with `take*()` methods** for performance-critical multi-array results — zero-copy transfer of ownership. Used by: `JoinIdxU32` (joins return paired index arrays), `Grouping` (grouping returns gid array + unique keys). These are correctly using WASM objects because they transfer large `Vec<u32>` buffers without serialization overhead. Do NOT migrate these to `serde-wasm-bindgen`.
- **`serde-wasm-bindgen`** for structured result objects with many named fields — produces plain JS objects directly, handles NaN/Infinity natively. Used by: stat test results (20+ field structs), regression results (GLM/GLMM/GEE). This replaces both the current WASM getter pattern AND the JSON string pattern for these cases.

**Why `serde-wasm-bindgen` over JSON strings**: The JSON approach (currently used by GLM/GLMM/GEE) was an improvement over WASM objects, but has its own issues:
- Double serialization: `serde_json::to_string()` in Rust → `JSON.parse()` in TS
- NaN/Infinity aren't valid JSON — requires custom `"NaN"` string encoding + `decodeWithSpecialFloats` reviver
- More code to maintain than necessary

`serde-wasm-bindgen` eliminates both problems:
- Single pass: Rust struct → JS object directly via `serde_wasm_bindgen::to_value()`
- `f64` NaN/Infinity pass through natively as JS `NaN`/`Infinity` (they're JS `number` values, not JSON)
- No codec functions needed on the TS side at all

**Note on TS→Rust inputs**: For sending complex data *into* WASM (formulas, categorical variable specs, options objects), `JSON.stringify` + `serde_json::from_str` remains fine — input complexity is where JSON shines and `serde-wasm-bindgen::from_value` adds little benefit. The win is on the *return* path.

**Actions**: See Findings 2 and 5 for migration details.

---

### Finding 2: `decodeWithSpecialFloats` / `encodeWithSpecialFloats` — delete, don't deduplicate

**Problem**: `decodeWithSpecialFloats` is copy-pasted in two files. `encodeWithSpecialFloats` exists only in one.

**Original plan**: Deduplicate into a shared `json-codec.ts`.

**Revised plan**: These functions exist solely to work around JSON's inability to represent NaN/Infinity. With `serde-wasm-bindgen` (Finding 5), Rust returns `JsValue` directly — `f64` NaN/Infinity become native JS `NaN`/`Infinity` values without any encoding. Both functions become unnecessary.

**Short-term** (before Finding 5 migration): Deduplicate into `ts/wasm/json-codec.ts` as a temporary measure so GLM/GLMM share the same copy.

**After Finding 5 migration**: Delete `json-codec.ts` entirely. The functions are no longer needed because:
- Statistical test results: returned via `serde_wasm_bindgen::to_value()` → NaN handled natively
- GLM/GLMM/GEE results: also migrated to `serde-wasm-bindgen` → `decodeWithSpecialFloats` deleted
- `encodeWithSpecialFloats`: only used for GLM input encoding; can be replaced by `serde_wasm_bindgen::from_value` on the Rust side, or kept as the one remaining JSON input path (TS→Rust inputs are less problematic since NaN rarely appears in input data)

**Files to modify (short-term):**
- `packages/dataframe/ts/wasm/json-codec.ts` — create with both functions
- `packages/dataframe/ts/wasm/glm-functions.ts` — delete both functions, import from `./json-codec.ts`
- `packages/dataframe/ts/wasm/glmm-functions.ts` — delete `decodeWithSpecialFloats`, import from `./json-codec.ts`

**Files to delete (after Finding 5):**
- `packages/dataframe/ts/wasm/json-codec.ts` — no longer needed
- `packages/dataframe/ts/wasm/wasm-serializer.ts` — no longer needed

**Effort**: ~15 minutes (short-term), then ~10 minutes cleanup (after Finding 5)

---

### Finding 3: `format_error` duplication in Rust — deduplicate now, eliminate later

**Problem**: Identical `format_error` function in `glm/wasm.rs` (line 448) and `glmm/wasm.rs` (line 421). GEE has an inline variant on line 37 of `gee/wasm.rs`: `format!("{{\"error\":\"{}\"}}", e.replace('"', "'"))` — note it replaces with `'` instead of escaped `\"`, which is a subtle inconsistency.

**Short-term solution**: Deduplicate into `packages/dataframe/rust/stats/regression/shared/utils.rs`. This is better than `stats/helpers/wasm_helpers.rs` because:
- `format_error` is regression-specific (only GLM/GLMM/GEE use JSON error returns)
- `stats/helpers/wasm_helpers.rs` is for statistical test helpers (e.g., `parse_alternative`)
- Keeping it in `regression/shared/` keeps the regression error pattern colocated

**After `serde-wasm-bindgen` migration**: `format_error` becomes unnecessary. When regression models switch from returning `String` (JSON) to returning `JsValue` (via `serde_wasm_bindgen::to_value`), errors can be returned as `Result<JsValue, JsValue>` — wasm-bindgen converts `Err(JsValue)` into a thrown JS exception, which is the idiomatic pattern. No more manual JSON error formatting.

**Files to modify (short-term):**
- `packages/dataframe/rust/stats/regression/shared/utils.rs` — add `pub fn format_error(error: &str) -> String`
- `packages/dataframe/rust/stats/regression/shared/mod.rs` — re-export `format_error`
- `packages/dataframe/rust/stats/regression/glm/wasm.rs` — delete local `format_error` (line 448), import from shared
- `packages/dataframe/rust/stats/regression/glmm/wasm.rs` — delete local `format_error` (line 421), import from shared
- `packages/dataframe/rust/stats/regression/gee/wasm.rs` — replace inline `format!` (line 37) with shared `format_error` call

**Effort**: ~15 minutes

---

### Finding 4: Two different error-handling strategies (Rust side) → unify via `Result<JsValue, JsValue>`

**Problem**: Statistical test `wasm.rs` files return WASM struct objects with NaN-filled fields on error (15-25 lines per function). Regression `wasm.rs` files return JSON `{"error":"..."}` strings.

**Solution with `serde-wasm-bindgen`**: Both strategies converge to a single pattern: return `Result<JsValue, JsValue>`.

```rust
// Unified pattern for all WASM exports (stat tests AND regression):
#[wasm_bindgen]
pub fn t_test_one_sample(x: &[f64], mu: f64, alpha: f64, alternative: &str) -> Result<JsValue, JsValue> {
    let alt = parse_alternative(alternative);
    let result = t_test(x.iter().copied(), mu, alt, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
```

**Why this is better than both current approaches:**
- **vs NaN-filled structs**: No more 15-25 line manual error construction blocks. Errors become thrown JS exceptions (which is how the TS layer should handle them). The `ErrorResult` trait is no longer needed.
- **vs `format_error()` JSON strings**: No more `{"error":"..."}` pattern that the caller must check. `Result<JsValue, JsValue>` lets wasm-bindgen throw a proper exception.

**TS side error handling** becomes idiomatic:
```typescript
// Before (JSON string pattern):
const resJson = wasmInternal.glm_fit_wasm(...);
const res = decodeWithSpecialFloats(resJson);
if (res.error) throw new Error(res.error);  // manual check

// After (serde-wasm-bindgen):
const res = wasmInternal.glm_fit_wasm(...);  // throws on error, returns plain object on success
```

**Files with `unwrap_or_else` blocks to eliminate** (each has 1-4 functions):
- `packages/dataframe/rust/stats/statistical_tests/t/wasm.rs` — 3 functions
- `packages/dataframe/rust/stats/statistical_tests/z/wasm.rs`
- `packages/dataframe/rust/stats/statistical_tests/proportion/wasm.rs`
- `packages/dataframe/rust/stats/statistical_tests/chi_square/wasm.rs`
- `packages/dataframe/rust/stats/statistical_tests/fisher/wasm.rs`
- `packages/dataframe/rust/stats/statistical_tests/correlation/wasm.rs` — 3 functions
- `packages/dataframe/rust/stats/statistical_tests/mann_whitney/wasm.rs`
- `packages/dataframe/rust/stats/statistical_tests/wilcoxon_signed_rank/wasm.rs`
- `packages/dataframe/rust/stats/statistical_tests/anova/wasm.rs`
- `packages/dataframe/rust/stats/statistical_tests/kruskal/wasm.rs`

**Also migrated:**
- `packages/dataframe/rust/stats/regression/glm/wasm.rs` — `String` → `Result<JsValue, JsValue>`
- `packages/dataframe/rust/stats/regression/glmm/wasm.rs` — `String` → `Result<JsValue, JsValue>`
- `packages/dataframe/rust/stats/regression/gee/wasm.rs` — `String` → `Result<JsValue, JsValue>`

**Effort**: Medium (~2-3 hours). Mechanical changes across many files, but each is simpler than before (no error-result construction at all).

---

### Finding 5: `wasm-serializer.ts` maintenance hazard → eliminate via `serde-wasm-bindgen`

**Problem**: `serializeTestResult()` (399 lines, 61 `!== undefined` checks) manually extracts every property from WASM objects. Adding a field to a Rust struct silently omits it from the JS result unless the TS serializer is also updated.

**Solution**: Use `serde-wasm-bindgen` to return plain JS objects directly from Rust.

**Why `serde-wasm-bindgen` over JSON strings** (correcting earlier assessment):

| | JSON string (`serde_json`) | `serde-wasm-bindgen` |
|---|---|---|
| NaN/Infinity | Not valid JSON — requires `"NaN"` string hack + `decodeWithSpecialFloats` reviver on TS side | Native: `f64` NaN/Infinity → JS `NaN`/`Infinity` directly |
| Serialization | Double pass: `serde_json::to_string()` → `JSON.parse()` | Single pass: Rust struct → JS object |
| TS code needed | 6-line `decodeWithSpecialFloats` function | Nothing |
| Error handling | Must check `result.error` manually | `Result<JsValue, JsValue>` → thrown JS exception |
| Option fields | JSON `null` | JS `undefined` (or `null` with `json_compatible()`) |
| Struct fields | Plain object properties | Plain object properties |
| Dependencies | `serde_json` (already in use) | `serde-wasm-bindgen` crate (add to Cargo.toml) |

The key insight: **`serde-wasm-bindgen` serializes `f64` directly to JS `number` via `JsValue`**, which means NaN and Infinity just work — they're valid JavaScript values, just not valid JSON. This eliminates the entire `encode/decodeWithSpecialFloats` workaround.

**Migration approach** (per test, can be done incrementally):

Rust side:
```rust
// Before (current — returns WASM object with getters):
#[wasm_bindgen]
pub fn t_test_one_sample(x: &[f64], mu: f64, alpha: f64, alternative: &str) -> OneSampleTTestResult {
    let alt = parse_alternative(alternative);
    t_test(x.iter().copied(), mu, alt, alpha).unwrap_or_else(|error| {
        OneSampleTTestResult {
            test_statistic: TestStatistic { value: f64::NAN, name: ... },
            p_value: f64::NAN,
            // ... 15 more lines of NaN-filling
        }
    })
}

// After (serde-wasm-bindgen — returns plain JS object):
#[wasm_bindgen]
pub fn t_test_one_sample(x: &[f64], mu: f64, alpha: f64, alternative: &str) -> Result<JsValue, JsValue> {
    let alt = parse_alternative(alternative);
    let result = t_test(x.iter().copied(), mu, alt, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
```

TS side:
```typescript
// Before (current — needs serializeTestResult):
export function t_test_one_sample(x: Float64Array, mu: number, alpha: number, alt: string): OneSampleTTestResult {
  initWasm();
  return wasmInternal.t_test_one_sample(x, mu, alpha, alt);  // returns opaque WASM object
}
// ... then caller must: serializeTestResult(result) to get plain object

// After (serde-wasm-bindgen — already a plain object):
export function t_test_one_sample(x: Float64Array, mu: number, alpha: number, alt: string): OneSampleTTestResult {
  initWasm();
  return wasmInternal.t_test_one_sample(x, mu, alpha, alt);  // already a plain JS object, NaN works
}
// ... caller uses result directly — no serialization step
```

**Files to modify:**

Rust:
- `Cargo.toml` — add `serde-wasm-bindgen` dependency
- All 10+ `packages/dataframe/rust/stats/statistical_tests/*/wasm.rs` — return `Result<JsValue, JsValue>` via `serde_wasm_bindgen::to_value()`, remove `unwrap_or_else` NaN blocks
- `packages/dataframe/rust/stats/core/types.rs` — remove `#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]` from result structs (no longer returned as WASM objects)
- `packages/dataframe/rust/stats/regression/glm/wasm.rs` — return `Result<JsValue, JsValue>` instead of `String`
- `packages/dataframe/rust/stats/regression/glmm/wasm.rs` — same
- `packages/dataframe/rust/stats/regression/gee/wasm.rs` — same

TypeScript:
- `packages/dataframe/ts/wasm/statistical-tests.ts` — remove `serializeTestResult` re-export; return types are now plain objects
- `packages/dataframe/ts/wasm/wasm-serializer.ts` — **delete entirely**
- `packages/dataframe/ts/wasm/glm-functions.ts` — delete `decodeWithSpecialFloats`, remove JSON decode step
- `packages/dataframe/ts/wasm/glmm-functions.ts` — delete `decodeWithSpecialFloats`, remove JSON decode step
- `packages/dataframe/ts/stats/statistical-tests/*.ts` (all 15+ files) — remove `serializeTestResult()` calls, results are already plain objects

**Effort**: Medium-high (~3-4 hours). Many files to touch, but each change is simpler than before — the Rust side gets shorter (no error construction), and the TS side gets shorter (no serialization).

**Can be done incrementally**: Migrate one test type at a time. `serde-wasm-bindgen::to_value()` and `serde_json::to_string()` can coexist — the crate just adds an option, it doesn't replace anything.

---

### Finding 6: `any` types in TS wrappers

**Problem**: `sorting-functions.ts` has 16 `any` params, `stats-functions.ts` has 11 `any` params.

**Solution**: Replace with proper types from the generated `lib/tidy_ts_dataframe.d.ts`. The Rust signatures are known:

**`packages/dataframe/ts/wasm/sorting-functions.ts`** — proper types:
```typescript
arrange_multi_f64_wasm(values: Float64Array, nRows: number, nCols: number, dirs: Uint8Array, outIdx: Uint32Array): void
stable_sort_indices_f64_wasm(values: Float64Array, indices: Uint32Array, ascending: boolean): void
stable_sort_indices_u32_wasm(values: Uint32Array, indices: Uint32Array, ascending: boolean, na_code: number): void
batch_filter_numbers(values: Float64Array, threshold: number, operation: number, output: Uint8Array): void
```

**`packages/dataframe/ts/wasm/stats-functions.ts`** — proper types for lines 7-60:
```typescript
unique_f64(values: Float64Array): Float64Array
unique_i32(values: Int32Array): Int32Array
unique_str(values: string[]): string[]
count_f64(values: Float64Array, target: number): number
count_i32(values: Int32Array, target: number): number
count_str(values: string[], target: string): number
mean_wasm(values: Float64Array): number
sum_wasm(values: Float64Array): number
quantile_wasm(values: Float64Array, probs: Float64Array): Float64Array
median_wasm(values: Float64Array): number
iqr_wasm(values: Float64Array): number
```

**Files to modify:**
- `packages/dataframe/ts/wasm/sorting-functions.ts` — replace all `any` with proper types, remove `deno-lint-ignore-file no-explicit-any`
- `packages/dataframe/ts/wasm/stats-functions.ts` — replace `any` params (lines 7-60) with proper types, remove `deno-lint-ignore-file no-explicit-any`

**Note**: The exact types should be verified against the generated `lib/tidy_ts_dataframe.d.ts` before applying. The types listed above are inferred from the Rust signatures but the generated TS declarations are authoritative.

**Effort**: ~30 minutes

---

### Finding 7: `stats-functions.ts` mixes unrelated domains

**Problem**: GEE (a regression model) lives with simple aggregates. `distinct_rows_generic_typed` is a dataframe filtering op, not a stats function.

**Solution**: Create `packages/dataframe/ts/wasm/gee-functions.ts` for GEE. Move `distinct_rows_generic_typed` to an existing file.

**Files to create:**
- `packages/dataframe/ts/wasm/gee-functions.ts` — move `GeeCorstr`, `GeeglmFitOptions`, `GeeglmResult`, `geeglmFit` from `stats-functions.ts` (lines 71-122)

**Files to modify:**
- `packages/dataframe/ts/wasm/stats-functions.ts` — delete lines 71-122 (GEE section)
- `packages/dataframe/ts/wasm/wasm-loader.ts` — add `export * from "./gee-functions.ts"`
- All TS files that import GEE types/functions from `stats-functions.ts` — update import paths to `./gee-functions.ts`

**For `distinct_rows_generic_typed`** (lines 63-69): This is a dataframe filtering primitive. It could move to `sorting-functions.ts` (since that file already has `batch_filter_numbers`) or stay where it is. The cost of moving it is low but the benefit is marginal — it's only 7 lines. Recommendation: leave it unless we rename `stats-functions.ts` to something more accurate like `aggregate-functions.ts`.

**Effort**: ~20 minutes

---

### Finding 8: Dead Rust code

**Problem**: Two pieces of dead code identified.

**Solution**: Delete both.

**Files to modify:**
- `packages/dataframe/rust/stats/core/utils.rs` — delete `mean_null_hypothesis` function (entire file content, lines 1-20)
- `packages/dataframe/rust/stats/core/mod.rs` — remove `pub mod utils;` (line 6), remove `pub use utils::mean_null_hypothesis;` (line 19)
- `packages/dataframe/rust/stats/helpers/common.rs` — delete this file entirely
- `packages/dataframe/rust/stats/helpers/mod.rs` — remove commented-out `// pub mod common;` (line 3) and `// pub use common::*;` (line 8)

**Effort**: ~5 minutes

---

### Finding 9: Alternative hypothesis parsing inconsistency

**Problem**: Three approaches across wasm.rs files:
1. `parse_alternative()` from `wasm_helpers.rs` — used by `t/wasm.rs`, `z/wasm.rs`, `proportion/wasm.rs`
2. Inline `match` on string — used by `correlation/wasm.rs` (3 functions)
3. Pass raw string to constructor — used by `mann_whitney/wasm.rs`

**Solution**: Standardize on `parse_alternative()` for cases 1 and 2. Leave case 3 alone (Mann-Whitney's constructor handles it internally — changing it would require refactoring the test implementation).

**Files to modify:**
- `packages/dataframe/rust/stats/statistical_tests/correlation/wasm.rs` — replace the 3 inline `match alternative { ... }` blocks (lines 19-23, 55-59, 92-96) with `use crate::stats::helpers::parse_alternative;` + `parse_alternative(alternative)` call

**Files unchanged:**
- `packages/dataframe/rust/stats/statistical_tests/mann_whitney/wasm.rs` — `MannWhitneyUTest::independent()` accepts `&str` directly and parses internally. Changing this would require modifying the test API, which is out of scope.

**Effort**: ~10 minutes

---

### Finding 10: `distributions_wasm.rs` monolith

**Problem**: All 17 distributions' WASM bindings are in a single 471-line file, while statistical tests use per-test `wasm.rs` files.

**Verdict**: Leave as-is. The monolith is actually fine here because:
- Each distribution function is a simple 3-5 line wrapper (parameter validation → call statrs → return)
- The functions are structurally identical (dpqr pattern) — grouping them aids comprehension
- Splitting into 17 files would add file management overhead with no readability benefit
- Statistical tests have per-test `wasm.rs` because each test has unique parameters and error handling

If the file grows past ~600 lines (e.g., adding distribution-specific logic beyond simple wrappers), reconsider splitting. But for uniform thin wrappers, a single file is better.

**No action needed.**

---

## Implementation Todo List

Ordered by dependencies, then by effort (quick wins first). Each task is self-contained.

### Phase 1: Delete dead code & fix obvious issues (no dependencies, all quick)

| # | Source | Task | Files | Effort |
|---|--------|------|-------|--------|
| 1 | F8 | Delete `mean_null_hypothesis()` function | `stats/core/utils.rs` (delete), `stats/core/mod.rs` (remove `pub mod utils` + re-export) | 2 min |
| 2 | F8 | Delete empty `common.rs` and its commented-out declarations | `stats/helpers/common.rs` (delete file), `stats/helpers/mod.rs` (remove lines 3, 8) | 2 min |
| 3 | S13 | Delete or relocate orphaned `rust/survival/` directory | `rust/survival/` — delete entirely, or move `survival-port-plan.md` into `rust/stats/survival/` | 2 min |
| 4 | — | Remove `// pub mod old;` from `rust/mod.rs` (line 13) | `rust/mod.rs` | 1 min |

### Phase 2: Consistency fixes (no dependencies, low effort)

| # | Source | Task | Files | Effort |
|---|--------|------|-------|--------|
| 5 | F9 | Replace inline `match alternative` blocks in `correlation/wasm.rs` with `parse_alternative()` | `stats/statistical_tests/correlation/wasm.rs` (lines 19-23, 55-59, 92-96) | 10 min |
| 6 | S2 | Replace `partial_cmp(b).unwrap()` with `unwrap_or(Ordering::Equal)` in quantile sort closures | `dataframe/quantile.wasm.rs:20`, `dataframe/median.wasm.rs:20`, `dataframe/iqr.wasm.rs:21` | 5 min |
| 7 | S2 | Replace bare `map.get_mut(&k).unwrap()` with `.expect("key just inserted")` in join helpers | `dataframe/join-helpers.wasm.rs` (2 locations) | 5 min |
| 8 | S15 | Gate `shared_types` behind `#[cfg(feature = "wasm")]` in `mod.rs` | `rust/mod.rs` | 5 min |

### Phase 3: Deduplication (no dependencies, medium effort)

| # | Source | Task | Files | Effort |
|---|--------|------|-------|--------|
| 9 | S1 | Extract shared quantile engine into `quantile_core.rs` (or `shared-types.wasm.rs`) | Create shared module; slim down `quantile.wasm.rs`, `median.wasm.rs`, `iqr.wasm.rs` to thin WASM wrappers | 30 min |
| 10 | S16 | Remove `#![allow(dead_code)]` blankets from quantile/median/iqr/left-join files (should resolve after task 9 dedup; use `pub(crate)` on remaining internal helpers) | `quantile.wasm.rs`, `median.wasm.rs`, `iqr.wasm.rs`, `left-join.wasm.rs` | 10 min |
| 11 | F3 | Deduplicate `format_error()` to `regression/shared/utils.rs` | `regression/shared/utils.rs` (add fn), `regression/shared/mod.rs` (re-export), `glm/wasm.rs` (delete local, import), `glmm/wasm.rs` (delete local, import), `gee/wasm.rs` (replace inline format!) | 15 min |
| 12 | F2 | Deduplicate `decodeWithSpecialFloats`/`encodeWithSpecialFloats` into `ts/wasm/json-codec.ts` (temporary — deleted in task 24) | Create `json-codec.ts`; update `glm-functions.ts`, `glmm-functions.ts` to import | 15 min |

### Phase 4: TS typing & organization (no dependencies, medium effort)

| # | Source | Task | Files | Effort |
|---|--------|------|-------|--------|
| 13 | F6 | Replace all `any` params in `sorting-functions.ts` with proper typed array types; remove `deno-lint-ignore-file` | `ts/wasm/sorting-functions.ts` | 15 min |
| 14 | F6 | Replace all `any` params in `stats-functions.ts` (lines 7-60) with proper types; remove `deno-lint-ignore-file` | `ts/wasm/stats-functions.ts` | 15 min |
| 15 | F7 | Extract GEE types + `geeglmFit` to `ts/wasm/gee-functions.ts`; update barrel export | Create `gee-functions.ts`; update `stats-functions.ts` (delete lines 71-122), `wasm-loader.ts` (add export), update all GEE import sites | 20 min |
| 16 | S6 | Add explicit return type annotations to all TS WASM wrapper functions (121 functions across 8 files) | `statistical-tests.ts`, `probability-distributions.ts`, `pivot-functions.ts`, `grouping-functions.ts`, `stats-functions.ts`, `join-functions.ts`, `sorting-functions.ts` | 45 min |

### Phase 5: Error handling improvements (some depend on Phase 3)

| # | Source | Task | Files | Effort |
|---|--------|------|-------|--------|
| 17 | S14 | Replace 11 bare `unwrap()` on `solve_linear_system()` with `?` propagation; update enclosing function signatures to return `Result` | `regression/glmm/laplace/linear_algebra.rs` | 45 min |
| 18 | S9 | Verify which grouping functions are called from TS; delete `group_ids_codes()`, `get_unique_group_keys()`, `get_group_count()` if superseded by `group_ids_codes_all()` | `dataframe/grouping.wasm.rs`, `ts/wasm/grouping-functions.ts`, grep TS callers | 20 min |

### Phase 6: `serde-wasm-bindgen` migration (the big one — depends on Phases 1-3)

| # | Source | Task | Files | Effort |
|---|--------|------|-------|--------|
| 19 | F1, F5 | Add `serde-wasm-bindgen` to `Cargo.toml` as optional WASM dependency | `Cargo.toml` | 2 min |
| 20 | F5 | Remove `#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]` from all stat test result structs | `stats/core/types.rs` (many structs) | 15 min |
| 21 | F4, F5 | Migrate all stat test `wasm.rs` files: return `Result<JsValue, JsValue>` via `serde_wasm_bindgen::to_value()`, delete `unwrap_or_else` NaN-filled error blocks | `t/wasm.rs`, `z/wasm.rs`, `proportion/wasm.rs`, `chi_square/wasm.rs`, `fisher/wasm.rs`, `correlation/wasm.rs`, `mann_whitney/wasm.rs`, `wilcoxon_signed_rank/wasm.rs`, `anova/wasm.rs`, `kruskal/wasm.rs` | 90 min |
| 22 | F4, F5 | Migrate regression `wasm.rs` files: return `Result<JsValue, JsValue>` instead of JSON `String` | `glm/wasm.rs`, `glmm/wasm.rs`, `gee/wasm.rs` | 45 min |
| 23 | F5 | Update TS stat test wrappers: remove all `serializeTestResult()` calls; results are now plain objects | `ts/wasm/statistical-tests.ts`, `ts/stats/statistical-tests/*.ts` (all 15+ consumer files) | 30 min |

### Phase 7: Post-migration cleanup (depends on Phase 6)

| # | Source | Task | Files | Effort |
|---|--------|------|-------|--------|
| 24 | F2 | Delete `ts/wasm/json-codec.ts` (created in task 12); remove imports from `glm-functions.ts`, `glmm-functions.ts`; delete `decodeWithSpecialFloats` calls from GLM/GLMM result handling | `json-codec.ts` (delete), `glm-functions.ts`, `glmm-functions.ts` | 10 min |
| 25 | F5 | Delete `ts/wasm/wasm-serializer.ts` entirely; remove re-export from `statistical-tests.ts` | `wasm-serializer.ts` (delete), `statistical-tests.ts` | 5 min |
| 26 | F3 | Delete `format_error()` from `regression/shared/utils.rs` (no longer needed — errors are `Result<JsValue, JsValue>` now) | `regression/shared/utils.rs`, `regression/shared/mod.rs` | 5 min |

### Phase 8: Ongoing habits (apply when touching files for other work)

| # | Source | Task | Context |
|---|--------|------|---------|
| 27 | S17 | Use `pub(crate)` for internal helpers, not `pub` | All new code; tighten when touching existing files |
| 28 | S3 | Adopt `StatError` enum for new stat functions; migrate existing functions incrementally | `stats/core/errors.rs` defines it; current code uses `Result<T, String>` |
| 29 | F10 | If `distributions_wasm.rs` grows past ~600 lines, split into per-distribution files | Currently 471 lines — fine for now |

### Summary

| Phase | Tasks | Total effort | Depends on |
|-------|------:|-------------|------------|
| 1. Delete dead code | 4 | ~7 min | — |
| 2. Consistency fixes | 4 | ~25 min | — |
| 3. Deduplication | 4 | ~70 min | — |
| 4. TS typing & org | 4 | ~95 min | — |
| 5. Error handling | 2 | ~65 min | Phase 3 |
| 6. serde-wasm-bindgen | 5 | ~3 hrs | Phases 1-3 |
| 7. Post-migration cleanup | 3 | ~20 min | Phase 6 |
| 8. Ongoing habits | 3 | ongoing | — |
| **Total** | **29** | **~7 hrs** | |

Phases 1-4 are all independent and can be done in any order or in parallel. Phase 5 benefits from Phase 3 (quantile dedup). Phase 6 is the main migration. Phase 7 is cleanup after Phase 6.

---

## Code Style Assessment

### S1. Quantile implementation tripled across dataframe WASM files

**Severity: HIGH**

The entire quantile engine (9 type functions + main `quantile()` + `sort_by` with `unwrap`) is copy-pasted verbatim across three files:
- `rust/dataframe/quantile.wasm.rs` (201 lines)
- `rust/dataframe/median.wasm.rs` (207 lines)
- `rust/dataframe/iqr.wasm.rs` (213 lines)

Each file has identical `quantile()`, `quantile_type1()` through `quantile_type9()`. The only difference is the thin WASM export at the bottom (`quantile_wasm`, `median_wasm`, `iqr_wasm`).

**Solution**: Extract the shared quantile engine into a shared module (e.g., `rust/dataframe/quantile_core.wasm.rs` or into `shared-types.wasm.rs`), then have the three files import and call it.

**Files to modify:**
- Create shared quantile module or add to `rust/dataframe/shared-types.wasm.rs`
- `rust/dataframe/quantile.wasm.rs` — keep only WASM export, import quantile engine
- `rust/dataframe/median.wasm.rs` — keep only WASM export + `median()` wrapper
- `rust/dataframe/iqr.wasm.rs` — keep only WASM export + `iqr()`/`quartiles()` wrappers

This also centralizes the `partial_cmp(b).unwrap()` fix (see S2) to one location.

---

### S2. Bare `unwrap()` on `partial_cmp` in sort closures

**Severity: HIGH** (potential panic on NaN data)

Three files (all from the quantile duplication) use:
```rust
clean_data.sort_by(|a, b| a.partial_cmp(b).unwrap());
```

While these files filter `is_finite()` first (so NaN shouldn't reach the sort), the `unwrap()` is still a code smell — it's a panic path that should never be hit. An explicit fallback makes the contract clear:

```rust
clean_data.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
```

Or better — `sort_unstable_by` with the same explicit ordering, since stability doesn't matter for numeric sorts.

**Other bare unwraps of concern:**
- `rust/dataframe/join-helpers.wasm.rs`: `map.get_mut(&k).unwrap()` — this is safe in context (key was just inserted) but an `expect("key just inserted")` is more explicit
- `rust/stats/regression/glmm/laplace/linear_algebra.rs`: Multiple `unwrap()` calls on matrix operations — these should propagate errors via `?` rather than panicking

**Files to audit/fix:**
- `rust/dataframe/quantile.wasm.rs:20`
- `rust/dataframe/median.wasm.rs:20`
- `rust/dataframe/iqr.wasm.rs:21`
- `rust/dataframe/join-helpers.wasm.rs` (2 unwraps)
- `rust/stats/regression/glmm/laplace/linear_algebra.rs` (~10 unwraps)

---

### S3. `StatError` enum defined but barely adopted

**Severity: MEDIUM**

`stats/core/errors.rs` defines a proper `StatError` enum with `EmptyData`, `InsufficientData`, `ComputeError` variants. It's exported from `stats/core/mod.rs`. But it's referenced in doc comments only — no function actually returns `Result<T, StatError>`. The entire codebase uses `Result<T, String>` instead.

This means error handling is stringly-typed throughout. Callers can't `match` on error kinds — they'd have to string-match on error messages.

**Options:**
1. **Adopt `StatError`** — migrate stat test functions to return `Result<T, StatError>`, convert to `String` only at the WASM boundary. This is the explicit approach.
2. **Delete `StatError`** — if the stringly-typed approach is intentional and the enum is aspirational dead code, remove it to avoid confusion.

Given your preference for explicitness, option 1 is ideal but is a large refactor. At minimum, new code should use `StatError` and existing code can be migrated incrementally.

---

### S4. `pub` used everywhere; `pub(crate)` nearly absent

See **S17** for full analysis with concrete examples.

---

### S5. `#[allow(dead_code)]` / `#![allow(dead_code)]` used as file-level blankets

See **S16** for full analysis with resolution path.

---

### S6. TS WASM wrappers: 121 of 144 exported functions lack return type annotations

**Severity: MEDIUM** (given preference for explicitness)

Breakdown:
| File | Functions | With return type | Without |
|------|-----------|-----------------|---------|
| `probability-distributions.ts` | 64 | 19 (`: number`) | 45 |
| `statistical-tests.ts` | 33 | 0 | 33 |
| `pivot-functions.ts` | 9 | 0 | 9 |
| `grouping-functions.ts` | 8 | 0 | 8 |
| `stats-functions.ts` | 13 | 2 (GEE section) | 11 |
| `join-functions.ts` | 5 | 0 | 5 |
| `sorting-functions.ts` | 4 | 0 | 4 |
| `glm-functions.ts` | 2 | 2 | 0 |
| `glmm-functions.ts` | 2 | 2 | 0 |
| Others | 4 | 2 | 2 |

The regression files (`glm-functions.ts`, `glmm-functions.ts`) are explicit about return types. The rest rely on type inference from `wasmInternal.*()` calls.

**Solution**: Add explicit return types to all exported functions. The return types are derivable from `lib/tidy_ts_dataframe.d.ts` (the generated declarations). For functions returning WASM objects (stat tests), this is especially important since the inferred type is the opaque WASM class, not a plain JS object.

This pairs with Finding 6 (`any` param types) — both should be fixed together.

---

### S7. Inconsistent WASM boundary error pattern (Rust `Result` → TS)

**Severity: LOW-MEDIUM**

Three different patterns for converting Rust errors at the WASM boundary:

1. **`map_err(|e| JsValue::from_str(e.as_str()))`** → `Result<T, JsValue>` — used by `quantile_wasm`, `median_wasm`, `iqr_wasm` (throws JS exception)
2. **`unwrap_or_else(|e| NaN-filled struct)`** — used by all statistical tests (returns "successful" struct with error metadata)
3. **`format_error()` → JSON string** — used by GLM/GLMM/GEE (returns `String`, caller must check `.error`)

**Target**: All WASM exports should use `Result<JsValue, JsValue>` (pattern 1, extended with `serde-wasm-bindgen` for the success path). This is the idiomatic wasm-bindgen pattern — errors become thrown JS exceptions, successes are plain objects.

**Covered by**: Findings 4 and 5 (the `serde-wasm-bindgen` migration).

---

### S8. TS wrappers are thin passthrough with no validation

**Severity: LOW** (design observation)

Every TS WASM wrapper follows the same pattern:
```typescript
export function foo(x: SomeType) {
  initWasm();
  return wasmInternal.foo(x);
}
```

No input validation happens on the TS side. All validation is in Rust. This is generally fine (validate once, at the lowest level), but it means:
- Callers get WASM-level error messages, not TS-friendly ones
- TypeScript's types are the only defense before hitting WASM

This is a design choice, not a bug. Documenting it here since "explicit" could mean "validate early."

---

### S9. Grouping functions rebuild the same hash map independently

**Severity: MEDIUM** (redundant work, code duplication)

`grouping.wasm.rs` has 4 functions that each build the same hash map from scratch:
- `group_ids_codes()` — returns `gid_per_row` (builds map, discards unique keys)
- `get_unique_group_keys()` — returns unique keys (builds map, discards gid)
- `get_group_count()` — returns count (builds map, discards everything)
- `group_ids_codes_all()` — returns `Grouping` struct with everything (the correct one)

The first three exist as older APIs. `group_ids_codes_all()` returns a `Grouping` WASM object with `takeGidPerRow()` and `takeUniqueKeys()` methods — it does one pass and gives you everything.

If the TS layer only calls `group_ids_codes_all()`, the other three are dead code. If it still calls them individually, it's doing 2-3x the hash map work.

**Solution**: Verify which are called from TS. If `group_ids_codes_all` has replaced the others, delete them.

---

### S10. `build_csr_from_keys_u32` / `build_csr_from_keys_u64` are nearly identical

**Severity: LOW**

`join-helpers.wasm.rs` has two CSR-building functions that differ only in key type (`u32` vs `u64`). They could be a single generic function `build_csr_from_keys<K: Hash + Eq + Copy>()`. However, the current approach avoids monomorphization bloat concerns in WASM — keeping both is acceptable for a performance-critical path.

**No action needed** — noting for awareness.

---

### S11. Dataframe ops correctly use `Result<(), JsValue>` and typed arrays — already best practice

**Severity: NONE** (positive finding)

The `dataframe/*.wasm.rs` files (arrange, filter, sort) already follow the best practices documented in the guidelines:
- Typed arrays for input/output (`&[f64]`, `&mut [u32]`)
- `Result<(), JsValue>` for error handling (throws JS exceptions)
- `#![deny(unsafe_op_in_unsafe_fn)]` for explicit unsafe blocks
- `WASM objects with take*()` for multi-array results (`JoinIdxU32`, `Grouping`)

These don't need migration. The patterns here are mature and should be preserved.

---

### S12. `JoinIdxU32` / `Grouping` use WASM objects correctly (intentional, not a problem)

**Severity: NONE** (clarification)

Unlike the stat test result structs (Finding 5), `JoinIdxU32` and `Grouping` are correctly using WASM objects because:
- They transfer large `Vec<u32>` buffers (potentially millions of indices)
- The `take*()` methods use `std::mem::take` for zero-copy ownership transfer
- `serde-wasm-bindgen` would serialize these as JS arrays, which involves copying every element — defeating the purpose
- The TS consumer calls `takeLeft()`/`takeRight()` immediately and gets `Uint32Array` views

The distinction: **use WASM objects for large homogeneous arrays** (joins, grouping), **use `serde-wasm-bindgen` for small heterogeneous structs** (test results, model summaries).

---

### S13. Orphaned `rust/survival/` directory alongside real `rust/stats/survival/`

**Severity: MEDIUM** (confusing for new developers)

Two `survival/` directories exist:
- `packages/dataframe/rust/stats/survival/` — the **real** implementation (12 files: Cox regression, Kaplan-Meier, log-rank test, etc.). Declared in `stats/mod.rs` line 21, fully integrated.
- `packages/dataframe/rust/survival/` — contains **only** a planning document (`survival-port-plan.md`). Not declared in any `mod.rs`. Not imported anywhere. Not referenced by any code.

The orphaned directory is a trap for anyone navigating the codebase — it looks like a parallel implementation but is just an abandoned staging area.

**Solution**: Delete `packages/dataframe/rust/survival/` entirely, or move the planning document into `packages/dataframe/rust/stats/survival/` if it's still a useful reference.

---

### S14. Bare `unwrap()` in GLMM linear algebra (11 calls on fallible operations)

**Severity: HIGH** (real panic risk on legitimate failures)

`packages/dataframe/rust/stats/regression/glmm/laplace/linear_algebra.rs` has 11 `unwrap()` calls on `solve_linear_system()` — unlike the quantile `partial_cmp` unwraps (which are protected by prior `is_finite()` filtering), these can legitimately fail:
- Singular matrices
- Numerical precision issues
- Ill-conditioned data

These should propagate errors via `?` operator rather than panicking in production WASM code. A panic in WASM crashes the entire runtime with no recovery.

**Files to fix:**
- `packages/dataframe/rust/stats/regression/glmm/laplace/linear_algebra.rs` — replace `solve_linear_system(...).unwrap()` with `solve_linear_system(...)?` (requires the enclosing functions to return `Result`)

---

### S15. `shared_types` exported unconditionally outside `#[cfg(feature = "wasm")]` gate

**Severity: LOW** (API surface cleanliness)

In `packages/dataframe/rust/mod.rs`, `pub use shared_types::*` is outside any feature gate, while all other module re-exports are behind `#[cfg(feature = "wasm")]`. This exports WASM-specific types like `JoinIdxU32`, `Grouping`, and `QuantileType` even in non-WASM builds where they serve no purpose.

**Solution**: Gate `shared_types` behind `#[cfg(feature = "wasm")]` alongside the other module declarations, or split it into WASM-specific types (gated) and genuinely shared types (ungated).

---

### S16. File-level `#![allow(dead_code)]` masks real dead code

**Severity: LOW-MEDIUM** (hides issues the compiler would otherwise catch)

Found in `dataframe/*.wasm.rs` files:
- `quantile.wasm.rs`
- `median.wasm.rs`
- `iqr.wasm.rs`
- `left-join.wasm.rs`

These blanket suppressions exist because internal helper functions (e.g., `quantile_type1` through `quantile_type9`) aren't called when `feature = "wasm"` is off. But the blanket hides *any* genuinely dead code that accumulates over time.

**Solution**: Replace `#![allow(dead_code)]` with targeted `#[cfg(feature = "wasm")]` gating on the module-level declaration in `mod.rs`, or use `pub(crate)` on the helper functions to indicate internal-only use. After the quantile deduplication (S1), this mostly resolves itself.

---

### S17. `pub` everywhere, `pub(crate)` nearly absent

**Severity: MEDIUM** (intent is unclear — what's internal vs. external?)

Only 3 uses of `pub(crate)` in the entire Rust codebase (all in `stats/core/types.rs`). Everything else is `pub`, making internal helpers indistinguishable from the public API surface.

For a WASM library, only `#[wasm_bindgen] pub fn` functions are truly public. Internal helpers, intermediate types, and module-internal functions should use `pub(crate)` or `pub(super)` to signal intent. Examples:
- The 9 `quantile_type*` functions are internal — should be `pub(crate)` (or private after S1 dedup)
- `IdentityHasher`, `FastState`, `Off` in `join-helpers.wasm.rs` are internal — should be `pub(crate)`
- `cmp_nan_last` in `arrange.wasm.rs` is a helper — should be `pub(crate)` or private

**No immediate action needed** — adopt as a habit when touching files for other fixes.

---

### Style Summary Table

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| S1 | Quantile engine tripled across 3 files (~600 duplicated lines) | **HIGH** | **Low** |
| S2 | Bare `unwrap()` on `partial_cmp` + matrix ops | **HIGH** | **Low** |
| S3 | `StatError` defined but never used (stringly-typed errors) | Medium | High (if adopting) |
| S4 | `pub` everywhere, `pub(crate)` absent | Medium | Ongoing habit |
| S5 | `#![allow(dead_code)]` blankets hiding real issues | Low-Medium | Low |
| S6 | 121/144 TS wasm exports missing return types | Medium | Medium |
| S7 | Three error-passing patterns at WASM boundary | Low-Medium | Covered by F4/F5 |
| S8 | No TS-side input validation in wrappers | Low | Design choice |
| S9 | Grouping functions rebuild same hash map 3x redundantly | Medium | Low |
| S10 | CSR builders duplicated for u32/u64 (acceptable) | Low | — |
| S11 | Dataframe ops already follow best practices | None | — |
| S12 | JoinIdxU32/Grouping WASM objects are correct (not a problem) | None | — |
| S13 | Orphaned `rust/survival/` dir alongside real `rust/stats/survival/` | Medium | **Low** |
| S14 | GLMM linear algebra has 11 bare `unwrap()` on fallible matrix ops | **HIGH** | Medium |
| S15 | `shared_types` exported outside `#[cfg(feature = "wasm")]` gate | Low | **Low** |
| S16 | File-level `#![allow(dead_code)]` blankets mask real dead code | Low-Medium | Low |
| S17 | `pub` everywhere, `pub(crate)` nearly absent | Medium | Ongoing habit |

---

## Guidelines for new WASM functions

### Data passing
- **Typed arrays** (`Float64Array`, `Uint32Array`) for bulk numeric data TS→Rust (zero-copy)
- **`serde-wasm-bindgen`** for structured results Rust→TS: `serde_wasm_bindgen::to_value(&result)` returns a plain JS object with native NaN/Infinity support
- **JSON strings** (`JSON.stringify`) are acceptable for complex TS→Rust inputs (formulas, options objects) where typed arrays don't apply
- **Never return WASM objects** (`#[wasm_bindgen(getter_with_clone)]` structs) — they require manual serialization on the TS side

### Error handling
- **Return `Result<JsValue, JsValue>`** from all WASM exports — errors become thrown JS exceptions
- **Use `.map_err(|e| JsValue::from_str(&e))?`** to propagate Rust errors to JS
- Do NOT construct NaN-filled error structs or `{"error":"..."}` JSON strings

### Style
- **Always type TS wrappers** — no `any` params, explicit return types
- **Each new domain** gets its own TS file (don't add to `stats-functions.ts`)
- **Keep `wasm.rs` files** colocated with their Rust implementation modules
- **Use `parse_alternative()`** from `stats/helpers/wasm_helpers.rs` for alternative hypothesis parsing
- **Use `pub(crate)`** for internal helpers, not `pub`

### Example: complete WASM function (Rust + TS)

```rust
// Rust: stats/statistical_tests/example/wasm.rs
use serde_wasm_bindgen;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn example_test(x: &[f64], alpha: f64) -> Result<JsValue, JsValue> {
    let result = run_test(x, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
```

```typescript
// TS: wasm/example-functions.ts
import { initWasm, wasmInternal } from "./wasm-init.ts";
import type { ExampleTestResult } from "./types.ts";

export function example_test(x: Float64Array, alpha: number): ExampleTestResult {
  initWasm();
  return wasmInternal.example_test(x, alpha) as ExampleTestResult;
}
```
