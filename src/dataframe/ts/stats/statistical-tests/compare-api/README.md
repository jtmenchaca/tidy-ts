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

proportions.toValue(data, p):
  RETURN proportionTest(data, p)

distribution.toNormal(data):
  RETURN shapiroWilk(data)
```

## Two Groups

```
centralTendency.toEachOther(x, y, parametric, assumeEqualVariances?):
  IF parametric = "auto":
    nonNormalX = shapiroWilk(x, α=0.05).p_value < 0.05
    nonNormalY = shapiroWilk(y, α=0.05).p_value < 0.05
    IF nonNormalX AND nonNormalY:
      RETURN mannWhitney(x, y)
    ELSE:
      IF assumeEqualVariances provided:
        RETURN tTest(x, y, assumeEqualVariances)
      ELSE:
        equalVar = brownForsytheTest([x, y]).p_value >= 0.05
        RETURN tTest(x, y, equalVar)
  ELSE IF parametric = "parametric":
    IF assumeEqualVariances provided:
      RETURN tTest(x, y, assumeEqualVariances)
    ELSE:
      equalVar = brownForsytheTest([x, y]).p_value >= 0.05
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

proportions.toEachOther(data1, data2, useChiSquare?):
  IF useChiSquare = "fisher":
    RETURN fishersExact(data1, data2)
  ELSE IF useChiSquare = "auto":
    IF smallSample OR manyTies:
      RETURN fishersExact(data1, data2)
    ELSE:
      RETURN chiSquare(data1, data2)
  ELSE IF useChiSquare = true:
    RETURN chiSquare(data1, data2)
  ELSE:
    RETURN proportionTestTwoSample(data1, data2)

// TODO: Add Cochran-Armitage trend test
proportions.trend(groups, ordered):
  // NOT YET IMPLEMENTED
  RETURN cochranArmitage(groups, ordered)

distributions.toEachOther(x, y, method):
  IF method = "ks":
    RETURN kolmogorovSmirnov(x, y)
  ELSE IF method = "mann-whitney":
    RETURN mannWhitney(x, y)
  ELSE: // method = "auto"
    // Default to KS test for true distribution equality
    RETURN kolmogorovSmirnov(x, y)
```

## Multiple Groups

**Multiple Testing Corrections**: All post-hoc tests automatically correct for multiple comparisons:
- **Tukey HSD**: Uses studentized range distribution (built-in correction)
- **Games-Howell**: Uses Welch's t-test with adjusted degrees of freedom (built-in correction)  
- **Dunn's Test**: Uses Bonferroni correction (explicit adjustment)

```
centralTendency.toEachOther(groups, parametric, assumeEqualVariances?):
  // Auto-detect variance equality if not provided
  IF assumeEqualVariances not provided AND parametric != "nonparametric":
    assumeEqualVariances = brownForsytheTest(groups).p_value >= 0.05

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
      IF assumeEqualVariances provided:
        result = assumeEqualVariances ? anovaOneWay(groups) : welchAnova(groups)
        postHoc = assumeEqualVariances ? tukeyHSD(groups) : gamesHowell(groups) IF significant
      ELSE:
        equalVar = brownForsytheTest(groups).p_value >= 0.05
        result = equalVar ? anovaOneWay(groups) : welchAnova(groups)
        postHoc = equalVar ? tukeyHSD(groups) : gamesHowell(groups) IF significant
    RETURN {result, postHoc}

proportions.toEachOther(contingencyTable):
  IF contingencyTable.size = "2x2":
    RETURN chiSquare(contingencyTable)
  ELSE:
    // TODO: Add Fisher exact for RxC tables
    // NOT YET IMPLEMENTED - only 2x2 supported
    RETURN chiSquare(contingencyTable)

// Two-way ANOVA
centralTendency.toEachOther(data, design="two-way", testType):
  IF testType = "factorA":
    RETURN twoWayAnovaFactorA(data)
  ELSE IF testType = "factorB":
    RETURN twoWayAnovaFactorB(data)
  ELSE IF testType = "interaction":
    RETURN twoWayAnovaInteraction(data)
```

## Helpers

```
significant(result) = result.p_value < α
shapiroNonNormal(data) = shapiroWilk(data, α=0.05).p_value < 0.05
hasManyTies(x, y) = uniqueValues(x ∪ y) < length(x) + length(y)

// Post-hoc test selection
runPostHocTest(testType, groups, mainResult, α):
  IF groups.length < 3 OR NOT significant(mainResult):
    RETURN undefined
  ELSE IF testType = "anova":
    RETURN tukeyHSD(groups, α)
  ELSE IF testType = "welch_anova":
    RETURN gamesHowell(groups, α)
  ELSE IF testType = "kruskal_wallis":
    RETURN dunnTest(groups, α)
