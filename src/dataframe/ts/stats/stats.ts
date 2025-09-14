import { sum } from "./sum.ts";
import { mean } from "./mean.ts";
import { median } from "./median.ts";
import { mode } from "./mode.ts";
import { min } from "./min.ts";
import { max } from "./max.ts";
import { product } from "./product.ts";
import { range } from "./range.ts";
import { variance } from "./variance.ts";
import { sd } from "./standard-deviation.ts";
import { iqr } from "./iqr.ts";
import { quantile } from "./quantile.ts";
import { quartiles } from "./quartiles.ts";
import { covariance } from "./covariance.ts";
import { corr } from "./corr.ts";
import { unique } from "./unique.ts";
import { uniqueCount } from "./unique-count.ts";
import { cumsum } from "./cumsum.ts";
import { rank } from "./rank.ts";
import { denseRank } from "./dense-rank.ts";
import { normalize } from "./normalize.ts";
import { cumprod } from "./cumprod.ts";
import { cummin } from "./cummin.ts";
import { cummean } from "./cummean.ts";
import { cummax } from "./cummax.ts";
import { lag } from "./lag.ts";
import { lead } from "./lead.ts";
import { round } from "./round.ts";
import { floor } from "./floor.ts";
import { ceiling } from "./ceiling.ts";
import { count_value } from "./count_value.ts";
import { percentile_rank } from "./percentile-rank.ts";

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
 * const mean = stats.mean(df.value); // 20
 * const sum = stats.sum(df.value);   // 60
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
};

// Also export the stats constant as default
export default stats;
