// packages/dataframe/ts/transformation/reorder.ts

/**
 * Reorder columns explicitly.
 *
 * Changes the order of columns in the DataFrame according to the specified list.
 * Columns not included in the list will be placed after the specified columns
 * in their original order.
 *
 * @param cols - Column names in desired order
 * @returns New DataFrame with reordered columns
 *
 * @example
 * ```typescript
 * const df = createDataFrame([
 *   { name: "Alice", age: 25, city: "NYC" },
 *   { name: "Bob", age: 30, city: "LA" }
 * ]);
 *
 * const reordered = df.reorder(["city", "name"]); // age will come last
 * // Result: city, name, age columns
 * ```
 */
export function reorder(
  cols: Array<string>,
) {
  // deno-lint-ignore no-explicit-any
  return function (df: any): any {
    const allColumns = df.columns();
    const specified = cols.map(String);
    const remaining = allColumns.filter((col: string) => !specified.includes(col));
    const newOrder = [...specified, ...remaining];

    // Use select to reorder - it maintains types correctly
    // Handle empty DataFrame case by bypassing the type constraint
    return (df as any).select(...newOrder);
  };
}
