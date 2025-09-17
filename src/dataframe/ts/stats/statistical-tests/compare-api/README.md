# Compare API Algorithm

## One Group

```
centralTendency.toValue(data, value, parametric):
  IF parametric = "auto":
    IF shapiroWilk(data, α=0.05).p_value < 0.05:
      RETURN wilcoxonSignedRank(data, value)
    ELSE:
      RETURN tTest(data, value)
  ELSE IF parametric = "parametric":
    RETURN tTest(data, value)
  ELSE:
    RETURN wilcoxonSignedRank(data, value)
```

## Two Groups

```
centralTendency.toEachOther(x, y, parametric, equalVar):
  IF parametric = "auto":
    nonNormalX = shapiroWilk(x, α=0.05).p_value < 0.05
    nonNormalY = shapiroWilk(y, α=0.05).p_value < 0.05
    IF nonNormalX AND nonNormalY:
      RETURN mannWhitney(x, y)
    ELSE:
      RETURN tTest(x, y, equalVar=false)  // Welch default
  ELSE IF parametric = "parametric":
    RETURN tTest(x, y, equalVar)
  ELSE:
    RETURN mannWhitney(x, y)

association.toEachOther(x, y, method):
  IF method = "auto":
    smallSample = min(length(x), length(y)) < 25
    IF hasManyTies(x, y) OR smallSample:
      RETURN kendall(x, y)
    ELSE IF shapiroNonNormal(x) OR shapiroNonNormal(y):
      RETURN spearman(x, y)
    ELSE:
      RETURN pearson(x, y)
```

## Multiple Groups

```
centralTendency.toEachOther(groups, parametric, assumeEqualVariances):
  // Auto-detect variance equality if not specified
  IF assumeEqualVariances undefined AND parametric != "nonparametric":
    assumeEqualVariances = leveneTest(groups, α=0.05).p_value >= 0.05

  IF parametric = "parametric":
    IF assumeEqualVariances:
      result = anovaOneWay(groups)
      postHoc = tukeyHSD(groups) IF significant AND length(groups) >= 3
    ELSE:
      result = welchAnova(groups)
      postHoc = gamesHowell(groups) IF significant AND length(groups) >= 3
    RETURN {result, postHoc}
  
  ELSE IF parametric = "nonparametric":
    result = kruskalWallis(groups)
    postHoc = dunnTest(groups) IF significant AND length(groups) >= 3
    RETURN {result, postHoc}
  
  ELSE IF parametric = "auto":
    anyNonNormal = groups.some(g => shapiroWilk(g, α=0.05).p_value < 0.05)
    IF anyNonNormal:
      result = kruskalWallis(groups)
      postHoc = dunnTest(groups) IF significant
    ELSE:
      result = assumeEqualVariances ? anovaOneWay(groups) : welchAnova(groups)
      postHoc = assumeEqualVariances ? tukeyHSD(groups) : gamesHowell(groups) IF significant
    RETURN {result, postHoc}
```

## Helpers

```
significant(result) = result.p_value < α
shapiroNonNormal(data) = shapiroWilk(data, α=0.05).p_value < 0.05
hasManyTies(x, y) = uniqueValues(x ∪ y) < length(x) + length(y)
```

## Missing Features

1. **One-group proportion tests** - `oneGroup.proportions.toValue()`
2. **One-group distribution tests** - `oneGroup.distribution.toNormal()` (Shapiro-Wilk wrapper)
3. **Distribution comparison tests** - `twoGroups.distributions.toEachOther()`
4. **Advanced proportion tests**:
   - Cochran-Armitage trend test
   - Fisher exact for RxC tables

## Usage Examples

