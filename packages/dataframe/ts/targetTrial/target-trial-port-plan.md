# Target Trial Emulation Port Plan

Full port of R's `SEQTaRget` package (Sequential Trial Emulation) to Rust/WASM + TypeScript for tidy-ts. SEQTaRget emulates sequential randomized trials from longitudinal observational data, accommodating time-varying treatments and confounders via inverse probability weighting.

## Reference Sources

- `survival-ref/SEQTaRget-main/SEQTaRget/` — R `SEQTaRget` package (pure R, no compiled code)
- `survival-ref/r-source-trunk/src/library/splines/` — R base `splines` package (C core + R orchestration for `ns()`, `bs()`, `splineDesign()`)
- `survival-ref/SEQTaRget-main/SEQTaRget/data/` — 3 example datasets (SEQdata, SEQdata.LTFU, SEQdata.multitreatment)

---

## Implementation Standards — READ BEFORE STARTING ANY WORK

These standards are inherited from the survival port plan. Every agent working on this port MUST follow them:

### 1. Port C Code Faithfully

The `splineDesign()` C implementation (`splines.c`, ~264 lines) must be ported in full — all branches of `set_cursor`, `diff_table`, `basis_funcs`, `evaluate`, `spline_basis`, and `spline_value`. Do not substitute a third-party crate or simplified algorithm.

### 2. Match R's Numerical Behavior

SEQTaRget's R test suite (`test_coefficients.R`) validates against exact coefficient values at tolerance 1e-2. The Rust primitives (splines, multinomial, bootstrap) must reproduce R's numerical output at this tolerance or better.

### 3. Validate Before Claiming Success

Every function must be validated against R's output. Do not claim a function works because "the code compiles." Use SEQTaRget's 3 bundled datasets for integration testing.

### 4. Do Not Overstate Progress

If a tier is partially complete, say exactly what is and isn't done. Mark checklist items individually.

---

## Architecture Overview

SEQTaRget has **no compiled code** — it is pure R orchestration over `data.table`, `fastglm`, and `survival`. Our port puts the **entire pipeline in Rust** — data expansion, weight computation, model fitting, survival curves, bootstrap loop, hazard ratios, CI aggregation. TypeScript is a thin wrapper that marshals data in and unpacks the result.

```
┌──────────────────────────────────────────────────────────┐
│  TypeScript — Thin Wrapper                                │
│  targetTrialEmulation({ data, treatment, outcome, ... }) │
│  → serialize to WASM → deserialize result                │
└──────────────────────┬───────────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │  Rust/WASM — Full Pipeline │
         ├───────────────────────────┤
         │ Data expansion (trials)   │
         │ IPCW weight computation   │
         │ Outcome model (GLM)       │
         │ Survival curves (cumprod) │
         │ Hazard ratios (Cox/FG)    │
         │ Bootstrap loop (ID-level  │
         │   resample → re-run full  │
         │   pipeline → aggregate)   │
         │ CI computation (SE/pctl)  │
         ├───────────────────────────┤
         │ Primitives (already done):│
         │  Splines (ns/bs/spDesign) │
         │  Multinomial logistic     │
         │  GLM, Cox PH, Fine-Gray   │
         └───────────────────────────┘
```

---

## Dependency Mapping

### Already Available in tidy-ts (Rust)

| Capability | Rust Location | Used By |
|-----------|---------------|---------|
| GLM with quasibinomial + logit link | `rust/stats/regression/glm/` | All weight & outcome models |
| GLM prediction (link + response) | `rust/stats/regression/glm/` | Weight/outcome prediction |
| Design matrix / model matrix | `rust/stats/regression/shared/` | Formula-based model specification |
| Cox PH regression | `rust/stats/survival/` | Hazard ratio estimation |
| Fine-Gray competing risks | `rust/stats/survival/` | Competing event hazard ratios |
| qnorm, pnorm | `rust/stats/distributions/` | Confidence interval construction |
| B-spline basis (`splineDesign`) | `rust/stats/splines/spline_design.rs` | `ns()`, `bs()` — **done** |
| Natural splines (`ns()`) | `rust/stats/splines/natural_splines.rs` | Outcome model follow-up terms — **done** |
| B-splines (`bs()`) | `rust/stats/splines/b_splines.rs` | Optional basis — **done** |
| Multinomial logistic regression | `rust/stats/regression/glm/multinomial.rs` | Multi-treatment weight models — **done** |

### Needs to Be Built (Rust — Pipeline Modules)

