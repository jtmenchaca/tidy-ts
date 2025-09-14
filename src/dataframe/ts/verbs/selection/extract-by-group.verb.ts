import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Extract a column's values into arrays grouped by another column's values.
 *
 * This function takes two columns - a grouping column and a value column - and
 * returns a Record where keys are the unique values from the grouping column
 * and values are arrays containing all corresponding values from the value column.
 *
 * This is useful for statistical analysis where you need to collect all values
 * for each group while maintaining type safety.
 *
 * @param groupColumn - Column to group by (becomes keys in result)
 * @param valueColumn - Column whose values to collect (becomes array values in result)
 * @returns A function that takes a DataFrame and returns Record<string, T[ValueCol][]>
 *
 * @example
 * ```ts
 * const data = createDataFrame([
 *   { treatment: "A", score: 85 },
 *   { treatment: "A", score: 90 },
 *   { treatment: "B", score: 78 },
 *   { treatment: "B", score: 82 }
 * ]);
 *
 * const grouped = pipe(data, extract_column_by_group("treatment", "score"));
 * // Result: { "A": [85, 90], "B": [78, 82] }
 * ```
 *
 * @remarks
 * - Maintains full type safety - return type is inferred from input columns
 * - Null/undefined values in groupColumn are converted to "null"/"undefined" strings
 * - All values from valueColumn are included, including null/undefined
 * - Groups maintain the order of first appearance in the data
 * - Empty dataframes return empty Record
 * - More type-safe alternative to pivot_wider when you need arrays rather than spread columns
 */
export function extract_column_by_group<
  T extends Record<string, unknown>,
  GroupCol extends keyof T,
  ValueCol extends keyof T,
>(
  groupColumn: GroupCol,
  valueColumn: ValueCol,
): (df: DataFrame<T>) => Record<string, T[ValueCol][]> {
  return (df: DataFrame<T>) => {
    // Validate columns exist
    if (df.nrows() > 0) {
      const firstRow = df[0];
      if (!(groupColumn in firstRow)) {
        throw new Error(
          `Group column '${String(groupColumn)}' not found in data`,
        );
      }
      if (!(valueColumn in firstRow)) {
        throw new Error(
          `Value column '${String(valueColumn)}' not found in data`,
        );
      }
    }

    const result: Record<string, T[ValueCol][]> = {};

    // Process each row and group values
    for (const row of df) {
      const groupValue = row[groupColumn];
      const valueToCollect = row[valueColumn];

      // Convert group value to string key, handling null/undefined
      let groupKey: string;
      if (groupValue === null) {
        groupKey = "null";
      } else if (groupValue === undefined) {
        groupKey = "undefined";
      } else {
        groupKey = String(groupValue);
      }

      // Initialize array if this is the first time we see this group
      if (!(groupKey in result)) {
        result[groupKey] = [];
      }

      // Add the value to the group's array
      result[groupKey].push(valueToCollect);
    }

    return result;
  };
}
