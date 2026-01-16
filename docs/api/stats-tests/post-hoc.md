# Post Hoc

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [s.compare.postHoc.tukey](#scompareposthoctukey)
- [s.compare.postHoc.gamesHowell](#scompareposthocgameshowell)
- [s.compare.postHoc.dunn](#scompareposthocdunn)

---

## s.compare.postHoc.tukey

Tukey's Honestly Significant Difference (HSD) test for pairwise comparisons after significant one-way ANOVA.

### Signature

```typescript
s.compare.postHoc.tukey(groups: number[][], alpha?: number): TukeyHsdTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `groups: number[][]` - Array of groups, where each group is an array of numbers
- `alpha?: number` - Significance level (default: 0.05)

### Returns

TukeyHsdTestResult with pairwise comparisons, adjusted p-values, and confidence intervals

### Examples

```typescript
const group1 = [10, 12, 11, 13, 12];
const group2 = [15, 16, 14, 17, 15];
const group3 = [20, 21, 19, 22, 20];
// First perform ANOVA
const anovaResult = s.test.anova.oneWay([group1, group2, group3]);
if (anovaResult.reject) {
  // If ANOVA is significant, perform post-hoc
  const postHoc = s.compare.postHoc.tukey([group1, group2, group3]);
  console.log(postHoc.pairwiseComparisons);  // See which pairs differ
}
```

### Best Practices

- Use after significant one-way ANOVA
- Assumes equal variances across groups
- Automatically corrects for multiple comparisons using studentized range distribution
- Best for balanced sample sizes

### Anti-patterns

- Using Tukey HSD when variances are unequal (use Games-Howell instead)
- Using Tukey HSD without first performing ANOVA
- Using Tukey HSD for non-parametric data (use Dunn's test instead)

### Related

`s.test.anova.oneWay`, `s.compare.postHoc.gamesHowell`, `s.compare.postHoc.dunn`

---

## s.compare.postHoc.gamesHowell

Games-Howell test for pairwise comparisons after significant ANOVA when variances are unequal.

### Signature

```typescript
s.compare.postHoc.gamesHowell(groups: number[][], alpha?: number): GamesHowellTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `groups: number[][]` - Array of groups, where each group is an array of numbers
- `alpha?: number` - Significance level (default: 0.05)

### Returns

GamesHowellTestResult with pairwise comparisons, adjusted p-values, and confidence intervals

### Examples

```typescript
const group1 = [10, 12, 11, 13, 12];
const group2 = [15, 16, 14, 17, 15];
const group3 = [20, 21, 19, 22, 20];
// Use when variances are unequal
const postHoc = s.compare.postHoc.gamesHowell([group1, group2, group3]);
console.log(postHoc.pairwiseComparisons);  // See which pairs differ
```

### Best Practices

- Use after significant ANOVA when variances are unequal
- More robust than Tukey HSD for heterogeneous data
- Uses Welch's t-test for pairwise comparisons with adjusted degrees of freedom
- Automatically corrects for multiple comparisons
- Good for unequal sample sizes

### Anti-patterns

- Using Games-Howell when variances are equal (Tukey HSD is more powerful)
- Using Games-Howell without first performing ANOVA

### Related

`s.test.anova.oneWay`, `s.compare.postHoc.tukey`, `s.compare.postHoc.dunn`

---

## s.compare.postHoc.dunn

Dunn's test for pairwise comparisons after significant Kruskal-Wallis test (non-parametric post-hoc).

### Signature

```typescript
s.compare.postHoc.dunn(groups: number[][], alpha?: number): DunnTestResult
```

### Import

```typescript
import { stats as s } from "@tidy-ts/dataframe";
```

### Parameters

- `groups: number[][]` - Array of groups, where each group is an array of numbers
- `alpha?: number` - Significance level (default: 0.05)

### Returns

DunnTestResult with pairwise comparisons, adjusted p-values (Bonferroni correction)

### Examples

```typescript
const group1 = [10, 12, 11, 13, 12];
const group2 = [15, 16, 14, 17, 15];
const group3 = [20, 21, 19, 22, 20];
// First perform Kruskal-Wallis
const kwResult = s.test.nonparametric.kruskalWallis([group1, group2, group3]);
if (kwResult.reject) {
  // If Kruskal-Wallis is significant, perform post-hoc
  const postHoc = s.compare.postHoc.dunn([group1, group2, group3]);
  console.log(postHoc.pairwiseComparisons);  // See which pairs differ
}
```

### Best Practices

- Use after significant Kruskal-Wallis test
- Non-parametric alternative to parametric post-hoc tests
- Uses rank-based comparisons
- Corrects for multiple comparisons using Bonferroni adjustment

### Anti-patterns

- Using Dunn's test after parametric ANOVA (use Tukey or Games-Howell instead)
- Using Dunn's test without first performing Kruskal-Wallis

### Related

`s.test.nonparametric.kruskalWallis`, `s.compare.postHoc.tukey`, `s.compare.postHoc.gamesHowell`

---
