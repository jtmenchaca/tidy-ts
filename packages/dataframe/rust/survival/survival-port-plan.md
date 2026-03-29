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
| `finegray.c` | `finegray()` | Data transformation for Fine-Gray subdistribution hazard: creates weighted pseudo-observations with IPCW weights | — | `fine_gray_transform.rs` (Tier 4) |

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
- [ ] `numerical_safety.rs` — port `coxsafe()` (exp overflow cap)
- [ ] `survival_object.rs` — `SurvData` struct for right-censored and counting process
- [ ] `kaplan_meier.rs` — port full `survfitkm.c` including:
  - [ ] Single-group KM (type 1: KM survival + Nelson-Aalen cumhaz)
  - [ ] Type 2: Fleming-Harrington survival + Nelson-Aalen cumhaz
  - [ ] Type 3: exp(-Nelson-Aalen) survival + Nelson-Aalen cumhaz
  - [ ] Type 4: FH survival + FH cumhaz
  - [ ] Weighted observations
  - [ ] Right-censored data (2-column Surv)
  - [ ] Counting process data (3-column Surv: start, stop, status)
  - [ ] Strata support (multiple curves from grouped data)
  - [ ] Number at risk, events, censored at each time
  - [ ] Influence function estimation (for robust variance)
  - [ ] Clustered variance (id/cluster grouping)
- [ ] `kaplan_meier_fast.rs` — port `fastkm1()`, `fastkm2()` from `fastkm.c`
- [ ] `confidence_intervals.rs` — all 6 CI types from `survfitKM.R`:
  - [ ] `log` (default): `exp(log(S) ± z * se(log(S)))`
  - [ ] `log-log`: `exp(-exp(log(-log(S)) ± z * se))`
  - [ ] `plain`: `S ± z * se(S)`
  - [ ] `logit`: logit transform
  - [ ] `arcsin`: arcsin-sqrt transform
  - [ ] `none`: no CI
  - [ ] Modified lower bound (Peto)
- [ ] `logrank_test.rs` — port full `survdiff2.c`:
  - [ ] Unweighted log-rank
  - [ ] Weighted variants (rho parameter for G-rho family)
  - [ ] Stratified test
  - [ ] Observed/expected events per group
  - [ ] Variance-covariance matrix
  - [ ] Chi-squared test statistic and p-value
- [ ] `wasm_survfit.rs` — WASM entry points with JSON serialization

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
- [ ] `cholesky.rs` — port all three functions from C, preserving exact numerical behavior:
  - [ ] `cholesky2()` — FDF' decomposition with tolerance, singularity detection, rank return
  - [ ] `chsolve2()` — forward/back substitution
  - [ ] `chinv2()` — full matrix inversion via Cholesky factors
- [ ] `cox_partial_likelihood.rs` — port `coxfit6_iter()` EXACTLY:
  - [ ] Backward walk through sorted event times
  - [ ] Risk set accumulation: denom, weighted covariate sums (a[]), weighted cross-products (cmat[][])
  - [ ] Death set accumulation: deadwt, denom2, a2[], cmat2[][]
  - [ ] Breslow method: all deaths simultaneous
  - [ ] Efron method: average over orderings (k=0..ndead-1 loop)
  - [ ] Score vector u[] and information matrix imat[][] computation
  - [ ] Strata boundaries (reset risk set at strata boundaries)
  - [ ] Weighted observations
  - [ ] Offset terms
- [ ] `cox_fitting.rs` — port outer Newton-Raphson from `coxfit6()`:
  - [ ] Covariate centering: mean subtraction weighted by case weights
  - [ ] Covariate scaling: MAD-based scaling (not SD)
  - [ ] Initial β handling (user-supplied or zero)
  - [ ] Score test computation on first iteration
  - [ ] Newton-Raphson loop: Cholesky → solve → update β
  - [ ] Step halving when log-likelihood decreases (increasingly aggressive)
  - [ ] Convergence criterion: `|1 - loglik_old/loglik_new| < eps`
  - [ ] Non-finite detection (infinite score, information, loglik)
  - [ ] Undo centering/scaling on final coefficients, variance matrix, score vector
  - [ ] Return: coefficients, variance matrix, loglik[initial, final], score test, iterations, flag
