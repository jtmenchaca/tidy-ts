# Weighted GLM Edge Cases Documentation

This document provides comprehensive examples and analysis of edge cases in weighted GLM implementations, comparing R and TypeScript behaviors.

## Overview

We tested 15 edge cases to identify discrepancies between R's `glm()` function and our TypeScript implementation. Found **8 significant discrepancies** out of 15 test cases.

## Test Cases and Results

### ✅ **PASSING TESTS (7/15)**

#### Test 1: Very Small Weights
**Scenario**: Weights are extremely small (1e-10 to 1e-2)
```r
# R Code
x <- c(1, 2, 3, 4, 5)
y <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights <- c(1e-10, 1e-8, 1e-6, 1e-4, 1e-2)
model <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights)
# Result: Intercept=-0.7089085, Slope=2.2017834
```

```typescript
// TypeScript Code
const x = [1, 2, 3, 4, 5];
const y = [2.1, 4.2, 5.8, 8.1, 10.3];
const weights = [1e-10, 1e-8, 1e-6, 1e-4, 1e-2];
const result = glm({
  formula: "y ~ x",
  family: "gaussian",
  link: "identity",
  data: df,
  options: { weights },
});
// Result: Intercept=-0.7089084837225806, Slope=2.201783419800622
// ✅ MATCHES within floating-point precision
```

#### Test 3: Mixed Extreme Weights
**Scenario**: Alternating very large and very small weights
```r
# R Code
x3 <- c(1, 2, 3, 4, 5)
y3 <- c(1, 2, 3, 4, 5)  # Perfect linear relationship
weights3 <- c(1e10, 1e-10, 1e10, 1e-10, 1e10)
model3 <- glm(y3 ~ x3, family = gaussian(link = "identity"), weights = weights3)
# Result: Intercept=6.661338e-16, Slope=1.000000e+00
```

```typescript
// TypeScript Code
const x3 = [1, 2, 3, 4, 5];
const y3 = [1, 2, 3, 4, 5];
const weights3 = [1e10, 1e-10, 1e10, 1e-10, 1e10];
// Result: Intercept≈0, Slope≈1
// ✅ MATCHES - fits through high-weight points (1,1), (3,3), (5,5)
```

#### Test 5: Binomial with Extreme Weights
**Scenario**: Binomial GLM with very extreme weights
```r
# R Code
successes <- c(1, 9, 1, 9, 1)
trials <- c(10, 10, 10, 10, 10)
x5 <- c(1, 2, 3, 4, 5)
y5 <- successes / trials
weights5 <- c(1e-6, 1e6, 1e-6, 1e6, 1e-6)
model5 <- glm(y5 ~ x5, family = binomial(link = "logit"), weights = trials * weights5)
# Result: Intercept=2.197225e+00, Slope=-4.022568e-21
```

```typescript
// TypeScript Code
const successes = [1, 9, 1, 9, 1];
const trials = [10, 10, 10, 10, 10];
const weights5 = [1e-6, 1e6, 1e-6, 1e6, 1e-6];
// Result: High-weight observations dominate the fit
// ✅ MATCHES - both implementations handle extreme weights correctly
```

#### Test 6: Poisson with Zero Counts and Weights
**Scenario**: Poisson GLM with zero counts and zero weights
```r
# R Code
counts <- c(0, 1, 0, 2, 0)
x6 <- c(1, 2, 3, 4, 5)
weights6 <- c(1, 1, 0, 1, 1)
model6 <- glm(counts ~ x6, family = poisson(link = "log"), weights = weights6)
# Result: Intercept=-0.7152806, Slope=0.1349873
```

```typescript
// TypeScript Code
const counts = [0, 1, 0, 2, 0];
const weights6 = [1, 1, 0, 1, 1];
// Result: All fitted values are positive, zero weights handled correctly
// ✅ MATCHES - both handle zero counts and weights properly
```

#### Test 7: Perfect Separation in Binomial
**Scenario**: Complete separation in binomial data
```r
# R Code
successes7 <- c(0, 0, 0, 10, 10)
trials7 <- c(10, 10, 10, 10, 10)
x7 <- c(1, 2, 3, 4, 5)
y7 <- successes7 / trials7
model7 <- glm(y7 ~ x7, family = binomial(link = "logit"), weights = trials7)
# Result: Large coefficients, converged=FALSE, warning about fitted probabilities
```

```typescript
// TypeScript Code
const successes7 = [0, 0, 0, 10, 10];
const trials7 = [10, 10, 10, 10, 10];
// Result: Large slope coefficient, warning about fitted probabilities
// ✅ MATCHES - both handle perfect separation with warnings
```

