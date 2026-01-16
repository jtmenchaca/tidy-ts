# Anova

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.test.anova.oneWay](#stestanovaoneway)
- [s.test.anova.twoWay](#stestanovatwoway)

---

## s.test.anova.oneWay

One-way Analysis of Variance (ANOVA) to compare means across multiple groups.

### Signature

```typescript
s.test.anova.oneWay(groups: number[][], alpha?: number): OneWayAnovaTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `groups: number[][]` - Array of groups, where each group is an array of numbers
- `alpha?: number` - Significance level (default: 0.05)

### Returns

OneWayAnovaTestResult with `statistic`, `pValue`, `degreesOfFreedom`, `reject`

### Examples

```typescript
const group1 = [10, 12, 11, 13, 12];
const group2 = [15, 16, 14, 17, 15];
const group3 = [20, 21, 19, 22, 20];
const result = s.test.anova.oneWay([group1, group2, group3]);
console.log(result.pValue);  // p-value
if (result.reject) {
  // If significant, use post-hoc tests
  const postHoc = s.compare.postHoc.tukey([group1, group2, group3]);
}
```

### Best Practices

- Check normality of each group before using
- Check equal variances assumption (consider Welch ANOVA if violated)
- Requires at least 2 groups, each with at least 2 observations
- If significant, follow up with post-hoc tests (Tukey, Games-Howell, etc.)

### Anti-patterns

- Using ANOVA on non-normal data (consider Kruskal-Wallis test)
- Using ANOVA when variances are unequal (use Welch ANOVA or Kruskal-Wallis)
- Not performing post-hoc tests after significant result

### Related

`s.test.anova.twoWay`, `s.test.nonparametric.kruskalWallis`, `s.compare.postHoc.tukey`, `s.compare.postHoc.gamesHowell`

---

## s.test.anova.twoWay

Two-way Analysis of Variance (ANOVA) to test main effects and interaction in a factorial design.

### Signature

```typescript
s.test.anova.twoWay({ data, alpha? }): TwoWayAnovaTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `data: number[][][]` - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
- `alpha?: number` - Significance level (default: 0.05)

### Returns

TwoWayAnovaTestResult with results for factor A, factor B, and A×B interaction

### Examples

```typescript
// Example: 2x3 factorial design
// Factor A: 2 levels (treatment, control)
// Factor B: 3 levels (low, medium, high)
const data = [
  [[10, 11, 12], [15, 16, 17], [20, 21, 22]],  // Treatment group
  [[8, 9, 10], [12, 13, 14], [18, 19, 20]]     // Control group
];
const result = s.test.anova.twoWay({ data });
console.log(result.factorA.pValue);  // Main effect of factor A
console.log(result.factorB.pValue);  // Main effect of factor B
console.log(result.interaction.pValue);  // Interaction effect
```

### Best Practices

- Use for factorial designs with two factors
- Check normality and equal variances assumptions
- Requires at least 2 levels for each factor
- Each cell must have at least 1 observation
- Interpret interaction before main effects if interaction is significant

### Anti-patterns

- Using two-way ANOVA on non-normal data
- Ignoring interaction effects when they are significant
- Using unbalanced designs without appropriate adjustments

### Related

`s.test.anova.oneWay`

---
