# Correlation Tests

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.test.correlation.pearson](#stestcorrelationpearson)
- [s.test.correlation.spearman](#stestcorrelationspearman)
- [s.test.correlation.kendall](#stestcorrelationkendall)

---

## s.test.correlation.pearson

Pearson correlation test to assess linear relationship between two continuous variables.

### Signature

```typescript
s.test.correlation.pearson({ x, y, alternative?, alpha? }): PearsonCorrelationTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First variable (must have same length as y)
- `y: number[]` - Second variable (must have same length as x)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

PearsonCorrelationTestResult with `correlation`, `statistic`, `pValue`, `reject`

### Examples

```typescript
const x = [1, 2, 3, 4, 5];
const y = [2, 4, 6, 8, 10];
const result = s.test.correlation.pearson({ x, y });
console.log(result.correlation);  // 1.0 (perfect positive correlation)
console.log(result.pValue);  // p-value for test of correlation = 0
```

### Best Practices

- Use for linear relationships between continuous variables
- Requires at least 3 observations
- Assumes bivariate normality
- Use Spearman or Kendall for non-linear or non-normal relationships

### Anti-patterns

- Using Pearson correlation on non-linear relationships
- Using Pearson correlation when data is not normally distributed
- Interpreting correlation as causation

### Related

`s.test.correlation.spearman`, `s.test.correlation.kendall`

---

## s.test.correlation.spearman

Spearman rank correlation test to assess monotonic relationship between two variables.

### Signature

```typescript
s.test.correlation.spearman({ x, y, alternative?, alpha? }): SpearmanCorrelationTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First variable (must have same length as y)
- `y: number[]` - Second variable (must have same length as x)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

SpearmanCorrelationTestResult with `correlation`, `statistic`, `pValue`, `reject`

### Examples

```typescript
const x = [1, 2, 3, 4, 5];
const y = [10, 20, 30, 40, 50];
const result = s.test.correlation.spearman({ x, y });
console.log(result.correlation);  // Spearman's rho
console.log(result.pValue);  // p-value
```

### Best Practices

- Use for monotonic (not necessarily linear) relationships
- Robust to outliers and non-normal distributions
- Requires at least 2 observations
- Based on ranks, so handles ordinal data well

### Anti-patterns

- Using Spearman when relationship is clearly linear and data is normal (Pearson is more powerful)
- Using Spearman with many ties (consider Kendall instead)

### Related

`s.test.correlation.pearson`, `s.test.correlation.kendall`

---

## s.test.correlation.kendall

Kendall's tau correlation test to assess ordinal association between two variables.

### Signature

```typescript
s.test.correlation.kendall({ x, y, alternative?, alpha?, exact? }): KendallCorrelationTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `x: number[]` - First variable (must have same length as y)
- `y: number[]` - Second variable (must have same length as x)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)
- `exact?: boolean` - Use exact p-value calculation (default: auto-determined based on sample size)

### Returns

KendallCorrelationTestResult with `correlation`, `statistic`, `pValue`, `reject`

### Examples

```typescript
const x = [1, 2, 3, 4, 5];
const y = [5, 4, 3, 2, 1];
const result = s.test.correlation.kendall({ x, y });
console.log(result.correlation);  // Kendall's tau (negative for inverse relationship)
console.log(result.pValue);  // p-value
```

### Best Practices

- Use for ordinal data or when there are many ties
- More robust than Spearman for small samples with ties
- Requires at least 2 observations
- Good for non-parametric correlation testing

### Anti-patterns

- Using Kendall when data has no ties and relationship is linear (Pearson or Spearman may be more appropriate)

### Related

`s.test.correlation.pearson`, `s.test.correlation.spearman`

---