#### Test 13: Gamma GLM with Weights
**Scenario**: Gamma family with weights
```r
# R Code
x13 <- c(1, 2, 3, 4, 5)
y13 <- c(1.1, 2.2, 3.3, 4.4, 5.5)
weights13 <- c(1, 2, 1, 2, 1)
model13 <- glm(y13 ~ x13, family = Gamma(link = "inverse"), weights = weights13)
# Result: Intercept=0.6811130, Slope=-0.1058632
```

```typescript
// TypeScript Code
const y13 = [1.1, 2.2, 3.3, 4.4, 5.5];
const weights13 = [1, 2, 1, 2, 1];
// Result: All fitted values positive, coefficients match R
// ✅ MATCHES - Gamma family works correctly with weights
```

#### Test 14: Inverse Gaussian with Weights
**Scenario**: Inverse Gaussian family with weights
```r
# R Code
x14 <- c(1, 2, 3, 4, 5)
y14 <- c(1.1, 2.2, 3.3, 4.4, 5.5)
weights14 <- c(1, 2, 1, 2, 1)
model14 <- glm(y14 ~ x14, family = inverse.gaussian(link = "inverse"), weights = weights14)
# Result: Intercept=0.7486631, Slope=-0.1247772
```

```typescript
// TypeScript Code
const y14 = [1.1, 2.2, 3.3, 4.4, 5.5];
const weights14 = [1, 2, 1, 2, 1];
// Result: All fitted values positive, coefficients match R
// ✅ MATCHES - Inverse Gaussian family works correctly with weights
```

---

### ❌ **FAILING TESTS (8/15)**

#### Test 2: Very Large Weights
**Scenario**: Weights are extremely large (1e2 to 1e10)
```r
# R Code
weights2 <- c(1e2, 1e4, 1e6, 1e8, 1e10)
model2 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights2)
# Result: Intercept=-0.7089085, Slope=2.2017834
```

```typescript
// TypeScript Code
const weights2 = [1e2, 1e4, 1e6, 1e8, 1e10];
// Result: Intercept=-0.7089084837225806, Slope=2.201783419800622
// ❌ TEST EXPECTATION WRONG: Expected slope≈0, but both R and TS give same result
// Issue: Test expectation was incorrect - large weights don't dominate as expected
```

#### Test 4: Single Non-Zero Weight
**Scenario**: Only one observation has non-zero weight
```r
# R Code
weights4 <- c(0, 0, 0, 0, 1)
model4 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights4)
# Result: Intercept=10.3, Slope=NA
```

```typescript
// TypeScript Code
const weights4 = [0, 0, 0, 0, 1];
// Result: Intercept=-10.3, Slope=0
// ❌ DISCREPANCY: Wrong sign in intercept, slope should be undefined
// Issue: TS gives negative intercept (-10.3) vs R's positive (10.3)
// Root Cause: Different handling of single observation case
```

#### Test 8: Identical X Values with Different Weights
**Scenario**: All x values are identical, weights vary
```r
# R Code
x8 <- c(1, 1, 1, 1, 1)
y8 <- c(2.1, 4.2, 5.8, 8.1, 10.3)
weights8 <- c(1, 2, 3, 4, 5)
model8 <- glm(y8 ~ x8, family = gaussian(link = "identity"), weights = weights8)
# Result: Intercept=7.453333, Slope=NA
```

```typescript
// TypeScript Code
const x8 = [1, 1, 1, 1, 1];
const y8 = [2.1, 4.2, 5.8, 8.1, 10.3];
const weights8 = [1, 2, 3, 4, 5];
// Result: Intercept=0, Slope=0
// ❌ DISCREPANCY: Should return weighted mean as intercept, slope undefined
// Issue: TS returns (0,0) vs R's (7.453333, NA)
// Root Cause: TS doesn't handle identical x values correctly
// Expected: Intercept should be weighted mean = (1*2.1 + 2*4.2 + 3*5.8 + 4*8.1 + 5*10.3) / (1+2+3+4+5) = 7.453333
```

#### Test 9: All Weights Zero
**Scenario**: All weights are zero
```r
# R Code
weights9 <- c(0, 0, 0, 0, 0)
tryCatch({
  model9 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights9)
}, error = function(e) {
  cat("Error:", e$message)
})
# Result: Error: "object 'fit' not found"
```

```typescript
// TypeScript Code
const weights9 = [0, 0, 0, 0, 0];
try {
  // glm call
} catch (e) {
  // Error handling
}
// Result: Error: "GLM fit failed: no observations informative at iteration 1"
// ❌ DIFFERENT ERROR MESSAGES: Both handle correctly but with different messages
// Issue: Different error messages for same condition
// Root Cause: Different error handling implementations
```

