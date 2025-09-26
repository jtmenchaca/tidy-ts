// deno-lint-ignore-file no-explicit-any
import type {
  ColumnarStore,
  DataFrame,
  GroupedDataFrame,
  Prettify,
  UnionToIntersection,
} from "../../dataframe/index.ts";
import {
  createDataFrame,
  materializeIndex,
  withGroups,
} from "../../dataframe/index.ts";

/**
 * Conditional type to map colType to the correct value type.
 * Ensures type safety by mapping column type strings to their corresponding TypeScript types.
 */
type ColumnValueMap = {
  number: number;
  string: string;
  boolean: boolean;
};

/**
 * Type for mutate_columns specification with better type safety.
 *
 * @template Row - The dataframe type
 * @template ColType - The column type ("number", "string", or "boolean")
 */
export type MutateColumnsSpec<
  Row extends Record<string, unknown>,
  ColType extends keyof ColumnValueMap,
> = {
  /** The type of columns to operate on */
  colType: ColType;
  /** Array of column names to apply functions to */
  columns: (keyof Row)[];
  /** Array of new column specifications */
  newColumns: Array<{
    /** Optional prefix for new column names */
    prefix?: string;
    /** Optional suffix for new column names */
    suffix?: string;
    /** Function to apply to each column value */
    fn: (col: ColumnValueMap[ColType]) => unknown;
  }>;
};

/**
 * Enhanced type that generates columns with their proper return types for mutate_columns
 */
type GenerateColumnNamesWithTypes<
  ColNames extends readonly string[],
  NewColDefs extends readonly {
    prefix?: string;
    suffix?: string;

    fn: (...args: any[]) => any;
  }[],
> = UnionToIntersection<
  {
    [Index in keyof NewColDefs]: NewColDefs[Index] extends {
      prefix?: infer Prefix;
      suffix?: infer Suffix;

      fn: (...args: any[]) => infer Result;
    }
      ? (Prefix extends string ? Prefix : "") extends infer PrefixType
        ? (Suffix extends string ? Suffix : "") extends infer SuffixType
          ? PrefixType extends string ? SuffixType extends string ? {
                [
                  ColName in ColNames[
                    number
                  ] as `${PrefixType}${ColName}${SuffixType}`
                ]: Result;
              }
            : never
          : never
        : never
      : never
      : never;
  }[number]
>;

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

// Unified overload that handles both DataFrame and GroupedDataFrame
export function mutate_columns<
  ColType extends keyof ColumnValueMap,
  const ColNames extends readonly string[],
  const NewColDefs extends readonly {
    prefix?: string;
    suffix?: string;

    fn: (col: ColumnValueMap[ColType]) => any;
  }[],
>(
  config: {
    colType: ColType;
    columns: ColNames;
    newColumns: NewColDefs;
  },
): <Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<
  Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
>;

// Implementation
export function mutate_columns<
  Row extends Record<string, unknown>,
  ColType extends keyof ColumnValueMap,
  ColNames extends readonly (keyof Row & string)[],
  NewColDefs extends readonly {
    prefix?: string;
    suffix?: string;

    fn: (col: ColumnValueMap[ColType]) => any;
  }[],