| Capability | R Source | Rust Target | Used By |
|-----------|----------|-------------|---------|
| Data expansion | `SEQexpand.R` (150 lines) | `rust/stats/target_trial/expand.rs` | Trial structure creation |
| IPCW weights | `internal_weights.R` (225 lines) | `rust/stats/target_trial/weights.rs` | Treatment weight computation |
| Outcome models | `internal_models.R` (42 lines) | `rust/stats/target_trial/outcome_models.rs` | Weighted GLM fitting |
| Survival curves | `internal_survival.R` (182 lines) | `rust/stats/target_trial/survival_curves.rs` | KM curves + CIs |
| Hazard ratios | `internal_hazard.R` (122 lines) | `rust/stats/target_trial/hazard.rs` | Cox/Fine-Gray HRs |
| Bootstrap loop | `internal_analysis.R` (232 lines) | `rust/stats/target_trial/bootstrap.rs` | Full pipeline resample → aggregate |
| Risk comparison | `internal_misc.R` (139 lines) | `rust/stats/target_trial/risk_comparison.rs` | Paired RD/RR with CIs |
| Pipeline orchestration | `SEQuential.R` (258 lines) | `rust/stats/target_trial/pipeline.rs` | Main entry point |
| Types/config | `class_definitions.R` + `SEQopts.R` | `rust/stats/target_trial/types.rs` | Config + result structs |
| Formula builders | `internal_covariates.R` (130 lines) | `rust/stats/target_trial/covariates.rs` | Default model formulas |
| GLM helpers | `internal_fatglmHelpers.R` (186 lines) | `rust/stats/target_trial/glm_helpers.rs` | Design matrix, separation |

---

## R Source File → Rust/TypeScript Mapping

### SEQTaRget R Files → Rust Pipeline

All pipeline logic lives in Rust. TypeScript provides only the thin WASM wrapper and user-facing types.

| R Source | Lines | Purpose | Rust Target |
|----------|-------|---------|-------------|
| `SEQuential.R` | 258 | Main orchestration: validation → expand → weights → models → survival → hazard → diagnostics | `rust/stats/target_trial/pipeline.rs` |
| `SEQexpand.R` | 150 | Core data expansion: trial/period creation, covariate joins, baseline indicators, censoring | `rust/stats/target_trial/expand.rs` |
| `internal_weights.R` | 225 | IPW computation: numerator/denominator models, LTFU, visit weights, cumulative product | `rust/stats/target_trial/weights.rs` |
| `internal_survival.R` | 182 | KM curves via vectorized prediction + cumprod(1-p), competing event CI, bootstrap CIs | `rust/stats/target_trial/survival_curves.rs` |
| `internal_hazard.R` | 122 | Event simulation from predicted probabilities, Fine-Gray + Cox PH, bootstrap log-scale CIs | `rust/stats/target_trial/hazard.rs` |
| `internal_models.R` | 42 | Outcome model fitting: optional ns()/factor for followup, weighted GLM, subgroup stratification | `rust/stats/target_trial/outcome_models.rs` |
| `internal_analysis.R` | 232 | Bootstrap loop: resample IDs → re-run full pipeline → aggregate estimates → CIs | `rust/stats/target_trial/bootstrap.rs` |
| `internal_multinomial.R` | 127 | One-vs-rest logistic models, softmax prediction | `rust/stats/regression/glm/multinomial.rs` (done) |
| `internal_covariates.R` | 130 | Default formula builders for outcome, weight, LTFU models | `rust/stats/target_trial/covariates.rs` |
| `internal_misc.R` | 139 | Risk ratio/difference computation, paired bootstrap CIs | `rust/stats/target_trial/risk_comparison.rs` |
| `internal_fatglmHelpers.R` | 186 | Cached prediction, optimized model matrix, separation check | `rust/stats/target_trial/glm_helpers.rs` |
| `SEQopts.R` | 227 | Options builder with validation | `rust/stats/target_trial/types.rs` (config struct) |
| `class_definitions.R` | 248 | S4 classes: SEQopts, SEQparams, SEQweights, SEQoutput | `rust/stats/target_trial/types.rs` |
| `class_methods.R` | 330 | Accessor functions, show method | Result struct methods in Rust |
| `class_setters.R` | 172 | Parameter validation, output construction | `rust/stats/target_trial/types.rs` |
| `internal_plot.R` | 40 | ggplot2 visualization | **Not ported** (visualization is consumer-side) |
| `data.R` | — | Dataset documentation | Test fixtures only |

