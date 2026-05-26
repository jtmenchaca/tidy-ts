---
name: stats-compare
description: s.compare.* — the auto-selecting comparison API. Picks parametric vs nonparametric based on normality, picks equal/unequal variance for ANOVA, runs post-hoc automatically. One group, two groups, multi-group, distributions, association.
metadata:
  tags: stats, compare, auto-select, parametric, nonparametric, post-hoc
---

# Group comparison API (`s.compare.*`)

A higher-level API that **auto-picks the right test** for you based on data characteristics (normality, variance, sample size, ties). Prefer these over `s.test.*` when you'd otherwise be writing branches like "if Shapiro is significant, switch to Mann-Whitney".

Every comparator accepts `comparator?: 'not equal to' | 'less than' | 'greater than'` (default `'not equal to'`) and `alpha?` (default `0.05`).

## One group

```typescript
// Mean / median vs a hypothesized value
// (auto-selects one-sample t-test or Wilcoxon signed-rank)
s.compare.oneGroup.centralTendency.toValue({
  data: [23, 25, 24, 26, 22, 24, 25, 23, 27, 24],
  hypothesizedValue: 24,
  comparator: "not equal to",
  // parametric: "auto" | "parametric" | "nonparametric"   (default "auto")
});

// Proportion vs hypothesized value (one-sample proportion z-test)
s.compare.oneGroup.proportions.toValue({
  data: [true, false, true, true, false],
  hypothesizedProportion: 0.5,
  comparator: "not equal to",
});

// Test normality (Shapiro-Wilk)
s.compare.oneGroup.distribution.toNormal({ data });
```

`parametric: "auto"` runs Shapiro-Wilk and picks t-test or Wilcoxon accordingly. For `n > 300`, parametric is used regardless.

## Two groups

```typescript
// Compare central tendencies of two independent groups
// Auto-picks: t-test vs Mann-Whitney based on normality of both groups;
// Auto-detects equal/unequal variances via Brown-Forsythe Levene (unless overridden).
s.compare.twoGroups.centralTendency.toEachOther({
  x: group1,
  y: group2,
  parametric: "auto",                  // "auto" | "parametric" | "nonparametric"
  // assumeEqualVariances?: boolean,   // omit to auto-detect
  comparator: "not equal to",          // 'greater than' means x > y
});

// Compare two proportions
// useChiSquare: "auto" applies Cochran's rule (Fisher if expected < 1 or > 20% cells < 5; else chi²);
// Other options: true (chi²), false (z-test), 'fisher'
s.compare.twoGroups.proportions.toEachOther({
  data1: boolArr1,
  data2: boolArr2,
  useChiSquare: "auto",
});

// Correlation / association — auto-picks Pearson / Spearman / Kendall
// (Kendall for small n or many ties; Spearman for non-normal; Pearson otherwise)
// Point-biserial is automatic when one variable is boolean.
s.compare.twoGroups.association.toEachOther({
  x: df.extract("height"),
  y: df.extract("weight"),
  method: "auto",                      // "auto" | "pearson" | "spearman" | "kendall"
});

// Distribution comparison
// method: "ks" tests distribution equality (any difference);
//         "mann-whitney" tests stochastic dominance (location);
//         "auto" defaults to KS.
s.compare.twoGroups.distributions.toEachOther({
  x: g1,
  y: g2,
  method: "auto",
});
```

For paired data, use `s.test.t.paired` directly (no auto-select needed).

## Multi-group (3+)

```typescript
// One-way: auto-picks ANOVA vs Kruskal-Wallis based on normality.
// Auto-detects equal/unequal variances (Levene) and post-hoc:
//   - Tukey HSD (parametric, equal var)
//   - Games-Howell (parametric, unequal var)
//   - Dunn (nonparametric)
// Post-hoc runs automatically when main test is significant and there are 3+ groups.
const result = s.compare.multiGroups.centralTendency.toEachOther({
  groups: [g1, g2, g3],
  parametric: "auto",
  // assumeEqualVariances?: boolean,
});
result.pValue;        // main test
result.postHoc;       // pairwise comparisons (if significant)

// Two-way factorial: returns results for factor A, factor B, and A×B interaction.
const tw = s.compare.multiGroups.centralTendency.toEachOther({
  data: [
    [[10, 11, 12], [15, 16, 17]],   // factor A level 1
    [[20, 21, 22], [25, 26, 27]],   // factor A level 2
  ],
  design: "two-way",
  parametric: "parametric",
});

// Multi-group proportions: chi-square on a contingency table.
s.compare.multiGroups.proportions.toEachOther({
  contingencyTable: [
    [10, 20, 15],
    [15, 25, 20],
  ],
});
```

## When to use `s.compare.*` vs `s.test.*`

- **Use `s.compare.*`** when you want the API to make the parametric/nonparametric choice for you, and you'd run post-hoc anyway when ANOVA is significant. This is the default for exploratory analysis.
- **Use `s.test.*`** when you have a specific test in mind (e.g. you must report Welch's t-test regardless of variance check), or when you need control over edge cases the auto-select doesn't expose.

## Anti-patterns

- ❌ Forcing `parametric: "parametric"` on clearly non-normal small samples.
- ❌ Forcing `assumeEqualVariances: true` without checking — let auto-detect run.
- ❌ Using `centralTendency.toEachOther` for paired data — use `s.test.t.paired` or `s.test.nonparametric.wilcoxon`.
- ❌ Ignoring `result.postHoc` when ANOVA is significant — that's where the actionable findings are.
- ❌ Using KS on continuous data when you only care about location — use Mann-Whitney or t-test.
