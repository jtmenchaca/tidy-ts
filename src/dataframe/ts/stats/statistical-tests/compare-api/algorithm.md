// =======================
// Compare API (Evidence-Based Approach)
// =======================

// =======================
// ONE GROUP ✅ COMPLETE
// =======================
oneGroup = {

  centralTendency: { ✅
    toValue(data, value, parametric): ✅
      IF parametric == "auto": ✅
        r = residuals_oneSample(data, value) ✅
        n = length(r) ✅
        IF n > N_MODERATE_MAX (300): ✅
          RETURN tTest_oneSample(data, value) ✅
        IF !normalityOK(r): ✅
          RETURN wilcoxonSignedRank(data, value) ✅
        RETURN tTest_oneSample(data, value) ✅
      ELSE IF parametric == "parametric": ✅
        RETURN tTest_oneSample(data, value) ✅
      ELSE: ✅
        RETURN wilcoxonSignedRank(data, value) ✅
  },

  proportions: { ✅
    toValue(data, p0): ✅
      RETURN proportionTest_oneSample(data, p0) ✅
  },

  distribution: { ✅
    toNormal(data): ✅
      RETURN shapiroWilk(data, α=0.05) ✅
  }
}

// =======================
// TWO GROUPS ✅ COMPLETE
// =======================
twoGroups = {

  centralTendency: { ✅
    toEachOther(x, y, parametric, assumeEqualVariances?): ✅
      IF parametric == "auto": ✅
        (rx, ry) = residuals_twoSample(x, y) ✅
        nmin = min(length(x), length(y)) ✅
        IF nmin > N_MODERATE_MAX (300): ✅
          equalVar = (assumeEqualVariances provided) ? assumeEqualVariances : hasEqualVariances([x, y], α=0.05) ✅
          RETURN tTest_independent(x, y, equalVariances=equalVar) ✅
        nonNormal = (!normalityOK(rx)) OR (!normalityOK(ry)) ✅
        IF nonNormal: ✅
          RETURN mannWhitney(x, y) ✅
        equalVar = (assumeEqualVariances provided) ? assumeEqualVariances : hasEqualVariances([x, y], α=0.05) ✅
        RETURN tTest_independent(x, y, equalVariances=equalVar) ✅

      ELSE IF parametric == "parametric": ✅
        IF assumeEqualVariances provided: ✅
          RETURN tTest_independent(x, y, equalVariances=assumeEqualVariances) ✅
        ELSE: ✅
          equalVar = hasEqualVariances([x, y], α=0.05) ✅
          RETURN tTest_independent(x, y, equalVariances=equalVar) ✅

      ELSE: ✅
        RETURN mannWhitney(x, y) ✅
  },

  association: { ✅
    toEachOther(x, y, method): ✅
      IF method == "pearson":  RETURN pearson(x, y) ✅
      IF method == "spearman": RETURN spearman(x, y) ✅
      IF method == "kendall":  RETURN kendall(x, y) ✅
      // auto ✅
      smallSample = min(length(x), length(y)) < 25 ✅
      IF hasManyTies(x, y) OR smallSample: ✅
        RETURN kendall(x, y) ✅
      ELSE IF shapiroNonNormal(x) OR shapiroNonNormal(y): ✅
        RETURN spearman(x, y) ✅
      ELSE: ✅
        RETURN pearson(x, y) ✅
  },

  proportions: { ✅
    toEachOther(data1, data2, useChiSquare?): ✅
      IF useChiSquare == "fisher": ✅
        RETURN fishersExact(data1, data2) ✅
      ELSE IF useChiSquare == "auto": ✅
        smallSample = hasSmallExpectedCounts(data1, data2) OR hasManyTies(data1, data2) ✅
        IF smallSample: ✅
          RETURN fishersExact(data1, data2) ✅
        ELSE: ✅
          RETURN chiSquare_2x2(data1, data2) ✅
      ELSE IF useChiSquare == true: ✅
        RETURN chiSquare_2x2(data1, data2) ✅
      ELSE: ✅
        RETURN proportionTest_twoSample(data1, data2) ✅
  },

  distributions: { ✅
    toEachOther(x, y, method): ✅
      IF method == "ks": ✅
        RETURN kolmogorovSmirnov_2samp(x, y) ✅
      ELSE IF method == "mann-whitney": ✅
        RETURN mannWhitney(x, y) ✅
      ELSE: ✅
        RETURN kolmogorovSmirnov_2samp(x, y) ✅
  }
}

