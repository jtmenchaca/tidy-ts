# Correlation Tests

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.test.correlation.pearson](#stestcorrelationpearson)
- [s.test.correlation.spearman](#stestcorrelationspearman)
- [s.test.correlation.kendall](#stestcorrelationkendall)

---

## s.test.correlation.pearson

Pearson correlation test to assess linear relationship between two continuous variables. Returns correlation coefficient with statistical significance test.

### Signature

```typescript
s.test.correlation.pearson({ x, y, alternative?, alpha? }): PearsonCorrelationTestResult
```

### Import

```typescript
import { s, createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First variable (must have same length as y)
- `y: number[]` - Second variable (must have same length as x)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

PearsonCorrelationTestResult with `correlation`, `testStatistic`, `pValue`, `rejectNull`

### Examples

```typescript
import { s } from "@tidy-ts/dataframe";
// Basic usage with arrays
const x = [1, 2, 3, 4, 5];
const y = [2, 4, 6, 8, 10];
const result = s.test.correlation.pearson({ x, y });
console.log(result.correlation);  // 1.0 (perfect positive)
console.log(result.pValue);       // p-value for H0: r = 0
console.log(result.rejectNull);       // true if significant
import { s, createDataFrame } from "@tidy-ts/dataframe";
// FROM DATAFRAME COLUMNS - Common pattern
const df = createDataFrame([
  { height: 170, weight: 70 },
  { height: 180, weight: 85 },
  { height: 165, weight: 60 },
  { height: 175, weight: 75 },
  { height: 185, weight: 90 },
]);

// Extract columns using df.extract()
const result = s.test.correlation.pearson({
  x: df.extract("height"),
  y: df.extract("weight"),
});

console.log(`Correlation: ${result.correlation.toFixed(3)}`);
console.log(`p-value: ${result.pValue.toFixed(4)}`);
console.log(`Significant: ${result.rejectNull}`);
// One-tailed test (testing if correlation > 0)
const result = s.test.correlation.pearson({
  x: df.extract("study_hours"),
  y: df.extract("test_score"),
  alternative: "greater",
  alpha: 0.01,
});
```

### Best Practices

- ✓ GOOD: Use df.extract('column') to get arrays from DataFrame
- ✓ GOOD: Use for linear relationships between continuous variables
- ✓ GOOD: Requires at least 3 observations
- ✓ GOOD: Check assumptions: bivariate normality, linearity
- ✓ GOOD: Use Spearman or Kendall for non-linear or non-normal data

### Anti-patterns

- ❌ BAD: Using Pearson correlation on non-linear relationships
- ❌ BAD: Using when data is not normally distributed
- ❌ BAD: Interpreting correlation as causation

### Related

`s.test.correlation.spearman`, `s.test.correlation.kendall`, `s.pearson`, `extract`

---

## s.test.correlation.spearman

Spearman rank correlation test to assess monotonic relationship between two variables. More robust than Pearson for non-normal data and outliers.

### Signature

```typescript
s.test.correlation.spearman({ x, y, alternative?, alpha? }): SpearmanCorrelationTestResult
```

### Import

```typescript
import { s, createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First variable (must have same length as y)
- `y: number[]` - Second variable (must have same length as x)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

SpearmanCorrelationTestResult with `correlation`, `testStatistic`, `pValue`, `rejectNull`

### Examples

```typescript
import { s } from "@tidy-ts/dataframe";
// Basic usage
const x = [1, 2, 3, 4, 5];
const y = [10, 20, 30, 40, 50];
const result = s.test.correlation.spearman({ x, y });
console.log(result.correlation);  // Spearman's rho
import { s, createDataFrame } from "@tidy-ts/dataframe";
// FROM DATAFRAME COLUMNS
const df = createDataFrame([
  { satisfaction: 4, loyalty: 8 },
  { satisfaction: 2, loyalty: 3 },
  { satisfaction: 5, loyalty: 9 },
  { satisfaction: 3, loyalty: 5 },
]);

const result = s.test.correlation.spearman({
  x: df.extract("satisfaction"),
  y: df.extract("loyalty"),
});
console.log(`Spearman rho: ${result.correlation.toFixed(3)}`);
```

### Best Practices

- ✓ GOOD: Use df.extract('column') to get arrays from DataFrame
- ✓ GOOD: Use for monotonic (not necessarily linear) relationships
- ✓ GOOD: Robust to outliers and non-normal distributions
- ✓ GOOD: Based on ranks, handles ordinal data well

### Anti-patterns

- ❌ BAD: Using when relationship is clearly linear and data is normal (Pearson is more powerful)
- ❌ BAD: Using with many ties (consider Kendall instead)

### Related

`s.test.correlation.pearson`, `s.test.correlation.kendall`, `s.spearman`, `extract`

---

## s.test.correlation.kendall

Kendall's tau correlation test to assess ordinal association between two variables. Best for small samples with ties.

### Signature

```typescript
s.test.correlation.kendall({ x, y, alternative?, alpha?, exact? }): KendallCorrelationTestResult
```

### Import

```typescript
import { s, createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First variable (must have same length as y)
- `y: number[]` - Second variable (must have same length as x)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)
- `exact?: boolean` - Use exact p-value calculation (default: auto-determined based on sample size)

### Returns

KendallCorrelationTestResult with `correlation`, `testStatistic`, `pValue`, `rejectNull`

### Examples

```typescript
import { s } from "@tidy-ts/dataframe";
// Basic usage
const x = [1, 2, 3, 4, 5];
const y = [5, 4, 3, 2, 1];
const result = s.test.correlation.kendall({ x, y });
console.log(result.correlation);  // Kendall's tau (negative)
import { s, createDataFrame } from "@tidy-ts/dataframe";
// FROM DATAFRAME COLUMNS
const df = createDataFrame([
  { rank_A: 1, rank_B: 2 },
  { rank_A: 2, rank_B: 1 },
  { rank_A: 3, rank_B: 3 },
  { rank_A: 4, rank_B: 5 },
]);

const result = s.test.correlation.kendall({
  x: df.extract("rank_A"),
  y: df.extract("rank_B"),
});
console.log(`Kendall tau: ${result.correlation.toFixed(3)}`);
```

### Best Practices

- ✓ GOOD: Use df.extract('column') to get arrays from DataFrame
- ✓ GOOD: Use for ordinal data or when there are many ties
- ✓ GOOD: More robust than Spearman for small samples with ties
- ✓ GOOD: Good for non-parametric correlation testing

### Anti-patterns

- ❌ BAD: Using when data has no ties and relationship is linear (Pearson or Spearman may be better)

### Related

`s.test.correlation.pearson`, `s.test.correlation.spearman`, `extract`

---
