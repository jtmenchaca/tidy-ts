// Test type name mapping
const TEST_TYPE_NAMES = {
  1: "One-sample z-test",
  2: "Two-sample z-test",
  3: "Paired z-test",
  4: "One-sample proportion test",
  5: "Two-sample proportion test",
  6: "One-sample t-test",
  7: "Two-sample t-test",
  8: "Paired t-test",
  9: "Wilcoxon signed-rank test",
  10: "Mann-Whitney U test",
  11: "One-way ANOVA",
  12: "Two-way ANOVA",
  13: "Chi-square test of independence",
  14: "Chi-square goodness of fit test",
  15: "Fisher's exact test",
  16: "Kruskal-Wallis test",
  17: "Friedman test",
  18: "Pearson correlation test",
  19: "Spearman correlation test",
  20: "Kendall correlation test",
  21: "Shapiro-Wilk normality test",
  22: "Kolmogorov-Smirnov test",
  23: "Anderson-Darling test",
  24: "Levene's test",
  25: "Bartlett's test",
  26: "Tukey HSD",
  27: "Games-Howell",
  28: "Dunn's Test",
} as const;

/**
 * Test statistic names that can be returned by statistical tests
 */
export type TestStatisticName =
  | "t-statistic"
  | "F-statistic"
  | "Chi-square"
  | "z-statistic"
  | "U-statistic"
  | "W-statistic"
  | "H-statistic"
  | "r-statistic"
  | "tau-statistic"
  | "rho-statistic"
  | "D-statistic"
  | "G-statistic"
  | "Q-statistic"
  | "V-statistic"
  | "Z-statistic"
  | "A-statistic"
  | "B-statistic"
  | "L-statistic";

export type TestName = typeof TEST_TYPE_NAMES[keyof typeof TEST_TYPE_NAMES];

// Type reconstruction helpers
export function getTestInfo(testType: number) {
  const typeNum = Number(testType);
  const testName = TEST_TYPE_NAMES[typeNum as keyof typeof TEST_TYPE_NAMES] ||
    `Unknown test (type ${typeNum})` as TestName;

  let testStatistic: TestStatisticName;
  let defaultEffectSize: EffectSizeType;

  switch (testType) {
    case 1:
    case 2:
    case 3: // Z-tests
      testStatistic = "z-statistic";
      defaultEffectSize = "Cohen's d";
      break;
    case 4:
    case 5: // Proportion tests
      testStatistic = "z-statistic";
      defaultEffectSize = "Cohen's h";
      break;
    case 6:
    case 7:
    case 8: // T-tests
      testStatistic = "t-statistic";
      defaultEffectSize = "Cohen's d";
      break;
    case 9: // Wilcoxon
      testStatistic = "W-statistic";
      defaultEffectSize = "rank-biserial correlation";
      break;
    case 10: // Mann-Whitney
      testStatistic = "U-statistic";
      defaultEffectSize = "rank-biserial correlation";
      break;
    case 11:
    case 12: // ANOVA
      testStatistic = "F-statistic";
      defaultEffectSize = "eta-squared";
      break;
    case 13:
    case 14: // Chi-square
      testStatistic = "Chi-square";
      defaultEffectSize = "Cramér's V";
      break;
    case 15: // Fisher's exact
      testStatistic = "G-statistic";
      defaultEffectSize = "odds ratio";
      break;
    case 16: // Kruskal-Wallis
      testStatistic = "H-statistic";
      defaultEffectSize = "eta-squared";
      break;
    case 17: // Friedman
      testStatistic = "Q-statistic";
      defaultEffectSize = "Kendall's tau";
      break;
    case 18: // Pearson correlation
      testStatistic = "r-statistic";
      defaultEffectSize = "Pearson's r";
      break;
    case 19: // Spearman correlation
      testStatistic = "rho-statistic";
      defaultEffectSize = "Spearman's rho";
      break;
    case 20: // Kendall correlation
      testStatistic = "tau-statistic";
      defaultEffectSize = "Kendall's tau";
      break;
    case 21: // Shapiro-Wilk
      testStatistic = "W-statistic";
      defaultEffectSize = "Cohen's d";
      break;
    case 22: // Kolmogorov-Smirnov
      testStatistic = "D-statistic";
      defaultEffectSize = "Cohen's d";
      break;
    case 23: // Anderson-Darling
      testStatistic = "A-statistic";
      defaultEffectSize = "Cohen's d";
      break;
    case 24: // Levene's test
      testStatistic = "L-statistic";
      defaultEffectSize = "eta-squared";
      break;
    case 25: // Bartlett's test
      testStatistic = "B-statistic";
      defaultEffectSize = "eta-squared";
      break;
    case 26: // Tukey HSD
      testStatistic = "Q-statistic";
      defaultEffectSize = "Cohen's d";
      break;
    case 27: // Games-Howell
      testStatistic = "t-statistic";
      defaultEffectSize = "Cohen's d";
      break;
    case 28: // Dunn's Test
      testStatistic = "z-statistic";
      defaultEffectSize = "rank-biserial correlation";
      break;
    default:
      testStatistic = "F-statistic";
      defaultEffectSize = "eta-squared";
  }

  return {
    testName,
    testStatistic,
    defaultEffectSize,
  };
}

/**
 * Parametric choice for statistical tests
 */
export type ParametricChoice = "parametric" | "nonparametric" | "auto";

/**
 * Effect size types that can be returned by statistical tests
 */
export type EffectSizeType =
  | "Cohen's d"
  | "Hedges' g"
  | "eta-squared"
  | "partial eta-squared"
  | "omega-squared"
  | "Cramér's V"
  | "phi coefficient"
  | "point-biserial correlation"
  | "rank-biserial correlation"
  | "Kendall's tau"
  | "Spearman's rho"
  | "Pearson's r"
  | "Glass's delta"
  | "Cohen's f"
  | "Cohen's h"
  | "odds ratio"
  | "relative risk"
  | "risk difference"
  | "number needed to treat";
