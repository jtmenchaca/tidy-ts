// deno-lint-ignore-file no-explicit-any
import {
  createDataFrame,
  materializeIndex,
  withGroups,
} from "../../dataframe/index.ts";
import { validateColumnsExist } from "../../utilities/errors.ts";
import { RowView, wrapRowView } from "../verb-helpers.ts";

/**
 * Mutate across multiple columns of the same type.
 *
 * Applies functions to individual column values (row-level operations) across multiple
 * columns of the same type. Creates new columns for each function applied to each
 * specified column.
 *
 * @param config - Specification object defining columns and functions to apply
 * @returns A function that takes a DataFrame and returns the modified DataFrame
 *
 * @example
 * ```ts
 * // Apply multiple functions to numeric columns
 * pipe(df, mutate_columns({
 *   colType: "number",
 *   columns: ["score1", "score2", "score3"],
 *   newColumns: [
 *     { prefix: "add_1_", fn: (col) => col + 1 },
 *     { prefix: "double_", fn: (col) => col * 2 }
 *   ]
 * }))
 *
 * // Apply string operations
 * pipe(df, mutate_columns({
 *   colType: "string",
 *   columns: ["name", "city"],
 *   newColumns: [
 *     { prefix: "upper_", fn: (col) => col.toUpperCase() },
 *     { suffix: "_length", fn: (col) => col.length }
 *   ]
 * }))
 *
 * // Works with grouped data (applies same row-level operations)
 * pipe(df, group_by("category"), mutate_columns({
 *   colType: "number",
 *   columns: ["value1", "value2"],
 *   newColumns: [{ prefix: "scaled_", fn: (col) => col * 10 }]
 * }))
 * ```
 *
 * @remarks
 * - Functions receive individual column values, not entire columns
 * - New column names are created as: `{prefix}{original_column_name}{suffix}`
 * - Works with both grouped and ungrouped dataframes
 * - For grouped data, applies same row-level operations within each group
 * - Preserves the original dataframe (does not mutate)
 * - Provides type safety based on colType parameter
 * - All specified columns must be of the same type
 */
export function mutate_columns(
  config: {
    colType: string;
    columns: readonly string[];
    newColumns: readonly {
      prefix?: string;
      suffix?: string;
      fn: (col: any) => any;
    }[];
  },
) {
  return (
    df: any,
  ): any => {
    const api: any = df;
    const store = api.__store;

    // View-aware implementation for columnar storage
    if (store) {
      const idx = materializeIndex(store.length, api.__view);
      const viewLength = idx.length;

      // Runtime validation using store columns
      validateColumnsExist(
        config.columns.map(String),
        store.columnNames,
      );

      // Build new columns
      const newColumns: Record<string, unknown[]> = {};
      const newColumnNames: string[] = [...store.columnNames];

      // Copy existing columns with view awareness
      for (const colName of store.columnNames) {
        const sourceCol = store.columns[colName];
        const newCol = new Array(viewLength);
        for (let i = 0; i < viewLength; i++) {
          newCol[i] = sourceCol[idx[i]];
        }
        newColumns[colName] = newCol;
      }

      // Add new computed columns
      for (const col of config.columns) {
        const colName = String(col);
        const sourceCol = store.columns[colName];

        for (const newColSpec of config.newColumns) {
          const { prefix = "", suffix = "", fn } = newColSpec;
          const newColName = `${prefix}${colName}${suffix}`;
          const newCol = new Array(viewLength);

          for (let i = 0; i < viewLength; i++) {
            const physicalIdx = idx[i];
            const value = sourceCol[physicalIdx];

            // Type validation
            if (config.colType === "number" && typeof value !== "number") {
              throw new Error(
                `Column "${colName}" contains non-numeric values but colType is "number"`,
              );
            }
            if (config.colType === "string" && typeof value !== "string") {
              throw new Error(
                `Column "${colName}" contains non-string values but colType is "string"`,
              );
            }
            if (config.colType === "boolean" && typeof value !== "boolean") {
              throw new Error(
                `Column "${colName}" contains non-boolean values but colType is "boolean"`,
              );
            }

            newCol[i] = fn(value);
          }

          newColumns[newColName] = newCol;
          newColumnNames.push(newColName);
        }
      }

      const newStore = {
        columns: newColumns,
        columnNames: newColumnNames,
        length: viewLength,
      };

      const outDf = createDataFrame([]);
      (outDf as any).__store = newStore;
      (outDf as any).__view = {}; // reset view

      (outDf as any).__rowView = wrapRowView(new RowView(newColumns, newColumnNames), newColumnNames);

      const groupedDf = df as any;
      if (groupedDf.__groups) {
        return withGroups(groupedDf, outDf);
      } else {
        return outDf;
      }
    }

    // Fallback for non-columnar DataFrames
    const groupedDf = df as any;
    const out: Record<string, unknown>[] = [];
    for (const row of df) {
      out.push({ ...row });
    }

    // Runtime validation
    if (df.nrows() > 0) {
      validateColumnsExist(
        config.columns.map(String),
        Object.keys(df[0]),
      );
    }

    // Helper function to get properly typed column value
    const getColumnValue = (
      row: Record<string, unknown>,
      col: string,
    ): any => {
      const rawValue = row[col as string];

      // Type validation
      if (config.colType === "number" && typeof rawValue !== "number") {
        throw new Error(
          `Column "${
            String(col)
          }" contains non-numeric values but colType is "number"`,
        );
      }
      if (config.colType === "string" && typeof rawValue !== "string") {
        throw new Error(
          `Column "${
            String(col)
          }" contains non-string values but colType is "string"`,
        );
      }
      if (config.colType === "boolean" && typeof rawValue !== "boolean") {
        throw new Error(
          `Column "${
            String(col)
          }" contains non-boolean values but colType is "boolean"`,
        );
      }

      return rawValue;
    };

    // Apply row-level mutations to all rows (same logic for grouped and ungrouped)
    for (let rowIndex = 0; rowIndex < out.length; rowIndex++) {
      const row = out[rowIndex];
      for (const col of config.columns) {
        const colValue = getColumnValue(row, col);

        for (const newCol of config.newColumns) {
          const { prefix = "", suffix = "", fn } = newCol;
          const newColName = `${prefix}${String(col)}${suffix}`;
          out[rowIndex][newColName] = fn(colValue);
        }
      }
    }

    const outDf = createDataFrame(out);

    if (groupedDf.__groups) {
      return withGroups(groupedDf, outDf);
    }

    return outDf;
  };
}
