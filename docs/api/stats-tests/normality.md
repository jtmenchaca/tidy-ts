# Normality

> Auto-generated from tidy-ts MCP documentation

## s.test.normality.shapiroWilk

Shapiro-Wilk test for assessing whether data follows a normal distribution.

### Signature

```typescript
s.test.normality.shapiroWilk({ data, alpha? }): ShapiroWilkTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: number[]` - Array of numeric values to test
- `alpha?: number` - Significance level (default: 0.05)

### Returns

ShapiroWilkTestResult with `statistic`, `pValue`, `reject`

### Examples

```typescript
const data = [1.2, 2.3, 3.1, 4.5, 5.2, 6.1, 7.3, 8.2];
const result = s.test.normality.shapiroWilk({ data });
console.log(result.pValue);  // p-value
if (result.reject) {
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

`s.test.t.oneSample`, `s.test.anova.oneWay`, `s.test.nonparametric.mannWhitney`

---
