# GEE Implementation Plan (Reusing Existing GLM)

This plan outlines how to implement Generalized Estimating Equations (GEE) by reusing the existing GLM infrastructure and aligning with `geepack`'s design (notably `geeglm()` and `geese.fit()`).

## Guiding Principles

- Reuse GLM wherever possible: formula parsing, model frame, design matrix, families/links, IRLS core, summaries, printing.
- Implement only GEE-specific layers: clustering (id/waves), working correlation structures, correlation updates, robust variance, ANOVA, and wrappers.
- Mirror geepack flow: `geeglm()` calls `glm()` first, then calls `geese.fit()` and wraps results to look like a GLM with GEE extensions.

## What Already Exists (to Reuse)

- `glm()` pipeline: `glm_main_core.rs` → uses shared formula parser and `glm_fit` IRLS.
- `GlmResult` and helpers: access to `x` (`ModelMatrix`), `y`, `weights`, `offset`, `family`, `rank`, residuals, AIC, etc.
- Influence/diagnostics modules for LM/GLM (potentially helpful for sandwich pieces).
- Families/links/variance functions across Gaussian, Binomial, Poisson, etc.

## What GEE Adds (and we must implement)

1. Correlation structures (working correlation matrix):
   - Independence, Exchangeable, AR(1), Unstructured, User-defined, Fixed.
   - API: build working correlation per cluster, and optionally its derivatives wrt alpha.

2. Clustering support:
   - `id` vector (n): group membership for each observation.
   - Optional `waves` (n): time indices for AR(1) and similar.
   - Grouping utilities: compute cluster boundaries, sizes, and per-cluster slices of X, y, weights, offset.

3. GEE estimation loop (geese.fit analogue):
   - Start at GLM coefficients or provided `start`.
   - Iterate:
     - Build working covariance V_i for each cluster using current alpha and scale.
     - Solve generalized least squares step using GLM’s weighted least squares machinery (no new IRLS; just adapt weights/working response via V^{-1}).
     - Update `alpha` (correlation params) based on Pearson residuals and chosen structure.
     - Optional: update `gamma` (scale) if not fixed.
     - Check convergence on beta/alpha, or max iter.

4. Robust variance (vcov.geeglm):
   - Provide `san.se` (sandwich) and placeholders for `jack`, `j1s`, `fij`.
   - `vcov.geeglm` should switch based on chosen standard error type.

5. geeglm wrapper:
   - Accepts all glm-like args plus GEE-specific: `id`, `waves`, `zcor`, `corstr`, `scale.fix`, `scale.value`, `std.err`.
   - Calls `glm()` to construct model frame and a dummy fit; extracts `X`, `y`, `weights`, `offset`, `family`.
   - Calls `geese_fit(...)` to perform GEE.
   - Wraps result to `geeglm`-like object that preserves GLM API but adds GEE fields.

6. ANOVA and Summary:
   - `summary.geeglm`: temporarily reuse `summary.glm` on the GLM-like result, and augment with GEE metadata (clusters, corstr, robust SE availability).
   - `anova.geeglm`: support model comparisons consistent with geepack (defer deep math until core GEE stabilizes).

## Module Layout (Minimal and Focused)

```
src/dataframe/rust/stats/regression/gee/
  - mod.rs (exports)
  - geeglm.rs (wrapper calling glm + geese_fit)
  - geese_fit.rs (core GEE loop coordinator)
  - types.rs (GEE-only types that extend GLM types)
  - control.rs (geese.control analogue)
  - correlation/
      - mod.rs (trait + factory)
      - independence.rs, exchangeable.rs, ar1.rs, unstructured.rs, user_defined.rs, fixed.rs
  - variance/
      - mod.rs (switch)
      - sandwich.rs (san.se core)
      - jackknife.rs (stubs for jack, j1s, fij)
  - utils/
      - clustering.rs (id/waves utilities)
      - blocks.rs (block-diagonal ops, per-cluster slices)
      - weights.rs (map V_i^{-1} into working weights for GLM step)
  - implementation-plan.md (this file)
```

## Detailed Task Breakdown

1) Types and Control (1–2 days)
- `types.rs`: `CorrelationStructure`, `ClusterInfo`, `WorkingCorrelation`, `GeeParams` {alpha, gamma}, `GeeInfo` (working correlation, cluster info, vcov matrices, convergence), `GeeglmResult { glm_result, gee_info, corstr, cluster_ids }`.
- `control.rs`: `geese_control(epsilon, max_iter, trace, jack, j1s, fij)`.

2) Correlation Structures (2–3 days)
- Independence: identity.
- Exchangeable: parameter rho ∈ [−1,1].
- AR(1): parameter rho; uses `waves` difference.
- Unstructured: parameterized full symmetric correlation (start with identity + TODO for params mapping).
- User-defined/Fixed: wired via `zcor` or fixed matrix (initially stubs).
- Factory: `create_correlation(structure, max_cluster_size)` returns implementor.

