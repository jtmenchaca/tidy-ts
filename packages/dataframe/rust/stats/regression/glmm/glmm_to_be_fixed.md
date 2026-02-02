# GLMM Implementation Issues to Fix

This document identifies discrepancies between our Rust GLMM implementation and glmmTMB/lme4 that need to be fixed for R-matching results.

## Status Summary

| Issue | Priority | Status | Affected Files |
|-------|----------|--------|----------------|
| Issue 1 | HIGH | ✅ **FIXED** | `laplace/likelihood.rs` |
| Issue 2 | HIGH | ✅ **FIXED** | `fitting.rs`, `laplace/approximation.rs`, `laplace/gradient.rs` |
| Issue 3 | MEDIUM | ✅ **FIXED** | `random_effects_likelihood.rs`, `variance_components.rs` |
| Issue 4 | MEDIUM | ✅ **FIXED** | N/A (moot - Issue 2 removes post-hoc computation) |
| Issue 5 | MEDIUM | ⚠️ VERIFY | `laplace/reml.rs` |
| Issue 6 | LOW | ⚠️ DEFER | `laplace/approximation.rs` |
| Issue 7 | LOW | ⚠️ VERIFY | `variance_components.rs` |
| Issue 8 | HIGH | ✅ **FIXED** | `laplace/approximation.rs` |

### Issue 2 Implementation Details

Joint sigma estimation has been implemented matching glmmTMB:

1. **theta structure**: For Gaussian family, `log(sigma)` is appended to the end of the theta vector
2. **IRLS weights**: For Gaussian, weights are now scaled by 1/σ² (not just 1)
3. **Hessian scaling**: The Hessian used in Laplace approximation now properly depends on sigma
4. **Data likelihood**: Uses `dnorm(y, mu, sigma, log=TRUE)` matching glmmTMB line 965

**Key files modified:**
- `laplace/gradient.rs`: Added sigma parameter to `joint_gradient_b` and `joint_hessian_b`
- `laplace/mode_finding.rs`: Added sigma parameter to `find_b_mode`
- `laplace/approximation.rs`: Added `extract_sigma_from_theta()` function
- `fitting.rs`: Initialize log_sigma in theta for Gaussian, extract sigma from fitted theta

**Test data note**: The `create_random_slopes_data()` test has near-zero residual variance making it pathological. glmmTMB also struggles with this data, producing different results than lme4 and showing "false convergence" warnings.

---

## Issue 1: Data Likelihood Uses Deviance Instead of Proper Log-Likelihood ✅ FIXED

**Status:** Fixed in `laplace/likelihood.rs`

**What was done:**
- Created `compute_data_log_likelihood()` function that uses proper distribution functions
- Gaussian: `dnorm(y[i], mu[i], sigma, true)`
- Poisson: `dpois(y[i], mu[i], true)`
- Binomial: `dbinom(successes, trials, mu[i], true)`
- Negative Binomial: `dnbinom(y[i], size, prob, true)`

**glmmTMB reference:** `glmmTMB.cpp:961-1178` - observation likelihood switch statement

---

## Issue 2: Gaussian Residual Variance Computed Post-Hoc Instead of Jointly Estimated ✅ FIXED

**Status:** FIXED