>(
  config: {
    colType: ColType;
    columns: ColNames;
    newColumns: NewColDefs;
  },
) {
  return (
    df: DataFrame<Row> | GroupedDataFrame<Row>,
  ): DataFrame<
    Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
  > => {
    const api: any = df as any;
    const store = api.__store as ColumnarStore | undefined;

    // View-aware implementation for columnar storage
    if (store) {
      const idx = materializeIndex(store.length, api.__view);
      const viewLength = idx.length;

      // Runtime validation using store columns
      const availableColumns = store.columnNames;
      const missingColumns = config.columns.filter((col) =>
        !availableColumns.includes(String(col))
      );
      if (missingColumns.length > 0) {
        throw new Error(
          `Columns [${
            missingColumns.join(", ")
          }] not found in data. Available columns: [${
            availableColumns.join(", ")
          }]`,
        );
      }

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

            newCol[i] = fn(value as ColumnValueMap[ColType]);
          }

          newColumns[newColName] = newCol;
          newColumnNames.push(newColName);
        }
      }

      const newStore: ColumnarStore = {
        columns: newColumns,
        columnNames: newColumnNames,
        length: viewLength,
      };

      const outDf = createDataFrame([]);
      (outDf as any).__store = newStore;
      (outDf as any).__view = {}; // reset view

      // reconstruct a rowView
      class RowView {
        private _i = 0;
        constructor(
          private cols: Record<string, unknown[]>,
          private names: (string | symbol)[],
        ) {
          for (const name of this.names) {
            Object.defineProperty(this, name, {
              get: () => this.cols[name as string][this._i],
              enumerable: true,
            });
          }
        }
        setCursor(i: number) {
          this._i = i;
        }
      }
      (outDf as any).__rowView = new RowView(newColumns, newColumnNames);

      const groupedDf = df as GroupedDataFrame<Row>;
      if (groupedDf.__groups) {
        return withGroups(
          groupedDf as unknown as GroupedDataFrame<
            Row,
            Extract<keyof Row, string | number | symbol>
          >,
          outDf as unknown as DataFrame<
            Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
          >,
        ) as unknown as DataFrame<
          Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
        >;
      } else {
        return outDf as unknown as DataFrame<
          Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
        >;
      }
    }

    // Fallback for non-columnar DataFrames
    const groupedDf = df as GroupedDataFrame<Row>;
    const out: Record<string, unknown>[] = [];
    for (const row of df) {
      out.push({ ...row });
    }

    // Runtime validation
    if (df.nrows() > 0) {
      const availableColumns = Object.keys(df[0]);
      const missingColumns = config.columns.filter((col) =>
        !availableColumns.includes(String(col))
      );
      if (missingColumns.length > 0) {
        throw new Error(
          `Columns [${
            missingColumns.join(", ")
          }] not found in data. Available columns: [${
            availableColumns.join(", ")
          }]`,
        );
      }
    }

    // Helper function to get properly typed column value
    const getColumnValue = (
      row: Record<string, unknown>,
      col: keyof Row,
    ): ColumnValueMap[ColType] => {
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

      return rawValue as ColumnValueMap[ColType];
    };

    // Check if this is a grouped dataframe
    if (groupedDf.__groups) {
      // Grouped mutate_columns
      const { head, next, size } = groupedDf.__groups;

      for (let g = 0; g < size; g++) {
        // Collect rows for this group and process each row
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          const rowIndex = rowIdx;
          const row = out[rowIndex];

          // For each column, apply each function
          for (const col of config.columns) {
            const colValue = getColumnValue(row, col);

            for (const newCol of config.newColumns) {
              const { prefix = "", suffix = "", fn } = newCol;
              const newColName = `${prefix}${String(col)}${suffix}`;
              out[rowIndex][newColName] = fn(colValue);
            }
          }

          rowIdx = next[rowIdx];
        }
      }

      const outDf = createDataFrame(out) as unknown as DataFrame<
        Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
      >;
      return withGroups(
        groupedDf as GroupedDataFrame<
          Row,
          Extract<keyof Row, string | number | symbol>
        >,
        outDf,
      ) as unknown as DataFrame<
        Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
      >;
    } else {
      // Ungrouped mutate_columns
      out.forEach((row, rowIndex) => {
        // For each column, apply each function
        for (const col of config.columns) {
          const colValue = getColumnValue(row, col);

          for (const newCol of config.newColumns) {
            const { prefix = "", suffix = "", fn } = newCol;
            const newColName = `${prefix}${String(col)}${suffix}`;
            out[rowIndex][newColName] = fn(colValue);
          }
        }
      });

      return createDataFrame(out) as unknown as DataFrame<
        Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
      >;
    }
  };
}