### TypeScript — Thin Wrappers Only

| TS File | Purpose |
|---------|---------|
| `targetTrial/types.ts` | User-facing TypeScript interfaces (options, result types) |
| `targetTrial/index.ts` | `targetTrialEmulation()` — serialize data → WASM call → deserialize result |

### Splines C/R Files (C Core → Rust)

| Source | Lines | Purpose | Rust Target |
|--------|-------|---------|-------------|
| `splines.c` | 264 | `spline_basis()` + `spline_value()`: B-spline basis evaluation with de Boor's algorithm, derivative support, boundary handling | `splines/spline_design.rs` |
| `splines.R` lines 19–106 | 88 | `bs()`: B-spline basis matrix with knot placement, boundary extrapolation, df-to-knots conversion | `splines/b_splines.rs` |
| `splines.R` lines 108–194 | 87 | `ns()`: Natural spline basis = B-spline basis + QR constraint to enforce linearity beyond boundary knots | `splines/natural_splines.rs` |

---

## SEQTaRget Analysis Pipeline (What the Main Function Does)

```
SEQuential(data, opts)
  │
  ├── 1. Validate inputs (options, data columns, treatment levels)
  │
  ├── 2. SEQexpand(data, opts)
  │     → Create trial structure: one row per (id, trial, followup)
  │     → Join time-varying covariates at each trial's baseline
  │     → Create censoring indicators (switch, LTFU, end-of-followup)
  │     → For dose-response: cumulative treatment exposure
  │
  ├── 3. Compute IPCW weights (internal_weights)
  │     → Denominator model: P(treatment | covariates) per treatment level
  │     → Numerator model: P(treatment | baseline covariates only) — stabilization
  │     → LTFU model (optional): P(not lost to followup | covariates)
  │     → Visit model (optional): P(visit | covariates)
  │     → Weight = cumulative product of (numerator/denominator) across followup
  │
  ├── 4. Fit outcome model (internal_models)
  │     → Weighted quasibinomial GLM: outcome ~ treatment + covariates + ns(followup)
  │     → Optional subgroup stratification
  │
  ├── 5. Generate survival curves (internal_survival)
  │     → Predict counterfactual outcomes at each followup time
  │     → KM-style curve: S(t) = cumprod(1 - predicted_probability)
  │     → Competing event cumulative incidence
  │     → Bootstrap CIs via ID-level resampling
  │
  ├── 6. Estimate hazard ratios (internal_hazard)
  │     → Simulate first-event times from predicted probabilities
  │     → Cox PH or Fine-Gray on simulated events
  │     → Bootstrap CIs on log-scale
  │
  └── 7. Return SEQoutput (survival curves, HRs, weight diagnostics)
```

---

## Three Analysis Methods

| Method | `analysis_type` | Treatment Handling | Censoring |
|--------|----------------|-------------------|-----------|
| **ITT** (Intention-to-Treat) | `"ITT"` | Once assigned, always assigned | No treatment-switch censoring |
| **Dose-Response** | `"dose_response"` | Cumulative exposure tracked | Censored at specified max dose |
| **Censoring** (Per-Protocol) | `"censoring"` | Censor at treatment switch | IPCW for informative censoring |

---

## Current Status (2026-03-31)

**11 passed, 8 failed** across all target trial test suites.

### coefficients.test.ts — 10/10 ✓

All outcome model coefficient tests pass at tolerance 1e-2:

| Test | Status |
|------|--------|
| ITT | ✓ |
| Dose-Response Pre-Expansion | ✓ |
| Dose-Response Post-Expansion | ✓ |
| Censoring Pre-Expansion | ✓ |
| Censoring Post-Expansion | ✓ |
| Excused Censoring Pre-Expansion | ✓ |
| Excused Censoring Post-Expansion | ✓ |
| ITT with LTFU Pre-Expansion | ✓ |
| ITT with LTFU Post-Expansion | ✓ |
| ITT Multinomial (treat.level = [1,2]) | ✓ |

### multinomial.test.ts — 1/3

| Test | Status | Notes |
|------|--------|-------|
| ITT Multinomial coefficients | ✓ | |
| Multinomial Censoring Pre-Expansion | ✗ | diff ~3 on intercept |
| Multinomial Censoring Post-Expansion | ✗ | diff ~8 on intercept |

### hazard.test.ts — 0/3

