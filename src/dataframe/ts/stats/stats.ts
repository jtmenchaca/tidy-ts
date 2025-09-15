import { sum } from "./aggregate/sum.ts";
import { mean } from "./descriptive/central-tendency/mean.ts";
import { median } from "./descriptive/central-tendency/median.ts";
import { mode } from "./descriptive/central-tendency/mode.ts";
import { min } from "./aggregate/min.ts";
import { max } from "./aggregate/max.ts";
import { product } from "./aggregate/product.ts";
import { range } from "./descriptive/spread/range.ts";
import { variance } from "./descriptive/spread/variance.ts";
import { sd } from "./descriptive/spread/stdev.ts";
import { iqr } from "./descriptive/spread/iqr.ts";
import { quantile } from "./descriptive/quantiles/quantile.ts";
import { quartiles } from "./descriptive/quantiles/quartiles.ts";
import { covariance } from "./correlation/covariance.ts";
import { corr } from "./correlation/corr.ts";
import { unique } from "./descriptive/counts/unique.ts";
import { uniqueCount } from "./descriptive/counts/unique-count.ts";
import { cumsum } from "./cumulative/cumsum.ts";
import { rank } from "./ranking/rank.ts";
import { denseRank } from "./ranking/dense-rank.ts";
import { normalize } from "./transformation/normalize.ts";
import { cumprod } from "./cumulative/cumprod.ts";
import { cummin } from "./cumulative/cummin.ts";
import { cummean } from "./cumulative/cummean.ts";
import { cummax } from "./cumulative/cummax.ts";
import { lag } from "./window/lag.ts";
import { lead } from "./window/lead.ts";
import { round } from "./transformation/round.ts";
import { floor } from "./transformation/floor.ts";
import { ceiling } from "./transformation/ceiling.ts";
import { count_value } from "./descriptive/counts/count-value.ts";
import { percentile_rank } from "./ranking/percentile-rank.ts";

// Import statistical tests
import * as statisticalTests from "./statistical-tests/index.ts";

// Import distribution functions
import { dist } from "./distributions/index.ts";

/**
 * Comprehensive statistical functions for data analysis.
 *
 * @example
 * ```typescript
 * import { createDataFrame, stats } from "@tidy-ts/dataframe";
 *
 * const df = createDataFrame([
 *   { value: 10 }, { value: 20 }, { value: 30 }
 * ]);
 *
 * // Descriptive statistics
 * const mean = stats.mean(df.value); // 20
 * const sum = stats.sum(df.value);   // 60
 *
 * // Distribution functions
 * const randomNormal = stats.dist.rnorm(0, 1);
 * const normalCDF = stats.dist.pnorm(0, 0, 1);
 *
 * // Statistical tests
 * const tTest = stats.test.t_test(df.value, 0, "two-sided", 0.05);
 * const anova = stats.test.anovaOneWay([df.value, [5, 15, 25]], 0.05);
 * ```
 */
