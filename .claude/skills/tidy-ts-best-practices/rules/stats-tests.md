---
name: stats-tests
description: Hypothesis tests under s.test.* — t-tests, z-tests, ANOVA, nonparametric (Mann-Whitney, Wilcoxon, Kruskal-Wallis), categorical (chi-square, Fisher), correlation (Pearson, Spearman, Kendall), proportion, normality (Shapiro-Wilk, Anderson-Darling, D'Agostino-Pearson, KS), Levene, post-hoc (Tukey, Games-Howell, Dunn). Every result has pValue and alpha.
metadata:
  tags: stats, hypothesis-testing, t-test, anova, chi-square, normality, correlation, post-hoc
---

# Hypothesis tests (`s.test.*`)

## Universal result shape

Every test returns an object with at least:

- `pValue: number`
- `alpha: number` (defaults to `0.05`)
- `testStatistic: { value: number; name: string }` — read the number as `result.testStatistic.value`.
- `effectSize: { value: number; name: string }` — read the magnitude as `result.effectSize.value` (e.g. Pearson r, Cohen's d, eta², phi).

**Significance check:** `result.pValue < (result.alpha ?? 0.05)`. The `?? 0.05` is defensive — `alpha` is always set on returned results, but the fallback documents the convention.

## Inputs

All test functions accept `readonly number[]` (and `readonly boolean[]` for proportion tests), so you can pass column arrays directly: `s.test.t.oneSample({ data: df.bodyMassG, mu: 4000 })`. Use `df.extract("col")` only when you specifically need a mutable copy. Pre-narrow nulls with `df.removeNull("col")` before passing.

## t-tests

```typescript
// One sample
s.test.t.oneSample({ data, mu: 2.0 });
// → { testStatistic, pValue, degreesOfFreedom, confidenceInterval, alpha }

// Two independent samples (default equalVar: true; pass false for Welch's t-test)
s.test.t.independent({ x: control, y: treatment });
s.test.t.independent({ x: control, y: treatment, equalVar: false });

// Paired
s.test.t.paired({ x: before, y: after });
```

All accept `alternative: 'two-sided' | 'less' | 'greater'` and `alpha?`.

## z-tests (population std known)

```typescript
s.test.z.oneSample({ data, popMean: 100, popStd: 5 });
s.test.z.twoSample({ data1, data2, popStd1: 0.5, popStd2: 0.6 });
```

## ANOVA

```typescript
// One-way (equal variances assumed)
s.test.anova.oneWay([group1, group2, group3]);
// → { testStatistic (F), pValue, dfBetween, dfWithin, alpha }

// Welch (unequal variances)
s.test.anova.welch([group1, group2, group3]);

// Two-way factorial: data[factorA][factorB] = observations
s.test.anova.twoWay({ data: [
  [[10, 11, 12], [15, 16, 17], [20, 21, 22]],   // factor A level 1
  [[8, 9, 10],  [12, 13, 14], [18, 19, 20]],    // factor A level 2
]});
// → { factorA, factorB, interaction } — each with its own pValue
//
// Uses Type I sequential SS (matches R `aov(y ~ A * B) |> summary()`).
// Order matters for unbalanced data: SS_A is computed first, then SS_B|A,
// then SS_AB|A,B. The outer array of `data` is factor A; the inner is B.

// Levene's test for equal variances
s.test.variance.levene([group1, group2, group3]);                    // median-centered (Brown-Forsythe, default)
s.test.variance.levene([group1, group2, group3], 0.05, "mean");      // mean-centered (classical Levene)
// `center` matches R's `car::leveneTest(..., center = median | mean)`.
// `"median"` is robust to non-normality and is the modern recommended default.
```

If ANOVA is significant, follow with post-hoc (see below).

## Nonparametric alternatives

```typescript
s.test.nonparametric.mannWhitney({ x: g1, y: g2 });        // → t.independent alternative
s.test.nonparametric.wilcoxon({ x: before, y: after });    // → t.paired alternative
s.test.nonparametric.kruskalWallis([g1, g2, g3]);          // → anova.oneWay alternative
```

`wilcoxon` (signed-rank) accepts `exact?: boolean` and `correct?: boolean` to control which p-value path runs:

- `exact` omitted: R's auto rule — exact when `n < 50` AND no ties in |differences| AND no zero differences, else asymptotic.
- `exact: true`: force the exact (signed-rank permutation) p-value.
- `exact: false`: force the asymptotic normal approximation; `correct` (default `true`) toggles the continuity correction. Matches `wilcox.test(..., exact = ..., correct = ...)`.

The result carries `method: "Exact" | "Asymptotic"` so you can confirm which path ran.

## Categorical

```typescript
// Chi-square independence (rows × cols contingency table)
s.test.categorical.chiSquare({
  contingencyTable: [
    [20, 10],   // group 1
    [15, 15],   // group 2
  ],
});
// → { testStatistic, pValue, degreesOfFreedom, phiCoefficient, residuals }

// Fisher's exact (2×2 only; for small samples)
s.test.categorical.fishersExact({
  contingencyTable: [[8, 2], [3, 7]],
});
// → { pValue, effectSize: { value: <odds ratio>, name: "Odds Ratio" },
//     confidenceInterval, midPValue }
// The odds ratio is on `result.effectSize.value`, NOT `result.testStatistic`
// (which is the universal-shape placeholder for Fisher).
```

Rule of thumb: chi-square needs expected frequency ≥ 5 in every cell. For 2×2 with small samples, prefer Fisher's exact.

### Building a contingency table from raw columns

Both `chiSquare` and `fishersExact` take a pre-built `number[][]`. To go from two categorical columns in a DataFrame to a contingency table, count combinations with `groupBy(...).summarize`, then reshape. `pivotWider` leaves cells with no observation as `undefined` (it has no fill option), so coerce to 0 before passing to chi-square:

```typescript
// Example: species × island association from a row-per-observation DataFrame.
const counts = df
  .groupBy("species", "island")
  .summarize({ n: (g) => g.nrows() })
  .pivotWider({ namesFrom: "island", valuesFrom: "n" });

const rowLabels = counts.species;              // ["Adelie", "Chinstrap", "Gentoo"]
const colLabels = counts.columns().filter((c) => c !== "species");
const contingencyTable = counts
  .drop("species")
  .toRows()
  .map((row) => colLabels.map((c) => (row[c] as number | undefined) ?? 0));

s.test.categorical.chiSquare({ contingencyTable });
```

## Correlation

Each returns `{ effectSize, testStatistic, pValue, alpha }` (plus `confidenceInterval` for Pearson). The coefficient is on `result.effectSize.value`.

```typescript
// Pre-narrow nulls so the row type is non-null, then pass columns directly.
const clean = df.removeNull("height", "weight");
const r = s.test.correlation.pearson({
  x: clean.height,
  y: clean.weight,
});
r.effectSize.value;            // Pearson r (number)
r.pValue;                       // p-value for H0: r = 0
r.pValue < (r.alpha ?? 0.05);   // significant?

s.test.correlation.spearman({ x, y });   // rank correlation (rho on .effectSize.value)
s.test.correlation.kendall({ x, y });    // tau — best with many ties or small n
```

**Throws** (does not return `null`) if length mismatch or fewer than 3 observations. Wrap in try/catch when input may be invalid.

## Proportion

```typescript
s.test.proportion.oneSample({ data: boolArr, hypothesizedProportion: 0.5 });
s.test.proportion.twoSample({ data1: boolArr1, data2: boolArr2 });
```

Both accept `alternative?: "two-sided" | "less" | "greater"` and `correct?: boolean` (default `true`, matches R's `prop.test()`). Pass `correct: false` for the uncorrected chi-square (matches R `prop.test(..., correct = FALSE)`).

The result's `testStatistic.name` is `"X-squared"` and `testStatistic.value` is the (Yates-corrected, by default) chi-square statistic with 1 d.f. Two-sample results carry `proportionDifference: p1 - p2` on the result (per-group proportions are not separately reported — compute from the boolean arrays directly if needed).

## Normality

```typescript
s.test.normality.shapiroWilk({ data });           // requires 3 ≤ n ≤ 5000
s.test.normality.andersonDarling({ data });       // requires n ≥ 7
s.test.normality.dagostinoPearson({ data });      // requires n ≥ 20 (returns skewness, kurtosis)
s.test.normality.kolmogorovSmirnovUniform({ x, min, max });           // test against uniform
s.test.normality.kolmogorovSmirnovNormal({ x, mean, sd });            // test against normal (matches R `ks.test(x, "pnorm", mean, sd)`)
s.test.normality.kolmogorovSmirnovTwoSample({ x, y });                // two-sample KS
```

For the most common pattern — checking whether a sample looks normal under its own mean/sd — pass them explicitly:

```typescript
const m = s.mean(clean.value)!;
const sd = s.stdev(clean.value)!;
s.test.normality.kolmogorovSmirnovNormal({ x: clean.value, mean: m, sd });
```

Rejecting H0 (`pValue < alpha`) means the data is **not** normal. Use as a precondition for parametric tests; for one-stop comparison APIs that auto-select, see [stats-compare.md](stats-compare.md).

## Post-hoc (after significant ANOVA / KW)

```typescript
// Use the ANOVA / KW result first
const anova = s.test.anova.oneWay([g1, g2, g3]);
if (anova.pValue < (anova.alpha ?? 0.05)) {
  // Equal variances → Tukey HSD
  s.compare.postHoc.tukey([g1, g2, g3]);
  // Unequal variances → Games-Howell
  s.compare.postHoc.gamesHowell([g1, g2, g3]);
}

// Non-parametric (after Kruskal-Wallis) → Dunn
const kw = s.test.nonparametric.kruskalWallis([g1, g2, g3]);
if (kw.pValue < (kw.alpha ?? 0.05)) {
  s.compare.postHoc.dunn([g1, g2, g3]);
}
```

Note: post-hoc tests live under `s.compare.postHoc.*`, not `s.test.*`.

### Post-hoc result shape

All three post-hoc tests (`tukey`, `gamesHowell`, `dunn`) return:

```typescript
{
  testName: string;
  pValue: number;                  // overall (not always meaningful per-pair)
  testStatistic: { value: number; name: string };
  alpha: number;
  nGroups: number;
  nTotal: number;
  correctionMethod: string;        // e.g. "Tukey HSD", "Bonferroni"
  comparisons: PairwiseComparison[];
  errorMessage: string | null;
  note: string | null;
}

interface PairwiseComparison {
  group1: string;                  // "Group_1", "Group_2", … (indexed by input position)
  group2: string;
  meanDifference: number;
  standardError: number;
  testStatistic: { value: number; name: string };
  pValue: number;                  // raw
  adjustedPValue: number;          // after multiple-comparison correction
  confidenceInterval: { lower: number; upper: number; confidenceLevel: number };
  significant: boolean;            // at the test's alpha
}
```

Iterate `result.comparisons` to get per-pair significance and effect direction.

## Decision guide

| Question                                       | Test                                                |
|------------------------------------------------|-----------------------------------------------------|
| Does sample mean equal μ? (σ known)            | `s.test.z.oneSample`                                |
| Does sample mean equal μ? (σ unknown)          | `s.test.t.oneSample` (or KS / Wilcoxon if not normal) |
| Two independent groups, normal                 | `s.test.t.independent` (`equalVar: false` for Welch)|
| Two independent groups, non-normal             | `s.test.nonparametric.mannWhitney`                  |
| Paired / before-after, normal                  | `s.test.t.paired`                                   |
| Paired / before-after, non-normal              | `s.test.nonparametric.wilcoxon`                     |
| 3+ groups, normal, equal variance              | `s.test.anova.oneWay` + Tukey HSD                   |
| 3+ groups, normal, unequal variance            | `s.test.anova.welch` + Games-Howell                 |
| 3+ groups, non-normal                          | `s.test.nonparametric.kruskalWallis` + Dunn         |
| Factorial design (two factors)                 | `s.test.anova.twoWay`                               |
| Association between categoricals (large n)     | `s.test.categorical.chiSquare`                      |
| 2×2 categorical, small n                       | `s.test.categorical.fishersExact`                   |
| Linear relationship between continuous vars    | `s.test.correlation.pearson`                        |
| Monotonic / non-normal / outliers              | `s.test.correlation.spearman`                       |
| Small n / many ties / ordinal                  | `s.test.correlation.kendall`                        |
| Is data normal?                                | `s.test.normality.shapiroWilk` (or AD / DP / KS)    |
| Are variances equal?                           | `s.test.variance.levene`                            |
| One/two proportions                            | `s.test.proportion.oneSample` / `.twoSample`        |

For an API that auto-picks among these based on normality and variance checks, use `s.compare.*` (see [stats-compare.md](stats-compare.md)).

## Anti-patterns

- ❌ t-test on clearly non-normal data with small n — switch to Mann-Whitney / Wilcoxon.
- ❌ Assuming equal variances without checking — pass `equalVar: false` or use Welch's, or run `s.test.variance.levene` first.
- ❌ Skipping post-hoc after a significant ANOVA — you don't yet know which pairs differ.
- ❌ Mismatching post-hoc to the main test — Tukey/Games-Howell after parametric ANOVA, Dunn after Kruskal-Wallis.
- ❌ Pearson on non-linear relationships — use Spearman.
- ❌ Shapiro-Wilk on n > 5000 (will throw); use D'Agostino-Pearson or Anderson-Darling.
- ❌ Treating correlation as causation.