| Test | Status | Notes |
|------|--------|-------|
| ITT hazard ratio matches R | ✗ | Not yet audited |
| Hazard ratio reproducibility | ✗ | Not yet audited |
| Hazard ratio bootstrap CIs | ✗ | Not yet audited |

### survival.test.ts — 0/3

| Test | Status | Notes |
|------|--------|-------|
| ITT survival curves match R | ✗ | Not yet audited |
| ITT risk data matches R | ✗ | Not yet audited |
| ITT risk comparison matches R | ✗ | Not yet audited |

### What's been audited and fixed (line-by-line vs R source)

1. **pipeline.rs** — Sort by (id, time) matching R line 69. Removed incorrect row pruning (R line 165 prunes local `data`, not `params@data` used by SEQexpand). Multinomial eligible filter matching R line 169.
2. **expand.rs** — Trial numbering uses row position (`rowid(id) - 1`). Trial-time lookup maps ALL positions (not just eligible). Excused columns included in time-varying join (R SEQexpand.R line 40). Excused switch forgiveness with `isExcused` column preserved for weights. Eligible_bas filtering after baseline join.
3. **weights.rs** — `tx_lag` creation for pre/post expansion matching R's `internal_weights.R` lines 21-48. `prepare.data_cached` row filtering (lag_condition, excused numerator, denominator followup!=0, excused_col==0). Response variable selection (censored for post-expansion excused). `isExcused` cumsum (R line 42). Excused prediction paths (denominator and numerator). Excused cumulative weight path with guards (denominator < 1e-15, is.na(outcome), isExcused cumsum → wt=1).
4. **factorize.rs** — Matches R's `internal_misc.R::factorize()`.

### What has NOT been audited yet

- **hazard.rs** — Event simulation, Cox PH / Fine-Gray fitting
- **survival_curves.rs** — KM curve generation, counterfactual prediction
- **risk_comparison.rs** — Paired RD/RR computation
- **bootstrap.rs** — ID-level resampling (basic structure exists, used by coefficient tests)
- **Multinomial + Censoring interaction** — Weight model behavior when both multinomial and censoring are active

---

## Tiered Implementation Plan

### Tier 0: Rust Primitives (Prerequisites) — DONE

**Tier 0a: B-Spline Basis Engine** (`packages/dataframe/rust/stats/splines/`)

- [x] `spline_design.rs` — Core B-spline basis evaluation
- [x] Unit tests against R's `splineDesign()` output

**Tier 0b: Natural Splines** (`packages/dataframe/rust/stats/splines/`)

- [x] `natural_splines.rs` — `ns()` implementation
- [x] `b_splines.rs` — `bs()` implementation
- [x] QR decomposition for `ns()` constraint

**Tier 0c: Multinomial Logistic Regression** (`packages/dataframe/rust/stats/regression/glm/multinomial.rs`)

- [x] `multinomial.rs` — K-1 binary GLM + softmax

**Tier 0 WASM Bindings:**

| WASM Function | Rust Function | Purpose |
|--------------|---------------|---------|
| `spline_design_wasm` | `spline_basis()` | B-spline basis matrix |
| `ns_wasm` | `ns()` | Natural spline basis matrix |
| `bs_wasm` | `bs()` | B-spline basis matrix |
| `multinomial_wasm` | `multinomial_fit()` | K-1 binary GLM + softmax |
| `multinomial_predict_wasm` | `multinomial_predict()` | Softmax class probabilities |
| `target_trial_wasm` | `target_trial_emulation()` | Full pipeline |

---

### Tier 1: Data Expansion + Types (Rust) — DONE

- [x] `rust/stats/target_trial/types.rs` — Config + result structs
- [x] `rust/stats/target_trial/expand.rs` — Core data expansion
  - [x] Trial generation with positional trial numbering (`rowid(id) - 1`)
  - [x] Follow-up sequence with configurable min/max
  - [x] Time-varying covariate joins (including excused cols, deviation excused cols)
  - [x] Baseline indicator joins via trial-time lookup
  - [x] Squared terms (followup_sq, trial_sq, time_sq)
  - [x] ITT path
  - [x] Dose-response path (cumulative dose, dose_sq)
  - [x] Censoring path (switch detection, truncation at firstSwitch)
  - [x] Excused censoring (switch forgiveness via isExcused cumsum, column preserved)
  - [x] Eligible_bas filtering after baseline join
- [x] `rust/stats/target_trial/covariates.rs` — Default formula builders
- [x] `rust/stats/target_trial/factorize.rs` — Factor encoding matching R

---