#### Test 10: Weights with NaN Values
**Scenario**: Some weights are NaN
```r
# R Code
weights10 <- c(1, 2, NaN, 4, 5)
model10 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights10)
# Result: Intercept=0.05846154, Slope=2.03692308 (NaN treated as 0)
```

```typescript
// TypeScript Code
const weights10 = [1, 2, NaN, 4, 5];
// Result: Error: "GLM fit failed: weights must be numeric"
// ❌ DIFFERENT HANDLING: R silently converts NaN to 0, TS throws error
// Issue: Different strategies for invalid input
// Root Cause: R uses silent conversion, TS uses strict validation
```

#### Test 11: Weights with Infinity Values
**Scenario**: Some weights are Infinity
```r
# R Code
weights11 <- c(1, 2, Inf, 4, 5)
tryCatch({
  model11 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights11)
}, error = function(e) {
  cat("Error:", e$message)
})
# Result: Error: "NA/NaN/Inf in 'x'"
```

```typescript
// TypeScript Code
const weights11 = [1, 2, Infinity, 4, 5];
// Result: Error: "GLM fit failed: weights must be numeric"
// ❌ DIFFERENT ERROR MESSAGES: Both handle correctly but with different messages
// Issue: Different error messages for same condition
// Root Cause: Different error handling implementations
```

#### Test 12: Single Observation
**Scenario**: Only one observation total
```r
# R Code
x12 <- c(1)
y12 <- c(2.1)
weights12 <- c(1)
model12 <- glm(y12 ~ x12, family = gaussian(link = "identity"), weights = weights12)
# Result: Intercept=2.1, Slope=NA
```

```typescript
// TypeScript Code
const x12 = [1];
const y12 = [2.1];
const weights12 = [1];
// Result: Intercept=-2.1, Slope=0
// ❌ DISCREPANCY: Wrong sign in intercept, slope should be undefined
// Issue: TS gives negative intercept (-2.1) vs R's positive (2.1)
// Root Cause: Different handling of single observation case
```

#### Test 15: Weights Length Mismatch
**Scenario**: Weights array has wrong length
```r
# R Code
weights15 <- c(1, 2, 3)  # Wrong length
tryCatch({
  model15 <- glm(y ~ x, family = gaussian(link = "identity"), weights = weights15)
}, error = function(e) {
  cat("Error:", e$message)
})
# Result: Error: "variable lengths differ (found for '(weights)')"
```

```typescript
// TypeScript Code
const weights15 = [1, 2, 3]; // Wrong length
// Result: Error: "GLM fit failed: weights length must match number of observations"
// ❌ DIFFERENT ERROR MESSAGES: Both handle correctly but with different messages
// Issue: Different error messages for same condition
// Root Cause: Different error handling implementations
```

---

## Summary of Issues

### 🔴 **Critical Issues (High Priority)**

1. **Single Observation Handling**
   - **Problem**: TS returns wrong sign for intercept
   - **R**: `Intercept=observed_value, Slope=NA`
   - **TS**: `Intercept=-observed_value, Slope=0`
   - **Impact**: Affects single observation cases

2. **Identical X Values Handling**
   - **Problem**: TS doesn't compute weighted mean correctly
   - **R**: `Intercept=weighted_mean, Slope=NA`
   - **TS**: `Intercept=0, Slope=0`
   - **Impact**: Affects cases with no variation in predictors

3. **Single Non-Zero Weight**
   - **Problem**: Same as single observation - wrong sign
   - **R**: `Intercept=observed_value, Slope=NA`
   - **TS**: `Intercept=-observed_value, Slope=0`
   - **Impact**: Affects cases with only one informative observation

### 🟡 **Medium Priority Issues**

4. **NaN Weight Handling**
   - **Problem**: Different strategies for invalid input
   - **R**: Silently converts NaN to 0
   - **TS**: Throws error
   - **Impact**: Different behavior for invalid inputs

### 🟢 **Low Priority Issues**

5. **Error Message Consistency**
   - **Problem**: Different error messages for same conditions
   - **Impact**: Low - functionality works, just different messaging

## Recommendations

### Immediate Fixes Needed

1. **Fix Single Observation Cases**
   - Ensure intercept sign matches observed value
   - Return undefined/NA for slope when it can't be determined

2. **Fix Identical X Values**
   - Compute weighted mean correctly: `Σ(w_i * y_i) / Σ(w_i)`
   - Return undefined/NA for slope when x has no variation

3. **Consider NaN Handling Strategy**
   - Decide whether to follow R's silent conversion or maintain strict validation
   - Document the chosen approach

### Future Improvements

1. **Standardize Error Messages**
   - Make error messages more consistent with R where possible
   - Maintain clear, descriptive error messages

