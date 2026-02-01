# One Group

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.compare.oneGroup.centralTendency.toValue](#scompareonegroupcentraltendencytovalue)
- [s.compare.oneGroup.proportions.toValue](#scompareonegroupproportionstovalue)
- [s.compare.oneGroup.distribution.toNormal](#scompareonegroupdistributiontonormal)

---

## s.compare.oneGroup.centralTendency.toValue

Test if a single group's central tendency (mean/median) differs from a hypothesized value. Automatically selects parametric (one-sample t-test) or non-parametric (Wilcoxon signed-rank) test based on data distribution.

### Signature

```typescript
s.compare.oneGroup.centralTendency.toValue({ data, hypothesizedValue, comparator?, alpha?, parametric? }): OneSampleTTestResult | WilcoxonSignedRankTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: number[]` - Sample values to test
- `hypothesizedValue: number` - The value to compare against (population mean/median)
- `comparator?: 'not equal to' | 'less than' | 'greater than'` - Direction of the test (default: 'not equal to')
- `alpha?: number` - Significance level (default: 0.05)
- `parametric?: 'parametric' | 'nonparametric' | 'auto'` - Test type selection (default: 'auto'). 'auto' uses Shapiro-Wilk to detect normality and selects appropriate test

### Returns

OneSampleTTestResult (if parametric) or WilcoxonSignedRankTestResult (if non-parametric) with `statistic`, `pValue`, `degreesOfFreedom` (t-test only), `confidenceInterval`, `reject`

### Examples

```typescript
const data = [23, 25, 24, 26, 22, 24, 25, 23, 27, 24];
const result = s.compare.oneGroup.centralTendency.toValue({
  data,
  hypothesizedValue: 24,
  comparator: 'not equal to',
  alpha: 0.05
});
console.log(result.pValue);  // p-value
console.log(result.reject);    // true if reject H0

// Force parametric test
const tTest = s.compare.oneGroup.centralTendency.toValue({
  data,
  hypothesizedValue: 24,
  parametric: 'parametric'
});

// Force non-parametric test
const wilcoxon = s.compare.oneGroup.centralTendency.toValue({
  data,
  hypothesizedValue: 24,
  parametric: 'nonparametric'
});
```

### Best Practices

- Use 'auto' mode (default) to automatically select the appropriate test based on normality
- For large samples (n > 300), parametric test is used regardless of normality
- Use 'parametric' when you know data is normally distributed
- Use 'nonparametric' for skewed data or when normality assumptions are violated
- Check normality with `s.test.normality.shapiroWilk` if you want to verify the auto-selection

### Anti-patterns

- Using parametric test on clearly non-normal data with small sample sizes
- Ignoring the auto-selection and forcing parametric tests without checking assumptions

### Related

`s.test.t.oneSample`, `s.test.nonparametric.wilcoxon`, `s.test.normality.shapiroWilk`, `s.compare.twoGroups.centralTendency.toEachOther`

---

## s.compare.oneGroup.proportions.toValue

Test if a sample proportion differs from a hypothesized population proportion. Uses one-sample proportion z-test to compare binary data (0/1 or boolean) against an expected proportion.

### Signature

```typescript
s.compare.oneGroup.proportions.toValue({ data, hypothesizedProportion, comparator, alpha? }): OneSampleProportionTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: boolean[]` - Binary data (true/false or 0/1 values)
- `hypothesizedProportion: number` - Hypothesized population proportion (0 to 1)
- `comparator: 'not equal to' | 'less than' | 'greater than'` - Direction of the test
- `alpha?: number` - Significance level (default: 0.05)

### Returns

OneSampleProportionTestResult with `statistic` (z-statistic), `pValue`, `confidenceInterval`, `reject`

### Examples

```typescript
const data = [true, false, true, true, false, true, false, true];
const result = s.compare.oneGroup.proportions.toValue({
  data,
  hypothesizedProportion: 0.5,
  comparator: 'not equal to',
  alpha: 0.05
});
console.log(result.pValue);  // p-value
console.log(result.reject);    // true if proportion differs from 0.5

// Test if proportion is greater than 0.3
const greater = s.compare.oneGroup.proportions.toValue({
  data: [true, true, false, true, true],
  hypothesizedProportion: 0.3,
  comparator: 'greater than'
});
```

### Best Practices

- Ensure sample size is large enough: np ≥ 5 and n(1-p) ≥ 5
- Use for binary outcomes (success/failure, yes/no, etc.)
- Data is automatically converted to boolean format

### Anti-patterns

- Using with non-binary data (will throw error)
- Using with very small samples where np < 5

### Related

`s.test.proportion.oneSample`, `s.compare.twoGroups.proportions.toEachOther`, `s.compare.multiGroups.proportions.toEachOther`

---

## s.compare.oneGroup.distribution.toNormal

Test if data follows a normal distribution using the Shapiro-Wilk test. Most reliable for small to medium sample sizes (n < 5000). Returns test results indicating whether the null hypothesis (data is normally distributed) should be rejected.

### Signature

```typescript
s.compare.oneGroup.distribution.toNormal({ data, alpha? }): ShapiroWilkTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: number[]` - Sample values to test for normality
- `alpha?: number` - Significance level (default: 0.05)

### Returns

ShapiroWilkTestResult with `statistic` (W statistic), `pValue`, `reject` (true if p < alpha, meaning data is non-normal)

### Examples

```typescript
const data = [1.2, 2.3, 1.8, 2.1, 1.9, 2.0, 1.7, 2.2];
const result = s.compare.oneGroup.distribution.toNormal({
  data,
  alpha: 0.05
});
console.log(result.pValue);  // p-value
console.log(result.reject);    // true if data is non-normal (p < 0.05)

// Check before using parametric tests
const normalCheck = s.compare.oneGroup.distribution.toNormal({ data });
if (normalCheck.reject) {
  // Use non-parametric test
  const test = s.compare.oneGroup.centralTendency.toValue({
    data,
    hypothesizedValue: 2.0,
    parametric: 'nonparametric'
  });
}
```

### Best Practices

- Use before selecting parametric vs non-parametric tests
- Most reliable for sample sizes between 3 and 5000
- Reject null (reject: true) means data is NOT normally distributed
- Use as part of assumption checking for t-tests and ANOVA

### Anti-patterns

- Using Shapiro-Wilk on very large samples (n > 5000) - test becomes overly sensitive
- Ignoring normality test results when choosing statistical tests

### Related

`s.test.normality.shapiroWilk`, `s.compare.oneGroup.centralTendency.toValue`, `s.compare.twoGroups.centralTendency.toEachOther`

---
