# GLM Algorithm Implementation Map

This document maps each step of the GLM algorithm to specific files and line numbers in the tidy-ts codebase.

## GLM Algorithm Overview

The GLM algorithm models outcomes that aren't normally distributed (e.g., binary or counts) using maximum likelihood estimation via Iteratively Reweighted Least Squares (IRLS).

## Algorithm Steps and Implementation Locations

### 1. Choose a link function and distribution

**Why**: Different data types require different probability distributions and link functions to properly model the relationship between predictors and outcomes. Binary data needs binomial distribution, counts need Poisson, etc.

**Location**: `src/dataframe/rust/stats/regression/family/`

**Files and Lines**:
- **Family Selection**: `family/mod.rs` lines 38-94
  - Defines the `GlmFamily` trait with methods for link, variance, and deviance functions
- **Link Functions**: `family/links/links_implementations.rs` lines 35-515
  - Implements specific link functions (logit, probit, log, identity, etc.)
- **Family Implementations**:
  - **Binomial**: `family/binomial.rs` lines 22-54 (constructors for different links)
  - **Gaussian**: `family/gaussian.rs` lines 24-46
  - **Poisson**: `family/poisson.rs` lines 24-48
  - **Gamma**: `family/gamma.rs` lines 24-48
  - **Inverse Gaussian**: `family/inverse_gaussian.rs` lines 26-55

**Key Code**:
```rust
// Example: Creating a binomial family with logit link
let family = BinomialFamily::logit();
```

### 2. Start with initial coefficient guesses

**Why**: IRLS is an iterative algorithm that needs starting values to begin. Good starting values improve convergence speed and stability, especially for non-linear link functions.

**Location**: `src/dataframe/rust/stats/regression/glm/glm_fit_core_initialization.rs`

**Files and Lines**:
- **Main Initialization**: `glm_fit_core_initialization.rs` lines 16-79
- **Starting Values Structure**: `glm_fit_core_initialization.rs` lines 8-13

**Key Code**:
```rust
// Lines 16-79: initialize_starting_values function
// Lines 28-36: Use provided mustart values
// Lines 37-69: Use provided start coefficients  
// Lines 70-78: Use family initialization
```

**Family-Specific Initialization**:
- **Binomial**: `family/binomial.rs` lines 99-122
- **Gaussian**: `family/gaussian.rs` lines 83-99
- **Poisson**: `family/poisson.rs` lines 91-120

### 3. For each row: Compute linear predictor η = β₀ + β₁*x₁ + ...

**Why**: The linear predictor is the "raw" prediction before applying the link function. It represents the linear combination of predictors that will be transformed to the appropriate scale for the chosen distribution.

**Location**: `src/dataframe/rust/stats/regression/glm/glm_fit_irls_core.rs`

**Files and Lines**:
- **Linear Predictor Calculation**: `glm_fit_irls_core.rs` lines 228-239
- **Initialization**: `glm_fit_core_initialization.rs` lines 45-63

**Key Code**:
```rust
// Lines 228-239: Update eta (linear predictor)
*eta = offset
    .iter()
    .enumerate()
    .map(|(i, &o)| {
        o + x[i]
            .iter()
            .zip(coef.iter())
            .map(|(x_ij, &c_j)| x_ij * c_j)
            .sum::<f64>()
    })
    .collect();
```

### 4. Transform linear predictor to get predicted outcome μ

**Why**: The link function transforms the linear predictor to the appropriate scale for the chosen distribution. For binomial data, we need probabilities (0-1), so we use logit to map from (-∞,∞) to (0,1).

**Location**: `src/dataframe/rust/stats/regression/family/links/`

**Files and Lines**:
- **Link Inverse Functions**: `family/links/links_implementations.rs` lines 46-51 (logit), 92-98 (probit), etc.
- **Family Link Methods**: `family/mod.rs` lines 64-66
- **IRLS Usage**: `glm_fit_irls_core.rs` lines 241-243

**Key Code**:
```rust
// Lines 241-243: Transform eta to mu using link inverse
*mu = linkinv(eta);

// Example logit inverse: 1 / (1 + exp(-eta))
// Lines 46-51 in links_implementations.rs
fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
    Ok(1.0 / (1.0 + (-eta).exp()))
}
```

### 5. Compute likelihood under assumed distribution and predicted μ

**Location**: `src/dataframe/rust/stats/regression/family/`

**Files and Lines**:
- **Deviance Functions**: `family/deviance.rs` lines 8-38 (trait definition)
- **Binomial Deviance**: `family/binomial.rs` lines 188-284
- **Poisson Deviance**: `family/deviance.rs` lines 96-156
- **Gaussian Deviance**: `family/deviance.rs` lines 44-90

**Key Code**:
```rust
// Lines 188-284 in binomial.rs: BinomialDeviance implementation
// Computes: 2 * weight * (y_log_y(y, mu) + y_log_y(1-y, 1-mu))
// where y_log_y(y, mu) = (y != 0) ? (y * log(y/mu)) : 0
```

### 6. Take log of probabilities → log-likelihood, sum across rows

**Location**: `src/dataframe/rust/stats/regression/glm/glm_fit_irls_core.rs`

**Files and Lines**:
- **Deviance Calculation**: `glm_fit_irls_core.rs` lines 256-261
- **Initial Deviance**: `glm_fit_core_initialization.rs` lines 82-90

