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
import { percent } from "./transformation/percent.ts";
import { count_value } from "./descriptive/counts/count-value.ts";
import { percentile_rank } from "./ranking/percentile-rank.ts";

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
  readonly percent: typeof percent;
  readonly countValue: typeof count_value;
  readonly percentileRank: typeof percentile_rank;

  // Distribution Functions
  readonly dist: {
    // Continuous distributions
    readonly normal: {
      readonly density: typeof normal.dnorm;
      readonly probability: typeof normal.pnorm;
      readonly quantile: typeof normal.qnorm;
      readonly random: typeof normal.rnorm;
      readonly data: typeof normal.normalData;
    };
    readonly beta: {
      readonly density: typeof beta.dbeta;
      readonly probability: typeof beta.pbeta;
      readonly quantile: typeof beta.qbeta;
      readonly random: typeof beta.rbeta;
      readonly data: typeof beta.betaData;
    };
    readonly gamma: {
      readonly density: typeof gamma.dgamma;
      readonly probability: typeof gamma.pgamma;
      readonly quantile: typeof gamma.qgamma;
      readonly random: typeof gamma.rgamma;
      readonly data: typeof gamma.gammaData;
    };
    readonly exponential: {
      readonly density: typeof exponential.dexp;
      readonly probability: typeof exponential.pexp;
      readonly quantile: typeof exponential.qexp;
      readonly random: typeof exponential.rexp;
      readonly data: typeof exponential.exponentialData;
    };
    readonly chiSquare: {
      readonly density: typeof chiSquare.dchisq;
      readonly probability: typeof chiSquare.pchisq;
      readonly quantile: typeof chiSquare.qchisq;
      readonly random: typeof chiSquare.rchisq;
      readonly data: typeof chiSquare.chiSquareData;
    };
    readonly t: {
      readonly density: typeof tDist.dt;
      readonly probability: typeof tDist.pt;
      readonly quantile: typeof tDist.qt;
      readonly random: typeof tDist.rt;
      readonly data: typeof tDist.tData;
    };
    readonly f: {
      readonly density: typeof fDist.df;
      readonly probability: typeof fDist.pf;
      readonly quantile: typeof fDist.qf;
      readonly random: typeof fDist.rf;
    };
    readonly uniform: {
      readonly density: typeof uniform.dunif;
      readonly probability: typeof uniform.punif;
      readonly quantile: typeof uniform.qunif;
      readonly random: typeof uniform.runif;
      readonly data: typeof uniform.uniformData;
    };
    readonly weibull: {
      readonly density: typeof weibull.dweibull;
      readonly probability: typeof weibull.pweibull;
      readonly quantile: typeof weibull.qweibull;
      readonly random: typeof weibull.rweibull;
      readonly data: typeof weibull.weibullData;
    };
    readonly logNormal: {
      readonly density: typeof logNormal.dlnorm;
      readonly probability: typeof logNormal.plnorm;
      readonly quantile: typeof logNormal.qlnorm;
      readonly random: typeof logNormal.rlnorm;
    };
    readonly wilcoxon: {
      readonly density: typeof wilcoxon.dwilcox;
      readonly probability: typeof wilcoxon.pwilcox;
      readonly quantile: typeof wilcoxon.qwilcox;
      readonly random: typeof wilcoxon.rwilcox;
    };
    // Discrete distributions
    readonly binomial: {
      readonly density: typeof binomial.dbinom;
      readonly probability: typeof binomial.pbinom;
      readonly quantile: typeof binomial.qbinom;
      readonly random: typeof binomial.rbinom;
      readonly data: typeof binomial.binomialData;
    };
    readonly poisson: {
      readonly density: typeof poisson.dpois;
      readonly probability: typeof poisson.ppois;
      readonly quantile: typeof poisson.qpois;
      readonly random: typeof poisson.rpois;
      readonly data: typeof poisson.poissonData;
    };
    readonly geometric: {
      readonly density: typeof geometric.dgeom;
      readonly probability: typeof geometric.pgeom;
      readonly quantile: typeof geometric.qgeom;
      readonly random: typeof geometric.rgeom;
    };
    readonly negativeBinomial: {
      readonly density: typeof negativeBinomial.dnbinom;
      readonly probability: typeof negativeBinomial.pnbinom;
      readonly quantile: typeof negativeBinomial.qnbinom;
      readonly random: typeof negativeBinomial.rnbinom;
    };
    readonly hypergeometric: {
      readonly density: typeof hypergeometric.dhyper;
      readonly probability: typeof hypergeometric.phyper;
      readonly quantile: typeof hypergeometric.qhyper;
      readonly random: typeof hypergeometric.rhyper;
    };
  };

  // Statistical Tests
  readonly test: {
    // T-tests
    readonly t: {
      readonly oneSample: typeof statisticalTests.tTestOneSample;
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

  // Hierarchical statistical test API
  readonly compare: {
    readonly oneGroup: {
      readonly centralTendency: {
        readonly toValue: typeof centralTendencyToValue;
      };
      readonly proportions: {
        readonly toValue: typeof proportionsToValue;
      };
      readonly distribution: {
        readonly toNormal: typeof distributionToNormal;
      };
    };
    readonly twoGroups: {
      readonly centralTendency: {
        readonly toEachOther: typeof twoGroupCentralTendency;
      };
      readonly proportions: {
        readonly toEachOther: typeof twoGroupProportions;
      };
      readonly association: {
        readonly toEachOther: typeof associationToEachOther;
      };
      readonly distributions: {
        readonly toEachOther: typeof distributionsToEachOther;
      };
    };
    readonly multiGroups: {
      readonly centralTendency: {
        readonly toEachOther: typeof multiGroupCentralTendency;
      };
      readonly proportions: {
        readonly toEachOther: typeof multiGroupProportions;
      };
    };
    readonly postHoc: {
      readonly dunn: typeof dunnTest;
      readonly gamesHowell: typeof gamesHowellTest;
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
  round,
  floor,
  ceiling,
  percent,
  countValue: count_value,
  percentileRank: percentile_rank,

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
