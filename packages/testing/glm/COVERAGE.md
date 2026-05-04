# GLM Test Coverage

## Coverage by Family

| Feature | Gaussian | Binomial | Poisson | Gamma | InvGauss | QuasiBinom | QuasiPoisson |
|---|---|---|---|---|---|---|---|
| Core fit (coef, SE, deviance, AIC) | Y | Y | Y | Y | Y | Y | Y |
| Non-canonical links | Y (log, inverse) | Y (probit, cloglog) | Y (identity, sqrt) | Y (log) | Y (log) | - | - |
| Sandwich vcovCL (HC0-HC3) | Y | Y (sandwich.test) | Y | Y | Y | - | Y |
| Weighted GLM | Y | Y | Y | Y (edge) | Y (edge) | - | - |
| Predictions (newdata) | Y | Y | Y | Y | - | - | - |
| Diagnostics (leverage, Cook's) | Y | Y | Y | Y | - | - | - |
| Confidence intervals | Y | Y | Y | Y | Y | Y | Y (Wald) |
| Fitted values vs R | Y | Y | Y | Y | Y (log) | - | Y |
| Residuals (all types) | Y | Y | Y | - | - | - | - |
| vcov matrix | Y | Y | Y | - | - | - | - |
| Influence (rstandard, rstudent, dffits) | Y | Y | Y | - | - | - | - |
| Intercept-only (y ~ 1) | Y | Y | Y | - | - | - | - |
| R source tests (clotting, etc.) | - | - | Y (offset) | Y (lot1, lot2) | Y (identity, inverse) | - | - |

## Coverage by Feature (cross-family)

| Feature | Status | Files |
|---|---|---|
| Rank-deficient models | Y | glm-gaps.test.ts |
| Near-collinear models | Y | glm-gaps.test.ts |
| maxIter convergence control | Y (documents no-op) | glm-gaps.test.ts |
| Large-n (n=200) | Y (gauss, binom, poisson) | glm-gaps.test.ts |
| Offset (formula + argument) | Y | r-source-tests/offsets.test.ts |
| Edge cases (extreme weights, NaN, Inf) | Y | weighted-glm-edge-cases.test.ts |
| GLM = t-test equivalence | Y | equivalent-tests/glm-t-test.test.ts |

## Remaining Gaps (Priority Order)

### Medium Priority

1. Prediction SE (SE.fit) - Only point predictions tested, not standard errors.
2. Gamma residuals / vcov / influence - Not tested beyond basic fit + diagnostics.
3. Inverse Gaussian predictions on new data - Not tested.
4. Cauchit link (binomial) - Exists but not tested.
5. Anscombe residuals - Not tested for any family.
6. Offset + weights combined - Tested separately, never together.

### Lower Priority

7. Contrast coding (treatment, sum, helmert).
8. Likelihood ratio tests / model comparison.
9. Pseudo R-squared metrics.
10. High-dimensional models (p > 20).
