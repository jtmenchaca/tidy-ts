/**
 * Upsample time-series data by filling gaps to a higher frequency.
 *
 * Generates a complete time sequence and fills missing values using a simple fill strategy.
 * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
 */
export declare function upsample(args: any): (df: any) => any;