2. **Add Proper NA/Undefined Handling**
   - Implement proper handling for coefficients that can't be determined
   - Consider returning undefined instead of 0 for slopes in degenerate cases

## Test Files

- **TypeScript Tests**: `tests/glm/weighted-glm-edge-cases.test.ts`
- **R Validation**: `tests/glm/weighted-glm-edge-cases.test.R`
- **Analysis**: `weighted-glm-discrepancy-analysis.md`

## Additional Testing: vcov() and confint() with Edge Cases

After reviewing the new GLM vcov/confint tests, we discovered that the edge case issues **also affect variance-covariance matrices and confidence intervals**. This is critical because incorrect coefficients lead to incorrect variance estimates and confidence intervals.

### vcov/confint Tests Results

#### ✅ **Tests that PASSED**
- Test 1: Normal weighted GLM with vcov/confint - **PERFECT MATCH**
- Test 5: Very small weights with vcov/confint - **PERFECT MATCH**
- Test 6: Binomial with weights and vcov/confint - **PERFECT MATCH**

#### ❌ **Edge Cases with Issues**

##### **Test 2: Single Non-Zero Weight**
```r
# R Results
Coefficients: Intercept=10.3, Slope=NA
Vcov: [[NaN, NA], [NA, NA]]
```

```typescript
// TypeScript Results
Coefficients: Intercept=-10.3, Slope=0
Vcov: [[1, 0], [0, 0]]
```

**Issue**: Wrong intercept sign AND wrong vcov matrix (should be NaN/NA, not numeric)

##### **Test 3: Identical X Values**
```r
# R Results
Coefficients: Intercept=7.453333, Slope=NA
Vcov: [[1.670289, NA], [NA, NA]]
```

```typescript
// TypeScript Results
Coefficients: Intercept=0, Slope=0
Vcov: [[12.446666, 0], [0, 0]]
```

**Issue**: Wrong intercept value AND wrong vcov matrix values

##### **Test 4: Single Observation**
```r
# R Results
Coefficients: Intercept=2.1, Slope=NA
Vcov: [[NaN, NA], [NA, NA]]
```

```typescript
// TypeScript Results
Coefficients: Intercept=-2.1, Slope=0
Vcov: [[1, 0], [0, 0]]
```

**Issue**: Wrong intercept sign AND wrong vcov matrix (should be NaN/NA)

### Critical Impact

The edge case issues have **cascading effects**:
1. ❌ Wrong coefficients → Wrong predictions
2. ❌ Wrong vcov matrix → Wrong standard errors
3. ❌ Wrong standard errors → Wrong confidence intervals
4. ❌ Wrong confidence intervals → Wrong statistical inference

This means that **any analysis using these edge cases will produce incorrect results** for:
- Hypothesis testing
- Confidence intervals
- Standard errors
- p-values
- Model diagnostics

## Verification Status

### ✅ **Confirmed Issues**
All edge case discrepancies documented in this file have been:
- ✅ Re-verified as of latest test run
- ✅ Confirmed to affect coefficient estimates
- ✅ Confirmed to affect vcov matrices
- ✅ Confirmed to affect confidence intervals
- ✅ Documented with full examples

### 📋 **Test Files Created**
1. `tests/glm/weighted-glm-edge-cases.test.ts` - TypeScript edge case tests
2. `tests/glm/weighted-glm-edge-cases.test.R` - R validation tests
3. `tests/glm/weighted-glm-vcov.test.ts` - TypeScript vcov/confint edge case tests
4. `tests/glm/weighted-glm-vcov.test.R` - R vcov/confint validation tests
5. `tests/glm/glm-vcov-confint.test.ts` - Standard vcov/confint tests (all passing)
6. `tests/glm/glm-vcov-confint.test.R` - Standard vcov/confint R validation

## Conclusion

The edge case analysis revealed that while the basic weighted GLM functionality works correctly, there are **critical behavioral differences in degenerate cases** (single observations, identical predictors) that need attention. 

### Priority Assessment

**🔴 CRITICAL (Must Fix)**:
1. Single observation handling (wrong sign, affects predictions)
2. Identical X values handling (wrong intercept, affects predictions)
3. Single non-zero weight handling (wrong sign, affects predictions)

**🟡 MEDIUM (Should Fix)**:
4. NaN weight handling (different strategy, affects robustness)
5. vcov matrix edge case handling (affects statistical inference)

**🟢 LOW (Nice to Have)**:
6. Error message consistency (different messages, minimal impact)

The TypeScript implementation is generally robust for **normal use cases** but has specific issues with **edge cases** that should be addressed for full compatibility with R's behavior and to prevent incorrect statistical inference in degenerate scenarios.