- [ ] `cox_residuals_martingale.rs` — port `coxmart.c` and `coxmart2.c`:
  - [ ] Breslow method martingale residuals
  - [ ] Efron method martingale residuals
  - [ ] Weighted residuals
- [ ] `formula_survival.rs` — `Surv(time, status)` parsing:
  - [ ] Recognize `Surv(col1, col2)` as response
  - [ ] Extract time column name, status column name
  - [ ] No intercept by default (suppress `(Intercept)` in design matrix)
  - [ ] Support `Surv(start, stop, status)` for counting process (Tier 2b)
  - [ ] All existing predictor features: `+`, `*`, `:`, `-1`
- [ ] `wasm_coxph.rs` — entry point:
  - [ ] `coxph_fit_wasm(formula, data_json, method, options_json) -> String`
  - [ ] JSON deserialization of data columns
  - [ ] JSON serialization of full result

### Tier 2b: Counting Process Cox (Start/Stop)

| File | Ports From | What It Does |
|------|-----------|-------------|
| `cox_counting_process.rs` | `agfit4.c` | Anderson-Gill Cox fitting for `Surv(tstart, tstop, event)` data. Same algorithm as coxfit6 but handles entry/exit times. |
| `cox_residuals_martingale_ag.rs` | `agmart.c`, `agmart3.c` | Martingale residuals for counting process data |
| `cox_residuals_score_ag.rs` | `agscore2.c`, `agscore3.c` | Score residuals for counting process data |

**Checklist:**
- [ ] `cox_counting_process.rs` — port full `agfit4.c`:
  - [ ] Start/stop interval handling
  - [ ] Smart sorting by strata then stop time
  - [ ] Entry/exit of risk set at tstart/tstop
  - [ ] Same Breslow/Efron as coxfit6
  - [ ] Strata support
  - [ ] Weighted observations
- [ ] `cox_residuals_martingale_ag.rs` — port `agmart.c` + `agmart3.c`
- [ ] `cox_residuals_score_ag.rs` — port `agscore2.c` + `agscore3.c`

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
- [ ] `interpolation.rs` — port `approx.c` from `r-source-trunk/src/library/stats/src/approx.c` (~150 lines)
  - [ ] `approx1()` — single-point interpolation (linear or constant)
  - [ ] `approxfun()` — function factory pattern (in Rust: struct with method)
  - [ ] Bisection interval finding
  - [ ] `rule=1` (NA outside), `rule=2` (extend)

**Checklist:**
- [ ] `cox_baseline_hazard.rs`:
  - [ ] Breslow cumulative baseline hazard Ĥ₀(t)
  - [ ] Baseline survival Ŝ₀(t) = exp(-Ĥ₀(t))
  - [ ] Individual survival curves Ŝ(t|X) = Ŝ₀(t)^exp(Xβ̂)
  - [ ] Variance of baseline hazard
  - [ ] Standard errors for survival curves
  - [ ] Strata-specific baseline hazards
  - [ ] Port coxsurv1 through coxsurv4 completely
- [ ] `cox_survival_kp.rs` — port `agsurv4.c`:
  - [ ] Kalbfleisch-Prentice estimator
  - [ ] Bisection method for tied deaths (35 iterations)
- [ ] `cox_survival_efron.rs` — port `agsurv5.c`
- [ ] `cox_residuals_schoenfeld.rs` — port `coxscho.c`
- [ ] `cox_residuals_score.rs` — port `coxscore2.c`
- [ ] `cox_residuals_deviance.rs` — from R code, uses martingale residuals
- [ ] `cox_residuals_dfbeta.rs` — from R code, uses score residuals + variance
- [ ] `proportional_hazards_test.rs`:
  - [ ] Port `zph1.c` (right-censored) completely
  - [ ] Port `zph2.c` (counting process) completely
  - [ ] Scaled Schoenfeld residuals
  - [ ] Time transforms: identity, rank, KM, log
  - [ ] Per-covariate chi-squared test
  - [ ] Global chi-squared test
  - [ ] Uses `solve()` → our Cholesky or QR
  - [ ] Uses `pchisq()` → existing