```

## Missing Features

1. **Advanced proportion tests**:
   - Cochran-Armitage trend test
   - Fisher exact for RxC tables (only 2x2 is implemented)

## Usage Examples

| I want to... | Use | Test | Status |
|-------------|-----|------|--------|
| Compare group central tendency to value, my data is normal | `oneGroup.centralTendency.toValue(parametric="parametric")` | One-sample t-test | ✅ |
| Compare group central tendency to value, my data is not normal | `oneGroup.centralTendency.toValue(parametric="nonparametric")` | Wilcoxon signed-rank | ✅ |
| Compare group central tendency to value, auto-detect normality | `oneGroup.centralTendency.toValue(parametric="auto")` | Auto: t-test or Wilcoxon | ✅ |
| Compare proportion to expected rate | `oneGroup.proportions.toValue()` | One-sample proportion test | ✅ |
| Check if data is normally distributed | `oneGroup.distribution.toNormal()` | Shapiro-Wilk | ✅ |
| Compare two groups' central tendency, my data is normal | `twoGroups.centralTendency.toEachOther(parametric="parametric")` | t-test (Welch) | ✅ |
| Compare two groups' central tendency, my data is not normal | `twoGroups.centralTendency.toEachOther(parametric="nonparametric")` | Mann-Whitney U | ✅ |
| Compare two groups' central tendency, auto-detect normality | `twoGroups.centralTendency.toEachOther(parametric="auto")` | Auto: t-test or Mann-Whitney | ✅ |
| Compare proportions between two groups | `twoGroups.proportions.toEachOther()` | Fisher's exact/Chi-square/z-test | ✅ |
| Test linear relationship between two variables | `twoGroups.association.toEachOther(method="pearson")` | Pearson correlation | ✅ |
| Test monotonic relationship between two variables | `twoGroups.association.toEachOther(method="spearman")` | Spearman correlation | ✅ |
| Test monotonic relationship between two variables (robust) | `twoGroups.association.toEachOther(method="kendall")` | Kendall's tau | ✅ |
| Test relationship between two variables, auto-select method | `twoGroups.association.toEachOther(method="auto")` | Auto: Pearson/Spearman/Kendall | ✅ |
| Test if one distribution tends to be larger than another | `twoGroups.distributions.toEachOther()` | Mann-Whitney (stochastic dominance) | ✅ |
| Test if two distributions are identical (any difference) | `twoGroups.distributions.toEachOther(method="ks")` | Kolmogorov-Smirnov | ✅ |
| Compare multiple groups' central tendency, my data is normal with equal variances | `multiGroups.centralTendency.toEachOther(parametric="parametric", assumeEqualVariances=true)` | One-way ANOVA | ✅ |
| Compare multiple groups' central tendency, my data is normal with unequal variances | `multiGroups.centralTendency.toEachOther(parametric="parametric", assumeEqualVariances=false)` | Welch ANOVA | ✅ |
| Compare multiple groups' central tendency, my data is normal, auto-detect variances | `multiGroups.centralTendency.toEachOther(parametric="parametric")` | Auto: ANOVA or Welch ANOVA | ✅ |
| Compare multiple groups' central tendency, my data is not normal | `multiGroups.centralTendency.toEachOther(parametric="nonparametric")` | Kruskal-Wallis | ✅ |
| Compare multiple groups' central tendency, auto-detect normality and variances | `multiGroups.centralTendency.toEachOther(parametric="auto")` | Auto: ANOVA/Welch/Kruskal-Wallis | ✅ |
| Compare factor A effect in two-way design | `multiGroups.centralTendency.toEachOther(design="two-way", testType="factorA")` | Two-way ANOVA (factor A) | ✅ |
| Compare factor B effect in two-way design | `multiGroups.centralTendency.toEachOther(design="two-way", testType="factorB")` | Two-way ANOVA (factor B) | ✅ |
| Test interaction in two-way design | `multiGroups.centralTendency.toEachOther(design="two-way", testType="interaction")` | Two-way ANOVA (interaction) | ✅ |
| Test independence in contingency table using chi-square | `multiGroups.proportions.toEachOther(method="chi")` | Chi-square independence | ✅ |
| Test independence in contingency table using Fisher exact (RxC) | Not yet implemented | Fisher exact (RxC) | ❌ |
| Test trend in proportions across ordered groups | Not yet implemented | Cochran-Armitage | ❌ |