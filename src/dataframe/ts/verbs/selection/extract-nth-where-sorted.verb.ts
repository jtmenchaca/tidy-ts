import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import { createDataFrame, withGroupsRebuilt } from "../../dataframe/index.ts";
import { bitsetGet } from "../../dataframe/implementation/columnar-view.ts";
import { materializeIndex } from "../../dataframe/implementation/columnar-view.ts";

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
 * - Maintains type safety with proper column name inference
 */
export function extract_nth_where_sorted<
  T extends Record<string, unknown>,
  ColName extends keyof T,
  SortColName extends keyof T,
>(
  column: ColName,
  sortBy: SortColName,
  direction: "asc" | "desc",
  rank: number = 1,
) {
  return (df: DataFrame<T> | GroupedDataFrame<T>) => {
    const groupedDf = df as GroupedDataFrame<T>;

    if (groupedDf.__groups) {
      // Handle grouped data
      // deno-lint-ignore no-explicit-any
      const api: any = df as any;
      const store = api.__store;
      const mask = api.__view?.mask;
      const rebuilt: T[] = [];

      if (!groupedDf.__groups) return undefined;
      const { head, next, size } = groupedDf.__groups;

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        // Collect physical indices for this group, filtering by mask if present
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          // Only include this row if it passes the mask (or if there's no mask)
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }
        // Adjacency list gives us rows in reverse order, so reverse to get original order
        groupIndices.reverse();

        // Build rows from indices
        const groupData = groupIndices.map((i: number) => {
          const row = {} as T;
          for (const colName of store.columnNames) {
            // deno-lint-ignore no-explicit-any
            (row as any)[colName] = store.columns[colName][i];
          }
          return row;
        });

        // Separate defined and undefined values
        const definedData = groupData.filter((row) => row[sortBy] != null);
        const undefinedData = groupData.filter((row) => row[sortBy] == null);

        // Sort defined values based on direction
        const sortedDefined = [...definedData].sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          if (typeof aVal === "number" && typeof bVal === "number") {
            return direction === "desc" ? bVal - aVal : aVal - bVal;
          }
          if (aVal instanceof Date && bVal instanceof Date) {
            return direction === "desc"
              ? bVal.getTime() - aVal.getTime()
              : aVal.getTime() - bVal.getTime();
          }
          return direction === "desc"
            ? String(bVal).localeCompare(String(aVal))
            : String(aVal).localeCompare(String(bVal));
        });

        // Take first n from defined values, then undefined if needed
        const toTake = Math.min(rank, groupData.length);
        let taken = 0;

        // First, take from sorted defined values
        for (let i = 0; i < Math.min(toTake, sortedDefined.length); i++) {
          rebuilt.push(sortedDefined[i]);
          taken++;
        }

        // If we need more and have undefined values, take those
        for (
          let i = 0;
          i < Math.min(toTake - taken, undefinedData.length);
          i++
        ) {
          rebuilt.push(undefinedData[i]);
        }
      }

      const out = createDataFrame(rebuilt);
      const result = withGroupsRebuilt(groupedDf, rebuilt, out);

      // Return the value from the specified column at the requested rank
      if (result.nrows() >= rank) {
        return result[rank - 1][column];
      }
      return undefined;
    } else {
      // Handle ungrouped data
      // deno-lint-ignore no-explicit-any
      const api: any = df as any;
      const store = api.__store;
      const idx = materializeIndex(store.length, api.__view);

      const sortColumn = store.columns[sortBy as string];
      if (!sortColumn) {
        // Column doesn't exist, return undefined
        return undefined;
      }

      // Sort physical indices by their column values based on direction
      const sortableIndices = Array.from(idx);
      sortableIndices.sort((a, b) => {
        const aVal = sortColumn[a as number];
        const bVal = sortColumn[b as number];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "number" && typeof bVal === "number") {
          return direction === "desc" ? bVal - aVal : aVal - bVal;
        }
        if (aVal instanceof Date && bVal instanceof Date) {
          return direction === "desc"
            ? bVal.getTime() - aVal.getTime()
            : aVal.getTime() - bVal.getTime();
        }
        return direction === "desc"
          ? String(bVal).localeCompare(String(aVal))
          : String(aVal).localeCompare(String(bVal));
      });

      // Take the row at the requested rank
      const targetIndex = sortableIndices[rank - 1];
      if (targetIndex === undefined) {
        return undefined;
      }

      // Return the value from the specified column
      return store
        .columns[column as string][targetIndex as number] as T[ColName];
    }
  };
}
