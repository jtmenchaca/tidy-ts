// deno-lint-ignore-file no-explicit-any
import type { DataFrame } from "../../dataframe/index.ts";
import type { ColumnarStore } from "../../dataframe/implementation/columnar-store.ts";
import { createColumnarDataFrameFromStore } from "../../dataframe/implementation/create-dataframe.ts";

/**
 * Add rows to the bottom of a DataFrame.
 *
 * @param rows - Rows to append to the DataFrame
 * @returns A function that takes a DataFrame and returns it with rows appended
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 30 }
 * ]);
 *
 * // Append new rows
 * const extended = pipe(df, append(
 *   { name: "Carol", age: 28 },
 *   { name: "David", age: 32 }
 * ));
 * // Results in 4 rows total with new rows at the end
 * ```
 *
 * @remarks
 * - Adds rows to the end of the DataFrame
 * - Creates a new DataFrame without modifying the original
 * - New rows must have compatible structure with existing DataFrame
 * - Equivalent to bind_rows but more intuitive for adding a few rows
 */
// Overload for single object
export function append<T extends Record<string, unknown>>(
  row: T,
): (df: DataFrame<T>) => DataFrame<T>;

// Overload for array of objects
export function append<T extends Record<string, unknown>>(
  rows: T[],
): (df: DataFrame<T>) => DataFrame<T>;

// Overload for multiple individual objects
export function append<T extends Record<string, unknown>>(
  ...rows: T[]
): (df: DataFrame<T>) => DataFrame<T>;

export function append<T extends Record<string, unknown>>(
  rowOrRows: T | T[] | DataFrame<T> | unknown,
  ...additionalRows: T[]
) {
  return (df: DataFrame<T>): DataFrame<T> => {
    let rowsToAdd: T[];

    // Handle different input types
    if (rowOrRows && typeof rowOrRows === "object" && "nrows" in rowOrRows) {
      // DataFrame input - convert to rows, preserving all original data
      // NOTE: We can't just use [...df] because the DataFrame might have lost columns
      // due to toColumnarStorage only scanning the first row
      const dfApi = rowOrRows as any;
      const dfStore = dfApi.__store as ColumnarStore;

      // Reconstruct rows from columnar storage to ensure we have all available data
      rowsToAdd = [];
      for (let i = 0; i < dfStore.length; i++) {
        const row: any = {};
        for (const colName of dfStore.columnNames) {
          row[colName] = dfStore.columns[colName][i];
        }
        rowsToAdd.push(row);
      }
    } else if (Array.isArray(rowOrRows)) {
      // Single array of objects
      rowsToAdd = rowOrRows;
    } else if (additionalRows.length > 0) {
      // Multiple individual objects
      rowsToAdd = [rowOrRows as T, ...additionalRows];
    } else {
      // Single object
      rowsToAdd = [rowOrRows as T];
    }

    // If no rows to add, return the original DataFrame
    if (rowsToAdd.length === 0) {
      return df;
    }

    // COLUMNAR OPTIMIZATION: Work directly with columnar storage
    const api = df as any;
    const originalStore = api.__store as ColumnarStore;
    const originalLength = originalStore.length;
    const newRowsCount = rowsToAdd.length;
    const totalLength = originalLength + newRowsCount;

    // Get all unique column names
    const allColumns = new Set<string>();

    // Add columns from original DataFrame
    originalStore.columnNames.forEach((col) => allColumns.add(col));

    // Add columns from rows to add
    rowsToAdd.forEach((row) => {
      Object.keys(row).forEach((col) => allColumns.add(col));
    });

    // Use insertion order for intuitive column ordering
    const columnInsertionOrder: string[] = [];

    // Add columns from original DataFrame first
    originalStore.columnNames.forEach((col) => {
      if (!columnInsertionOrder.includes(col)) {
        columnInsertionOrder.push(col);
      }
    });

    // Add new columns from rows to add
    rowsToAdd.forEach((row) => {
      Object.keys(row).forEach((col) => {
        if (!columnInsertionOrder.includes(col)) {
          columnInsertionOrder.push(col);
        }
      });
    });

    const sortedColumns = columnInsertionOrder;

    // Create new columnar store with extended arrays
    const newColumns: Record<string, unknown[]> = {};

    for (const colName of sortedColumns) {
      const newArray = new Array(totalLength);

      // Copy existing column data or fill with undefined
      if (originalStore.columns[colName]) {
        // Column exists in original - copy values
        const originalArray = originalStore.columns[colName];
        for (let i = 0; i < originalLength; i++) {
          newArray[i] = originalArray[i];
        }
      } else {
        // Column doesn't exist in original - fill with undefined
        for (let i = 0; i < originalLength; i++) {
          newArray[i] = undefined;
        }
      }

      // Add new row values
      for (let i = 0; i < newRowsCount; i++) {
        const row = rowsToAdd[i];
        newArray[originalLength + i] = colName in row
          ? (row as any)[colName]
          : undefined;
      }

      newColumns[colName] = newArray;
    }

    // Create new columnar store
    const newStore: ColumnarStore = {
      columns: newColumns,
      length: totalLength,
      columnNames: sortedColumns,
      // Preserve row labels if they exist
      rowLabels: originalStore.rowLabels,
    };

    // Create DataFrame from the new store (most efficient path)
    return createColumnarDataFrameFromStore<T>(
      newStore,
    ) as unknown as DataFrame<T>;
  };
}
