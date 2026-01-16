# Proportion Tests

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.test.proportion.oneSample](#stestproportiononesample)
- [s.test.proportion.twoSample](#stestproportiontwosample)

---

## s.test.proportion.oneSample

One-sample proportion test to compare observed proportion to a hypothesized population proportion.

### Signature

```typescript
s.test.proportion.oneSample({ data, hypothesizedProportion, alternative?, alpha? }): OneSampleProportionTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: boolean[]` - Array of boolean values (true = success, false = failure)
- `hypothesizedProportion: number` - Hypothesized population proportion (between 0 and 1)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

OneSampleProportionTestResult with `statistic`, `pValue`, `confidenceInterval`, `reject`

### Examples

```typescript
const data = [true, false, true, true, false, true];
const result = s.test.proportion.oneSample({ data, hypothesizedProportion: 0.5 });
console.log(result.pValue);  // p-value
console.log(result.reject);  // true if reject H0
```

### Best Practices

- Use for testing if a proportion differs from a known value
- Data should be boolean array (true/false)
- Requires at least 1 observation
- Hypothesized proportion must be between 0 and 1

### Anti-patterns

- Using proportion test on continuous data
- Using proportion test when sample size is too small

### Related

`s.test.proportion.twoSample`, `s.test.categorical.chiSquare`

---

## s.test.proportion.twoSample

Two-sample proportion test to compare proportions between two independent groups.

### Signature

```typescript
s.test.proportion.twoSample({ data1, data2, pooled?, alternative?, alpha? }): TwoSampleProportionTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `data1: boolean[]` - First group of boolean values
- `data2: boolean[]` - Second group of boolean values
- `pooled?: boolean` - Use pooled variance estimate (default: true)
- `alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')
- `alpha?: number` - Significance level (default: 0.05)

### Returns

TwoSampleProportionTestResult with `statistic`, `pValue`, `confidenceInterval`, `reject`

### Examples

```typescript
const group1 = [true, false, true, true, false];
const group2 = [true, true, true, false, true];
const result = s.test.proportion.twoSample({ data1: group1, data2: group2 });
console.log(result.pValue);  // compare proportions
```

### Best Practices

- Use for comparing proportions between two independent groups
- Both groups should be boolean arrays
- Each group must have at least 1 observation
- Pooled variance (default) assumes equal population proportions under H0

### Anti-patterns

- Using proportion test on continuous data
- Using proportion test for dependent/paired samples

### Related

`s.test.proportion.oneSample`, `s.test.categorical.chiSquare`, `s.test.categorical.fishersExact`

---
