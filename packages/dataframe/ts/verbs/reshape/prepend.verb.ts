// deno-lint-ignore-file no-explicit-any
import type { DataFrame } from "../../dataframe/index.ts";
import type { ColumnarStore } from "../../dataframe/implementation/columnar-store.ts";
import { createColumnarDataFrameFromStore } from "../../dataframe/implementation/create-dataframe.ts";

/**
 * Add rows to the top of a DataFrame.
 *
 * @param rows - Rows to prepend to the DataFrame
 * @returns A function that takes a DataFrame and returns it with rows prepended
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 30 }
 * ]);
 *
 * // Prepend new rows
 * const extended = pipe(df, prepend(
 *   { name: "Carol", age: 28 },
 *   { name: "David", age: 32 }
 * ));
 * // Results in 4 rows total with new rows at the beginning
 * ```
 *
 * @remarks
 * - Adds rows to the beginning of the DataFrame
 * - Creates a new DataFrame without modifying the original
 * - New rows must have compatible structure with existing DataFrame
 * - Useful for adding headers, defaults, or priority rows
 */
// Overload for single object
export function prepend<T extends Record<string, unknown>>(
  row: T,
): (df: DataFrame<T>) => DataFrame<T>;

// Overload for array of objects
export function prepend<T extends Record<string, unknown>>(
  rows: T[],
): (df: DataFrame<T>) => DataFrame<T>;

// Overload for multiple individual objects
export function prepend<T extends Record<string, unknown>>(
  ...rows: T[]
): (df: DataFrame<T>) => DataFrame<T>;

export function prepend<T extends Record<string, unknown>>(
  rowOrRows: T | T[] | DataFrame<T> | unknown,
  ...additionalRows: T[]
) {
  return (df: DataFrame<T>): DataFrame<T> => {
    let rowsToAdd: T[];
    let isDataFrameInput = false;

    // Handle different input types
    if (rowOrRows && typeof rowOrRows === "object" && "nrows" in rowOrRows) {
      // DataFrame input - convert to rows, preserving all original data
      const dfApi = rowOrRows as any;
      const dfStore = dfApi.__store as ColumnarStore;

      isDataFrameInput = true;
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

    // Validate prepended rows against the existing schema (raw rows only, not DataFrame merges)
    if (!isDataFrameInput) {
      const schemaColumns = originalStore.columnNames;
      for (let i = 0; i < rowsToAdd.length; i++) {
        const row = rowsToAdd[i];
        const rowKeys = Object.keys(row);

        // Check for missing columns
        for (const col of schemaColumns) {
          if (!(col in row)) {
            throw new Error(
              `prepend: row ${i} is missing column "${col}". ` +
                `Expected columns: [${schemaColumns.join(", ")}]. ` +
                `Got: [${rowKeys.join(", ")}]`,
            );
          }
        }

        // Check for type mismatches against existing column data
        if (originalStore.length > 0) {
          for (const col of schemaColumns) {
            const existingVal = originalStore.columns[col][0];
            const newVal = (row as any)[col];
            if (
              existingVal !== null &&
              existingVal !== undefined &&
              newVal !== null &&
              newVal !== undefined &&
              typeof existingVal !== typeof newVal
            ) {
              throw new Error(
                `prepend: row ${i} has wrong type for column "${col}". ` +
                  `Expected ${typeof existingVal}, got ${typeof newVal}`,
              );
            }
          }
        }
      }
    }

    const prependCount = rowsToAdd.length;
    const originalLength = originalStore.length;
    const totalLength = prependCount + originalLength;

    // Get all unique column names (original first, then new)
    const columnInsertionOrder: string[] = [];

    originalStore.columnNames.forEach((col) => {
      if (!columnInsertionOrder.includes(col)) {
        columnInsertionOrder.push(col);
      }
    });

    rowsToAdd.forEach((row) => {
      Object.keys(row).forEach((col) => {
        if (!columnInsertionOrder.includes(col)) {
          columnInsertionOrder.push(col);
        }
      });
    });

    const sortedColumns = columnInsertionOrder;

    // Create new columnar store with prepended arrays
    const newColumns: Record<string, unknown[]> = {};

    for (const colName of sortedColumns) {
      const newArray = new Array(totalLength);

      // Add prepended row values first
      for (let i = 0; i < prependCount; i++) {
        const row = rowsToAdd[i];
        newArray[i] = colName in row ? (row as any)[colName] : undefined;
      }

      // Copy existing column data after
      if (originalStore.columns[colName]) {
        const originalArray = originalStore.columns[colName];
        for (let i = 0; i < originalLength; i++) {
          newArray[prependCount + i] = originalArray[i];
        }
      } else {
        for (let i = 0; i < originalLength; i++) {
          newArray[prependCount + i] = undefined;
        }
      }

      newColumns[colName] = newArray;
    }

    const newStore: ColumnarStore = {
      columns: newColumns,
      length: totalLength,
      columnNames: sortedColumns,
      rowLabels: originalStore.rowLabels,
    };

    return createColumnarDataFrameFromStore<T>(
      newStore,
    ) as unknown as DataFrame<T>;
  };
}
