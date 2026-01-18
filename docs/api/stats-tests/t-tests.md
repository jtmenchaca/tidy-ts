# T Tests

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.test.t.oneSample](#stesttonesample)
- [s.test.t.independent](#stesttindependent)
- [s.test.t.paired](#stesttpaired)

---

## s.test.t.oneSample

One-sample t-test to compare a sample mean to a known value.

### Signature

```typescript
tTestOneSample({ data, mu?, alternative?, alpha? }): OneSampleTTestResult
```

### Import

```typescript
import { tTestOneSample } from "@tidy-ts/dataframe";
```

### Parameters

- `data: number[]` - Array of numeric values
- `mu?: number` - Hypothesized population mean (default: 0)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

OneSampleTTestResult with `test_statistic`, `p_value`, `degrees_of_freedom`, `confidence_interval`, `reject_null`

### Examples

```typescript
const data = [2.3, 2.5, 2.1, 2.4, 2.2];
const result = tTestOneSample({ data, mu: 2.0 });
console.log(result.p_value);  // p-value
console.log(result.reject_null);  // true if reject H0
```

### Best Practices

- Check normality with shapiroWilkTest before using
- Use `alternative: 'less'` or `'greater'` for one-tailed tests
- Requires at least 2 observations

### Anti-patterns

- Using t-test on non-normal data with small sample sizes
- Using t-test when population standard deviation is known (use z-test instead)

### Related

`s.test.t.independent`, `s.test.t.paired`, `s.test.z.oneSample`, `s.test.normality.shapiroWilk`

---

## s.test.t.independent

Independent two-sample t-test to compare means of two unrelated groups.

### Signature

```typescript
tTestIndependent({ x, y, equalVar?, alternative?, alpha? }): TwoSampleTTestResult
```

### Import

```typescript
import { tTestIndependent } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First group of values
- `y: number[]` - Second group of values
- `equalVar?: boolean` - Assume equal variances (default: true, uses pooled variance; false uses Welch's t-test)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

TwoSampleTTestResult with `test_statistic`, `p_value`, `degrees_of_freedom`, `confidence_interval`, `reject_null`

### Examples

```typescript
const control = [5.2, 4.8, 5.1, 4.9, 5.0];
const treatment = [6.1, 5.9, 6.3, 6.0, 6.2];
const result = tTestIndependent({ x: control, y: treatment });
console.log(result.p_value);  // compare means
// Use Welch's t-test for unequal variances
const result2 = tTestIndependent({ x: control, y: treatment, equalVar: false });
```

### Best Practices

- Use Welch's t-test (equalVar: false) unless you've verified equal variances with leveneTest
- Check normality of both groups before using
- Each group must have at least 2 observations

### Anti-patterns

- Assuming equal variances without testing
- Using t-test when data is not normally distributed (consider Mann-Whitney U test)

### Related

`s.test.t.oneSample`, `s.test.t.paired`, `s.test.nonparametric.mannWhitney`, `s.test.variance.levene`

---

## s.test.t.paired

Paired t-test to compare means of two related samples (before/after, matched pairs).

### Signature

```typescript
tTestPaired({ x, y, alternative?, alpha? }): PairedTTestResult
```

### Import

```typescript
import { tTestPaired } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First measurement (e.g., before treatment)
- `y: number[]` - Second measurement (e.g., after treatment)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

PairedTTestResult with `test_statistic`, `p_value`, `degrees_of_freedom`, `confidence_interval`, `reject_null`

### Examples

```typescript
const before = [120, 125, 118, 130, 122];
const after = [115, 118, 112, 125, 117];
const result = tTestPaired({ x: before, y: after });
console.log(result.reject_null);  // true if significant change
```

### Best Practices

- Use for repeated measures or matched subjects
- Arrays must be same length and correspond element-wise
- Requires at least 2 paired observations

### Anti-patterns

- Using paired t-test for independent samples (use independent t-test instead)
- Mismatched array lengths

### Related

`s.test.t.oneSample`, `s.test.t.independent`, `s.test.nonparametric.wilcoxon`

---