### Tier 2: Weight Computation (Rust) — DONE

- [x] `rust/stats/target_trial/weights.rs` — IPCW weights
  - [x] tx_lag creation (pre-expansion: shift by id; post-expansion: shift by id+trial, merge baseline lag)
  - [x] Denominator model fitting per treatment level
  - [x] Numerator model fitting per treatment level
  - [x] prepare.data_cached row filtering (lag_condition, excused, denominator followup!=0)
  - [x] Response variable selection (censored vs treatment)
  - [x] model.passer multinomial flag logic
  - [x] Prediction with treatment-based flip (1-p)
  - [x] Excused prediction paths (denominator + numerator)
  - [x] isExcused cumsum in weight data (R line 42)
  - [x] Cumulative product by (id, trial) — standard and excused paths
  - [x] Excused cumulative weight guards (denominator < 1e-15, is.na(outcome), isExcused → wt=1)
  - [x] LTFU weight component
  - [x] Weight truncation (upper/lower bounds)
  - [x] Weight diagnostics (percentiles, SD)

---

### Tier 3: Outcome Models + Survival Curves (Rust) — PARTIAL

- [x] `rust/stats/target_trial/outcome_models.rs` — Weighted outcome modeling
  - [x] Weighted quasibinomial GLM fitting
  - [x] Design matrix from formula terms
  - [ ] Optional: factor(followup) instead of polynomial
  - [ ] Optional: subgroup stratification
- [x] `rust/stats/target_trial/glm_helpers.rs` — GLM utilities
  - [x] Formula parsing and caching
  - [x] Design matrix construction with factor dummy variables
- [ ] `rust/stats/target_trial/survival_curves.rs` — **Not yet audited**
  - [x] Basic implementation exists
  - [ ] Audit against R's `internal_survival.R`
- [ ] `rust/stats/target_trial/risk_comparison.rs` — **Not yet audited**
  - [x] Basic implementation exists
  - [ ] Audit against R's `internal_misc.R`

---

### Tier 4: Bootstrap + Hazard Ratios + Full Pipeline (Rust) — PARTIAL

- [ ] `rust/stats/target_trial/hazard.rs` — **Not yet audited**
  - [x] Basic implementation exists
  - [ ] Audit event simulation against R's `internal_hazard.R`
  - [ ] Audit Cox PH / Fine-Gray integration
- [x] `rust/stats/target_trial/bootstrap.rs` — ID-level resampling
  - [x] Basic structure works (used by coefficient tests with bootstrap)
  - [ ] Audit against R's `internal_analysis.R` bootstrap loop
- [x] `rust/stats/target_trial/pipeline.rs` — Main entry point
  - [x] Sort by (id, time)
  - [x] Multinomial eligible filter
  - [x] Expand → factorize → weights → outcome model
  - [x] Bootstrap loop
  - [x] Result assembly
- [x] WASM binding + TypeScript wrapper

**Tier 4 Tests:**
- [ ] 3 hazard ratio tests — 0/3 passing (not yet audited)
- [x] 10 coefficient tests — 10/10 passing
- [ ] 3 multinomial tests — 1/3 passing (multinomial + censoring interaction needs work)
- [ ] 3 survival tests — 0/3 passing (not yet audited)

---

## Test Datasets

| Dataset | Rows | Description | Used In |
|---------|------|-------------|---------|
| `SEQdata` | 12,180 | Binary treatment, binary outcome, time-varying covariates | ITT, dose-response, censoring tests |
| `SEQdata.LTFU` | 54,687 | Same structure + loss-to-followup events | LTFU weight tests |
| `SEQdata.multitreatment` | 5,976 | 3-level treatment (multinomial) | Multinomial tests |

Datasets will be exported to CSV/SQLite fixtures in `packages/testing/targetTrial/fixtures/`.

---

## Test Count Summary

| Source Test File | R Tests | Port Target |
|-----------------|---------|-------------|
| `test_coefficients.R` | 11 | `packages/testing/targetTrial/coefficients.test.ts` |
| `test_coverage.R` | 39 | `packages/testing/targetTrial/coverage.test.ts` |
| `test_hazard.R` | 4 | `packages/testing/targetTrial/hazard.test.ts` |
| `test_survival.R` | 4 | `packages/testing/targetTrial/survival.test.ts` |
| `test_covariates.R` | 7 | `packages/testing/targetTrial/covariates.test.ts` |
| `test_denominators.R` | 6 | `packages/testing/targetTrial/denominators.test.ts` |
| `test_numerators.R` | 5 | `packages/testing/targetTrial/numerators.test.ts` |
| `test_multinomial.R` | 5 | `packages/testing/targetTrial/multinomial.test.ts` |
| `test_misc.R` | 7 | `packages/testing/targetTrial/misc.test.ts` |
| **Total** | **88** | |

