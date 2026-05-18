/**
 * Profile a DataFrame by computing comprehensive statistics for each column.
 *
 * For numeric columns, computes: mean, median, min, max, sd, q1, q3, iqr, variance
 * For categorical columns, computes: unique count, top 3 most frequent values
 *
 * @example
 * ```typescript
 * const data = createDataFrame([
 *   { name: "Alice", age: 30, score: 85 },
 *   { name: "Bob", age: 25, score: 92 },
 *   { name: "Charlie", age: 35, score: 78 }
 * ]);
 *
 * const profile = data.profile();
 * profile.print();
 * ```
 */
export declare function profile(df: any): any;
