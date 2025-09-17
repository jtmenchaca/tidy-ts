// =======================
// Compare API (revised, consistent)
// =======================

// =======================
// ONE GROUP ✅ COMPLETE
// =======================
oneGroup = {

  centralTendency: { ✅
    toValue(data, value, parametric): ✅
      IF parametric == "auto": ✅
        IF shapiroWilk(data, α=0.05).p_value < 0.05: ✅
          RETURN wilcoxonSignedRank(data, value) ✅
        ELSE: ✅
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
        nonNormalX = shapiroWilk(x, α=0.05).p_value < 0.05 ✅
        nonNormalY = shapiroWilk(y, α=0.05).p_value < 0.05 ✅
        IF nonNormalX AND nonNormalY: ✅
          RETURN mannWhitney(x, y) ✅
        ELSE: ✅
          IF assumeEqualVariances provided: ✅
            RETURN tTest_independent(x, y, equalVariances=assumeEqualVariances) ✅
          ELSE: ✅
            equalVar = hasEqualVariances([x, y], α=0.05) ✅
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
        anyNonNormal = groups.some(g => shapiroWilk(g, α=0.05).p_value < 0.05) ✅
        IF anyNonNormal: ✅
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
// HELPERS ✅ MOSTLY COMPLETE
// =======================
helpers = {

  significant(result, α=0.05): ✅
    RETURN result.p_value < α ✅

  shapiroNonNormal(data, α=0.05): ✅
    RETURN shapiroWilk(data, α).p_value < α ✅

  hasManyTies(x, y): ✅
    RETURN uniqueValues(x ∪ y).length < (length(x) + length(y)) ✅

  hasEqualVariances(data, α=0.05): ✅
    RETURN brownForsytheTest(data, α).p_value >= α ✅
    // Note: Both multi-groups.ts and two-groups.ts now use Brown-Forsythe Levene test ✅

  hasSmallExpectedCounts(data1, data2): ✅
    // implement expected count check for 2×2 formed by data1,data2 ✅
    table = to2x2(data1, data2) ✅
    E = expectedCounts(table) ✅
    RETURN any(E_ij < 5) ✅

  expectedCounts(table): ✅
    // standard expected counts for a contingency table ✅
    RETURN computeExpectedCounts(table) ✅
}