- [ ] `concordance.rs`:
  - [ ] Port `concordance3.c` completely including binary tree
  - [ ] `walkup()` and `addin()` tree traversal
  - [ ] Concordant/discordant/tied counting
  - [ ] Influence estimation
  - [ ] Standard error
  - [ ] Port `concordance5.c` (fast path without influence)
- [ ] `cox_event_detail.rs` — port `coxdetail.c`
- [ ] `wald_test.rs` — port `coxph_wtest.c` + summary logic from R
- [ ] `interpolation.rs` — port R base `approx.c`
- [ ] `clustering.rs` — port `twoclust.c`
- [ ] `data_splitting.rs` — port `survsplit.c`
- [ ] `risk_set_validation.rs` — port `norisk.c`
- [ ] `survfit_residuals.rs` — port `survfitresid.c`

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
| `fine_gray_transform.rs` | `finegray.c` | Data transformation for competing risks |
| `aalen_johansen.rs` | `survfitaj.c` | Multi-state survival curves |
| `matrix_exponential.rs` | `cdecomp.c` | Eigendecomposition for transition matrices |
| `person_years.rs` | `pyears1.c`, `pyears2.c`, `pyears3b.c`, `pystep.c` | Person-years tabulation |
| `time_dependent_merge.rs` | `tmerge.c` | Time-dependent covariate merging |
| `multistate_validation.rs` | `multicheck.c` | Multi-state data validation |
| `risk_set_counting.rs` | `coxcount1.c` | Risk set ID for `tt()` expansion |
| `logistic_distribution.rs` | R base `dlogis/plogis/qlogis` | Logistic distribution (needed by survreg) |
| `extreme_value_distribution.rs` | R survreg.distributions | Gumbel/extreme value (needed by survreg Weibull) |
| `eigendecomposition.rs` | R base `eigen()` | Eigenvalues/vectors (needed by multi-state) |

---

## Test Infrastructure: R Source Test Suite → TypeScript

The primary validation strategy is a 1:1 translation of the R `survival` package's own test suite. The R package ships 110 test files in `packages/testing/survival/source-tests/tests/*.R`, each with a corresponding `.Rout.save` expected output. We create one `*.test.ts` file per `.R` file, placed in `packages/testing/survival/`.

### Approach

Each `.test.ts` file translates the R test file's assertions into Deno tests that call our Rust/WASM implementation. The R files follow a common pattern:

1. Load a dataset (e.g., `aml`, `lung`, `colon`)
2. Optionally compute expected values by hand (e.g., `byhand()` in `survfit1.R`)
3. Call survival functions (`survfit`, `coxph`, `survdiff`, etc.)
4. Assert equality with `all.equal()` or custom `aeq()` helpers

The `.test.ts` equivalent:

1. Load the same dataset from `packages/testing/fixtures/survival/survival.db` (SQLite)
2. Compute the same hand-derived expected values in TypeScript
3. Call our WASM-exported survival functions
4. Assert with `expect()` from `@std/expect` using the thresholds defined above

### Data Access

All R survival datasets are available as tables in `survival.db`. Table naming: `cancer_aml`, `cancer_lung`, `cancer_colon`, `heart_jasa`, `pbc_pbc`, etc. (CSV filenames with `-` replaced by `_`). Load via `node:sqlite`'s `DatabaseSync`:

```typescript
import { DatabaseSync } from "node:sqlite";

const DB_PATH = new URL(
  "../fixtures/survival/survival.db",
  import.meta.url,
).pathname;

function loadTable(name: string): Record<string, unknown>[] {
  const db = new DatabaseSync(DB_PATH);
  const rows = db.prepare(`SELECT * FROM "${name}"`).all();
  db.close();
  return rows as Record<string, unknown>[];
}
```

### File Naming

Each `.test.ts` mirrors the `.R` basename:

| R Source | TypeScript Test |
|----------|----------------|
| `survfit1.R` | `survfit1.test.ts` |
| `doaml.R` | `doaml.test.ts` |
| `difftest.R` | `difftest.test.ts` |
| `concordance.R` | `concordance.test.ts` |
| `coxsurv1.R` | `coxsurv1.test.ts` |
| ... (110 files total) | ... |

### Test Structure