Plus Tier 0 unit tests for splines, multinomial regression, and bootstrap (not counted above — these validate the Rust primitives directly, separate from SEQTaRget integration tests).

---

## Estimated Module Sizes

| Component | R Lines | Estimated Rust Lines | Notes |
|-----------|---------|---------------------|-------|
| **Rust: spline_design.rs** | 264 (C) | ~500 | Done — C → Rust port |
| **Rust: natural_splines.rs** | 87 (R) | ~600 | Done — R logic + QR |
| **Rust: b_splines.rs** | 88 (R) | ~460 | Done — R logic in Rust |
| **Rust: multinomial.rs** | 127 (R) | ~300 | Done — K-1 GLM + softmax |
| **Rust: types.rs** | 248+227 (R) | ~200 | Config + result structs |
| **Rust: expand.rs** | 150 (R) | ~300 | Core data expansion |
| **Rust: covariates.rs** | 130 (R) | ~100 | Formula builders |
| **Rust: weights.rs** | 225 (R) | ~300 | IPCW computation |
| **Rust: outcome_models.rs** | 42 (R) | ~150 | Weighted GLM fitting |
| **Rust: survival_curves.rs** | 182 (R) | ~250 | KM curves |
| **Rust: hazard.rs** | 122 (R) | ~200 | HR estimation |
| **Rust: bootstrap.rs** | 232 (R) | ~300 | Full pipeline resample loop |
| **Rust: risk_comparison.rs** | 139 (R) | ~150 | Paired RD/RR with CIs |
| **Rust: glm_helpers.rs** | 186 (R) | ~150 | Design matrix, separation |
| **Rust: pipeline.rs** | 258 (R) | ~200 | Main entry + WASM binding |
| **TS: types.ts** | — | ~100 | User-facing interfaces |
| **TS: index.ts** | — | ~50 | Thin WASM wrapper |
| **Total** | ~3,200 | ~3,810 | Mostly Rust |

---

## Key Implementation Notes

### Multinomial Logistic Regression (Rust)

SEQTaRget does NOT use a standard multinomial GLM. It fits K-1 separate binary logistic regressions (one-vs-rest) using quasibinomial GLM, then normalizes predictions via softmax. This is numerically simpler than iterative multinomial MLE but produces different estimates. Port the exact SEQTaRget approach, not a textbook multinomial implementation.

```
For K treatment levels:
  For k = 1..K-1:
    fit binary GLM: I(treatment == k) ~ covariates, family = quasibinomial
  Predictions:
    raw_k = predict(model_k, type = "response") for k = 1..K-1
    raw_K = 1  (reference class)
    P(class = k) = raw_k / sum(raw_1..raw_K)   # softmax normalization
```

### Natural Splines — QR Constraint

The key step in `ns()` that makes it "natural" (linear beyond boundary knots):

```
1. Compute B-spline basis: basis = splineDesign(Aknots, x, ord=4)
2. Compute 2nd derivative at boundaries: const = splineDesign(Aknots, Boundary.knots, ord=4, derivs=c(2,2))
3. QR decompose the constraint: qr.const = qr(t(const))
4. Project basis onto null space of constraint: basis = (t(qr.qty(qr.const, t(basis))))[, -(1:2)]
```

This removes the 2 columns corresponding to the curvature at boundary knots, enforcing linearity.

### Bootstrap — Full Pipeline in Rust

Bootstrap resamples entire IDs (all rows for a given patient), not individual rows. This preserves the within-subject correlation structure. The entire bootstrap loop runs in Rust: resample IDs → re-expand data → recompute weights → re-fit models → re-estimate survival/hazard → collect estimates → compute CIs. TypeScript never sees intermediate bootstrap iterations.

### Weight Computation — Cumulative Product

Weights are the cumulative product of per-period ratios across followup within each (id, trial):

```
weight_t = product_{s=0}^{t} (numerator_s / denominator_s)
```

This is computed directly in Rust over the columnar data representation.

### Separation Detection

When a binary predictor perfectly separates the outcome, GLM coefficients explode. SEQTaRget checks `|coef| > 25` and warns. This threshold should be preserved exactly.