// =======================
// MULTIPLE GROUPS ✅ COMPLETE
// =======================
multiGroups = {

  centralTendency: { ✅
    toEachOther(groups, parametric, assumeEqualVariances?): ✅
      // Auto-detect variance equality if not provided (and not forced nonparametric) ✅
      IF assumeEqualVariances not provided AND parametric != "nonparametric": ✅
        equalVar = hasEqualVariances(groups, α=0.05) ✅
      ELSE: ✅
        equalVar = (assumeEqualVariances == true) ✅

      IF parametric == "parametric": ✅
        IF equalVar: ✅
          result = anovaOneWay(groups) ✅
          postHoc = (significant(result) AND length(groups) >= 3) ? tukeyHSD(groups) : undefined ✅
        ELSE: ✅
          result = welchAnova(groups) ✅
          postHoc = (significant(result) AND length(groups) >= 3) ? gamesHowell(groups) : undefined ✅
        RETURN { result, postHoc } ✅

      ELSE IF parametric == "nonparametric": ✅
        result = kruskalWallis(groups) ✅
        postHoc = (significant(result) AND length(groups) >= 3) ? dunnTest(groups) : undefined ✅
        RETURN { result, postHoc } ✅

      ELSE: // "auto" ✅
        cleanGroups = groups.map(cleanNumeric) ✅
        nmin = min(...cleanGroups.map(g => g.length)) ✅
        IF nmin > N_MODERATE_MAX (300): ✅
          // Large samples: Use parametric regardless of normality ✅
          IF equalVar: ✅
            result = anovaOneWay(groups) ✅
            postHoc = (significant(result) AND length(groups) >= 3) ? tukeyHSD(groups) : undefined ✅
          ELSE: ✅
            result = welchAnova(groups) ✅
            postHoc = (significant(result) AND length(groups) >= 3) ? gamesHowell(groups) : undefined ✅
        ELSE: ✅
          // Test normality on residuals from group means ✅
          groupsNormal = allGroupsNormal(cleanGroups, α) ✅
          IF !groupsNormal: ✅
            result = kruskalWallis(groups) ✅
            postHoc = (significant(result) AND length(groups) >= 3) ? dunnTest(groups) : undefined ✅
          ELSE: ✅
            IF equalVar: ✅
              result = anovaOneWay(groups) ✅
              postHoc = (significant(result) AND length(groups) >= 3) ? tukeyHSD(groups) : undefined ✅
            ELSE: ✅
              result = welchAnova(groups) ✅
              postHoc = (significant(result) AND length(groups) >= 3) ? gamesHowell(groups) : undefined ✅
        RETURN { result, postHoc } ✅
  },

  proportions: { ✅
    toEachOther(contingencyTable): ✅
      IF contingencyTable.size == "2x2": ✅
        RETURN chiSquare(contingencyTable) ✅
      ELSE: ✅
        // Only 2x2 supported for Fisher RxC (TODO) ✅
        RETURN chiSquare(contingencyTable) ✅
  },

  centralTendencyTwoWay: { ✅
    toEachOther(data, testType): ✅
      IF testType == "factorA":     RETURN twoWayAnovaFactorA(data) ✅
      ELSE IF testType == "factorB": RETURN twoWayAnovaFactorB(data) ✅
      ELSE IF testType == "interaction": RETURN twoWayAnovaInteraction(data) ✅
  }
}

// =======================
// PROPORTIONS TREND ❌ NOT IMPLEMENTED
// =======================
proportions = {
  trend(groups, ordered): ❌
    RETURN cochranArmitage(groups, ordered) ❌
}

// =======================
// HELPERS ✅ COMPLETE (Evidence-Based Approach)
// =======================
helpers = {

  // Evidence-based constants ✅
  N_SMALL_MAX = 50 ✅
  N_MODERATE_MAX = 300 ✅
  ALPHA = 0.05 ✅

  significant(result, α=0.05): ✅
    RETURN result.p_value < α ✅

  // Evidence-based normality testing on residuals ✅
  normalityOK(vec, α=ALPHA): ✅
    n = length(vec) ✅
    IF n <= N_SMALL_MAX (50): ✅
      // Small samples: Use Shapiro-Wilk (best power for small samples) ✅
      IF canShapiro(n): ✅
        RETURN shapiroWilk(vec, α).p_value >= α ✅
      RETURN true // Assume normal if we can't test ✅
    ELSE IF n <= N_MODERATE_MAX (300): ✅
      // Moderate samples: Use D'Agostino-Pearson K² (omnibus test) ✅
      RETURN dagostinoPearson(vec, α).p_value >= α ✅
    ELSE: ✅
      // Large samples: Always return true (use robust methods regardless) ✅
      RETURN true ✅

  // Residual computation functions ✅
  residuals_oneSample(data, value): ✅
    RETURN data.map(d => d - value) ✅

  residuals_twoSample(x, y): ✅
    xMean = mean(x) ✅
    yMean = mean(y) ✅
    rx = x.map(d => d - xMean) ✅
    ry = y.map(d => d - yMean) ✅
    RETURN { rx, ry } ✅

  residuals_groups(groups): ✅
    RETURN groups.map(g => { ✅
      mean = mean(g) ✅
      RETURN g.map(d => d - mean) ✅
    }) ✅

  allGroupsNormal(groups, α=ALPHA): ✅
    residualGroups = residuals_groups(groups) ✅
    FOR r OF residualGroups: ✅
      IF !normalityOK(r, α): ✅
        RETURN false ✅
    RETURN true ✅

  hasManyTies(x, y): ✅
    combined = x ∪ y ✅
    uniqueCount = uniqueValues(combined).length ✅
    RETURN uniqueCount < combined.length * 0.8 // More than 20% ties ✅

  hasEqualVariances(data, α=0.05): ✅
    // Use Brown-Forsythe modification of Levene's test (deviations from medians) ✅
    // which is more robust to non-normality than the original Levene's test ✅
    RETURN leveneTest(data, α).p_value >= α ✅

  hasSmallExpectedCounts(data1, data2): ✅
    // implement expected count check for 2×2 formed by data1,data2 ✅
    table = to2x2(data1, data2) ✅
    E = expectedCounts(table) ✅
    RETURN any(E_ij < 5) ✅

  expectedCounts(table): ✅
    // standard expected counts for a contingency table ✅
    RETURN computeExpectedCounts(table) ✅
}