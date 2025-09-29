### Regression Test Harness: Algorithm Overview

This document explains the algorithm used by the regression test harness to compare Rust (WASM) vs R results for GLM/LM. It is intended to be easy to follow and implementation-agnostic.

### Goals
- Ensure Rust and R agree on model fit results across randomized, diverse test cases
- Detect true implementation mismatches, while filtering out known statistical pathologies (e.g., separation, rank deficiency)

### High-Level Flow
1) Configure which test types to run and how many random cases per type
2) Generate a random test case (data + formula) with constraints to avoid underdetermined designs
3) Fit the same model in R and in Rust (via WASM)
4) Compare results with logic that recognizes statistical pathologies
5) Retry pathologic cases; otherwise classify as PASS/FAIL/ERROR
6) Print detailed diagnostics and a summary

### Key Concepts
- Seeded RNG: All randomness is reproducible via a settable seed (Mulberry32 PRNG)
- Categorical Predictors: Generated as factors (strings in TS → factors in R). Dummy expansion follows R defaults
- Parameter Cap: We estimate the effective parameter count (including dummy variables and interactions) and cap it to roughly n/3 to avoid underdetermined models
- R Warnings: We capture R’s warnings/stderr and use them to identify separation/singularity/non-convergence pathologies

### Data & Formula Generation (per test case)
- Choose sample size n (approx. 10–30) and number of predictors (3–5), always including at least one categorical predictor
- Generate predictors:
  - Numeric: standard normal via Box–Muller
  - Categorical: 2–3 levels with a minimum count per level to avoid degenerate factors
- Generate response y based on test family:
  - gaussian: normal data (positive transforms when link requires)
  - binomial: Bernoulli with safeguards to ensure both classes present
  - poisson: Poisson counts
  - gamma/inverse_gaussian: positive continuous via |N(μ,σ)| + ε
- Build a formula mixing + and * operators; estimate effective parameters after dummy expansion and interaction combinations
- If parameter count exceeds maxParams ≈ floor(n/3), simplify (fall back to main effects) until within limits

### R Fit (reference)
- Convert JSON data to an R data.frame with proper types (strings → factors)
- Call glm()/lm() with matching family/link for the test type
- Return JSON with coefficients, fitted values, residuals, deviance, AIC, R² (LM), etc.
- Capture R warnings/stderr and attach them to the JSON result as `warnings`

### Rust Fit (via WASM)
- Call `glmFit`/`lmFit` with the same formula/family/link and data
- Categorical variables are kept as strings; the WASM layer expands them consistently with R reference behavior
- Return the same metrics (coefficients, deviance, AIC, etc.)

### Comparison and Classification
- Compute metrics:
  - coefficientDiff: max absolute difference across aligned coefficients
  - rSquaredDiff: |R.r_squared − Rust.r_squared| (0 when not applicable)
  - aicDiff: |R.AIC − Rust.AIC|

- Primary PASS rule (no warnings):
  - PASS if max(coefficientDiff, rSquaredDiff, aicDiff) < 0.1

- Relaxed PASS rule (R warnings indicate pathology):
  - If R warnings contain any of: “fitted probabilities numerically 0 or 1 occurred”, “separation”, “singular”, “did not converge”, “0s in V(mu)”, “NAs in V(mu)”:
    - Emphasize fit metrics: PASS if aicDiff < 1e-6 and rSquaredDiff < 1e-6
    - Otherwise fall back to the 0.1 max-diff rule

- Both Failed:
  - If both errors indicate statistical failure (same warning patterns above, incl. NaN/infinite), classify as PASS (expected behavior)

- Mixed Success/Failure:
  - If system/runtime errors (panic, WebAssembly errors, or “cannot correct step size”), classify as ERROR
  - Otherwise classify as FAIL

### Pathology Filter (Auto-Retry)
- After each comparison, if not PASS, declare a case “pathological” and retry (up to 3x) when any of the following holds:
  - aicDiff > 1e3 or coefficientDiff > 1e3 (extreme instability)
  - R warnings indicate separation/singularity/non-convergence
  - Errors indicate step-size correction failure
- If retries are exhausted, keep the last classification

### Reporting
- Detailed Coefficients: Side-by-side lists with per-index differences
- Test Parameters: Table with sample size, number of predictors, formula, family, and α
- Summary: Per-test row with counts of PASS/FAIL/ERROR and success rates per type

### Pseudocode
```text
set seed
select enabled test types

allResults = []
for each testType in enabled:
  repeat testCount times:
    attempts = 0
    while attempts < maxAttempts:
      attempts += 1
      params = generateTestCase(testType, n ~ U{10..30})

      try:
        r = runR(params)        # glm()/lm() → metrics + warnings
      catch errR:
        r = error(errR)

      try:
        rust = runRust(params)  # glmFit/lmFit → metrics
      catch errRust:
        rust = error(errRust)

      result = compare(r, rust)
        if both success:
          diffs = { coef, aic, r2 }
          if r.warnings indicates pathology:
            status = (aicDiff < 1e-6 && r2Diff < 1e-6) ? PASS : (maxDiff < 0.1 ? PASS : FAIL)
          else:
            status = (maxDiff < 0.1) ? PASS : FAIL
        else if both failed and both errors look statistical:
          status = PASS
        else if system/step-size errors present:
          status = ERROR
        else:
          status = FAIL

      if status != PASS and looksPathological(result):
        if attempts < maxAttempts:
          continue   # retry with a new randomized case

      allResults.push(result)
      break

printDetailedCoefficients(allResults)
printTestParameters(allResults)
printSummary(allResults)
```

### Current Thresholds
- Parameter cap: maxParams = max(3, floor(n/3))
- Pathology ‘huge’ thresholds: > 1e3 (diffs)
- R² and AIC tight tolerance under pathology: < 1e-6
- General PASS tolerance (no warnings): maxDiff < 0.1

### Notes
- The cap on effective parameters reduces rank deficiency and separation, but does not eliminate all pathologies; hence the explicit warning-aware comparison and retries
- R warnings are the canonical signal for separation/singularity handling; we mirror R’s behavior to avoid judging coefficients in ill-posed scenarios


