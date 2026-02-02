# glmmTMB GLMM Fitting Implementation - Comprehensive Analysis

Based on study of `/Users/jtmenchaca/Downloads/glmmTMB-master/glmmTMB/src/glmmTMB.cpp`

## 1. PARAMETER STRUCTURE

### Fixed Effects (`beta`)
- **Type**: `PARAMETER_VECTOR(beta)` at line 858
- **Role**: Fixed effects coefficients for the mean model
- **Integration**: `eta = Z * b + offset + X * beta` (lines 912-918)

### Random Effects (`b`)
- **Type**: `PARAMETER_VECTOR(b)` at line 861
- **Role**: Conditional modes (MAP estimates) of random effects
- **Distribution**: Integrated out via Laplace approximation by TMB
- **Joint NLL Contribution**: `jnll += allterms_nll(b, theta, terms, do_simulate)` (line 901)

### Dispersion Parameters (`betadisp`)
- **Type**: `PARAMETER_VECTOR(betadisp)` at line 860
- **Role**: Fixed effects for dispersion model
- **Computation**: `etadisp = Zdisp * bdisp + dispoffset + Xdisp * betadisp` (lines 926-932)
- **Final phi**: `phi(i) = exp(etadisp(i))` (line 939)

### Variance Components (`theta`)
- **Type**: `PARAMETER_VECTOR(theta)` at line 866
- **Role**: Covariance structure parameters for random effects
- **Usage**: Passed to `allterms_nll()` for likelihood computation (line 901)

## 2. DISPERSION/SIGMA HANDLING FOR GAUSSIAN

### Phi Computation
```cpp
// Line 939
vector<Type> phi = exp(etadisp);
```

- **Linear predictor for dispersion**:
  ```
  etadisp(i) = Zdisp(i,:) * bdisp + dispoffset(i) + Xdisp(i,:) * betadisp
  ```

- **Final dispersion parameter**: `phi(i) = exp(etadisp(i))` = standard deviation (not variance)

### Gaussian Likelihood
```cpp
// Line 965
case gaussian_family:
    tmp_loglik = dnorm(yobs(i), mu(i), phi(i), true);
```

**Mathematical form**:
```
log p(y_i | mu_i, phi_i) = dnorm(y_i, mu_i, phi_i, log=TRUE)
                          = -0.5 * log(2*pi) - log(phi_i) - 0.5*(y_i - mu_i)^2 / phi_i^2
```

where:
- `mu(i)` = mean from inverse link of eta
- `phi(i)` = standard deviation = exp(etadisp)

### Weights
- **Application** (line 1196):
  ```cpp
  tmp_loglik *= weights(i);
  ```
- Directly scales log-likelihood by observation weight

### Joint Optimization
- **phi is jointly optimized** along with beta, betadisp, theta
- Not profiled out - all parameters are in PARAMETER_VECTOR declarations
- TMB computes exact gradients via automatic differentiation

## 3. RANDOM EFFECTS LIKELIHOOD - `termwise_nll()` Function

### Diagonal Covariance Structure (`diag_covstruct`, lines 358-383)
```cpp
vector<Type> sd = exp(theta);
ans -= dnorm(vector<Type>(U.col(i)), Type(0), sd, true).sum();
```

**Mathematical form**:
```
theta_k = log(sd_k), so sd_k = exp(theta_k)
log p(b | theta) = sum_k [ -0.5 * log(2*pi*sd_k^2) - 0.5 * b_k^2 / sd_k^2 ]
```

### Unstructured Covariance (`us_covstruct`, lines 407-440)
```cpp
int n = term.blockSize;
vector<Type> logsd = theta.head(n);
vector<Type> corr_transf = theta.tail(theta.size() - n);
vector<Type> sd = exp(logsd);
density::UNSTRUCTURED_CORR_t<Type> nldens(corr_transf);
```

**Parameter composition**:
- First `n` parameters: `log(sd)` - log standard deviations
- Remaining parameters: transformed correlations (Cholesky factorization)