**Current implementation:** [fitting.rs:317-338](fitting.rs#L317-L338)
```rust
let residual_variance = if family.name() == "gaussian" {
    // Estimate from residuals AFTER fitting
    let zb = z.mul_vec(&b);
    let mut ssr = 0.0;
    // ... compute SSR ...
    let df_resid = (n as f64) - (p as f64) - (q as f64);
    if df_resid > 0.0 { ssr / df_resid } else { 1.0 }
} else {
    1.0
};
```

**Problem:** Residual variance (σ²) is estimated AFTER fitting using residual sum of squares. In glmmTMB, the dispersion parameter (phi = σ for Gaussian) is jointly estimated during optimization.

### glmmTMB Implementation Details

**Parameter declaration:** `glmmTMB.cpp:860`
```cpp
PARAMETER_VECTOR(betadisp);  // Fixed effects for dispersion model
```

**Dispersion linear predictor:** `glmmTMB.cpp:926-932`
```cpp
vector<Type> etadisp = Zdisp * bdisp + dispoffset;
if (!sparseXdisp) {
    etadisp += Xdisp*betadisp;
}
```

**Transform to phi:** `glmmTMB.cpp:939`
```cpp
vector<Type> phi = exp(etadisp);  // phi = exp(log(sigma)) = sigma
```

**Gaussian likelihood:** `glmmTMB.cpp:964-966`
```cpp
case gaussian_family:
    tmp_loglik = dnorm(yobs(i), mu(i), phi(i), true);  // phi is SD
```

### Implementation Plan

**Option A: Full dispersion model (match glmmTMB exactly)**
1. Add `betadisp` parameter to theta (typically just one value: `log(sigma)`)
2. Add `Xdisp` design matrix (typically just intercept column)
3. Compute `etadisp = Xdisp * betadisp` and `phi = exp(etadisp)`
4. Pass `phi` to `joint_log_likelihood_with_sigma()`
5. Jointly optimize `betadisp` with other parameters

**Option B: Simplified approach (single sigma)**
1. Add single `log_sigma` parameter at end of theta for Gaussian family
2. In likelihood: `sigma = exp(theta[n_re_params])`
3. Include in optimization objective
4. Simpler but doesn't support heteroscedastic models

**Recommended:** Start with Option B for simplicity, can extend to Option A later.

### Files to Modify

1. **`types.rs`**: Add `log_sigma` field to result types
2. **`fitting.rs`**:
   - Extend theta to include `log_sigma` for Gaussian
   - Remove post-hoc residual variance computation
3. **`laplace/likelihood.rs`**: Extract sigma from theta and pass to `compute_data_log_likelihood()`
4. **`laplace/approximation.rs`**: Pass sigma through the chain

### Test Case
```r
# R reference
library(lme4)
fm <- lmer(Reaction ~ Days + (Days|Subject), sleepstudy)
sigma(fm)     # Should match our residual_variance.sqrt()
VarCorr(fm)   # Variance components
logLik(fm)    # Log-likelihood (should match with joint sigma)
```

---

## Issue 3: Compound Symmetry Correlation Bounds Are Wrong ✅ FIXED

**Status:** FIXED

**What was done:**
- Added `cs_correlation_transform(x, k)` function that maps unconstrained x to valid CS range `(-1/(k-1), 1)`
- Added `cs_correlation_inv_transform(rho, k)` for initialization
- Updated `random_effects_likelihood.rs` and `variance_components.rs` to use new transformation
- Updated `initial_theta` to use inverse transform for proper initialization

**Current implementation:** [random_effects_likelihood.rs:119](random_effects_likelihood.rs#L119), [variance_components.rs:432](variance_components.rs#L432)
```rust
let rho = theta_re[1].tanh(); // Transform to (-1, 1)
```

**Problem:** Uses `tanh(x)` which maps to `(-1, 1)`. For compound symmetry with k dimensions, the valid correlation range is `(-1/(k-1), 1)` to ensure positive definiteness.

### glmmTMB Implementation

**Location:** `glmmTMB.cpp:441-473`
```cpp
else if (term.blockCode == cs_covstruct || term.blockCode == homcs_covstruct) {
    int n = term.blockSize;
    // ...
    Type corr_transf = theta.tail(1)(0);
    Type a = Type(1) / (Type(n) - Type(1));
    Type rho = invlogit(corr_transf) * (Type(1) + a) - a;
    // This maps corr_transf ∈ (-∞, ∞) to rho ∈ (-1/(n-1), 1)
```

**Math explanation:**
- For k×k compound symmetry matrix to be positive definite: ρ > -1/(k-1)
- Example: k=2 → ρ > -1, k=3 → ρ > -0.5, k=4 → ρ > -0.333
- glmmTMB transformation: `rho = invlogit(x) * (1 + a) - a` where `a = 1/(k-1)`
  - When x → -∞: rho → -a = -1/(k-1)
  - When x → +∞: rho → 1

### Implementation Plan

**Files to modify:**
1. **`random_effects_likelihood.rs:119`**
2. **`variance_components.rs:432`**

**Fix:**
```rust
// Old (wrong):
let rho = theta_re[1].tanh();

// New (correct):
fn cs_correlation_transform(x: f64, k: usize) -> f64 {
    let a = 1.0 / (k as f64 - 1.0);
    let invlogit_x = 1.0 / (1.0 + (-x).exp());
    invlogit_x * (1.0 + a) - a
}
let rho = cs_correlation_transform(theta_re[1], k);
```

**Also add inverse transform for initialization:**
```rust
fn cs_correlation_inv_transform(rho: f64, k: usize) -> f64 {
    let a = 1.0 / (k as f64 - 1.0);
    let y = (rho + a) / (1.0 + a);  // y = invlogit(x)
    (y / (1.0 - y)).ln()  // x = logit(y)
}
```

### Test Case
```r
# R reference - compound symmetry should work for any k
library(glmmTMB)
# With k=3 random effects, correlation can go down to -0.5
```

---

## Issue 4: Degrees of Freedom for Residual Variance Uses Wrong Formula ✅ FIXED (MOOT)

**Status:** MOOT - Issue 2 fix removes the post-hoc computation entirely

**Resolution:** The Issue 2 fix changed residual variance from post-hoc computation to joint estimation with other variance components. The old code with wrong df has been removed and replaced with:

```rust
// Extract sigma from theta for Gaussian family (Issue 2 fix)
let (theta_vc, sigma) = extract_sigma_from_theta(&theta, random_effects, family);
// ...
let residual_variance = sigma * sigma;
```

The degrees of freedom issue no longer applies since sigma is now estimated via ML/REML as part of the optimization, matching glmmTMB's approach.

---

## Issue 5: REML Adjustment Formula May Differ

**Status:** NEEDS VERIFICATION

**Current implementation:** [laplace/reml.rs](laplace/reml.rs)
```rust
pub fn compute_reml_adjustment(...) -> Option<f64> {
    let xtw_x = compute_weighted_xtx(...)?;
    let log_det = log_determinant(&xtw_x)?;
    Some(0.5 * log_det)  // REML adjustment: +0.5 * log|X'WX|
}
```

**glmmTMB approach:** REML is handled in the R wrapper (`glmmTMB.R`), not in the TMB template.

### Verification Strategy

Compare REML vs ML variance estimates:
```r
library(lme4)
# REML (default)
fm_reml <- lmer(Reaction ~ Days + (Days|Subject), sleepstudy, REML=TRUE)
# ML
fm_ml <- lmer(Reaction ~ Days + (Days|Subject), sleepstudy, REML=FALSE)

# Compare
sigma(fm_reml)  # Usually slightly larger
sigma(fm_ml)
VarCorr(fm_reml)
VarCorr(fm_ml)
```

---

## Issue 6: Numerical Gradients Instead of Analytical

**Status:** DEFERRED (low priority)

**Current implementation:** [laplace/approximation.rs](laplace/approximation.rs) - `numerical_grad_theta()`

**Problem:** Uses numerical differentiation with `eps = 1e-6`. glmmTMB uses TMB's automatic differentiation.

**Impact:**
- Slightly less accurate gradients
- More function evaluations (2 per parameter)
- May converge to slightly different optima

**Recommendation:** Low priority. Numerical gradients work, just slower. Analytical gradients would require significant implementation effort.

---

## Issue 7: Log-Jacobian Formula Uncertainty

**Status:** NEEDS VERIFICATION

**Current implementation:** [variance_components.rs:296-319](variance_components.rs#L296-L319)
```rust
// log|J| = k*log(2) + sum((k-i)*theta[i]) for i = 0..k-1
let mut log_det = (k as f64) * 2.0_f64.ln();
for i in 0..k {
    log_det += ((k - i) as f64) * theta[i];
}
```

**Comment in code:** "The exact form depends on whether we're looking at the Jacobian from theta to the unique elements of Σ or to vec(Σ)."

**Verification:** Compare standard errors against lme4/glmmTMB outputs.

---

## Testing Strategy

After each fix, validate against exact R values:

### 1. Gaussian GLMM (sleepstudy)
```r
library(lme4)
fm <- lmer(Reaction ~ Days + (Days|Subject), sleepstudy)

# Compare these values:
fixef(fm)        # Fixed effects
VarCorr(fm)      # Variance components
sigma(fm)        # Residual SD
ranef(fm)        # BLUPs
logLik(fm)       # Log-likelihood
AIC(fm)          # AIC
```

### 2. Binomial GLMM (cbpp)
```r
library(lme4)
fm <- glmer(cbind(incidence, size-incidence) ~ period + (1|herd),
            cbpp, family=binomial)

fixef(fm)
VarCorr(fm)
logLik(fm)
```

### 3. REML vs ML Comparison
```r
fm_reml <- lmer(Reaction ~ Days + (1|Subject), sleepstudy, REML=TRUE)
fm_ml <- lmer(Reaction ~ Days + (1|Subject), sleepstudy, REML=FALSE)

# REML should give slightly larger variance estimates
VarCorr(fm_reml)
VarCorr(fm_ml)
```

**Tolerance:** 1e-4 for coefficients, 1e-3 for variance components (matching project standard in VALIDATION.md).

---

## Issue 8: Laplace Correction Missing Normalization Constant ✅ FIXED

**Status:** FIXED

**Problem:** The Laplace approximation formula was missing the `(q/2) * log(2π)` normalization term. This caused a log-likelihood discrepancy of approximately `q/2 * log(2π)` units, where q is the number of random effects.

**Old implementation:** `laplace/approximation.rs`
```rust
// Missing the (q/2)*log(2π) term
laplace_correction = -0.5 * log|H|
```

**New implementation:**
```rust
// Full Laplace correction formula
laplace_correction = (q/2) * log(2π) - 0.5 * log|H|
```

**Mathematical background:**

The Laplace approximation for the integral over random effects is:
```
∫ exp(f(b)) db ≈ exp(f(b̂)) * (2π)^{q/2} * |H|^{-1/2}
```

Taking logs:
```
log(...) ≈ f(b̂) + (q/2)*log(2π) - 0.5*log|H|
```

The random effects prior `log p(b | θ)` includes `-(q/2)*log(2π)` from the multivariate normal density. The Laplace correction's `+(q/2)*log(2π)` partially cancels this, but omitting it causes the marginal likelihood to be shifted by `-q/2*log(2π)`.

**Test case:**
- Owls dataset: n=599, q=27 random effects (nests)
- Missing term: `27/2 * log(2π) ≈ 24.8`
- Observed discrepancy: ~25 units
- After fix: Log-likelihood matches glmmTMB to 0.01 precision

**Files modified:**
- `laplace/approximation.rs`: Updated `compute_laplace_correction()` function

---

## Implementation Order

1. **Issue 2** (Joint sigma) - Most impactful for Gaussian models
2. **Issue 3** (CS bounds) - Quick fix, enables compound symmetry for k > 2
3. **Issue 4** (Residual df) - May become moot after Issue 2
4. **Issue 8** (Laplace normalization) - Fixes log-likelihood reporting
5. **Issue 5** (REML) - Verification only
6. **Issue 7** (Jacobian) - Verification only
7. **Issue 6** (Analytical gradients) - Future optimization

---

## Module Structure Reference

The laplace module has been reorganized for better maintainability:

```
glmm/
├── laplace/
│   ├── mod.rs              # Re-exports
│   ├── types.rs            # LaplaceResult, LaplaceControl
│   ├── likelihood.rs       # compute_data_log_likelihood, joint_log_likelihood
│   ├── gradient.rs         # joint_gradient_b, joint_hessian_b
│   ├── linear_algebra.rs   # solve_linear_system, log_determinant, invert
│   ├── mode_finding.rs     # find_b_mode (Newton's method)
│   ├── beta_update.rs      # update_beta (IRLS)
│   ├── approximation.rs    # laplace_approximation, laplace_marginal_likelihood
│   └── reml.rs             # compute_reml_adjustment
├── fitting.rs              # glmm_fit, outer optimization
├── random_effects.rs       # Z matrix construction
├── random_effects_likelihood.rs  # Random effects prior
├── variance_components.rs  # Theta parameterization
├── types.rs                # GlmmResult, RandomEffect, etc.
└── mod.rs                  # Module exports
```
