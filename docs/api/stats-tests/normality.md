# Normality

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.test.normality.shapiroWilk](#stestnormalityshapirowilk)
- [s.test.normality.andersonDarling](#stestnormalityandersondarling)
- [s.test.normality.dagostinoPearson](#stestnormalitydagostinopearson)
- [s.test.normality.kolmogorovSmirnovUniform](#stestnormalitykolmogorovsmirnovuniform)
- [s.test.normality.kolmogorovSmirnovTwoSample](#stestnormalitykolmogorovsmirnovtwosample)

---

## s.test.normality.shapiroWilk

Shapiro-Wilk test for assessing whether data follows a normal distribution.

### Signature

```typescript
s.test.normality.shapiroWilk({ data, alpha? }): ShapiroWilkTestResult
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: number[]` - Array of numeric values to test
- `alpha?: number` - Significance level (default: 0.05)

### Returns

ShapiroWilkTestResult with `testStatistic`, `pValue`, `rejectNull`

### Examples

```typescript
import { s } from "@tidy-ts/dataframe";
const data = [1.2, 2.3, 3.1, 4.5, 5.2, 6.1, 7.3, 8.2];
const result = s.test.normality.shapiroWilk({ data });
console.log(result.pValue);  // p-value
if (result.rejectNull) {
  console.log('Data is not normally distributed');
  // Consider non-parametric tests
} else {
  console.log('Data appears normally distributed');
  // Can use parametric tests
}
```

### Best Practices

- Use before applying parametric tests (t-test, ANOVA, etc.)
- Requires at least 3 observations
- Not reliable for n > 5000 (test will throw error)
- If p < alpha, reject normality assumption and consider non-parametric alternatives

### Anti-patterns

- Using Shapiro-Wilk on very large samples (n > 5000)
- Ignoring normality test results when choosing statistical tests
- Using Shapiro-Wilk as the only diagnostic (also check visualizations)

### Related

`s.test.normality.andersonDarling`, `s.test.normality.dagostinoPearson`, `s.test.normality.kolmogorovSmirnov`

---

## s.test.normality.andersonDarling

Anderson-Darling test for normality. More sensitive to deviations in the tails of the distribution compared to Shapiro-Wilk.

### Signature

```typescript
s.test.normality.andersonDarling({ data, alpha? }): AndersonDarlingTestResult
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: number[]` - Array of numeric values to test
- `alpha?: number` - Significance level (default: 0.05)

### Returns

AndersonDarlingTestResult with `testStatistic` (A²), `pValue`, `rejectNull`

### Examples

```typescript
import { s } from "@tidy-ts/dataframe";
const data = [1.2, 2.3, 3.1, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1];
const result = s.test.normality.andersonDarling({ data });
console.log(result.pValue);
if (result.rejectNull) {
  console.log('Data is not normally distributed (p < 0.05)');
}
```

### Best Practices

- Requires at least 7 observations
- More sensitive to tail deviations than Shapiro-Wilk
- Good for detecting departures from normality in the extremes

### Anti-patterns

- Using with fewer than 7 observations
- Relying solely on one normality test (use multiple tests)

### Related

`s.test.normality.shapiroWilk`, `s.test.normality.dagostinoPearson`

---

## s.test.normality.dagostinoPearson

D'Agostino-Pearson K² omnibus test for normality. Combines skewness and kurtosis into a single test statistic.

### Signature

```typescript
s.test.normality.dagostinoPearson({ data, alpha? }): DAgostinoPearsonTestResult
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: number[]` - Array of numeric values to test
- `alpha?: number` - Significance level (default: 0.05)

### Returns

DAgostinoPearsonTestResult with `testStatistic` (K²), `pValue`, `rejectNull`, `skewness`, `kurtosis`

### Examples

```typescript
import { s } from "@tidy-ts/dataframe";
const data = Array.from({length: 50}, () => Math.random() * 10);
const result = s.test.normality.dagostinoPearson({ data });
console.log(`Skewness: ${result.skewness.toFixed(3)}`);
console.log(`Kurtosis: ${result.kurtosis.toFixed(3)}`);
console.log(`K² statistic: ${result.testStatistic.value.toFixed(3)}`);
console.log(`p-value: ${result.pValue.toFixed(3)}`);
```

### Best Practices

- Requires at least 20 observations
- Effective for moderate to large sample sizes (20-300)
- Detects both skewness and kurtosis deviations
- Provides individual skewness and kurtosis values for diagnosis

### Anti-patterns

- Using with fewer than 20 observations
- Ignoring the skewness/kurtosis values when interpreting results

### Related

`s.test.normality.shapiroWilk`, `s.test.normality.andersonDarling`

---

## s.test.normality.kolmogorovSmirnovUniform

One-sample Kolmogorov-Smirnov test against a uniform distribution. Tests whether data comes from a uniform distribution on [min, max].

### Signature

```typescript
s.test.normality.kolmogorovSmirnovUniform({ x, min?, max?, alternative?, alpha? }): KolmogorovSmirnovTestResult
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - Sample data to test
- `min?: number` - Minimum of uniform distribution (default: 0)
- `max?: number` - Maximum of uniform distribution (default: 1)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

KolmogorovSmirnovTestResult with `testStatistic` (D), `pValue`, `rejectNull`, `criticalValue`

### Examples

```typescript
import { s } from "@tidy-ts/dataframe";
// Test if data follows uniform distribution on [0, 1]
const data = [0.1, 0.3, 0.5, 0.7, 0.9];
const result = s.test.normality.kolmogorovSmirnovUniform({ x: data });
console.log(result.pValue);

// Test against uniform on [10, 20]
const result2 = s.test.normality.kolmogorovSmirnovUniform({ x: [12, 15, 18], min: 10, max: 20 });
```

### Best Practices

- Requires at least 1 observation
- Good for checking if random number generators are working correctly
- min must be less than max

### Anti-patterns

- Using when testing for normality (use Shapiro-Wilk instead)

### Related

`s.test.normality.kolmogorovSmirnovTwoSample`, `s.test.normality.shapiroWilk`

---

## s.test.normality.kolmogorovSmirnovTwoSample

Two-sample Kolmogorov-Smirnov test. Tests whether two samples come from the same distribution by comparing their empirical CDFs.

### Signature

```typescript
s.test.normality.kolmogorovSmirnovTwoSample({ x, y, alternative?, alpha? }): KolmogorovSmirnovTestResult
```

### Import

```typescript
import { s } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First sample
- `y: number[]` - Second sample
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

KolmogorovSmirnovTestResult with `testStatistic` (D), `pValue`, `rejectNull`, `criticalValue`

### Examples

```typescript
import { s } from "@tidy-ts/dataframe";
const sample1 = [1.2, 2.3, 3.4, 4.5, 5.6];
const sample2 = [1.5, 2.5, 3.5, 4.5, 5.5];
const result = s.test.normality.kolmogorovSmirnovTwoSample({ x: sample1, y: sample2 });
console.log(result.pValue);
if (result.rejectNull) {
  console.log('Samples come from different distributions');
}
```

### Best Practices

- Non-parametric test - no distribution assumptions
- Sensitive to differences in location, scale, and shape
- Each sample must have at least 1 observation

### Anti-patterns

- Using when only testing for difference in means (use t-test or Mann-Whitney)

### Related

`s.test.normality.kolmogorovSmirnovUniform`, `s.test.nonparametric.mannWhitney`

---