### Compound Symmetry (`cs_covstruct`, lines 441-473)
```cpp
Type a = Type(1) / (Type(n) - Type(1));
Type rho = invlogit(corr_transf) * (Type(1) + a) - a;
```

**Correlation constraint**:
```
a = 1 / (n-1)
rho = invlogit(corr_transf) * (1 + a) - a
```

This ensures `rho ∈ (-1/(n-1), 1)` for valid correlation matrix.

### AR(1) Covariance (`ar1_covstruct`, lines 507-592)
```cpp
Type phi = corr_transf / sqrt(1.0 + pow(corr_transf, 2));
```

**Correlation parameter transformation**:
```
phi = corr_transf / sqrt(1 + corr_transf^2)
```

This maps R → (-1, 1)

## 4. LAPLACE APPROXIMATION

TMB automatically:
1. **Integrates out `b`** using Laplace approximation:
   ```
   ∫ p(y | b, theta, beta) * p(b | theta) db ≈
       p(y | b*, theta, beta) * p(b* | theta) / |H|^{1/2}
   ```
   where:
   - `b*` = mode (argmax of conditional likelihood)
   - `H` = Hessian of negative joint log-likelihood w.r.t. b at mode

2. **Computes Hessian** via automatic differentiation

**Mathematical form**:
```
-log p(y | theta, beta) ≈ -[log p(y | b*, theta, beta)
                             + log p(b* | theta)
                             - 0.5 * log|H(b, theta, beta)|_{b=b*}]
```

## 5. KEY FORMULAS FOR GAUSSIAN GLMM

### Linear Predictor
```
eta_i = (Z*b)_i + offset_i + (X*beta)_i
etadisp_i = (Zdisp*bdisp)_i + dispoffset_i + (Xdisp*betadisp)_i
```

### Mean Model
```
mu_i = g^{-1}(eta_i)    [where g is link function]
```

### Dispersion Model
```
phi_i = exp(etadisp_i)    [always log link for dispersion]
```

### Observation Likelihood
```
log p(y_i | mu_i, phi_i) = -0.5*log(2*pi) - log(phi_i) - 0.5*(y_i - mu_i)^2 / phi_i^2
```

### Random Effects Likelihood (Diagonal Case)
```
log p(b | theta) = sum_k [ -0.5*log(2*pi*sigma_k^2) - 0.5*b_k^2/sigma_k^2 ]
where sigma_k = exp(theta_k)
```

### Marginal Likelihood (via Laplace)
```
log p(y | beta, theta) ≈ log p(y | b*, beta)
                        + log p(b* | theta)
                        - 0.5*log|H|

where:
  b* = argmax_b [log p(y|b,beta) + log p(b|theta)]
  H = -d²/db² [log p(y|b*,beta) + log p(b*|theta)]
```

## 6. CRITICAL INSIGHT: HESSIAN SCALING FOR GAUSSIAN

**For Gaussian family, the Hessian of -log p(y|b) w.r.t. b depends on sigma (phi):**

The second derivative of the observation likelihood w.r.t. η is:
```
d²/dη² [-log p(y|μ)] = d²/dη² [(y-μ)²/(2σ²) + log(σ)]
                     = 1/σ²  (for identity link)
```

So the IRLS weights for Gaussian are `W_ii = 1/σ²`, NOT 1.

This means:
- The Hessian H = Z'WZ + Σ^{-1} depends on sigma
- When sigma is jointly optimized, this creates coupling between sigma and variance components
- The weights scale as 1/σ², so larger sigma → smaller weights → larger random effect estimates

## 7. IMPLEMENTATION CHECKLIST

1. ✅ Dispersion as exp(betadisp) - phi = exp(log_sigma)
2. ✅ Gaussian likelihood uses sigma (phi) as SD in dnorm
3. ✅ Sigma jointly optimized (not profiled)
4. ⚠️ **CRITICAL**: IRLS weights for Gaussian must be 1/σ², not 1
5. ⚠️ **CRITICAL**: Hessian in Laplace approximation must use weights = 1/σ²
6. ✅ CS correlation: `rho = invlogit(x) * (1 + 1/(n-1)) - 1/(n-1)`
