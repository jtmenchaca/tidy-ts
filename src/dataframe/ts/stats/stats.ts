import { sum } from "./aggregate/sum.ts";
import { mean } from "./descriptive/central-tendency/mean.ts";
import { median } from "./descriptive/central-tendency/median.ts";
import { mode } from "./descriptive/central-tendency/mode.ts";
import { min } from "./aggregate/min.ts";
import { max } from "./aggregate/max.ts";
import { first } from "./aggregate/first.ts";
import { last } from "./aggregate/last.ts";
import { product } from "./aggregate/product.ts";
import { range } from "./descriptive/spread/range.ts";
import { variance } from "./descriptive/spread/variance.ts";
import { sd } from "./descriptive/spread/stdev.ts";
import { iqr } from "./descriptive/spread/iqr.ts";
import { quantile } from "./descriptive/quantiles/quantile.ts";
import { quartiles } from "./descriptive/quantiles/quartiles.ts";
import { covariance } from "./correlation/covariance.ts";
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
import { rolling } from "./window/rolling.ts";
import { forwardFill } from "./window/forward-fill.ts";
import { backwardFill } from "./window/backward-fill.ts";
import { interpolate } from "./window/interpolate.ts";
import { round } from "./transformation/round.ts";
import { floor } from "./transformation/floor.ts";
import { ceiling } from "./transformation/ceiling.ts";
import { percent } from "./transformation/percent.ts";
import { count_value } from "./descriptive/counts/count-value.ts";
import { percentile_rank } from "./ranking/percentile-rank.ts";
import { chunk } from "./helpers.ts";
import { batch } from "./async/batch.ts";
import { parallel } from "./async/parallel.ts";

// Import statistical tests
import * as statisticalTests from "./statistical-tests/index.ts";

// Import distribution functions
import * as beta from "./distributions/beta.ts";
import * as binomial from "./distributions/binomial.ts";
import * as chiSquare from "./distributions/chi-square.ts";
import * as exponential from "./distributions/exponential.ts";
import * as fDist from "./distributions/f-distribution.ts";
import * as gamma from "./distributions/gamma.ts";
import * as geometric from "./distributions/geometric.ts";
import * as hypergeometric from "./distributions/hypergeometric.ts";
import * as logNormal from "./distributions/log-normal.ts";
import * as negativeBinomial from "./distributions/negative-binomial.ts";
import * as normal from "./distributions/normal.ts";
import * as poisson from "./distributions/poisson.ts";
import * as tDist from "./distributions/t-distribution.ts";
import * as uniform from "./distributions/uniform.ts";
import * as weibull from "./distributions/weibull.ts";
import * as wilcoxon from "./distributions/wilcoxon.ts";

