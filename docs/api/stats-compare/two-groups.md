# Two Groups

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.compare.twoGroups.centralTendency.toEachOther](#scomparetwogroupscentraltendencytoeachother)
- [s.compare.twoGroups.proportions.toEachOther](#scomparetwogroupsproportionstoeachother)
- [s.compare.twoGroups.association.toEachOther](#scomparetwogroupsassociationtoeachother)
- [s.compare.twoGroups.distributions.toEachOther](#scomparetwogroupsdistributionstoeachother)

---

## s.compare.twoGroups.centralTendency.toEachOther

Compare the central tendencies (means/medians) of two independent groups. Automatically selects parametric (t-test) or non-parametric (Mann-Whitney U) test based on data distribution. Automatically detects equal/unequal variances using Brown-Forsythe test unless specified.

### Signature

```typescript
s.compare.twoGroups.centralTendency.toEachOther({ x, y, parametric?, assumeEqualVariances?, comparator?, alpha? }): TwoSampleTTestResult | MannWhitneyTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First group's values
- `y: number[]` - Second group's values
- `parametric?: 'parametric' | 'nonparametric' | 'auto'` - Test type selection (default: 'auto'). 'auto' uses Shapiro-Wilk on both groups to detect normality
- `assumeEqualVariances?: boolean` - Assume equal variances for t-test (optional: if not provided, uses Brown-Forsythe Levene test to auto-detect)
- `comparator?: 'not equal to' | 'less than' | 'greater than'` - Direction of the test, where 'greater than' means x > y (default: 'not equal to')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

TwoSampleTTestResult (if parametric) or MannWhitneyTestResult (if non-parametric) with `statistic`, `pValue`, `degreesOfFreedom` (t-test only), `confidenceInterval`, `reject`, and effect size measures

### Examples

```typescript
const group1 = [1.2, 1.4, 1.1, 1.3, 1.5, 1.2, 1.4, 1.3];
const group2 = [2.1, 2.3, 2.0, 2.2, 2.4, 2.1, 2.3, 2.2];
const result = s.compare.twoGroups.centralTendency.toEachOther({
  x: group1,
  y: group2,
  parametric: 'auto',
  comparator: 'not equal to',
  alpha: 0.05
});
console.log(result.pValue);  // p-value
console.log(result.reject);    // true if groups differ

// Force equal variances assumption
const equalVar = s.compare.twoGroups.centralTendency.toEachOther({
  x: group1,
  y: group2,
  assumeEqualVariances: true
});

// Use non-parametric test
const nonParam = s.compare.twoGroups.centralTendency.toEachOther({
  x: group1,
  y: group2,
  parametric: 'nonparametric'
});
```

### Best Practices

- Use 'auto' mode (default) to automatically select the appropriate test based on normality of both groups
- If both groups show non-normality (p < 0.05 on Shapiro-Wilk), auto mode uses Mann-Whitney
- Let the function auto-detect equal variances unless you have strong prior knowledge
- Mann-Whitney tests stochastic dominance, not just medians (only tests medians when distributions have same shape)
- For paired data, use `s.test.t.paired` instead

### Anti-patterns

- Using parametric test when both groups are clearly non-normal
- Forcing equal variances without checking (use auto-detection)
- Using this for paired/matched data (use paired t-test instead)

### Related

`s.test.t.independent`, `s.test.nonparametric.mannWhitney`, `s.compare.oneGroup.centralTendency.toValue`, `s.compare.multiGroups.centralTendency.toEachOther`

---

## s.compare.twoGroups.proportions.toEachOther

Compare proportions between two independent groups. Automatically selects z-test, chi-squared test, or Fisher's exact test based on sample size and expected frequencies. Tests whether the proportion of successes differs between two groups.

### Signature

```typescript
s.compare.twoGroups.proportions.toEachOther({ data1, data2, comparator?, useChiSquare?, alpha? }): TwoSampleProportionTestResult | ChiSquareIndependenceTestResult | FishersExactTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `data1: boolean[]` - First group's binary data (true/false or 0/1)
- `data2: boolean[]` - Second group's binary data (true/false or 0/1)
- `comparator?: 'not equal to' | 'less than' | 'greater than'` - Direction of the test (default: 'not equal to')
- `useChiSquare?: boolean | 'auto' | 'fisher'` - Test selection: false (z-test), true (chi-squared), 'auto' (default, auto-selects), or 'fisher' (Fisher's exact)
- `alpha?: number` - Significance level (default: 0.05)

### Returns

TwoSampleProportionTestResult, ChiSquareIndependenceTestResult, or FishersExactTestResult depending on test selected, with `statistic`, `pValue`, `reject`, and effect size measures

### Examples

```typescript
const data1 = [true, false, true, true, false];
const data2 = [true, true, true, false, true];
const result = s.compare.twoGroups.proportions.toEachOther({
  data1,
  data2,
  useChiSquare: 'auto',
  comparator: 'not equal to',
  alpha: 0.05
});
console.log(result.pValue);  // p-value

// Force Fisher's exact test (good for small samples)
const fisher = s.compare.twoGroups.proportions.toEachOther({
  data1,
  data2,
  useChiSquare: 'fisher'
});

// Use chi-squared test
const chiSquare = s.compare.twoGroups.proportions.toEachOther({
  data1,
  data2,
  useChiSquare: true
});
```

### Best Practices

- Use 'auto' mode (default) which applies Cochran's rule: uses Fisher's exact if min expected < 1 or >20% of cells < 5, otherwise chi-squared
- Use Fisher's exact for small samples or when expected frequencies are low
- Use z-test only when np ≥ 5 and n(1-p) ≥ 5 in both groups
- Chi-squared test requires expected frequency ≥ 5 in all cells

### Anti-patterns

- Using chi-squared test when expected frequencies are too low (< 5)
- Using z-test with small samples where np < 5
- Ignoring the auto-selection and forcing inappropriate tests

### Related

`s.test.proportion.twoSample`, `s.test.categorical.chiSquare`, `s.test.categorical.fishersExact`, `s.compare.oneGroup.proportions.toValue`, `s.compare.multiGroups.proportions.toEachOther`

---

## s.compare.twoGroups.association.toEachOther

Test association between two continuous variables. Measures correlation strength using Pearson (linear), Spearman (monotonic), or Kendall's tau. Automatically selects method based on data characteristics (normality, ties, sample size).

### Signature

```typescript
s.compare.twoGroups.association.toEachOther({ x, y, method?, comparator?, alpha? }): PearsonCorrelationTestResult | SpearmanCorrelationTestResult | KendallCorrelationTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[] | boolean[]` - First variable's values (numeric or boolean for point-biserial)
- `y: number[] | boolean[]` - Second variable's values (numeric or boolean for point-biserial)
- `method?: 'pearson' | 'spearman' | 'kendall' | 'auto'` - Correlation method (default: 'auto'). 'auto' selects based on normality, ties, and sample size
- `comparator?: 'not equal to' | 'less than' | 'greater than'` - Direction of the test (default: 'not equal to')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

PearsonCorrelationTestResult, SpearmanCorrelationTestResult, or KendallCorrelationTestResult with `correlation` (coefficient), `statistic`, `pValue`, `confidenceInterval`, `reject`

### Examples

```typescript
const x = [1, 2, 3, 4, 5, 6, 7, 8];
const y = [2, 4, 6, 8, 10, 12, 14, 16];
const result = s.compare.twoGroups.association.toEachOther({
  x,
  y,
  method: 'auto',
  comparator: 'not equal to'
});
console.log(result.correlation);  // correlation coefficient
console.log(result.pValue);       // p-value

// Force Pearson correlation (for linear relationships)
const pearson = s.compare.twoGroups.association.toEachOther({
  x,
  y,
  method: 'pearson'
});

// Point-biserial correlation (one boolean, one numeric)
const binary = [true, false, true, true, false];
const numeric = [10, 5, 12, 11, 6];
const pointBiserial = s.compare.twoGroups.association.toEachOther({
  x: binary,
  y: numeric
});
```

### Best Practices

- Use 'auto' mode (default) which selects: Kendall for small samples (< 25) or many ties, Spearman for non-normal data, Pearson for normal data
- Use Pearson for linear relationships when data is bivariate normal
- Use Spearman for monotonic relationships or when data is not normal
- Use Kendall for small samples or when there are many tied values
- Point-biserial correlation is automatically used when one variable is boolean

### Anti-patterns

- Using Pearson correlation on clearly non-normal data
- Using Pearson when relationship is not linear
- Ignoring the presence of ties (use Spearman or Kendall)

### Related

`s.test.correlation.pearson`, `s.test.correlation.spearman`, `s.test.correlation.kendall`, `s.compare.twoGroups.centralTendency.toEachOther`

---

## s.compare.twoGroups.distributions.toEachOther

Compare the distributions of two independent groups. Can test distribution equality (Kolmogorov-Smirnov) or stochastic dominance (Mann-Whitney U). Automatically selects method based on data characteristics.

### Signature

```typescript
s.compare.twoGroups.distributions.toEachOther({ x, y, method?, comparator?, alpha? }): KolmogorovSmirnovTestResult | MannWhitneyTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First group's values
- `y: number[]` - Second group's values
- `method?: 'auto' | 'ks' | 'mann-whitney'` - Test method (default: 'auto'). 'ks' tests if distributions are equal, 'mann-whitney' tests stochastic dominance
- `comparator?: 'not equal to' | 'less than' | 'greater than'` - Direction of the test (default: 'not equal to')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

KolmogorovSmirnovTestResult (if method='ks') or MannWhitneyTestResult (if method='mann-whitney') with `statistic`, `pValue`, `reject`

### Examples

```typescript
const group1 = [1.2, 1.4, 1.1, 1.3, 1.5];
const group2 = [2.1, 2.3, 2.0, 2.2, 2.4];
const result = s.compare.twoGroups.distributions.toEachOther({
  x: group1,
  y: group2,
  method: 'auto'
});
console.log(result.pValue);  // p-value

// Kolmogorov-Smirnov test (tests if distributions are equal)
const ks = s.compare.twoGroups.distributions.toEachOther({
  x: group1,
  y: group2,
  method: 'ks'
});

// Mann-Whitney test (tests stochastic dominance)
const mw = s.compare.twoGroups.distributions.toEachOther({
  x: group1,
  y: group2,
  method: 'mann-whitney'
});
```

### Best Practices

- Use 'ks' (Kolmogorov-Smirnov) to test if two samples come from the same distribution (any difference)
- Use 'mann-whitney' to test if one distribution tends to be larger than the other (stochastic dominance)
- Kolmogorov-Smirnov is sensitive to any difference in distributions (location, scale, shape)
- Mann-Whitney is more powerful for detecting location shifts
- Auto mode defaults to Kolmogorov-Smirnov

### Anti-patterns

- Using Kolmogorov-Smirnov when you only care about location differences (use Mann-Whitney or t-test)
- Confusing distribution equality with central tendency equality

### Related

`s.test.nonparametric.mannWhitney`, `s.compare.twoGroups.centralTendency.toEachOther`, `s.compare.oneGroup.distribution.toNormal`

---