3) Clustering and Utilities (1–2 days)
- From `id` (and `waves`), compute per-cluster indices, sizes, and maximum cluster size.
- Build block-diagonal V and efficient V^{-1}·res computations without materializing full n×n.
- Map cluster-level V_i^{-1} into observation-level working weights usable by GLM step; when correlation is not diagonal, compute GLS step via blocks (no re-implement IRLS).

4) GEE Fit Coordinator (3–5 days)
- `geese_fit.rs` orchestrates the loop:
  - Initialize beta from GLM coefficients (or start), alpha from defaults, scale from family or `scale.value`.
  - Loop up to `max_iter`:
    - Compute mu, residuals with current beta.
    - Build per-cluster working covariance V_i from structure, alpha, scale.
    - Compute GLS/weighted step using existing GLM linear algebra utilities; update beta.
    - Update alpha from Pearson residuals (method-of-moments per structure).
    - If `!scale.fix`, update scale.
    - Convergence check on beta and alpha; trace if requested.
  - Store influence-function ingredients for sandwich variance.

5) Variance Estimation (2–3 days)
- `variance/sandwich.rs`: compute robust vcov via block sums of `X_i^T V_i^{-1} A_i V_i^{-1} X_i` style; use stored residuals/influence.
- `jackknife.rs`: provide stubs for jack, j1s, fij with clear TODO markers.

6) geeglm Wrapper (1–2 days)
- Mirror geepack: construct a GLM-like object, strip GLM-only fields that differ, attach `geese`-like payload, set class as `geeglm`.
- Ensure `vcov(geeglm)` dispatch selects robust vcov method.

7) Summary/ANOVA (1–2 days)
- `summary_geeglm`: call `summary.glm`-equivalent, inject cluster/corstr info, and expose robust SE when available.
- `anova_geeglm`: basic deviance/score-based comparison placeholder aligned with geepack’s expectations.

## Key Reuse Points from GLM

- Use `glm(formula, ...)` to parse formula, build `ModelFrame` and `ModelMatrix`, and get initial `beta`, `mu`, residuals.
- Extract X and y via `GlmResult.x` and `GlmResult.y` (reshape if needed).
- Use existing linear algebra helpers (QR/WLS) rather than re-implementing IRLS.
- Reuse families and link/variance functions directly from GLM.

## Deliverables and Milestones

- Milestone A: Types/control + Independence/Exchangeable/AR1 + clustering utils.
- Milestone B: GEE loop (beta/alpha) with independence/exchangeable; robust sandwich vcov for san.se.
- Milestone C: geeglm wrapper + summary/vcov hooks; basic tests on small datasets.
- Milestone D: Extend to AR1, unstructured (with parameter mapping), and add jackknife stubs.

## Testing Strategy

- Golden tests against simple geepack examples (dietox/chick examples mirrored in TS fixtures).
- Unit tests for each correlation structure (matrix shape, bounds, derivatives when added).
- Integration tests for geeglm vs glm under independence (should reduce to glm coefficients; robust SE may differ).

## Risks and Mitigations

- Robust vcov math correctness: start with independence to validate plumbing, then add exchangeable/AR1.
- Performance on large clusters: use block operations and avoid dense n×n allocations.
- Incomplete GLM extractors: if `x`/`y` not fully exposed, extend `GlmResult` accessors minimally.

## Next Actions

1. Add `types.rs`, `control.rs`, and correlation `independence.rs`, `exchangeable.rs`, `ar1.rs`.
2. Implement clustering utils and per-cluster slicing.
3. Build `geese_fit.rs` skeleton that calls GLM linear solves using block weights.
4. Provide `variance/sandwich.rs` with independence working version.
5. Implement `geeglm.rs` wrapper that calls `glm()` then `geese_fit()`.

## Status Update (in-progress)

- GEE scaffolding created: `mod.rs`, `types.rs`, `control.rs`, `geese_fit.rs`, `geeglm.rs`, `correlation/mod.rs`, `variance/mod.rs`, `utils/mod.rs`.
- `geeglm()` now calls `glm()`, then `geese_fit`, and attaches `robust_vcov` via `vcov_geeglm` (independence baseline).
- Minimal alpha estimation added for Exchangeable and AR(1) using GLM Pearson residuals (no GLS re-fit yet).
- No duplication of GLM IRLS, parsing, or family logic.

## TODOs (concise)

- [ ] Correlation-aware GLS step (block-weighted solve using V_i^{-1}); keep independence path trivial.
- [ ] Clustered sandwich vcov: replace independence `diag(r^2)` with cluster block sums.
- [ ] Correlation factory: bounds/validation; stubs for UserDefined/Fixed wired to `zcor`/fixed matrices.
- [ ] geeglm API surface: expose `vcov`, `summary` augmentation (print clusters, corstr; reuse GLM summary otherwise).
- [ ] Tests: unit (alpha estimators; grouping), integration (independence ≈ glm; small Exchangeable/AR1 example).
- [ ] Performance: avoid dense n×n; per-cluster ops only.