export const stats: {
  readonly sum: typeof sum;
  readonly mean: typeof mean;
  readonly median: typeof median;
  readonly mode: typeof mode;
  readonly min: typeof min;
  readonly max: typeof max;
  readonly product: typeof product;
  readonly range: typeof range;
  readonly variance: typeof variance;
  readonly stdev: typeof sd;
  readonly iqr: typeof iqr;
  readonly quantile: typeof quantile;
  readonly quartiles: typeof quartiles;
  readonly covariance: typeof covariance;
  readonly corr: typeof corr;
  readonly unique: typeof unique;
  readonly uniqueCount: typeof uniqueCount;
  readonly cumsum: typeof cumsum;
  readonly cummean: typeof cummean;
  readonly cumprod: typeof cumprod;
  readonly cummin: typeof cummin;
  readonly cummax: typeof cummax;
  readonly rank: typeof rank;
  readonly denseRank: typeof denseRank;
  readonly normalize: typeof normalize;
  readonly lag: typeof lag;
  readonly lead: typeof lead;
  readonly round: typeof round;
  readonly floor: typeof floor;
  readonly ceiling: typeof ceiling;
  readonly countValue: typeof count_value;
  readonly percentileRank: typeof percentile_rank;

  // Distribution Functions
  readonly dist: typeof dist;

  // Statistical Tests
  readonly test: {
    // T-tests
    readonly t: {
      readonly oneSample: typeof statisticalTests.t_test;
      readonly independent: typeof statisticalTests.tTestIndependent;
      readonly paired: typeof statisticalTests.tTestPaired;
    };

    // Z-tests
    readonly z: {
      readonly oneSample: typeof statisticalTests.zTestOneSample;
      readonly twoSample: typeof statisticalTests.zTestTwoSample;
    };

    // Proportion tests
    readonly proportion: {
      readonly oneSample: typeof statisticalTests.proportionTestOneSample;
      readonly twoSample: typeof statisticalTests.proportionTestTwoSample;
    };

    // ANOVA
    readonly anova: {
      readonly oneWay: typeof statisticalTests.anovaOneWay;
      readonly twoWayMain: typeof statisticalTests.twoWayAnovaFactorA;
      readonly twoWayInteraction:
        typeof statisticalTests.twoWayAnovaInteraction;
    };

    // Correlation tests
    readonly correlation: {
      readonly pearson: typeof statisticalTests.pearsonTest;
      readonly spearman: typeof statisticalTests.spearmanTest;
      readonly kendall: typeof statisticalTests.kendallTest;
    };

    // Non-parametric tests
    readonly nonparametric: {
      readonly mannWhitney: typeof statisticalTests.mannWhitneyTest;
      readonly wilcoxon: typeof statisticalTests.wilcoxonSignedRankTest;
      readonly kruskalWallis: typeof statisticalTests.kruskalWallisTest;
      readonly kruskalWallisGroup:
        typeof statisticalTests.kruskalWallisTestByGroup;
    };

    // Categorical tests
    readonly categorical: {
      readonly chiSquare: typeof statisticalTests.chiSquareTest;
      readonly fishersExact: typeof statisticalTests.fishersExactTest;
    };

    // Normality tests
    readonly normality: {
      readonly shapiroWilk: typeof statisticalTests.shapiroWilkTest;
    };
  };
} = {
  // Basic statistics
  sum,
  mean,
  median,
  mode,
  min,
  max,
  product,

  // Spread statistics
  range,
  variance,
  stdev: sd,
  iqr,
  quantile,
  quartiles,

  // Bivariate statistics
  covariance,
  corr,

  // Count and unique functions
  unique,
  uniqueCount,

  // Other statistics
  cumsum,
  cummean,
  cumprod,
  cummin,
  cummax,
  rank,
  denseRank,
  normalize,
  lag,
  lead,
  round,
  floor,
  ceiling,
  countValue: count_value,
  percentileRank: percentile_rank,

  // Distribution Functions
  dist: dist,

  // Statistical Tests
  test: {
    // T-tests
    t: {
      oneSample: statisticalTests.t_test,
      independent: statisticalTests.tTestIndependent,
      paired: statisticalTests.tTestPaired,
    },

    // Z-tests
    z: {
      oneSample: statisticalTests.zTestOneSample,
      twoSample: statisticalTests.zTestTwoSample,
    },

    // Proportion tests
    proportion: {
      oneSample: statisticalTests.proportionTestOneSample,
      twoSample: statisticalTests.proportionTestTwoSample,
    },

    // ANOVA
    anova: {
      oneWay: statisticalTests.anovaOneWay,
      twoWayMain: statisticalTests.twoWayAnovaFactorA,
      twoWayInteraction: statisticalTests.twoWayAnovaInteraction,
    },

    // Correlation tests
    correlation: {
      pearson: statisticalTests.pearsonTest,
      spearman: statisticalTests.spearmanTest,
      kendall: statisticalTests.kendallTest,
    },

    // Non-parametric tests
    nonparametric: {
      mannWhitney: statisticalTests.mannWhitneyTest,
      wilcoxon: statisticalTests.wilcoxonSignedRankTest,
      kruskalWallis: statisticalTests.kruskalWallisTest,
      kruskalWallisGroup: statisticalTests.kruskalWallisTestByGroup,
    },

    // Categorical tests
    categorical: {
      chiSquare: statisticalTests.chiSquareTest,
      fishersExact: statisticalTests.fishersExactTest,
    },

    // Normality tests
    normality: {
      shapiroWilk: statisticalTests.shapiroWilkTest,
    },
  },
};

// Export stats with alias 's' for convenience
export { stats as s };

// Also export the stats constant as default
export default stats;
