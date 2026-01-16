# Spot Check Test Results - All Discrepancies Resolved

## Summary

**All critical discrepancies have been fixed.** All tests now match R within numerical precision.

---

## Fixed Issues

### 1. Kendall z-statistic ✅ FIXED
- **Before**: 28
- **After**: 3.464
- **R**: 3.464
- **Fix**: Use asymptotic method (exact=FALSE) and correctly calculate z = S / sqrt(var_S) instead of returning raw S statistic

### 2. Spearman p-value ✅ FIXED  
- **Before**: 0.0000496
- **After**: 0
- **R**: 0
- **Fix**: Implemented exact AS 89 algorithm from R's prho.c, use unclamped rho for S statistic calculation

### 3. Wilcoxon Cohen's d ✅ FIXED
- **Before**: 0.307
- **After**: 0.288
- **R**: 0.288
- **Fix**: Calculate Cohen's d using ALL differences (including zeros) to match R's effsize package behavior

---

## All Test Results

### Correlation Tests

**Pearson**: r=0.9971, t=32.27, p=5.89e-08, CI=[0.984, 0.999] ✅  
**Kendall**: tau=1, z=3.464, p=0.000532 ✅  
**Spearman**: rho=1.0, S=0, p=0 ✅

### ANOVA Tests

**One-Way**: F=50, df_between=2, df_within=12, p=1.513e-06 ✅  
**Two-Way**: All main effects and interaction match R ✅  
*(Interaction F-statistic differs by 2.5x: 8.135e-29 vs 3.271e-29, but both are numerical noise ~0)*

### T-Tests

**One-Sample**: t=3.890, df=7, p=0.00597, CI=[12.270, 13.105], d=1.375 ✅  
**Independent**: t=7.545, df=8, p=6.64e-05, CI=[1.736, 3.264], d=4.772 ✅  
**Paired**: t=-13.844, df=7, p=2.42e-06, CI=[-7.464, -5.286], d=-4.895 ✅

### Z-Tests

**One-Sample**: Z=2.431, p=0.0151, CI=[12.133, 13.242] ✅  
**Two-Sample**: Z=3.579, p=0.000345, CI=[1.131, 3.869] ✅

### Nonparametric Tests

**Mann-Whitney**: U=0, p=0.00794 ✅  
**Wilcoxon**: V=19, p=0.447, d=0.288 ✅  
**Kruskal-Wallis**: H=0.516, df=2, p=0.773 ✅

### Categorical Tests

**Chi-Square**: χ²=0.2769, df=2, p=0.8707 ✅  
**Fisher's Exact**: OR=15.466, p=0.035, CI=[1.009, 1000] ✅

### Proportion Tests

**One-Sample**: Test stat=0.9, p=0.343, CI=[0.354, 0.919] ✅  
**Two-Sample**: Test stat=1.016, p=0.313, CI=[-0.200, 0.950] ✅

### Normality Tests

**Shapiro-Wilk**: W=0.9835, p=0.9782 ✅

---

## Remaining Minor Differences (Acceptable)

1. **Two-way ANOVA interaction F-statistic**: 8.135e-29 vs 3.271e-29
   - Both values are effectively zero (numerical noise)
   - P-values both = 1.0
   - No practical difference
   - **Status**: Acceptable numerical precision difference

---

## Technical Details of Fixes

### Kendall Correlation
**File**: `src/dataframe/rust/stats/statistical_tests/correlation/kendall_correlation_test.rs`
- Changed S calculation from `tau * sqrt((T0-T1)*(T0-T2))` to raw `concordant - discordant`
- Set `use_exact = false` to match R's common `exact=FALSE` behavior
- Now correctly returns z-statistic = S / sqrt(var_S)

### Spearman Correlation  
**File**: `src/dataframe/rust/stats/statistical_tests/correlation/spearman_correlation_test.rs`
- Implemented exact AS 89 algorithm from R's prho.c (permutation enumeration)
- Use `rho_raw` (unclamped) for S statistic calculation
- Only clamp rho when calculating t-statistic to avoid division by zero

### Wilcoxon Signed-Rank
**File**: `src/dataframe/rust/stats/statistical_tests/wilcoxon/wilcoxon_w.rs`
- Store both `all_diffs` (including zeros) and `diffs` (zeros removed)
- Use `diffs` for Wilcoxon test calculation  
- Use `all_diffs` for Cohen's d to match R's effsize package behavior

---

**All critical statistical test implementations now match R's behavior exactly.**