**Key Code**:
```rust
// Lines 256-261: Calculate deviance (proportional to -2*log-likelihood)
let dev = deviance_fn.deviance(y, mu, weights).unwrap_or(0.0);
```

### 7. Adjust βs using IRLS (Iteratively Reweighted Least Squares)

**Location**: `src/dataframe/rust/stats/regression/glm/glm_fit_irls_core.rs`

**Files and Lines**:
- **Main IRLS Loop**: `glm_fit_irls_core.rs` lines 60-388
- **Working Weights**: `glm_fit_irls_core.rs` lines 138-147
- **Working Response**: `glm_fit_irls_core.rs` lines 125-136
- **QR Decomposition**: `glm_fit_irls_core.rs` lines 180-187

**Key Code**:
```rust
// Lines 60-388: Main IRLS iteration loop
for iter_count in 1..=control.maxit {
    // Calculate working weights (lines 138-147)
    let w: Vec<f64> = weights
        .iter()
        .zip(mu_eta_val.iter())
        .zip(varmu.iter())
        .enumerate()
        .filter(|(i, _)| good[*i])
        .map(|(_, ((&weight_i, &mu_eta_i), &var_i))| {
            (weight_i * mu_eta_i * mu_eta_i / var_i).sqrt()
        })
        .collect();
    
    // Solve weighted least squares (lines 180-187)
    let qr_result = cdqrls(&x_flat, &z_weighted, n_weighted, p_weighted, 1, Some(control.epsilon / 1000.0))?;
}
```

### 8. Compute gradients and curvatures (Newton-Raphson/Fisher scoring)

**Location**: `src/dataframe/rust/stats/regression/glm/glm_fit_irls_core.rs`

**Files and Lines**:
- **Working Response (Gradient)**: `glm_fit_irls_core.rs` lines 125-136
- **Working Weights (Curvature)**: `glm_fit_irls_core.rs` lines 138-147
- **QR Decomposition**: `glm_fit_irls_core.rs` lines 180-187

**Key Code**:
```rust
// Lines 125-136: Working response (gradient information)
let z: Vec<f64> = eta
    .iter()
    .zip(offset.iter())
    .zip(y.iter())
    .zip(mu.iter())
    .zip(mu_eta_val.iter())
    .enumerate()
    .filter(|(i, _)| good[*i])
    .map(|(_, ((((eta_i, offset_i), y_i), mu_i), mu_eta_i))| {
        (eta_i - offset_i) + (y_i - mu_i) / mu_eta_i
    })
    .collect();
```

### 9. Repeat until convergence

**Location**: `src/dataframe/rust/stats/regression/glm/glm_fit_irls_core.rs`

**Files and Lines**:
- **Convergence Check**: `glm_fit_irls_core.rs` lines 381-387
- **Step Halving**: `glm_fit_irls_core.rs` lines 325-379
- **Main Loop**: `glm_fit_irls_core.rs` lines 60-388

**Key Code**:
```rust
// Lines 381-387: Convergence check
if (dev - *devold).abs() / (0.1 + dev.abs()) < control.epsilon {
    *conv = true;
    break;
} else {
    *devold = dev;
}

// Lines 325-379: Step halving for boundary issues
if valideta(eta).is_err() || validmu(mu).is_err() {
    // Step halving implementation
}
```

## Main Entry Points

### Primary GLM Function
**Location**: `src/dataframe/rust/stats/regression/glm/glm_main_core.rs`
- **Main Function**: `glm_main_core.rs` lines 68-191
- **Formula Parsing**: `glm_main_core.rs` lines 110-138
- **Data Preparation**: `glm_main_core.rs` lines 114-138

### Core Fitting Algorithm
**Location**: `src/dataframe/rust/stats/regression/glm/glm_fit_core.rs`
- **Main Fit Function**: `glm_fit_core.rs` lines 49-271
- **IRLS Call**: `glm_fit_core.rs` lines 124-138
- **Result Assembly**: `glm_fit_core.rs` lines 224-270

## Supporting Infrastructure

### QR Decomposition
**Location**: `src/dataframe/rust/stats/regression/glm/qr_decomposition.rs`
- **QR Solver**: `qr_decomposition.rs` lines 34-356
- **Used in IRLS**: `glm_fit_irls_core.rs` lines 180-187

### Control Parameters
**Location**: `src/dataframe/rust/stats/regression/glm/glm_control.rs`
- **Control Structure**: `glm_control.rs` lines 10-17
- **Default Values**: `glm_control.rs` lines 19-28

### AIC Calculation
**Location**: `src/dataframe/rust/stats/regression/glm/glm_aic.rs`
- **Family-Specific AIC**: `glm_aic.rs` lines 99-309
- **Binomial AIC**: `glm_aic.rs` lines 136-179
- **Poisson AIC**: `glm_aic.rs` lines 180-217

## Summary

The GLM algorithm is implemented across multiple modules:

1. **Family/Link Selection**: `family/` module
2. **Initialization**: `glm_fit_core_initialization.rs`
3. **Main Algorithm**: `glm_fit_irls_core.rs` (IRLS loop)
4. **Linear Algebra**: `qr_decomposition.rs`
5. **Entry Points**: `glm_main_core.rs` and `glm_fit_core.rs`

The implementation follows R's glm.fit() closely, with proper handling of edge cases, convergence checking, and family-specific computations.