// Import compare API functions
import { centralTendencyToValue } from "./statistical-tests/compare-api/one-group/central-tendency.ts";
import { proportionsToValue } from "./statistical-tests/compare-api/one-group/proportions.ts";
import { distributionToNormal } from "./statistical-tests/compare-api/one-group/distribution.ts";
import { centralTendencyToEachOther as twoGroupCentralTendency } from "./statistical-tests/compare-api/two-group/central-tendency.ts";
import { proportionsToEachOther as twoGroupProportions } from "./statistical-tests/compare-api/two-group/proportions.ts";
import { associationToEachOther } from "./statistical-tests/compare-api/two-group/association.ts";
import { distributionsToEachOther } from "./statistical-tests/compare-api/two-group/distributions.ts";
import { centralTendencyToEachOther as multiGroupCentralTendency } from "./statistical-tests/compare-api/multi-group/central-tendency.ts";
import { proportionsToEachOther as multiGroupProportions } from "./statistical-tests/compare-api/multi-group/proportions.ts";
import {
  dunnTest,
  gamesHowellTest,
  tukeyHSD,
} from "./statistical-tests/post-hoc/index.ts";

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
 * const tTest = stats.test.t.oneSample({ data: df.value, mu: 0, alternative: "two-sided", alpha: 0.05 });
 * const anova = stats.test.anova.oneWay(df.value, [5, 15, 25]);
 * ```
 */
export const stats: {
  /** Calculate the sum of numeric values */
  readonly sum: typeof sum;
  /** Calculate the arithmetic mean (average) of numeric values */
  readonly mean: typeof mean;
  /** Calculate the median (middle value) of numeric values */
  readonly median: typeof median;
  /** Find the most frequently occurring value(s) */
  readonly mode: typeof mode;
  /** Find the minimum value */
  readonly min: typeof min;
  /** Find the maximum value */
  readonly max: typeof max;
  /** Get the first value in an array */
  readonly first: typeof first;
  /** Get the last value in an array */
  readonly last: typeof last;
  /** Calculate the product of all values */
  readonly product: typeof product;
  /** Calculate the range (max - min) */
  readonly range: typeof range;
  /** Calculate the variance (spread of data) */
  readonly variance: typeof variance;
  /** Calculate the standard deviation */
  readonly stdev: typeof sd;
  /** Calculate the interquartile range (Q3 - Q1) */
  readonly iqr: typeof iqr;
  /** Calculate quantiles at specified probabilities */
  readonly quantile: typeof quantile;
  /** Calculate the first, second, and third quartiles */
  readonly quartiles: typeof quartiles;
  /** Calculate covariance between two variables */
  readonly covariance: typeof covariance;
  /** Get unique values from an array */
  readonly unique: typeof unique;
  /** Count the number of unique values */
  readonly uniqueCount: typeof uniqueCount;
  /** Calculate cumulative sum */
  readonly cumsum: typeof cumsum;
  /** Calculate cumulative mean */
  readonly cummean: typeof cummean;
  /** Calculate cumulative product */
  readonly cumprod: typeof cumprod;
  /** Calculate cumulative minimum */
  readonly cummin: typeof cummin;
  /** Calculate cumulative maximum */
  readonly cummax: typeof cummax;
  /** Assign ranks to values (with ties) */
  readonly rank: typeof rank;
  /** Assign dense ranks to values (consecutive integers) */
  readonly denseRank: typeof denseRank;
  /** Normalize values to 0-1 range or z-scores */
  readonly normalize: typeof normalize;
  /** Shift values forward (lag) */
  readonly lag: typeof lag;
  /** Shift values backward (lead) */
  readonly lead: typeof lead;
  /** Apply function over rolling window */
  readonly rolling: typeof rolling;
  /** Forward fill null/undefined values in an array */
  readonly forwardFill: typeof forwardFill;
  /** Backward fill null/undefined values in an array */
  readonly backwardFill: typeof backwardFill;
  /** Interpolate null/undefined values using linear or spline interpolation */
  readonly interpolate: typeof interpolate;
  /** Round values to specified decimal places */
  readonly round: typeof round;
  /** Round values down to nearest integer */
  readonly floor: typeof floor;
  /** Round values up to nearest integer */
  readonly ceiling: typeof ceiling;
  /** Convert values to percentages */
  readonly percent: typeof percent;
  /** Count occurrences of a specific value */
  readonly countValue: typeof count_value;
  /** Calculate percentile rank of values */
  readonly percentileRank: typeof percentile_rank;
  /** Split an array into chunks of specified size */
  readonly chunk: typeof chunk;
  /** Process an array of items with async function and concurrency control */
  readonly batch: typeof batch;
  /** Process an array of promises with concurrency control, batching, and retry logic */
  readonly parallel: typeof parallel;

  /** Probability distribution functions (PDF, CDF, quantile, random sampling) */
  readonly dist: {
    /** Normal (Gaussian) distribution */
    readonly normal: {
      /** Probability density function */
      readonly density: typeof normal.dnorm;
      /** Cumulative distribution function */
      readonly probability: typeof normal.pnorm;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof normal.qnorm;
      /** Generate random samples */
      readonly random: typeof normal.rnorm;
      /** Generate dataset from distribution */
      readonly data: typeof normal.normalData;
    };
    /** Beta distribution */
    readonly beta: {
      /** Probability density function */
      readonly density: typeof beta.dbeta;
      /** Cumulative distribution function */
      readonly probability: typeof beta.pbeta;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof beta.qbeta;
      /** Generate random samples */
      readonly random: typeof beta.rbeta;
      /** Generate dataset from distribution */
      readonly data: typeof beta.betaData;
    };
    /** Gamma distribution */
    readonly gamma: {
      /** Probability density function */
      readonly density: typeof gamma.dgamma;
      /** Cumulative distribution function */
      readonly probability: typeof gamma.pgamma;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof gamma.qgamma;
      /** Generate random samples */
      readonly random: typeof gamma.rgamma;
      /** Generate dataset from distribution */
      readonly data: typeof gamma.gammaData;
    };
    /** Exponential distribution */
    readonly exponential: {
      /** Probability density function */
      readonly density: typeof exponential.dexp;
      /** Cumulative distribution function */
      readonly probability: typeof exponential.pexp;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof exponential.qexp;
      /** Generate random samples */
      readonly random: typeof exponential.rexp;
      /** Generate dataset from distribution */
      readonly data: typeof exponential.exponentialData;
    };
    /** Chi-squared distribution */
    readonly chiSquare: {
      /** Probability density function */
      readonly density: typeof chiSquare.dchisq;
      /** Cumulative distribution function */
      readonly probability: typeof chiSquare.pchisq;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof chiSquare.qchisq;
      /** Generate random samples */
      readonly random: typeof chiSquare.rchisq;
      /** Generate dataset from distribution */
      readonly data: typeof chiSquare.chiSquareData;
    };
    /** Student's t-distribution */
    readonly t: {
      /** Probability density function */
      readonly density: typeof tDist.dt;
      /** Cumulative distribution function */
      readonly probability: typeof tDist.pt;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof tDist.qt;
      /** Generate random samples */
      readonly random: typeof tDist.rt;
      /** Generate dataset from distribution */
      readonly data: typeof tDist.tData;
    };
    /** F-distribution */
    readonly f: {
      /** Probability density function */
      readonly density: typeof fDist.df;
      /** Cumulative distribution function */
      readonly probability: typeof fDist.pf;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof fDist.qf;
      /** Generate random samples */
      readonly random: typeof fDist.rf;
    };
    /** Uniform distribution */
    readonly uniform: {
      /** Probability density function */
      readonly density: typeof uniform.dunif;
      /** Cumulative distribution function */
      readonly probability: typeof uniform.punif;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof uniform.qunif;
      /** Generate random samples */
      readonly random: typeof uniform.runif;
      /** Generate dataset from distribution */
      readonly data: typeof uniform.uniformData;
    };
    /** Weibull distribution */
    readonly weibull: {
      /** Probability density function */
      readonly density: typeof weibull.dweibull;
      /** Cumulative distribution function */
      readonly probability: typeof weibull.pweibull;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof weibull.qweibull;
      /** Generate random samples */
      readonly random: typeof weibull.rweibull;
      /** Generate dataset from distribution */
      readonly data: typeof weibull.weibullData;
    };
    /** Log-normal distribution */
    readonly logNormal: {
      /** Probability density function */
      readonly density: typeof logNormal.dlnorm;
      /** Cumulative distribution function */
      readonly probability: typeof logNormal.plnorm;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof logNormal.qlnorm;
      /** Generate random samples */
      readonly random: typeof logNormal.rlnorm;
    };
    /** Wilcoxon rank-sum distribution */
    readonly wilcoxon: {
      /** Probability density function */
      readonly density: typeof wilcoxon.dwilcox;
      /** Cumulative distribution function */
      readonly probability: typeof wilcoxon.pwilcox;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof wilcoxon.qwilcox;
      /** Generate random samples */
      readonly random: typeof wilcoxon.rwilcox;
    };
    /** Binomial distribution (discrete) */
    readonly binomial: {
      /** Probability mass function */
      readonly density: typeof binomial.dbinom;
      /** Cumulative distribution function */
      readonly probability: typeof binomial.pbinom;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof binomial.qbinom;
      /** Generate random samples */
      readonly random: typeof binomial.rbinom;
      /** Generate dataset from distribution */
      readonly data: typeof binomial.binomialData;
    };
    /** Poisson distribution (discrete) */
    readonly poisson: {
      /** Probability mass function */
      readonly density: typeof poisson.dpois;
      /** Cumulative distribution function */
      readonly probability: typeof poisson.ppois;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof poisson.qpois;
      /** Generate random samples */
      readonly random: typeof poisson.rpois;
      /** Generate dataset from distribution */
      readonly data: typeof poisson.poissonData;
    };
    /** Geometric distribution (discrete) */
    readonly geometric: {
      /** Probability mass function */
      readonly density: typeof geometric.dgeom;
      /** Cumulative distribution function */
      readonly probability: typeof geometric.pgeom;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof geometric.qgeom;
      /** Generate random samples */
      readonly random: typeof geometric.rgeom;
    };
    /** Negative binomial distribution (discrete) */
    readonly negativeBinomial: {
      /** Probability mass function */
      readonly density: typeof negativeBinomial.dnbinom;
      /** Cumulative distribution function */
      readonly probability: typeof negativeBinomial.pnbinom;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof negativeBinomial.qnbinom;
      /** Generate random samples */
      readonly random: typeof negativeBinomial.rnbinom;
    };
    /** Hypergeometric distribution (discrete) */
    readonly hypergeometric: {
      /** Probability mass function */
      readonly density: typeof hypergeometric.dhyper;
      /** Cumulative distribution function */
      readonly probability: typeof hypergeometric.phyper;
      /** Quantile function (inverse CDF) */
      readonly quantile: typeof hypergeometric.qhyper;
      /** Generate random samples */
      readonly random: typeof hypergeometric.rhyper;
    };
  };

  /** Statistical hypothesis tests */
  readonly test: {
    /** Student's t-tests for comparing means */
    readonly t: {
      /** One-sample t-test (compare sample mean to a value) */
      readonly oneSample: typeof statisticalTests.tTestOneSample;
      /** Independent two-sample t-test (compare means of two groups) */
      readonly independent: typeof statisticalTests.tTestIndependent;
      /** Paired t-test (compare related samples) */
      readonly paired: typeof statisticalTests.tTestPaired;
    };

    /** Z-tests for comparing proportions and means (large samples) */
    readonly z: {
      /** One-sample z-test */
      readonly oneSample: typeof statisticalTests.zTestOneSample;
      /** Two-sample z-test */
      readonly twoSample: typeof statisticalTests.zTestTwoSample;
    };

    /** Proportion tests for categorical data */
    readonly proportion: {
      /** One-sample proportion test */
      readonly oneSample: typeof statisticalTests.proportionTestOneSample;
      /** Two-sample proportion test */
      readonly twoSample: typeof statisticalTests.proportionTestTwoSample;
    };

    /** Analysis of Variance (ANOVA) tests */
    readonly anova: {
      /** One-way ANOVA (one factor) */
      readonly oneWay: typeof statisticalTests.anovaOneWay;
      /** Two-way ANOVA (two factors) */
      readonly twoWay: typeof statisticalTests.twoWayAnova;
    };

    /** Correlation tests */
    readonly correlation: {
      /** Pearson correlation test (linear correlation) */
      readonly pearson: typeof statisticalTests.pearsonTest;
      /** Spearman rank correlation test (monotonic correlation) */
      readonly spearman: typeof statisticalTests.spearmanTest;
      /** Kendall's tau correlation test */
      readonly kendall: typeof statisticalTests.kendallTest;
    };

    /** Non-parametric tests (distribution-free) */
    readonly nonparametric: {
      /** Mann-Whitney U test (compare two independent groups) */
      readonly mannWhitney: typeof statisticalTests.mannWhitneyTest;
      /** Wilcoxon signed-rank test (compare paired samples) */
      readonly wilcoxon: typeof statisticalTests.wilcoxonSignedRankTest;
      /** Kruskal-Wallis test (compare multiple groups) */
      readonly kruskalWallis: typeof statisticalTests.kruskalWallisTest;
      /** Kruskal-Wallis test by group */
      readonly kruskalWallisGroup:
        typeof statisticalTests.kruskalWallisTestByGroup;
    };

    /** Tests for categorical data */
    readonly categorical: {
      /** Chi-square test of independence */
      readonly chiSquare: typeof statisticalTests.chiSquareTest;
      /** Fisher's exact test */
      readonly fishersExact: typeof statisticalTests.fishersExactTest;
    };

    /** Tests for normality */
    readonly normality: {
      /** Shapiro-Wilk normality test */
      readonly shapiroWilk: typeof statisticalTests.shapiroWilkTest;
    };
  };

  /** Hierarchical statistical test API (alternative organization) */
  readonly compare: {
    /** Tests for comparing one group to a reference value */
    readonly oneGroup: {
      /** Compare central tendency (mean/median) to a value */
      readonly centralTendency: {
        /** Compare to a specific value */
        readonly toValue: typeof centralTendencyToValue;
      };
      /** Compare proportions to a value */
      readonly proportions: {
        /** Compare to a specific proportion */
        readonly toValue: typeof proportionsToValue;
      };
      /** Compare distribution to normal */
      readonly distribution: {
        /** Test for normality */
        readonly toNormal: typeof distributionToNormal;
      };
    };
    /** Tests for comparing two groups */
    readonly twoGroups: {
      /** Compare central tendencies between two groups */
      readonly centralTendency: {
        /** Compare means/medians of two groups */
        readonly toEachOther: typeof twoGroupCentralTendency;
      };
      /** Compare proportions between two groups */
      readonly proportions: {
        /** Compare proportions of two groups */
        readonly toEachOther: typeof twoGroupProportions;
      };
      /** Test association between two variables */
      readonly association: {
        /** Test correlation/association */
        readonly toEachOther: typeof associationToEachOther;
      };
      /** Compare distributions between two groups */
      readonly distributions: {
        /** Compare distributions of two groups */
        readonly toEachOther: typeof distributionsToEachOther;
      };
    };
    /** Tests for comparing multiple groups */
    readonly multiGroups: {
      /** Compare central tendencies across multiple groups */
      readonly centralTendency: {
        /** Compare means/medians of multiple groups */
        readonly toEachOther: typeof multiGroupCentralTendency;
      };
      /** Compare proportions across multiple groups */
      readonly proportions: {
        /** Compare proportions of multiple groups */
        readonly toEachOther: typeof multiGroupProportions;
      };
    };
    /** Post-hoc tests (follow-up to ANOVA/Kruskal-Wallis) */
    readonly postHoc: {
      /** Dunn's test for multiple comparisons */
      readonly dunn: typeof dunnTest;
      /** Games-Howell test for unequal variances */
      readonly gamesHowell: typeof gamesHowellTest;
      /** Tukey's HSD test for pairwise comparisons */
      readonly tukey: typeof tukeyHSD;
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
  first,
  last,
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
  rolling,
  forwardFill,
  backwardFill,
  interpolate,
  round,
  floor,
  ceiling,
  percent,
  countValue: count_value,
  percentileRank: percentile_rank,
  chunk,
  batch,
  parallel,

  // Distribution Functions
  dist: {
    // Continuous distributions
    normal: {
      density: normal.dnorm,
      probability: normal.pnorm,
      quantile: normal.qnorm,
      random: normal.rnorm,
      data: normal.normalData,
    },
    beta: {
      density: beta.dbeta,
      probability: beta.pbeta,
      quantile: beta.qbeta,
      random: beta.rbeta,
      data: beta.betaData,
    },
    gamma: {
      density: gamma.dgamma,
      probability: gamma.pgamma,
      quantile: gamma.qgamma,
      random: gamma.rgamma,
      data: gamma.gammaData,
    },
    exponential: {
      density: exponential.dexp,
      probability: exponential.pexp,
      quantile: exponential.qexp,
      random: exponential.rexp,
      data: exponential.exponentialData,
    },
    chiSquare: {
      density: chiSquare.dchisq,
      probability: chiSquare.pchisq,
      quantile: chiSquare.qchisq,
      random: chiSquare.rchisq,
      data: chiSquare.chiSquareData,
    },
    t: {
      density: tDist.dt,
      probability: tDist.pt,
      quantile: tDist.qt,
      random: tDist.rt,
      data: tDist.tData,
    },
    f: {
      density: fDist.df,
      probability: fDist.pf,
      quantile: fDist.qf,
      random: fDist.rf,
    },
    uniform: {
      density: uniform.dunif,
      probability: uniform.punif,
      quantile: uniform.qunif,
      random: uniform.runif,
      data: uniform.uniformData,
    },
    weibull: {
      density: weibull.dweibull,
      probability: weibull.pweibull,
      quantile: weibull.qweibull,
      random: weibull.rweibull,
      data: weibull.weibullData,
    },
    logNormal: {
      density: logNormal.dlnorm,
      probability: logNormal.plnorm,
      quantile: logNormal.qlnorm,
      random: logNormal.rlnorm,
    },
    wilcoxon: {
      density: wilcoxon.dwilcox,
      probability: wilcoxon.pwilcox,
      quantile: wilcoxon.qwilcox,
      random: wilcoxon.rwilcox,
    },
    // Discrete distributions
    binomial: {
      density: binomial.dbinom,
      probability: binomial.pbinom,
      quantile: binomial.qbinom,
      random: binomial.rbinom,
      data: binomial.binomialData,
    },
    poisson: {
      density: poisson.dpois,
      probability: poisson.ppois,
      quantile: poisson.qpois,
      random: poisson.rpois,
      data: poisson.poissonData,
    },
    geometric: {
      density: geometric.dgeom,
      probability: geometric.pgeom,
      quantile: geometric.qgeom,
      random: geometric.rgeom,
    },
    negativeBinomial: {
      density: negativeBinomial.dnbinom,
      probability: negativeBinomial.pnbinom,
      quantile: negativeBinomial.qnbinom,
      random: negativeBinomial.rnbinom,
    },
    hypergeometric: {
      density: hypergeometric.dhyper,
      probability: hypergeometric.phyper,
      quantile: hypergeometric.qhyper,
      random: hypergeometric.rhyper,
    },
  },

  // Statistical Tests
  test: {
    // T-tests
    t: {
      oneSample: statisticalTests.tTestOneSample,
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
      twoWay: statisticalTests.twoWayAnova,
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

  // Hierarchical statistical test API
  compare: {
    oneGroup: {
      centralTendency: {
        toValue: centralTendencyToValue,
      },
      proportions: {
        toValue: proportionsToValue,
      },
      distribution: {
        toNormal: distributionToNormal,
      },
    },
    twoGroups: {
      centralTendency: {
        toEachOther: twoGroupCentralTendency,
      },
      proportions: {
        toEachOther: twoGroupProportions,
      },
      association: {
        toEachOther: associationToEachOther,
      },
      distributions: {
        toEachOther: distributionsToEachOther,
      },
    },
    multiGroups: {
      centralTendency: {
        toEachOther: multiGroupCentralTendency,
      },
      proportions: {
        toEachOther: multiGroupProportions,
      },
    },
    postHoc: {
      dunn: dunnTest,
      gamesHowell: gamesHowellTest,
      tukey: tukeyHSD,
    },
  },
};

// Export stats with alias 's' for convenience
export { stats as s };

// Also export the stats constant as default
export default stats;
