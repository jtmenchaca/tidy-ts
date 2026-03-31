# Survival Analysis Port Plan

Full port of R's `survival` package (Therneau) to Rust/WASM for tidy-ts. Validated against R using the same on-the-fly comparison pattern as GLM/GEE.

## Reference Sources

- `survival-ref/survival-master/` — R `survival` package (C core + R orchestration)
- `survival-ref/r-source-trunk/` — R base/stats source (for base R dependencies survival relies on)

---

## Implementation Standards — READ BEFORE STARTING ANY WORK

These standards exist because prior porting efforts produced half-solutions, silent simplifications, and misleading claims of completion. Every agent working on this port MUST follow these rules:

### 1. No Partial Ports of C Files

When a C file is listed in the inventory below, it must be ported **in full** — every branch, every edge case, every method variant. Do not:
- Skip Efron tie handling because "Breslow is simpler and usually sufficient"
- Omit weighted observation support because "we can add it later"
- Drop strata handling because "most users don't use strata"
- Implement only the right-censored path and skip counting process
- Leave out influence function computation because "it's optional"

If the C code handles it, the Rust code handles it. Period.

### 2. No Substituting Simpler Algorithms

Do not replace the survival package's algorithms with "equivalent" alternatives. For example:
- Do NOT use `faer`'s generic Cholesky instead of porting `cholesky2.c` — the survival Cholesky has specific tolerance-based singularity handling and rank detection that the generic version lacks
- Do NOT use a generic Newton-Raphson when the C code has specific step-halving logic
- Do NOT replace the binary tree concordance algorithm with a naive O(n²) implementation

### 3. Port R Base/Stats Dependencies From Source

When survival's R code calls a base R or stats function that does non-trivial computation (e.g., `approx()` for interpolation), you MUST port it from the actual R source in `survival-ref/r-source-trunk/`. Do not:
- Write a "simplified version" that handles "the common case"
- Use a third-party Rust crate as a substitute without verifying numerical equivalence
- Skip porting it and claim "we'll handle this in TypeScript"

### 4. Validate Before Claiming Success

Every Rust function must be validated against R's output using the on-the-fly comparison test pattern (see Test Infrastructure section). Do not:
- Claim a function works because "the code compiles and looks correct"
- Test with a single hand-picked example and call it done
- Use relaxed thresholds to make failing tests pass without understanding why they fail
- Report success without running `pnpm check` on affected TypeScript files

### 5. Preserve R's Numerical Behavior

The goal is numerical equivalence with R's survival package, not a "Rust-idiomatic rewrite." Where R's C code makes specific numerical choices (e.g., `coxsafe()` capping exp at 200, Cholesky tolerance thresholds, convergence criteria), preserve those exact choices. Document any intentional deviations with justification.

### 6. Do Not Overstate Progress

If a tier is partially complete, say exactly what is and isn't done. Do not say "Tier 1 is complete" when influence estimation or counting process support is missing. The checklists below exist for this reason — mark items individually.

---

## Current Status (2026-03-30)

**Tiers 1–3: COMPLETE** — 22 Rust modules. **Tier 4 partial** — Fine-Gray competing risks implemented. **152 tests passing across 48 test files**, 0 failing.

| Tier | Status | Modules | Tests |
|------|--------|---------|-------|
| 1 (KM + Foundation) | **Complete** | 4 | 18 |
| 2 (Cox PH) | **Complete** | 4 | 18 |
| 2b (Counting Process) | **Complete** | 2 | 7 |
| 3 (Diagnostics) | **Complete** | 12 | 59 |
| 4 (Extensions) | **Partial** — Fine-Gray | 1 | 4 |
| Integration tests | **Complete** | — | 152 |

**Naming divergences from original plan:**
- `cox_partial_likelihood.rs` + `cox_fitting.rs` → merged into `cox_regression.rs`
- `cox_counting_process.rs` → `ag_cox_regression.rs`
- `cox_residuals_martingale.rs` + `cox_residuals_schoenfeld.rs` → merged into `cox_residuals.rs`
- `cox_residuals_martingale_ag.rs` + `cox_residuals_score_ag.rs` → merged into `ag_cox_residuals.rs`
- `cox_residuals_deviance.rs` + `cox_residuals_dfbeta.rs` → merged into `cox_residuals_derived.rs`
- `confidence_intervals.rs` → CI transforms live inside `kaplan_meier.rs`
- `cox_baseline_hazard.rs` split into `cox_baseline_hazard.rs` (coxsurv3/4, right-censored) + `cox_baseline_hazard_ms.rs` (coxsurv1/2, multistate)

**Deferred items (not blocking correctness):**
- `kaplan_meier_fast.rs` — optimized fast path from `fastkm.c`
- `risk_set_validation.rs` — `norisk.c` is dead code (never called from R)
- Formula parsing (`formula_survival.rs`) — handled in TypeScript layer

**Integration phase:**
- WASM bindings implemented in `wasm.rs` (consolidated, not separate files)
- TypeScript wrappers in `survival-functions.ts`
- Integration test infrastructure: `survival-test-helpers.ts`, R source test companion scripts
- **152/152 integration tests passing across 48 test files** ported from R source tests:

  **Tier 1 — KM + Foundation (28 tests, 10 files):**
  - `doaml.test.ts` — 14 tests (Cox PH, residuals, KM survfit, survdiff, Cox survfit, counting process)
  - `difftest.test.ts` — 2 tests (survdiff: dummy group + stratified log-rank)
  - `survfit1.test.ts` — 2 tests (basic KM assertions)
  - `survfit2.test.ts` — 2 tests (KM with strata, weighted)
  - `survtest.test.ts` — 2 tests (counting-process KM + Cox survfit comparison)
  - `tiedtime.test.ts` — 1 test (floating-point tie handling)
  - `ekm.test.ts` — 1 test (expected KM)
  - `surv.test.ts` — 1 test (Surv object construction)
  - `summary_survfit.test.ts` — 2 tests (summary.survfit)
  - `summarydf.test.ts` — 2 tests (summary as data frame)

  **Tier 2 — Cox PH (40 tests, 11 files):**
  - `book1.test.ts` — 8 tests (Breslow hand-computed: iter=0/1/converged, residuals, survfit at x=0)
  - `book2.test.ts` — 6 tests (Efron hand-computed: iter=0/converged, residuals, survfit at x=0 with variance)
  - `doweight.test.ts` — 9 tests (weighted Cox PH: Breslow + Efron, residuals, replicated data)
  - `stratatest.test.ts` — 8 tests (stratified Cox: right-censored + counting process)
  - `infcox.test.ts` — 2 tests (multivariate Cox with near-infinite coefs / separation)
  - `cancer.test.ts` — 2 tests (lung cancer dataset Cox PH)
  - `testnull.test.ts` — 2 tests (null model Cox PH)
  - `singtest.test.ts` — 2 tests (singular/collinear covariates)
  - `testreg.test.ts` — 1 test (regression diagnostics)

  **Tier 2b — Counting Process (20 tests, 5 files):**
  - `detail.test.ts` — 4 tests (counting-process Efron at beta=-1 iter=0, by-hand hazard, residuals)
  - `book3.test.ts` — 7 tests (T&G dataset 2 counting process, Breslow)
  - `counting.test.ts` — 7 tests (Anderson-Gill counting process Cox)
  - `jasa.test.ts` — 2 tests (Stanford heart transplant JASA data)

  **Tier 3 — Diagnostics + Baseline Hazard + Concordance (60 tests, 21 files):**
  - `book4.test.ts` — 4 tests (Cox survfit with prediction)
  - `book5.test.ts` — 9 tests (multivariate Cox, residuals, survfit)
  - `book6.test.ts` — 7 tests (stratified Cox with diagnostics)
  - `book7.test.ts` — 3 tests (doscale / nocenter centering)
  - `coxsurv.test.ts` — 2 tests (Cox survfit basics)
  - `coxsurv2.test.ts` — 2 tests (Cox survfit multivariate)
  - `coxsurv3.test.ts` — 3 tests (counting-process Cox survfit with hand-computed values)
  - `coxsurv4.test.ts` — 1 test (Cox survfit strata)
  - `coxsurv5.test.ts` — 1 test (Cox survfit with offset)
  - `coxsurv6.test.ts` — 1 test (Cox survfit complex model)
  - `concordance.test.ts` — 3 tests (AML + lung concordance with reverse)
  - `concordance2.test.ts` — 1 test (concordance edge cases)
  - `concordance3.test.ts` — 2 tests (concordance binary tree algorithm)
  - `zph.test.ts` — 5 tests (Grambsch-Therneau PH test)
  - `r_lung.test.ts` — 1 test (lung dataset residuals)
  - `r_resid.test.ts` — 1 test (general residuals)
  - `residms.test.ts` — 1 test (multi-state residuals)
  - `residsf.test.ts` — 1 test (survfit residuals)
  - `bladder.test.ts` — 3 tests (bladder dataset Cox)
  - `strata2.test.ts` — 2 tests (strata edge cases)
  - `prednew.test.ts` — 2 tests (prediction on new data)
  - `predsurv.test.ts` — 1 test (survival predictions)
  - `brier.test.ts` — 1 test (Brier score)
  - `quantile.test.ts` — 2 tests (survfit quantile computation)

  **Tier 4 — Fine-Gray Competing Risks (4 tests, 1 file):**
  - `finegray.test.ts` — 4 tests (right-censored etype=1, etype=2, stratified, left truncation with delayed entry)