Each test file contains one `Deno.test()` per logical assertion block in the R source. For example, `survfit1.R` has ~8 distinct test blocks (standard KM, IJ variance, leverage, weighted, FH hazard, etc.) → 8 `Deno.test()` calls in `survfit1.test.ts`.

R's `aeq()` / `all.equal()` maps to `expect(value).toBeCloseTo(expected, digits)` or a custom `assertArrayClose()` helper for vector comparisons.

### Comparison Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| KM survival probabilities | `1e-12` | Exact product-limit arithmetic |
| KM standard errors | `1e-10` | Greenwood formula involves sqrt |
| KM cumulative hazard | `1e-12` | Exact summation |
| CI bounds | `1e-10` | Involves qnorm, log transforms |
| Cox coefficients | `1e-6` | Same as GLM |
| Cox variance matrix | `1e-6` | Cholesky inversion |
| Cox log-likelihood | `1e-8` | Accumulation of logs |
| Cox score test | `1e-6` | Quadratic form |
| Martingale residuals | `1e-6` | Derived from baseline hazard |
| Schoenfeld residuals | `1e-6` | Per-death computation |
| Concordance | `1e-8` | Counting-based |
| cox.zph test statistic | `1e-4` | Involves matrix solve |
| Log-rank chi-squared | `1e-8` | Counting-based |
| Baseline hazard | `1e-8` | Cumulative sum |

### Implementation Order

Test files should be created as their corresponding Rust functionality is implemented:

- **Tier 1 (KM + foundation)**: `survfit1`, `survfit2`, `difftest`, `doaml`, `doweight`, `ekm`, `survtest`, `surv`, `tiedtime`
- **Tier 2 (Cox PH)**: `cancer`, `counting`, `coxsurv`–`coxsurv6`, `infcox`, `testnull`, `singtest`, `testreg`, `detail`
- **Tier 2b (Counting process)**: `counting`, `bladder`, `jasa`
- **Tier 3 (Diagnostics)**: `zph`, `concordance`–`concordance3`, `residms`, `residsf`, `r_resid`, `r_lung`, `brier`, `strata2`, `stratatest`, `prednew`, `predsurv`, `summary_survfit`, `summarydf`, `quantile`
- **Tier 4 (Extensions)**: `survreg1`, `survreg2`, `finegray`, `fr_*`, `frailty`, `frank`, `mstate*`, `multi*`, `tmerge*`, `pyear`, `expected*`, `pspline`, `aareg`, `anova`, `yates*`, `pseudo`, `clogit`, `book1`–`book7`, `tt`, `tt2`, `turnbull`, `update`, remaining files

### Files That May Not Need a TypeScript Equivalent

Some R test files test R-specific behavior (S4 methods, print/plot formatting, namespace resolution). These get a `.test.ts` stub with a skip annotation:

- `doublecolon.R` — tests `survival::` namespace resolution (R-specific)
- `plot.R` — tests plot output (no equivalent in our WASM pipeline)
- `model.matrix.R` — tests R's `model.matrix()` method dispatch
- `update.R` — tests R's `update()` formula manipulation
- `dropspecial.R` — tests R formula special term handling

---

## TypeScript Wrapper Files

```
packages/dataframe/ts/wasm/
├── survival-functions.ts     — survfitKm(), coxphFit(), survdiff(), coxZph(), concordance()
└── survival-types.ts         — KmResult, CoxphResult, SurvdiffResult, etc.
```

---

## Summary: File Count by Tier

| Tier | New Rust Files | C Files Ported | Lines (est.) |
|------|---------------|---------------|-------------|
| 1 | 7 | 4 (survfitkm.c, fastkm.c, survdiff2.c, coxsafe.c) | ~1200 |
| 2 | 6 | 4 (coxfit6.c, cholesky2.c, chsolve2.c, chinv2.c, coxmart.c) | ~1500 |
| 2b | 3 | 4 (agfit4.c, agmart.c, agmart3.c, agscore2/3.c) | ~800 |
| 3 | 15 | 14 (coxsurv1-4.c, agsurv4/5.c, coxscho.c, zph1/2.c, concordance3/5.c, coxdetail.c, approx.c, etc.) | ~3000 |
| 4 | 16+ | 20+ | ~4000+ |
| **Total** | **47+** | **46+** | **~10500+** |
