# GLM Realistic Demo: R vs TypeScript/Rust Comparison

This document compares the output from R and our TypeScript/Rust implementation for the realistic demo tests.

## Demo 1: Logistic Regression

| Metric | R | TypeScript/Rust | Match? |
|--------|---|-----------------|--------|
| Coefficients | (Intercept), x1, x2 | (Intercept), x1, x2 | ✓ |
| Estimates | -91.797, 27.254, 9.253 | -91.804, 27.261, 9.251 | ~✓ (minor diff) |
| AIC | 6.00 | 6.00 | ✓ |

**Note**: Minor coefficient differences (< 0.01) likely due to convergence tolerance differences.

## Demo 2: Linear Regression

| Metric | R | TypeScript/Rust | Match? |
|--------|---|-----------------|--------|
| (Intercept) | 28.000 | 28.000 | ✓ |
| sqft | 0.130 | 0.130 | ✓ |
| beds | 9.000 | 9.000 | ✓ |

**Perfect match!**

## Demo 3: Predictions

| Metric | R | TypeScript/Rust | Match? |
|--------|---|-----------------|--------|
| Prediction 1 | 13.00 | 13.00 | ✓ |
| Prediction 2 | 15.00 | 15.00 | ✓ |

**Perfect match!**

## Demo 4: Confidence Intervals

| Metric | R | TypeScript/Rust | Match? |
|--------|---|-----------------|--------|
| Lower[0] | -591657.03 | -591664.01 | ~✓ (minor diff) |
| Lower[1] | -330219.85 | -330223.90 | ~✓ (minor diff) |
| Upper[0] | 591335.04 | 591342.02 | ~✓ (minor diff) |
| Upper[1] | 330403.74 | 330407.79 | ~✓ (minor diff) |

**Note**: Minor differences (< 0.002%) in confidence intervals for highly separated data.

## Demo 5: Residual Diagnostics

| Metric | R | TypeScript/Rust | Match? |
|--------|---|-----------------|--------|
| Residuals | [1.8e-15, 1.8e-15, 1.8e-15, 0, 0] | [-6e-8, -5e-8, -4e-8, -4e-8, 0] | ~✓ (both tiny) |
| Rstandard | [1.581, 1.195, 1.118, 0, 0] | [NaN, NaN, NaN, NaN, NaN] | ✗ |
| Rstudent | [3.162, 1.348, 1.195, 0, 0] | [-2.828, -0.945, -0.686, -0.701, 0] | ✗ |

**Issue**: Perfect linear fit causes numerical issues
- R maintains dispersion = 3.155e-30
- Our implementation rounds dispersion to exactly 0
- This causes rstandard = residual / sqrt(0 * (1-h)) = NaN

## Demo 6: Influence Measures

| Metric | R | TypeScript/Rust | Match? |
|--------|---|-----------------|--------|
| Hat values | [0.000, 1.000, 1.000, 0.000, 0.000] | [0.000, 1.000, 1.000, 0.000, 0.000] | ✓ |
| Cook's D | [0.000, 0.571, 0.787, 0.000, 0.000] | [0.000, 11574789.840, 15971327.846, 0.000, 0.000] | ✗ |
| DFFITS | [-0.000, NaN, NaN, 0.000, 0.000] | [-0.000, NaN, NaN, -0.000, -0.000] | ✓ |
| Covratio | [2.250, NaN, NaN, 2.250, 2.250] | [2.250, NaN, NaN, 2.250, 2.250] | ✓ |

**Issue**: Cook's distance calculation
- Formula: (pear.res/(1-h))^2 * h/(dispersion * p)
- With h=1 (perfect leverage), dispersion≈0 causes massive values in our implementation
- R handles this more gracefully with its non-zero dispersion

## Demo 7: Weighted Regression

| Metric | R | TypeScript/Rust | Match? |
|--------|---|-----------------|--------|
| (Intercept) | 9.471 | 9.471 | ✓ |
| x | 0.651 | 0.651 | ✓ |

**Perfect match!**

## Demo 8: Variance-Covariance Matrix

| Metric | R | TypeScript/Rust | Match? |
|--------|---|-----------------|--------|
| vcov[1,1] | 0.000000 | 0.000000 | ✓ |
| vcov[1,2] | -0.000000 | 0.000000 | ✓ |
| vcov[2,1] | -0.000000 | 0.000000 | ✓ |
| vcov[2,2] | 0.000000 | 0.000000 | ✓ |

**Perfect match!**

## Summary

### Working Correctly (6/8 tests):
1. ✓ Logistic Regression (minor differences)
2. ✓ Linear Regression
3. ✓ Predictions
4. ✓ Confidence Intervals (minor differences)
7. ✓ Weighted Regression
8. ✓ Variance-Covariance Matrix

### Known Issues (2/8 tests):
5. ✗ Residual Diagnostics - Perfect fit numerical precision issue
6. ✗ Influence Measures - Cook's D calculation with degenerate case

### Root Cause

The core issue is in **how deviance is calculated for perfect/near-perfect fits**:
- R: deviance = 9.466331e-30 → dispersion = 3.155e-30
- Rust: deviance = 0 → dispersion = 0

This affects:
- `rstandard()`: Division by sqrt(0) produces NaN instead of reasonable values
- Cook's distance: Division by 0 produces massive values instead of ~0.5

### Recommendations

1. **Investigate deviance calculation**: Why is our deviance exactly 0 when R's is 3.155e-30?
2. **Consider minimum dispersion**: Add a floor value (e.g., 1e-30) to prevent division by exactly 0
3. **Document behavior**: These are edge cases (perfect fits, hat=1) that rarely occur in practice
4. **Alternative**: Accept that degenerate cases produce NaN/Inf and document this behavior

### Implementation Status

**Newly Implemented Methods:**
- ✓ `predict()` - Working correctly
- ✓ `confint()` - Working correctly (minor differences in edge cases)
- ✓ Infinite-to-NaN conversion - Matches R's behavior for degenerate cases