| I want to... | Use | Test | Status |
|-------------|-----|------|--------|
| Compare group central tendency to value, my data is normal | `oneGroup.centralTendency.toValue(parametric="parametric")` | One-sample t-test | ✅ |
| Compare group central tendency to value, my data is not normal | `oneGroup.centralTendency.toValue(parametric="nonparametric")` | Wilcoxon signed-rank | ✅ |
| Compare group central tendency to value, auto-detect normality | `oneGroup.centralTendency.toValue(parametric="auto")` | Auto: t-test or Wilcoxon | ✅ |
| Compare proportion to expected rate | `oneGroup.proportions.toValue()` | Exact binomial | ❌ |
| Check if data is normally distributed | `oneGroup.distribution.toNormal()` | Shapiro-Wilk | ❌ |
| Compare two groups' central tendency, my data is normal | `twoGroups.centralTendency.toEachOther(parametric="parametric")` | t-test (Welch) | ✅ |
| Compare two groups' central tendency, my data is not normal | `twoGroups.centralTendency.toEachOther(parametric="nonparametric")` | Mann-Whitney U | ✅ |
| Compare two groups' central tendency, auto-detect normality | `twoGroups.centralTendency.toEachOther(parametric="auto")` | Auto: t-test or Mann-Whitney | ✅ |
| Compare proportions between two groups | `twoGroups.proportions.toEachOther()` | Fisher's exact/Chi-square/z-test | ✅ |
| Test linear relationship between two variables | `twoGroups.association.toEachOther(method="pearson")` | Pearson correlation | ✅ |
| Test monotonic relationship between two variables | `twoGroups.association.toEachOther(method="spearman")` | Spearman correlation | ✅ |
| Test monotonic relationship between two variables (robust) | `twoGroups.association.toEachOther(method="kendall")` | Kendall's tau | ✅ |
| Test relationship between two variables, auto-select method | `twoGroups.association.toEachOther(method="auto")` | Auto: Pearson/Spearman/Kendall | ✅ |
| Test if two distributions are identical (any difference) | `twoGroups.distributions.toEachOther(method="ks")` | Kolmogorov-Smirnov | ❌ |
| Test if one distribution tends to be larger than another | `twoGroups.distributions.toEachOther(method="mw")` | Mann-Whitney (stochastic dominance) | ❌ |
| Compare two distributions, auto-select test | `twoGroups.distributions.toEachOther(method="auto")` | Auto: KS or Mann-Whitney | ❌ |
| Compare multiple groups' central tendency, my data is normal with equal variances | `multiGroups.centralTendency.toEachOther(parametric="parametric", assumeEqualVariances=true)` | One-way ANOVA | ✅ |
| Compare multiple groups' central tendency, my data is normal with unequal variances | `multiGroups.centralTendency.toEachOther(parametric="parametric", assumeEqualVariances=false)` | Welch ANOVA | ✅ |
| Compare multiple groups' central tendency, my data is normal, auto-detect variances | `multiGroups.centralTendency.toEachOther(parametric="parametric")` | Auto: ANOVA or Welch ANOVA | ✅ |
| Compare multiple groups' central tendency, my data is not normal | `multiGroups.centralTendency.toEachOther(parametric="nonparametric")` | Kruskal-Wallis | ✅ |
| Compare multiple groups' central tendency, auto-detect normality and variances | `multiGroups.centralTendency.toEachOther(parametric="auto")` | Auto: ANOVA/Welch/Kruskal-Wallis | ✅ |
| Compare factor A effect in two-way design | `multiGroups.centralTendency.toEachOther(design="two-way", testType="factorA")` | Two-way ANOVA (factor A) | ✅ |
| Compare factor B effect in two-way design | `multiGroups.centralTendency.toEachOther(design="two-way", testType="factorB")` | Two-way ANOVA (factor B) | ✅ |
| Test interaction in two-way design | `multiGroups.centralTendency.toEachOther(design="two-way", testType="interaction")` | Two-way ANOVA (interaction) | ✅ |
| Test independence in contingency table using chi-square | `multiGroups.proportions.toEachOther(method="chi")` | Chi-square independence | ✅ |
| Test independence in contingency table using Fisher exact | `multiGroups.proportions.toEachOther(method="fisher")` | Fisher exact (RxC) | ❌ |
| Test trend in proportions across ordered groups | `multiGroups.proportions.toEachOther(method="trend")` | Cochran-Armitage | ❌ |
| Test independence in contingency table, auto-select test | `multiGroups.proportions.toEachOther(method="auto")` | Auto: Chi-square or Fisher | ❌ |