**WASM gaps fixed during integration:**
- [x] `coxph` `init` option (fixed iteration count) — needed by book1/book2
- [x] `coxph` `nocenter` option (disable covariate centering) — needed by book1
- [x] `survfitCox` prediction at specific covariate values (`newx`, `means`, `varMatrix`) — needed by book1/book2 `survfit(fit, list(x=0))`
- [x] Efron survfit variance: proper `agsurv5` xbar computation with covariates
- [x] Weighted Schoenfeld residuals: `score * weights` passed to `coxscho` (matching R's `residuals.coxph.R`)
- [x] Stratified `coxph`: sort by (strata, time) in `coxph_wasm` — needed by stratatest
- [x] Stratified `coxResiduals`: parse strata from options, build `strata_marker`/`strata_sameval` — needed by stratatest
- [x] Stratified `coxphCounting`: sort by (strata, time) — needed by stratatest
- [x] Binary/ternary variable centering skip (`doscale`): auto-detect `{-1,0,1}` vars matching R's `nocenter=c(-1,0,1)` — needed by book7
- [x] Counting-process martingale residuals: switch from `agmart` (O(n²)) to `agmart3` (O(n) two-pointer) in `cox_residuals_counting_wasm` — needed by detail
- [x] Concordance: btree/rank preprocessing matching R's `concordance.fit()`, descending time sort, `reverse` option for swapping concordant/discordant
- [x] `coxph_wasm` coefficient ordering: use `IndexMap` to preserve insertion order instead of `HashMap` — needed by multivariate models
- [x] `csv_to_sqlite.ts` type inference: scan ALL rows for decimals, not just first non-empty value — fixed INTEGER truncation of REAL columns (e.g., stop=0.5 → 0 in jasa fixture)

---

### Debugging Log — Lessons Learned

These bugs consumed significant debugging time. Documented here so future work avoids repeating them.

**1. Breslow vs Efron method mismatch in detail.test.ts (hours wasted)**

- **Symptom**: `detail.test.ts` loglik off by exactly 0.126, mart residuals off at index 5
- **Root cause**: Test file passed `method: "breslow"` to both `coxphCounting` and `coxResidualsCounting`, but the R reference values in `extract-reference.R` were computed with R's default method (Efron). The 0.126 difference is exactly the Breslow-vs-Efron gap at the 2 tied deaths at t=9.
- **Why it took so long**: Instead of immediately checking what method the R extraction script used, we spent hours investigating centering, doscale, sort orders, agfit4 C source line-by-line comparison, and a red-herring "noweb indentation bug" in the C source. All of these were correct. The actual problem was a one-word mismatch in the test file.
- **Compounding error**: When the `method: "breslow"` was replaced with `method: "efron"` in the test, the `replace_all` edit only matched lines with the exact indentation `    method: "breslow",` (4-space indent, top-level parameter). The residuals calls had `method: "breslow"` inside nested `options: { ... }` objects with different indentation, so they were NOT replaced. This caused a second round of debugging where the fit used Efron but the residuals still used Breslow.
- **Fix**: Added `web_sys::console::log_1` logging to the WASM entry point, which immediately showed the raw JSON contained `"method":"breslow"`. The fix was trivial: remove `method` from residual options (default Efron).
- **Lesson**: When a numerical discrepancy is exactly the known difference between two methods, check the method parameter first. Add logging at the entry point to see what the function actually receives. Don't hypothesize — instrument.

**2. Counting-process residuals using wrong function (agmart vs agmart3)**

- **Symptom**: Same as above (mart residuals wrong)
- **Root cause**: `cox_residuals_counting_wasm` called `agmart` (the slow O(n²) algorithm from `agmart.c`, designed for exact partial likelihood only) instead of `agmart3` (the fast O(n) algorithm from `agmart3.c`, designed for counting process data). Both happen to produce identical results for Breslow with this dataset, so this bug was masked.
- **Fix**: Switched to `agmart3` with proper descending sort arrays (`sort1`, `sort2`).
- **Lesson**: The R survival package has multiple implementations of similar functions (agmart vs agmart3, agscore2 vs agscore3, coxsurv1-4). Each is designed for a specific calling context. Match the caller to the correct implementation.

---

## Exhaustive File Inventory: R survival C Source → Rust Target

Every C file in `survival-ref/survival-master/src/` is listed below with its purpose, exported functions, internal dependencies, and the corresponding Rust file it maps to.

### Linear Algebra (Foundation — Required by Nearly Everything)

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `cholesky2.c` | `cholesky2()` | FDF' Cholesky decomposition, n×n, with tolerance-based singularity detection. Returns rank. | `isfinite()` | `cholesky.rs` |
| `chsolve2.c` | `chsolve2()` | Forward/back substitution to solve system given Cholesky from `cholesky2` | `cholesky2` output | `cholesky.rs` |
| `chinv2.c` | `chinv2()` | Matrix inversion via Cholesky factors from `cholesky2` | `cholesky2` output | `cholesky.rs` |
| `cholesky3.c` | `cholesky3()` | Block-diagonal Cholesky for frailty/penalty structure (upper m×m diagonal + lower dense) | `isfinite()` | `cholesky_block.rs` |
| `chsolve3.c` | `chsolve3()` | Solve for block-diagonal structure | `cholesky3` output | `cholesky_block.rs` |
| `chinv3.c` | `chinv3()` | Invert block-diagonal structure | `cholesky3` output | `cholesky_block.rs` |
| `cholesky5.c` | `cholesky5()` | Generalized inverse variant for penalized models | — | `cholesky_generalized.rs` (Tier 4) |
| `chsolve5.c` | `chsolve5()` | Solve with generalized Cholesky | — | `cholesky_generalized.rs` (Tier 4) |

### Utility Functions (Foundation)

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `dmatrix.c` | `dmatrix()`, `imatrix()` | Create ragged array (2D pointer indexing) from flat R matrix. Handles >2^31 elements. | R macros | Not needed — Rust uses `Vec<Vec<f64>>` or column-major `Vec<f64>` with indexing |
| `coxsafe.c` | `coxsafe()` | Safe `exp(x)` capped at `exp(200)` to prevent overflow | `exp()` | `numerical_safety.rs` |
| `doloop.c` | `init_doloop()`, `doloop()` | Nested loop enumeration for exact partial likelihood combination counting | — | `combinatorics.rs` (Tier 4 — exact method only) |
| `init.c` | `R_init_survival()` | R dynamic library registration of all .C/.Call entry points | R API | Not needed — WASM exports via `#[wasm_bindgen]` |

### Survival Object & Data Manipulation

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `survsplit.c` | `survsplit()` | Split (start, stop] intervals at specified cutpoints | — | `data_splitting.rs` |
| `collapse.c` | `collapse()` | Collapse adjacent intervals for same subject/strata/state when censored | — | `data_collapsing.rs` |
| `tmerge.c` | `tmerge()` | Merge time-dependent covariates into survival data | — | `time_dependent_merge.rs` (Tier 4) |
| `norisk.c` | `norisk()` | Identify observation pairs with no overlapping risk times | — | `risk_set_validation.rs` |
| `multicheck.c` | `multicheck()` | Validate multi-state survival data consistency | — | `multistate_validation.rs` (Tier 4) |
| `twoclust.c` | `twoclust()` | Identify two-level nested clustering structure | — | `clustering.rs` (Tier 3) |

### Kaplan-Meier & Non-Parametric Survival Curves

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `survfitkm.c` | `survfitkm()` | Full KM/Nelson-Aalen with influence estimation, weighted, clustered. Handles right-censored and counting process data. | `ALLOC()` | `kaplan_meier.rs` |
| `fastkm.c` | `fastkm1()`, `fastkm2()` | Optimized KM for simple cases (no strata, no clustering) | — | `kaplan_meier_fast.rs` |
| `survfit4.c` | `survfit4()` | Basic KM computation at unique times (simpler than survfitkm) | — | Subsumed into `kaplan_meier.rs` |
| `survfitresid.c` | `survfitresid()` | Residual-based survival curve calculation | — | `survfit_residuals.rs` (Tier 3) |

### Aalen-Johansen (Multi-State / Competing Risks)

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `survfitaj.c` | `survfitaj()` | Aalen-Johansen multi-state survival curves with transition matrices | `cdecomp()` | `aalen_johansen.rs` (Tier 4) |
| `cdecomp.c` | `cdecomp()` | Eigendecomposition of transition matrix: eigenvalues, eigenvectors, matrix exponential | `sqrt()`, `fabs()` | `matrix_exponential.rs` (Tier 4) |

### Cox PH — Core Fitting

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `coxfit6.c` | `coxfit6()` (SEXP), `coxfit6_iter()` (static) | Main Cox PH fitter. Newton-Raphson on partial likelihood. Breslow and Efron tie methods. Covariate centering/scaling. Step halving. | `cholesky2`, `chsolve2`, `chinv2`, `coxsafe`, `dmatrix` | `cox_partial_likelihood.rs` + `cox_fitting.rs` |
| `coxfit5.c` | `coxfit5_a()`, `coxfit5_b()`, `coxfit5_c()` | Reentrant Cox fitting for frailty (init/iterate/cleanup pattern). Handles sparse penalty terms. | `cholesky3`, `chsolve3`, `chinv3`, `cox_callback`, `coxsafe` | `cox_fitting_penalized.rs` (Tier 4) |
| `coxexact.c` | `coxexact()`, `coxd0()`, `coxd1()`, `coxd2()` | Exact partial likelihood (enumerates all orderings of tied deaths). Recursive with memoization. | `doloop`, `cholesky2`, `chsolve2`, `chinv2` | `cox_exact.rs` (Tier 4) |

### Cox PH — Counting Process (Start/Stop) Fitting

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `agfit4.c` | `agfit4()` | Anderson-Gill (counting process) Cox fitting. Same Newton-Raphson as coxfit6 but for (start, stop] data. | `cholesky2`, `chsolve2`, `chinv2`, `coxsafe`, `dmatrix` | `cox_counting_process.rs` |
| `agfit5.c` | `agfit5a()`, `agfit5b()`, `agfit5c()` | Reentrant AG fitting with frailty. | `cholesky3`, `chsolve3`, `chinv3`, `cox_callback`, `coxsafe` | `cox_counting_process_penalized.rs` (Tier 4) |
| `agexact.c` | `agexact()` | Exact partial likelihood for counting process data | `doloop`, `cholesky2`, `chsolve2` | `cox_counting_exact.rs` (Tier 4) |

### Cox PH — Residuals

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `coxmart.c` | `coxmart()` | Martingale residuals for right-censored Cox model | — | `cox_residuals_martingale.rs` |
| `coxmart2.c` | `coxmart2()` | Martingale residuals variant | — | `cox_residuals_martingale.rs` |
| `agmart.c` | `agmart()` | Martingale residuals for counting process (start, stop] data | — | `cox_residuals_martingale_ag.rs` |
| `agmart3.c` | `agmart3()` | Fast martingale for AG data with Efron tie handling | `ALLOC()` | `cox_residuals_martingale_ag.rs` |
| `coxscho.c` | `coxscho()` | Schoenfeld residuals (per-death covariate contributions) | `dmatrix` | `cox_residuals_schoenfeld.rs` |
| `coxscore2.c` | `coxscore2()` | Score residuals for right-censored data | — | `cox_residuals_score.rs` |
| `agscore2.c` | `agscore2()` | Score residuals for counting process data | `dmatrix` | `cox_residuals_score_ag.rs` |
| `agscore3.c` | `agscore3()` | Efficient score residuals with cumulative sums | `dmatrix` | `cox_residuals_score_ag.rs` |
| `residcsum.c` | `residcsum()` | Cumulative sum of residuals by strata | — | `residual_cumulative_sum.rs` (Tier 3) |

### Cox PH — Survival Curves from Fitted Model

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `coxsurv1.c` | `coxsurv1()` | Breslow baseline hazard + individual survival curves from Cox fit | — | `cox_baseline_hazard.rs` |
| `coxsurv2.c` | `coxsurv2()` | Survival curves with variance estimation | — | `cox_baseline_hazard.rs` |
| `coxsurv3.c` | `coxsurv3()` | Multi-strata survival curves from Cox | — | `cox_baseline_hazard.rs` |
| `coxsurv4.c` | `coxsurv4()` | Survival curves with influence functions | — | `cox_baseline_hazard.rs` |
| `agsurv4.c` | `agsurv4()` | Kalbfleisch-Prentice survival from AG model (bisection for tied deaths, 35 iterations) | `pow()` | `cox_survival_kp.rs` |
| `agsurv5.c` | `agsurv5()` | Efron-method helper for AG survival curves | — | `cox_survival_efron.rs` |

### Cox PH — Diagnostics & Tests

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `zph1.c` | `zph1()` | PH assumption test: regression of scaled Schoenfeld residuals on time (right-censored) | — | `proportional_hazards_test.rs` |
| `zph2.c` | `zph2()` | PH assumption test for counting process data | — | `proportional_hazards_test.rs` |
| `coxdetail.c` | `coxdetail()` | Detailed per-event-time components (means, score, information at each death time) | `dmatrix` | `cox_event_detail.rs` |
| `coxph_wtest.c` | `coxph_wtest()` | Wald test on subsets of coefficients via Cholesky of variance submatrix | — | `wald_test.rs` |
| `coxcount1.c` | `coxcount1()` | Risk set identification for time-varying coefficient `tt()` expansion | — | `risk_set_counting.rs` (Tier 4) |

### Concordance (C-Statistic)

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `concordance1.c` | `concordance1()` | Basic concordance (deprecated) | — | Superseded by concordance3 |
| `concordance3.c` | `concordance3()`, internal: `walkup()`, `addin()` | Fast C-index with influence estimation using binary tree. Returns concordant/discordant/tied counts + influence matrix. | `ALLOC()` | `concordance.rs` |
| `concordance5.c` | `concordance5()` | Simplified concordance (no influence) for speed | — | `concordance.rs` |
| `survConcordance.c` | wrapper | High-level concordance entry point | `concordance3` | Subsumed into `concordance.rs` |

### Hypothesis Testing

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `survdiff2.c` | `survdiff2()` | Log-rank test and variants (weighted tests). Computes observed/expected events and variance matrix across strata. | — | `logrank_test.rs` |

### Parametric Survival Regression (survreg)

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `survreg6.c` | `survreg6()` | Parametric AFT model fitting (Weibull, exponential, log-normal, log-logistic). Newton-Raphson on full likelihood. | `cholesky2`, `chsolve2`, `chinv2` | `parametric_aft.rs` (Tier 4) |
| `survreg7.c` | `survreg7()` | Parametric AFT with frailty/penalty terms | `cholesky3`, `cox_callback` | `parametric_aft_penalized.rs` (Tier 4) |
| `survregc1.c` | `survregc1()` | Log-likelihood computation for survreg iteration | — | `parametric_aft_likelihood.rs` (Tier 4) |
| `survregc2.c` | `survregc2()` | Log-likelihood variant for specific distributions | — | `parametric_aft_likelihood.rs` (Tier 4) |
| `survpenal.c` | `survpenal()` | Penalty computation for penalized parametric regression | — | `parametric_aft_penalized.rs` (Tier 4) |

### Fine-Gray (Competing Risks)

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `finegray.c` | `finegray()` | Data transformation for Fine-Gray subdistribution hazard: creates weighted pseudo-observations with IPCW weights | — | `fine_gray_transform.rs` ✅ |

### Person-Years & Expected Events

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `pyears1.c` | `pyears1()` | Person-years tabulation across multi-dimensional strata | `pystep` | `person_years.rs` (Tier 4) |
| `pyears2.c` | `pyears2()` | Person-years with expected events from rate tables | `pystep` | `person_years.rs` (Tier 4) |
| `pyears3b.c` | `pyears3b()` | Person-years with grouping | `pystep` | `person_years.rs` (Tier 4) |
| `pystep.c` | `pystep()` | Single person-time increment weight | — | `person_years.rs` (Tier 4) |

### R Callback (Frailty Support)

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `cox_Rcallback.c` | `cox_callback()` | Evaluates R expression for frailty penalty computation | R `eval()` API | Not directly portable — frailty penalty functions must be reimplemented in Rust (Tier 4) |

### Generalized Cholesky

| C Source | Functions | Purpose | Dependencies | Rust Target |
|----------|-----------|---------|-------------|-------------|
| `gchol.c` | `gchol()`, `gchol_solve()`, `gchol_inv()` | Generalized Cholesky for possibly singular/indefinite matrices | — | `cholesky_generalized.rs` (Tier 4) |

---

## Dependencies on R Base/Stats — What We Already Have vs. Need to Port

### Distribution Functions

| R Function | Used In | Already in Rust? | Location / Action |
|-----------|---------|-----------------|-------------------|
| `qnorm()` | CI construction, survreg distributions | **YES** | `distributions/normal.rs` → `qnorm()` |
| `pnorm()` | CI transforms, survreg, summary | **YES** | `distributions/normal.rs` → `pnorm()` |
| `dnorm()` | survreg distributions | **YES** | `distributions/normal.rs` → `dnorm()` |
| `pchisq()` | All hypothesis tests (Wald, score, LRT, cox.zph, anova, survdiff) | **YES** | `distributions/chi_squared.rs` → `pchisq()` |
| `qchisq()` | CI for chi-squared tests | **YES** | `distributions/chi_squared.rs` → `qchisq()` |
| `dt()` | survreg t-distribution family | **YES** | `distributions/students_t.rs` → `dt()` |
| `pt()` | survreg p-values | **YES** | `distributions/students_t.rs` → `pt()` |
| `qt()` | survreg CIs | **YES** | `distributions/students_t.rs` → `qt()` |
| `pgamma()` | Gamma-family survreg | **YES** | `distributions/gamma.rs` → `pgamma()` |
| `qgamma()` | Poisson CI (`cipoisson`) | **YES** | `distributions/gamma.rs` → `qgamma()` |
| `plogis()` | Logistic link in survreg | **NO** | **NEED**: `distributions/logistic.rs` — `plogis`, `dlogis`, `qlogis` |
| Extreme value (Gumbel) | survreg Weibull/extreme value | **NO** | **NEED**: `distributions/extreme_value.rs` (Tier 4 — survreg only) |

### Linear Algebra (R base)

| R Function | Used In | Already in Rust? | Action |
|-----------|---------|-----------------|--------|
| `solve()` | cox.zph, survdiff, aareg, concordance variance | **PARTIAL** — `faer` has LU/QR solve, but survival's `solve()` calls go through Cholesky custom code | Survival C code uses its own `cholesky2`/`chsolve2`/`chinv2` — port those directly |
| `qr()`, `backsolve()` | cox.zph spline fitting, aareg | **YES** — `glm/qr_decomposition.rs` has `cdqrls` | Can reuse for non-Cox linear algebra needs |
| `eigen()` | yates.R, multi-state transition matrices | **NO** | **NEED**: `eigendecomposition.rs` (Tier 4 — multi-state only) |
| `svd()` | yates.R | **NO** | **NEED** only for Tier 4 |
| `crossprod()` | coxph.R, concordance.R, cch.R | **YES** — trivial matrix multiply, `faer` has this | Not a separate port item |

### Interpolation (R stats)

| R Function | Used In | Already in Rust? | Action |
|-----------|---------|-----------------|--------|
| `approx()` | Plot/print survival curves, quantile.survfit, residuals.survfit, agsurv.R baseline hazard, survexp | **NO** | **NEED**: `interpolation.rs` — port from `r-source-trunk/src/library/stats/src/approx.c`. Used for constant and linear interpolation of survival curves. ~150 lines of C. |

### Formula/Model Infrastructure

| R Component | Used In | Already in Rust? | Action |
|------------|---------|-----------------|--------|
| Formula parsing (`y ~ x1 + x2`) | Everywhere | **YES** | `shared/formula_parser.rs` — extend for `Surv(time, status)` |
| Design matrix construction | Everywhere | **YES** | `shared/formula_parser.rs` → `build_design_matrix()` |
| `terms()`, `model.frame()`, `model.matrix()` | All R-level functions | N/A | These are R model infrastructure. We handle this in the TypeScript/WASM layer (data arrives as JSON columns). Not needed in Rust. |
| Contrast/factor encoding | Categorical predictors | **YES** | Handled in WASM wrappers (dummy variable creation before passing to Rust) |

---

## Tiered Implementation — Full Checklist

### Tier 1: Kaplan-Meier Estimator + Foundation

**Rust files to create:**

| File | Ports From | What It Does |
|------|-----------|-------------|
| `numerical_safety.rs` | `coxsafe.c` | Safe exp/log with overflow prevention |
| `kaplan_meier.rs` | `survfitkm.c` (full file, all branches) | Product-limit estimator, Nelson-Aalen cumulative hazard, Greenwood variance, confidence intervals (log, log-log, plain, logit, arcsin). Weighted KM. Right-censored AND counting process data. Strata support. |
| `kaplan_meier_fast.rs` | `fastkm.c` | Optimized path for simple cases (no clustering, no strata) |
| `confidence_intervals.rs` | `survfitKM.R` lines 269-301 | CI transform implementations: log, log-log, plain, logit, arcsin. Uses `qnorm()` from existing distributions. |
| `survival_object.rs` | `Surv.R` | Survival data representation: right-censored `(time, status)`, counting process `(tstart, tstop, status)`. Validation. |
| `logrank_test.rs` | `survdiff2.c` | Log-rank and weighted log-rank tests (Peto, Tarone-Ware, Fleming-Harrington). Observed/expected/variance. Uses `pchisq()`. |
| `wasm_survfit.rs` | New | WASM bindings: `survfit_km_wasm()`, `survdiff_wasm()` |

**R orchestration logic to implement in Rust (from R files):**
- `survfitKM.R`: sorting, strata grouping, clustering setup, calling C core, assembling result with CI
- `survdiff.R`: data preparation, stratification, calling `survdiff2`

**Existing code reused:**
- `distributions/normal.rs` → `qnorm()` for CI construction
- `distributions/chi_squared.rs` → `pchisq()` for log-rank test p-value

**Checklist:**
- [x] `numerical_safety.rs` — port `coxsafe()` (exp overflow cap) — 4 tests
- [x] `survival_object.rs` — `SurvData` struct for right-censored and counting process — 7 tests
- [x] `kaplan_meier.rs` — port full `survfitkm.c` including: — 6 tests
  - [x] Single-group KM (type 1: KM survival + Nelson-Aalen cumhaz)
  - [x] Type 2: Fleming-Harrington survival + Nelson-Aalen cumhaz
  - [x] Type 3: exp(-Nelson-Aalen) survival + Nelson-Aalen cumhaz
  - [x] Type 4: FH survival + FH cumhaz
  - [x] Weighted observations
  - [x] Right-censored data (2-column Surv)
  - [x] Counting process data (3-column Surv: start, stop, status)
  - [x] Strata support (multiple curves from grouped data)
  - [x] Number at risk, events, censored at each time
  - [x] Influence function estimation (for robust variance)
  - [x] Clustered variance (id/cluster grouping)
- [ ] `kaplan_meier_fast.rs` — port `fastkm1()`, `fastkm2()` from `fastkm.c` — DEFERRED (optimized fast path, not needed for correctness)
- [x] CI transforms implemented within `kaplan_meier.rs` (not separate file):
  - [x] `log` (default): `exp(log(S) ± z * se(log(S)))`
  - [x] `log-log`: `exp(-exp(log(-log(S)) ± z * se))`
  - [x] `plain`: `S ± z * se(S)`
  - [x] `logit`: logit transform
  - [x] `arcsin`: arcsin-sqrt transform
  - [x] `none`: no CI
  - [x] Modified lower bound (Peto)
- [x] `logrank_test.rs` — port full `survdiff2.c`: — 1 test
  - [x] Unweighted log-rank
  - [x] Weighted variants (rho parameter for G-rho family)
  - [x] Stratified test
  - [x] Observed/expected events per group
  - [x] Variance-covariance matrix
  - [x] Chi-squared test statistic and p-value
- [ ] `wasm_survfit.rs` — WASM entry points with JSON serialization — DEFERRED to integration phase

### Tier 2: Cox PH — Partial Likelihood

**Rust files to create:**

| File | Ports From | What It Does |
|------|-----------|-------------|
| `cholesky.rs` | `cholesky2.c`, `chsolve2.c`, `chinv2.c` | Complete Cholesky suite: decompose, solve, invert. With tolerance-based singularity detection, rank return. |
| `cox_partial_likelihood.rs` | `coxfit6.c` → `coxfit6_iter()` | Core partial likelihood computation: risk set accumulation, score vector, information matrix. Both Breslow AND Efron tie methods. |
| `cox_fitting.rs` | `coxfit6.c` → `coxfit6()` outer loop + `coxph.fit.R` | Newton-Raphson with step halving, covariate centering/scaling, convergence checking, initial values, score test. |
| `cox_residuals_martingale.rs` | `coxmart.c`, `coxmart2.c` | Martingale residuals: M_i = δ_i - Ĥ₀(t_i) exp(X_i β̂). Both Breslow and Efron. |
| `formula_survival.rs` | Extension of `shared/formula_parser.rs` | Parse `Surv(time, status) ~ x1 + x2 + x1:x2`. Extract time/status columns. No intercept by default (Cox convention). |
| `wasm_coxph.rs` | New | WASM bindings: `coxph_fit_wasm()` |

**R orchestration logic to implement in Rust:**
- `coxph.R`: formula parsing → model frame → call `coxph.fit`
- `coxph.fit.R`: sort by time, center/scale covariates, handle strata encoding, call C, undo scaling, assemble result
- `summary.coxph.R`: SE, z-scores, p-values, HR, HR confidence intervals, concordance, Wald/LRT/score tests

**Existing code reused:**
- `shared/formula_parser.rs` → predictor parsing, interaction expansion, design matrix
- `distributions/chi_squared.rs` → `pchisq()` for Wald/LRT/score test p-values
- `distributions/normal.rs` → `qnorm()` for HR confidence intervals

**Checklist:**
- [x] `cholesky.rs` — port all three functions from C, preserving exact numerical behavior: — 10 tests
  - [x] `cholesky2()` — FDF' decomposition with tolerance, singularity detection, rank return
  - [x] `chsolve2()` — forward/back substitution
  - [x] `chinv2()` — full matrix inversion via Cholesky factors
- [x] `cox_regression.rs` (plan called for `cox_partial_likelihood.rs` + `cox_fitting.rs`, merged into one file) — 3 tests:
  - [x] Backward walk through sorted event times
  - [x] Risk set accumulation: denom, weighted covariate sums (a[]), weighted cross-products (cmat[][])
  - [x] Death set accumulation: deadwt, denom2, a2[], cmat2[][]
  - [x] Breslow method: all deaths simultaneous
  - [x] Efron method: average over orderings (k=0..ndead-1 loop)
  - [x] Score vector u[] and information matrix imat[][] computation
  - [x] Strata boundaries (reset risk set at strata boundaries)
  - [x] Weighted observations
  - [x] Offset terms
  - [x] Covariate centering: mean subtraction weighted by case weights
  - [x] Covariate scaling: MAD-based scaling (not SD)
  - [x] Initial β handling (user-supplied or zero)
  - [x] Score test computation on first iteration
  - [x] Newton-Raphson loop: Cholesky → solve → update β
  - [x] Step halving when log-likelihood decreases (increasingly aggressive)
  - [x] Convergence criterion: `|1 - loglik_old/loglik_new| < eps`
  - [x] Non-finite detection (infinite score, information, loglik)
  - [x] Undo centering/scaling on final coefficients, variance matrix, score vector
  - [x] Return: coefficients, variance matrix, loglik[initial, final], score test, iterations, flag
- [x] `cox_residuals.rs` (plan called for `cox_residuals_martingale.rs`, merged with Schoenfeld) — 3 tests:
  - [x] Breslow method martingale residuals
  - [x] Efron method martingale residuals
  - [x] Weighted residuals
  - [x] Schoenfeld residuals (from `coxscho.c`)
- [ ] `formula_survival.rs` — `Surv(time, status)` parsing — DEFERRED to integration phase (formula parsing handled in TypeScript layer)
- [ ] `wasm_coxph.rs` — WASM entry points — DEFERRED to integration phase

### Tier 2b: Counting Process Cox (Start/Stop)

| File | Ports From | What It Does |
|------|-----------|-------------|
| `cox_counting_process.rs` | `agfit4.c` | Anderson-Gill Cox fitting for `Surv(tstart, tstop, event)` data. Same algorithm as coxfit6 but handles entry/exit times. |
| `cox_residuals_martingale_ag.rs` | `agmart.c`, `agmart3.c` | Martingale residuals for counting process data |
| `cox_residuals_score_ag.rs` | `agscore2.c`, `agscore3.c` | Score residuals for counting process data |

**Checklist:**
- [x] `ag_cox_regression.rs` (plan called for `cox_counting_process.rs`) — 3 tests:
  - [x] Start/stop interval handling
  - [x] Smart sorting by strata then stop time
  - [x] Entry/exit of risk set at tstart/tstop
  - [x] Same Breslow/Efron as coxfit6
  - [x] Strata support
  - [x] Weighted observations
- [x] `ag_cox_residuals.rs` (plan called for separate martingale_ag + score_ag files) — 4 tests:
  - [x] `agmart.c` + `agmart3.c` (martingale residuals for counting process)
  - [x] `agscore2.c` + `agscore3.c` (score residuals for counting process)

### Tier 3: Diagnostics, Baseline Hazard, Concordance

**Rust files to create:**

| File | Ports From | What It Does |
|------|-----------|-------------|
| `cox_baseline_hazard.rs` | `coxsurv1.c`, `coxsurv2.c`, `coxsurv3.c`, `coxsurv4.c` | Breslow baseline hazard estimator. Survival curves from Cox fit S(t\|X). Variance estimation. |
| `cox_survival_kp.rs` | `agsurv4.c` | Kalbfleisch-Prentice survival estimate (bisection method for ties) |
| `cox_survival_efron.rs` | `agsurv5.c` | Efron-method helper for Cox survival curves |
| `cox_residuals_schoenfeld.rs` | `coxscho.c` | Schoenfeld residuals (one per death per covariate) |
| `cox_residuals_score.rs` | `coxscore2.c` | Score (efficient score) residuals for right-censored data |
| `cox_residuals_deviance.rs` | `residuals.coxph.R` (R code) | Deviance residuals: `sign(M_i) * sqrt(-2[M_i + δ_i log(δ_i - M_i)])` |
| `cox_residuals_dfbeta.rs` | `residuals.coxph.R` (R code) | dfbeta and dfbetas influence diagnostics |
| `proportional_hazards_test.rs` | `zph1.c`, `zph2.c`, `cox.zph.R` | Grambsch-Therneau PH test: correlation of scaled Schoenfeld residuals with time. Per-covariate and global test. |
| `concordance.rs` | `concordance3.c`, `concordance5.c` | Harrell's C-statistic with influence estimation. Binary tree algorithm for O(n log n). Somers' D. Standard errors. |
| `cox_event_detail.rs` | `coxdetail.c` | Per-event-time model components (weighted means, score, information) |
| `wald_test.rs` | `coxph_wtest.c`, `summary.coxph.R` | Wald test, score test, LRT for Cox model. Subset coefficient testing. |
| `interpolation.rs` | `r-source-trunk/src/library/stats/src/approx.c` | Linear and step-function interpolation. Port of R's `approx()`. Needed by baseline hazard, survival curve extraction, quantile.survfit. |
| `clustering.rs` | `twoclust.c` | Two-level clustering structure identification |
| `data_splitting.rs` | `survsplit.c` | Split (start, stop] intervals at cutpoints |
| `risk_set_validation.rs` | `norisk.c` | Identify never-at-risk observation pairs |
| `survfit_residuals.rs` | `survfitresid.c` | Residual-based survfit computation |

**R-base dependency to port:**
- [x] `interpolation.rs` — port `approx.c` from `r-source-trunk/src/library/stats/src/approx.c` — 7 tests
  - [x] `approx1()` — single-point interpolation (linear or constant)
  - [x] `approxfun()` — function factory pattern (in Rust: struct with method)
  - [x] Bisection interval finding
  - [x] `rule=1` (NA outside), `rule=2` (extend)

**Checklist:**
- [x] `cox_baseline_hazard.rs` (ports coxsurv3/coxsurv4) + `cox_baseline_hazard_ms.rs` (ports coxsurv1/coxsurv2) — 7+5 tests:
  - [x] Breslow cumulative baseline hazard Ĥ₀(t)
  - [x] Baseline survival Ŝ₀(t) = exp(-Ĥ₀(t))
  - [x] Individual survival curves Ŝ(t|X) = Ŝ₀(t)^exp(Xβ̂)
  - [x] Variance of baseline hazard
  - [x] Standard errors for survival curves
  - [x] Strata-specific baseline hazards
  - [x] Port coxsurv1 through coxsurv4 completely
  - Note: coxsurv3/coxsurv4 are dead code in R (registered in init.c but never called). coxsurv4 has documented C bugs.
- [x] `cox_survival_kp.rs` — port `agsurv4.c` — 3 tests:
  - [x] Kalbfleisch-Prentice estimator
  - [x] Bisection method for tied deaths (35 iterations)
- [x] `cox_survival_efron.rs` — port `agsurv5.c` — 3 tests
- [x] Schoenfeld residuals ported in `cox_residuals.rs` (not separate file)
- [x] `cox_score_residuals.rs` — port `coxscore2.c` — 2 tests
- [x] `cox_residuals_derived.rs` — deviance + dfbeta from R code — 4 tests
- [x] `proportional_hazards_test.rs` — 3 tests:
  - [x] Port `zph1.c` (right-censored) completely
  - [x] Port `zph2.c` (counting process) completely
  - [x] Scaled Schoenfeld residuals
  - [x] Time transforms: identity, rank, KM, log
  - [x] Per-covariate chi-squared test
  - [x] Global chi-squared test
  - [x] Uses `solve()` → our Cholesky or QR
  - [x] Uses `pchisq()` → existing
- [x] `concordance.rs` — 7 tests:
  - [x] Port `concordance3.c` completely including binary tree
  - [x] `walkup()` and `addin()` tree traversal
  - [x] Concordant/discordant/tied counting
  - [x] Influence estimation
  - [x] Standard error
  - [x] Port `concordance5.c` (fast path without influence)
- [x] `cox_event_detail.rs` — port `coxdetail.c` — 1 test
- [x] `wald_test.rs` — port `coxph_wtest.c` + summary logic from R — 2 tests
- [x] `interpolation.rs` — port R base `approx.c` — 7 tests
- [x] `clustering.rs` — port `twoclust.c` — 3 tests
- [x] `data_splitting.rs` — port `survsplit.c` — 5 tests
- [ ] `risk_set_validation.rs` — port `norisk.c` — SKIPPED: dead code (defined in C but never called from R)
- [x] `survfit_residuals.rs` — port `survfitresid.c` — 4 tests

### Tier 4: Extensions (Deferred)

| File | Ports From | What It Does |
|------|-----------|-------------|
| `cholesky_block.rs` | `cholesky3.c`, `chsolve3.c`, `chinv3.c` | Block-diagonal Cholesky for frailty |
| `cholesky_generalized.rs` | `cholesky5.c`, `chsolve5.c`, `gchol.c` | Generalized Cholesky for penalized/singular |
| `cox_fitting_penalized.rs` | `coxfit5.c`, `agfit5.c` | Penalized/frailty Cox fitting |
| `cox_exact.rs` | `coxexact.c` | Exact partial likelihood |
| `cox_counting_exact.rs` | `agexact.c` | Exact PL for counting process |
| `combinatorics.rs` | `doloop.c` | Nested loop enumeration for exact methods |
| `parametric_aft.rs` | `survreg6.c` | Parametric AFT fitting (Weibull, exp, log-normal, log-logistic) |
| `parametric_aft_likelihood.rs` | `survregc1.c`, `survregc2.c` | Log-likelihood for parametric models |
| `parametric_aft_penalized.rs` | `survreg7.c`, `survpenal.c` | Penalized parametric models |
| `fine_gray_transform.rs` | `finegray.c` | Data transformation for competing risks ✅ |
| `aalen_johansen.rs` | `survfitaj.c` | Multi-state survival curves |
| `matrix_exponential.rs` | `cdecomp.c` | Eigendecomposition for transition matrices |
| `person_years.rs` | `pyears1.c`, `pyears2.c`, `pyears3b.c`, `pystep.c` | Person-years tabulation |
| `time_dependent_merge.rs` | `tmerge.c` | Time-dependent covariate merging |
| `multistate_validation.rs` | `multicheck.c` | Multi-state data validation |
| `risk_set_counting.rs` | `coxcount1.c` | Risk set ID for `tt()` expansion |
| `logistic_distribution.rs` | R base `dlogis/plogis/qlogis` | Logistic distribution (needed by survreg) |
| `extreme_value_distribution.rs` | R survreg.distributions | Gumbel/extreme value (needed by survreg Weibull) |
| `eigendecomposition.rs` | R base `eigen()` | Eigenvalues/vectors (needed by multi-state) |

**Tier 4 Checklist (completed items):**
- [x] `fine_gray_transform.rs` — port `finegray.c` (core interval expansion algorithm) — 5 Rust unit tests
  - [x] Row indexing, start/end/wt/add output arrays
  - [x] Extend logic: competing event subjects extended forward with IPCW weights
  - [x] Keep filtering (observations outside risk set)
  - [x] NaN passthrough for censoring probabilities
- [x] `finegray_wasm` — full R `finegray.R` orchestration in Rust (~300 lines):
  - [x] Right-censored data (2-column Surv)
  - [x] Counting process / left truncation (3-column Surv with delayed entry)
  - [x] Multi-event type selection (etype parameter)
  - [x] Strata support (per-stratum censoring distributions)
  - [x] Censoring distribution G(t) via internal `survfit_km` calls
  - [x] Truncation distribution H(t) via reverse-time `survfit_km` (Geskus 2011, eq. 11)
  - [x] Combined G(t)*H(t) weighting for delayed entry
  - [x] `find_interval()` helper (R's `findInterval` with left_open, 1-based indexing)
- [x] `finegray()` TypeScript wrapper in `survival-functions.ts`
- [x] `finegray.test.ts` — 4 integration tests validated against R reference values:
  - [x] Right-censored etype=1 (type1)
  - [x] Right-censored etype=2 (type2)
  - [x] Stratified (reprises test1 and test2 in single call)
  - [x] Left truncation with delayed entry (counting process data)

---

## Test Infrastructure: R Source Test Suite → TypeScript

The primary validation strategy is a 1:1 translation of the R `survival` package's own test suite. The R package ships 110 test files in `packages/testing/survival/source-tests/tests/*.R`, each with a corresponding `.Rout.save` expected output. We create one `*.test.ts` file per `.R` file, placed in `packages/testing/survival/`.

### Approach

Each `.test.ts` file translates the R test file's assertions into Deno tests that call our Rust/WASM implementation. Reference values are extracted from R at runtime (not hardcoded) to ensure full-precision comparison.

**The flow for each test file:**

1. The `.test.ts` file calls `getReferenceValues<T>("testName")` from `survival-test-helpers.ts`
2. This runs `Rscript extract-reference.R <testName>` via `Deno.Command`, which computes all R reference values and emits JSON to stdout
3. The JSON is parsed and cached (via `refCache`) for the duration of the test run
4. Tests compare WASM output against these full-precision R values using `assertClose` / `assertArrayClose`

**Why runtime R extraction instead of hardcoded values:**
- R values like `-42.898123897174` get truncated to `-42.89812` when manually copied, causing failures at `TOL = 1e-6`
- Runtime extraction guarantees full 15-digit precision from R's `formatC(x, digits=15, format="g")`
- Adding new reference values only requires editing `extract-reference.R`, not updating hardcoded arrays

### Shared Test Helpers

All shared infrastructure lives in `packages/testing/survival/survival-test-helpers.ts`:

```typescript
// Tolerance constants
export const TOL = 1e-6;       // Default for all numerical comparisons
export const TOL_EXACT = 1e-10; // For identical/integer results

// Assertion helpers
export function assertClose(actual: number, expected: number, tol: number, label?: string)
export function assertArrayClose(actual: number[], expected: number[], tol: number, label?: string)

// Data loading from SQLite fixture database
export function loadTable<T>(table: string): T[]
export function loadAml(): AmlRow[]

// R reference value extraction (cached)
export function getReferenceValues<T>(testName: string): T
```

### R Reference Value Extraction

The extraction script lives at `packages/testing/survival/source-tests/extract-reference.R`. It dispatches on the test name and computes all needed reference values:

```r
# Usage: Rscript extract-reference.R <test-name>
# Outputs a single JSON object to stdout
library(survival)

if (test_name == "doaml") {
  fit_b <- coxph(Surv(aml$time, aml$status) ~ aml$x, method = "breslow")
  # ... compute all reference values ...
  result <- list(breslow_coef = as.vector(coef(fit_b)), ...)
  cat(toJSON(result), "\n")
}
```

The custom `toJSON()` helper handles edge cases: matrices (row-major), `Inf`/`-Inf`, `NaN`, named vectors. Each test name is a new `if`/`else if` branch in the dispatch.

**Adding a new test:** Add a new `else if (test_name == "newtest")` branch to `extract-reference.R`, define a typed interface (e.g., `DoamlRef`) in the `.test.ts` file, and call `getReferenceValues<NewTestRef>("newtest")`.

### Data Access

All R survival datasets are available as tables in `packages/testing/fixtures/survival/survival.db` (SQLite). Table naming: `cancer_aml`, `cancer_lung`, `cancer_colon`, `heart_jasa`, `pbc_pbc`, etc. Load via `node:sqlite`'s `DatabaseSync` through the `loadTable()` helper.

### Test File Conventions

**File naming:** Each `.test.ts` mirrors the `.R` basename (`doaml.R` → `doaml.test.ts`).

**Coverage checklist:** Each test file starts with a comment block documenting which R test lines are covered (`[x]`) and which are not yet implemented (`[ ]`) with a reason:

```typescript
// Coverage of doaml.R:
// [x] L8-9:   coxph Breslow fit (coef, loglik, var, score, nevent)
// [ ] L37-38: coxph with offset + survfit from Cox model — no survfit-from-Cox in TS layer
```

**Test structure:** One `Deno.test()` per logical assertion block in the R source. Type the reference interface to match the R extraction output.

**Import pattern:**
```typescript
import { expect } from "@std/expect";
import { coxph, survfit, survdiff, coxResiduals } from "../../dataframe/ts/wasm/survival-functions.ts";
import { assertArrayClose, assertClose, getReferenceValues, loadAml, TOL, TOL_EXACT } from "./survival-test-helpers.ts";
```

### Comparison Thresholds

In practice, two thresholds cover all cases:

| Constant | Value | Used For |
|----------|-------|----------|
| `TOL` | `1e-6` | All numerical comparisons against R (coefficients, residuals, survival probabilities, etc.) |
| `TOL_EXACT` | `1e-10` | Values that should be identical (integer counts, times, results that are algebraically the same) |

### Implementation Order

Test files should be created as their corresponding Rust functionality is implemented:

- **Tier 1 (KM + foundation)**: `survfit1`, `survfit2`, `difftest`, `doaml` ✅, `doweight`, `ekm`, `survtest`, `surv`, `tiedtime`
- **Tier 2 (Cox PH)**: `book1`, `book2`, `cancer`, `counting`, `coxsurv`–`coxsurv6`, `infcox`, `testnull`, `singtest`, `testreg`, `detail`
- **Tier 2b (Counting process)**: `counting`, `bladder`, `jasa`
- **Tier 3 (Diagnostics)**: `zph`, `concordance`–`concordance3`, `residms`, `residsf`, `r_resid`, `r_lung`, `brier`, `strata2`, `stratatest`, `prednew`, `predsurv`, `summary_survfit`, `summarydf`, `quantile`
- **Tier 4 (Extensions)**: `finegray` ✅, `survreg1`, `survreg2`, `fr_*`, `frailty`, `frank`, `mstate*`, `multi*`, `tmerge*`, `pyear`, `expected*`, `pspline`, `aareg`, `anova`, `yates*`, `pseudo`, `clogit`, `book1`–`book7`, `tt`, `tt2`, `turnbull`, `update`, remaining files

### Files That May Not Need a TypeScript Equivalent

Some R test files test R-specific behavior (S4 methods, print/plot formatting, namespace resolution). These get a `.test.ts` stub with a skip annotation:

- `doublecolon.R` — tests `survival::` namespace resolution (R-specific)
- `plot.R` — tests plot output (no equivalent in our WASM pipeline)
- `model.matrix.R` — tests R's `model.matrix()` method dispatch
- `update.R` — tests R's `update()` formula manipulation
- `dropspecial.R` — tests R formula special term handling

---

## WASM Integration Layer

The WASM layer (`packages/dataframe/rust/stats/survival/wasm.rs`) bridges Rust survival functions to TypeScript. It handles JSON deserialization, data sorting, strata conventions, and result serialization.

### Current WASM Bindings

| WASM Function | TypeScript Wrapper | Purpose |
|---------------|-------------------|---------|
| `coxph_wasm` | `coxph()` | Cox PH fitting (right-censored) |
| `survfit_km_wasm` | `survfit()` | Kaplan-Meier survival curves |
| `survdiff_wasm` | `survdiff()` | Log-rank test |
| `cox_residuals_wasm` | `coxResiduals()` | All Cox residual types (mart, score, scho, deviance, dfbeta, dfbetas) |
| `survsplit_wasm` | `survSplit()` | Split survival data at cutpoints |
| `concordance_wasm` | `concordance()` | C-statistic |
| `cox_zph_wasm` | — | Proportional hazards test (not yet wrapped in TS) |
| `survfit_cox_wasm` | `survfitCox()` | Survival curves from a fitted Cox model |
| `coxph_counting_wasm` | `coxphCounting()` | Counting process (start-stop) Cox PH |
| `finegray_wasm` | `finegray()` | Fine-Gray competing risks data transformation (IPCW weights) |

### Critical WASM Layer Conventions

These conventions were discovered through debugging and are essential for correctness:

#### 1. Dual Strata Conventions

The C source uses **two different strata representations** across functions. The WASM layer must create the correct type for each function:

| Convention | Format | Used By |
|-----------|--------|---------|
| **Marker** | `strata[i] = 1` means "last observation in this stratum", all others `0` | `coxmart`, `coxscho`, `survdiff2`, `coxfit6` |
| **Same-value** | `strata[i] == strata[j]` means same stratum (integer ID) | `coxscore2` |

```rust
// In WASM layer, create BOTH arrays:
// Marker convention for coxmart/coxscho
let mut strata_marker = vec![0i32; n];
if n > 0 { strata_marker[n - 1] = 1; }

// Same-value convention for coxscore2
let strata_sameval = vec![0i32; n]; // all same stratum
```

**Failure mode if wrong:** Using marker strata with `coxscore2` causes the last observation to be treated as a separate stratum, producing systematic ~0.016 errors in score residuals.

#### 2. Group Indexing Convention

`survdiff2` (the log-rank test C function) expects **1-based group labels** (R convention). The TypeScript API accepts 0-based groups (JS convention). The WASM layer adds 1:

```rust
// WASM layer converts 0-based → 1-based
let sorted_group: Vec<i32> = order.iter().map(|&i| group[i] + 1).collect();
```

**Failure mode if wrong:** Group 0 becomes -1 in the C code's `(group[j] - 1)` line, which wraps to `usize::MAX`, causing a panic.

#### 3. Sorting Requirements

All functions expect data sorted ascending by time within strata, with events (status=1) before censored (status=0) at tied times:

```rust
order.sort_by(|&a, &b| {
    time[a].partial_cmp(&time[b]).unwrap()
        .then(status[b].cmp(&status[a])) // events first
});
```

The WASM layer sorts data, passes sorted arrays to Rust, then **unsorts results back to original observation order** before returning to TypeScript.

#### 4. Strata Marker Construction for Multi-Strata

When the user provides strata IDs (e.g., `[0, 0, 1, 1, 2, 2]`), the WASM layer converts to marker format by detecting transitions in the sorted strata array:

```rust
let mut markers = vec![0i32; n];
for i in 0..n - 1 {
    if sorted_strat_vals[i] != sorted_strat_vals[i + 1] {
        markers[i] = 1;
    }
}
markers[n - 1] = 1; // last obs is always end of stratum
```

---

## TypeScript Wrapper Files

```
packages/dataframe/ts/wasm/
└── survival-functions.ts     — coxph(), survfit(), survdiff(), coxResiduals(),
                                survSplit(), concordance(), survfitCox(), coxphCounting(),
                                finegray()
```

---

## Summary: File Count by Tier

| Tier | New Rust Files | C Files Ported | Lines (est.) |
|------|---------------|---------------|-------------|
| 1 | 7 | 4 (survfitkm.c, fastkm.c, survdiff2.c, coxsafe.c) | ~1200 |
| 2 | 6 | 4 (coxfit6.c, cholesky2.c, chsolve2.c, chinv2.c, coxmart.c) | ~1500 |
| 2b | 3 | 4 (agfit4.c, agmart.c, agmart3.c, agscore2/3.c) | ~800 |
| 3 | 15 | 14 (coxsurv1-4.c, agsurv4/5.c, coxscho.c, zph1/2.c, concordance3/5.c, coxdetail.c, approx.c, etc.) | ~3000 |
| 4 | 16+ (1 done) | 20+ (1 done) | ~4000+ |
| **Total** | **47+** | **46+** | **~10500+** |
