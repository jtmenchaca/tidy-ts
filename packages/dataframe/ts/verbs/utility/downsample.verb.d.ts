/**
 * Downsample time-series data by aggregating to a lower frequency.
 *
 * Groups rows by time buckets and applies aggregation functions to each bucket.
 * Use this when converting from higher frequency to lower frequency (e.g., hourly to daily).
 */
export declare function downsample(args: any): (df: any) => any;
