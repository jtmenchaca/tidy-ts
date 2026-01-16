# Multi Groups

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.compare.multiGroups.centralTendency.toEachOther](#scomparemultigroupscentraltendencytoeachother)
- [s.compare.multiGroups.proportions.toEachOther](#scomparemultigroupsproportionstoeachother)

---

## s.compare.multiGroups.centralTendency.toEachOther

Compare central tendencies across three or more independent groups. Tests whether means (ANOVA) or medians (Kruskal-Wallis) differ significantly. Automatically runs post-hoc tests (Tukey HSD, Games-Howell, or Dunn's) when the main test is significant. Supports both one-way and two-way ANOVA designs.

### Signature

```typescript
s.compare.multiGroups.centralTendency.toEachOther({ groups, parametric?, assumeEqualVariances?, alpha? }): OneWayAnovaWithPostHocResult | WelchAnovaWithPostHocResult | KruskalWallisWithPostHocResult
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `groups: number[][]` - Array of arrays, each containing values for one group (for one-way ANOVA)
- `data?: number[][][]` - Three-dimensional array for two-way ANOVA (rows × columns × values)
- `design?: 'one-way' | 'two-way'` - ANOVA design type (default: 'one-way')
- `parametric?: 'parametric' | 'nonparametric' | 'auto'` - Test type selection (default: 'auto'). 'auto' uses normality tests to select appropriate test
- `assumeEqualVariances?: boolean` - Assume equal variances for ANOVA (optional: if not provided, uses Brown-Forsythe Levene test to auto-detect)
- `alpha?: number` - Significance level (default: 0.05)

### Returns

OneWayAnovaWithPostHocResult, WelchAnovaWithPostHocResult, KruskalWallisWithPostHocResult, or TwoWayAnovaTestResult (for two-way) with `statistic` (F or H), `p_value`, `degrees_of_freedom`, effect size, and `post_hoc` (if significant and 3+ groups)

### Examples

```typescript
// One-way ANOVA with automatic post-hoc
const group1 = [1.2, 1.4, 1.1, 1.3, 1.5];
const group2 = [2.1, 2.3, 2.0, 2.2, 2.4];
const group3 = [3.5, 3.7, 3.4, 3.6, 3.8];
const result = s.compare.multiGroups.centralTendency.toEachOther({
  groups: [group1, group2, group3],
  parametric: 'auto',
  alpha: 0.05
});
console.log(result.p_value);     // p-value from main test
console.log(result.post_hoc);    // Post-hoc comparisons (if significant)

// Two-way ANOVA
const twoWayData = [
  [[10, 11, 12], [15, 16, 17]],  // Factor A level 1
  [[20, 21, 22], [25, 26, 27]]   // Factor A level 2
];
const twoWay = s.compare.multiGroups.centralTendency.toEachOther({
  data: twoWayData,
  design: 'two-way',
  parametric: 'parametric'
});
// Returns results for factor A, factor B, and interaction

// Non-parametric (Kruskal-Wallis with Dunn's post-hoc)
const nonParam = s.compare.multiGroups.centralTendency.toEachOther({
  groups: [group1, group2, group3],
  parametric: 'nonparametric'
});
```

### Best Practices

- Use 'auto' mode (default) to automatically select ANOVA or Kruskal-Wallis based on normality
- Post-hoc tests are automatically run when main test is significant (p < alpha) and there are 3+ groups
- Post-hoc selection: Tukey HSD (equal variances), Games-Howell (unequal variances), Dunn's (Kruskal-Wallis)
- For large samples (n > 300 per group), parametric test is used regardless of normality
- Let the function auto-detect equal variances unless you have strong prior knowledge
- Two-way ANOVA always returns results for factor A, factor B, and their interaction

### Anti-patterns

- Using ANOVA when groups are clearly non-normal and sample sizes are small
- Ignoring post-hoc tests when main test is significant
- Using one-way ANOVA when you have a two-factor design (use two-way instead)
- Forcing equal variances without checking (use auto-detection)

### Related

`s.test.anova.oneWay`, `s.test.anova.twoWay`, `s.test.nonparametric.kruskalWallis`, `s.compare.postHoc.tukey`, `s.compare.postHoc.gamesHowell`, `s.compare.postHoc.dunn`, `s.compare.twoGroups.centralTendency.toEachOther`

---

## s.compare.multiGroups.proportions.toEachOther

Test independence of categorical variables across multiple groups using chi-squared test. Determines if there's a significant association between row and column variables in a contingency table.

### Signature

```typescript
s.compare.multiGroups.proportions.toEachOther({ contingencyTable, alpha? }): ChiSquareIndependenceTestResult
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `contingencyTable: number[][]` - 2D array of observed frequencies (rows × columns)
- `alpha?: number` - Significance level (default: 0.05)

### Returns

ChiSquareIndependenceTestResult with `statistic` (chi-squared), `p_value`, `degrees_of_freedom`, `reject`, and effect sizes (Cramér's V, phi)

### Examples

```typescript
// Test independence in a 2×3 contingency table
const table = [
  [10, 20, 15],  // Row 1: counts for categories A, B, C
  [15, 25, 20]   // Row 2: counts for categories A, B, C
];
const result = s.compare.multiGroups.proportions.toEachOther({
  contingencyTable: table,
  alpha: 0.05
});
console.log(result.p_value);  // p-value
console.log(result.reject);    // true if variables are dependent

// Larger contingency table
const largerTable = [
  [5, 10, 8, 12],
  [7, 15, 9, 11],
  [6, 12, 10, 14]
];
const larger = s.compare.multiGroups.proportions.toEachOther({
  contingencyTable: largerTable
});
```

### Best Practices

- Ensure expected frequency ≥ 5 in each cell for valid chi-squared approximation
- Use for testing independence between two categorical variables
- Categories should be mutually exclusive and exhaustive
- Observations must be independent
- If expected frequencies are too low, consider combining categories or using Fisher's exact test (for 2×2 tables)

### Anti-patterns

- Using chi-squared test when expected frequencies are too low (< 5 in many cells)
- Using with dependent observations (e.g., repeated measures)
- Interpreting significant result as causation (only indicates association)

### Related

`s.test.categorical.chiSquare`, `s.test.categorical.fishersExact`, `s.compare.twoGroups.proportions.toEachOther`, `s.compare.oneGroup.proportions.toValue`

---
