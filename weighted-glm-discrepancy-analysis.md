# Weighted GLM Edge Cases - Discrepancy Analysis

## Summary
Found **8 significant discrepancies** between R and TypeScript implementations in edge cases.

## Detailed Discrepancies

### ✅ **Tests that PASSED (7/15)**
- Test 1: Very small weights - **MATCH**
- Test 3: Mixed extreme weights - **MATCH** 
- Test 5: Binomial with extreme weights - **MATCH**
- Test 6: Poisson with zero counts and weights - **MATCH**
- Test 7: Perfect separation in binomial - **MATCH** (both handle gracefully)
- Test 13: Gamma GLM with weights - **MATCH**
- Test 14: Inverse Gaussian with weights - **MATCH**

### ❌ **Tests that FAILED (8/15)**

#### **Test 2: Very large weights**
- **R**: Coefficients: Intercept: -0.7089085, Slope: 2.2017834
- **TS**: Coefficients: Intercept: -0.7089085, Slope: 2.2017834
- **Issue**: Both give identical results, but TS test expected slope ≈ 0
- **Root Cause**: Test expectation was wrong - R shows large weights don't dominate as expected

#### **Test 4: Single non-zero weight**
- **R**: Coefficients: Intercept: 10.3, Slope: NA (perfect fit)
- **TS**: Coefficients: Intercept: -10.3, Slope: 0
- **Issue**: Sign difference in intercept
- **Root Cause**: Different handling of single observation case

#### **Test 8: Identical x values with different weights**
- **R**: Coefficients: Intercept: 7.453333, Slope: NA
- **TS**: Coefficients: Intercept: 0, Slope: 0  
- **Issue**: TS doesn't handle identical x values correctly
- **Root Cause**: TS should return weighted mean as intercept, slope should be undefined/NA

#### **Test 9: All weights zero**
- **R**: Error: "object 'fit' not found"
- **TS**: Error: "GLM fit failed: no observations informative at iteration 1"
- **Issue**: Different error messages
- **Root Cause**: Both handle correctly but with different error messages

#### **Test 10: Weights with NaN values**
- **R**: Coefficients: Intercept: 0.05846154, Slope: 2.03692308 (treats NaN as 0)
- **TS**: Error: "GLM fit failed: weights must be numeric"
- **Issue**: R silently converts NaN to 0, TS throws error
- **Root Cause**: Different NaN handling strategies

#### **Test 11: Weights with Infinity values**
- **R**: Error: "NA/NaN/Inf in 'x'"
- **TS**: Error: "GLM fit failed: weights must be numeric"
- **Issue**: Different error messages
- **Root Cause**: Both handle correctly but with different error messages

#### **Test 12: Single observation**
- **R**: Coefficients: Intercept: 2.1, Slope: NA
- **TS**: Coefficients: Intercept: -2.1, Slope: 0
- **Issue**: Sign difference in intercept
- **Root Cause**: Different handling of single observation case

#### **Test 15: Weights length mismatch**
- **R**: Error: "variable lengths differ (found for '(weights)')"
- **TS**: Error: "GLM fit failed: weights length must match number of observations"
- **Issue**: Different error messages
- **Root Cause**: Both handle correctly but with different error messages

## Key Issues Identified

### 1. **Single Observation Handling**
- **R**: Returns slope as NA (undefined), intercept as observed value
- **TS**: Returns slope as 0, intercept with wrong sign
- **Impact**: High - affects single observation cases

### 2. **Identical X Values Handling**
- **R**: Returns slope as NA, intercept as weighted mean
- **TS**: Returns both as 0
- **Impact**: High - affects cases with no variation in predictors

### 3. **NaN Weight Handling**
- **R**: Silently converts NaN to 0
- **TS**: Throws error
- **Impact**: Medium - different behavior for invalid inputs

### 4. **Error Message Consistency**
- **R**: Uses R-specific error messages
- **TS**: Uses custom error messages
- **Impact**: Low - functionality works, just different messages

## Recommendations

### High Priority Fixes
1. **Fix single observation handling** - should return slope as undefined/NA
2. **Fix identical x values handling** - should return weighted mean as intercept, slope as undefined/NA
3. **Consider NaN handling strategy** - decide whether to follow R's silent conversion or maintain strict validation

### Medium Priority Fixes
1. **Standardize error messages** - consider making them more consistent with R
2. **Add proper NA/undefined handling** for coefficients when they can't be determined

### Low Priority Fixes
1. **Update test expectations** - some tests had incorrect expectations based on R's actual behavior
