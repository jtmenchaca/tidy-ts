import { materializeIndex } from "../../dataframe/implementation/columnar-view.ts";
import { validateColumnsExist } from "../../utilities/errors.ts";
import { compareValues } from "../verb-helpers.ts";

/**
 * Extract the nth value from one column after sorting by another column.
 *
 * This method sorts the data by the sortBy column in the specified direction,
 * then returns the value from the specified column at the requested rank position.
 *
 * @param column - The column to extract the value from
 * @param sortBy - The column to sort by
 * @param direction - Sort direction: "asc" for ascending, "desc" for descending
 * @param rank - Optional rank position (default: 1 for first place, 2 for second place, etc.)
 * @returns A function that takes a DataFrame and returns the value from the specified column
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", score: 95, department: "Engineering" },
 *   { name: "Bob", score: 87, department: "Sales" },
 *   { name: "Carol", score: 92, department: "Engineering" }
 * ]);
 *
 * // Get the name of the person with the highest score
 * const topPerformer = df.extractNthWhereSorted("name", "score", "desc"); // "Alice"
 *
 * // Get the department of the person with the second-highest score
 * const secondBestDept = df.extractNthWhereSorted("department", "score", "desc", 2); // "Engineering"
 *
 * // Get the name of the person with the lowest score
 * const worstPerformer = df.extractNthWhereSorted("name", "score", "asc"); // "Bob"
 * ```
 *
 * @remarks
 * - Sorts by the specified column in the given direction
 * - Null/undefined values in sortBy column are sorted to the end
 * - For grouped data, applies within each group
 * - Returns undefined if no rows exist or rank is out of bounds
 */
export function extract_nth_where_sorted(
  column: string,
  sortBy: string,
  direction: "asc" | "desc",
  rank: number = 1,
) {
  return (df: any): any => {
    // deno-lint-ignore no-explicit-any
    const api: any = df as any;
    const store = api.__store;
    const idx = materializeIndex(store.length, api.__view);

    // Validate columns exist (skip for empty DataFrames)
    if (store.length > 0) {
      validateColumnsExist([column, sortBy], store.columnNames);
    }

    const sortColumn = store.columns[sortBy];

    // Sort physical indices by their column values based on direction
    const sortableIndices = Array.from(idx);
    sortableIndices.sort((a, b) =>
      compareValues(sortColumn[a as number], sortColumn[b as number], direction)
    );

    // Take the row at the requested rank
    const targetIndex = sortableIndices[rank - 1];
    if (targetIndex === undefined) {
      return undefined;
    }

    // Return the value from the specified column
    return store.columns[column][targetIndex as number];
  };
}
