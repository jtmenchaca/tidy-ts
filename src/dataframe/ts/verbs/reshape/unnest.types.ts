import type { DataFrame, Prettify } from "../../dataframe/index.ts";
import type {
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

/**
 * Helper type to extract the element type from an array type
 * Handles both T[] and T[] | null
 */
type ArrayElement<T> = T extends (infer U)[] ? U
  : T extends (infer U)[] | null ? U
  : never;

/**
 * Helper type to check if a type is an array
 */
type IsArray<T> = T extends unknown[] ? true : false;

/**
 * Helper type to extract only array column names from Row
 * Supports both T[] and T[] | null (from previous unnest operations)
 */
type ArrayColumns<Row extends object> = {
  [K in keyof Row]: Row[K] extends unknown[] ? K
    : Row[K] extends (infer U)[] | null ? K
    : never;
}[keyof Row];

/**
 * Helper type to unnest a single array column, replacing it with its element type | null
 * (null accounts for empty arrays)
 */
type UnnestColumn<Row, Col extends keyof Row> = IsArray<Row[Col]> extends true
  ? Omit<Row, Col> & { [K in Col]: ArrayElement<Row[Col]> | null }
  : Row;

/**
 * Error message for unnest on empty DataFrame
 */
type EmptyDataFrameUnnest =
  "🚨 Cannot unnest empty DataFrame - no columns available! Try adding data first with createDataFrame([...rows])";

/**
 * Error message for unnest on non-array column
 */
type NonArrayColumnUnnest =
  "🚨 Cannot unnest non-array column - column must contain array values! Only columns with array types can be unnested.";

/**
 * Type for the unnest method that flattens array columns into individual rows.
 *
 * @template Row - The row type of the DataFrame
 */
export type UnnestMethod<Row extends object> = {
  /**
   * Unnest a single array column, creating one row per array element.
   *
   * Takes an array column and creates multiple rows, one for each element in the array.
   * Other columns are duplicated for each array element. Empty arrays result in no rows
   * for that original row.
   *
   * @param column - The array column to unnest
   * @returns DataFrame with the array column flattened into individual rows
   *
   * @example
   * ```ts
   * const df = createDataFrame([
   *   { id: 1, name: "Alice", tags: ["admin", "user"] },
   *   { id: 2, name: "Bob", tags: ["user"] },
   *   { id: 3, name: "Charlie", tags: [] }
   * ]);
   *
   * // Unnest the tags column
   * const unnested = df.unnest("tags");
   * // Result: [
   * //   { id: 1, name: "Alice", tags: "admin" },
   * //   { id: 1, name: "Alice", tags: "user" },
   * //   { id: 2, name: "Bob", tags: "user" },
   * //   { id: 3, name: "Charlie", tags: null }
   * // ]
   * ```
   */
  <Col extends ArrayColumns<Row>>(
    column: RestrictEmptyDataFrame<Row, Col, EmptyDataFrameUnnest>,
  ): DataFrame<Prettify<UnnestColumn<Row, Col>>>;

  /**
   * Unnest multiple array columns, creating one row per combination of array elements.
   *
   * Takes multiple array columns and creates rows for each combination of elements
   * from all arrays. This is equivalent to a cross product of all array elements.
   *
   * @param columns - Array of column names to unnest
   * @returns DataFrame with all array columns flattened
   *
   * @example
   * ```ts
   * const df = createDataFrame([
   *   { id: 1, tags: ["a", "b"], categories: ["x", "y"] }
   * ]);
   *
   * // Unnest both array columns
   * const unnested = df.unnest(["tags", "categories"]);
   * // Result: [
   * //   { id: 1, tags: "a", categories: "x" },
   * //   { id: 1, tags: "a", categories: "y" },
   * //   { id: 1, tags: "b", categories: "x" },
   * //   { id: 1, tags: "b", categories: "y" }
   * // ]
   * ```
   */
  <Cols extends readonly ArrayColumns<Row>[]>(
    columns: RestrictEmptyDataFrame<Row, Cols, EmptyDataFrameUnnest>,
  ): DataFrame<Prettify<UnnestMultipleColumns<Row, Cols>>>;
};

/**
 * Helper type to unnest multiple columns
 */
type UnnestMultipleColumns<Row, Cols extends readonly (keyof Row)[]> =
  Cols extends readonly [infer First, ...infer Rest]
    ? First extends keyof Row
      ? Rest extends readonly (keyof Row)[]
        ? UnnestColumn<UnnestMultipleColumns<Row, Rest>, First>
      : UnnestColumn<Row, First>
    : Row
    : Row;
