// deno-lint-ignore-file no-explicit-any
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import { createDataFrame } from "../../dataframe/index.ts";
import type { ColumnTypeMap } from "./summarise-columns.types.ts";

/**
 * Type for summarise_columns specification with better type safety.
 */
export type SummariseColumnsSpec<
  T extends object,
  C extends keyof ColumnTypeMap,
> = {
  /** The type of columns to operate on */
  colType: C;
  /** Array of column names to apply functions to */
  columns: (keyof T)[];
  /** Array of new column specifications */
  newColumns: Array<{
    /** Prefix for new column names */
    prefix: string;
    /** Function to apply to each column array */
    fn: (col: ColumnTypeMap[C]) => unknown;
  }>;
};

// ----- literal-preserving helpers (leave as-is for nice IntelliSense) -----
type ColumnsWithPrefix<
  Cols extends readonly string[],
  Prefix extends string,
  FnReturnType = unknown,
> = {
  [K in Cols[number] as `${Prefix}${K}`]: FnReturnType;
};
type ExtractPrefixes<NewCols extends readonly { prefix: string }[]> = {
  [I in keyof NewCols]: NewCols[I] extends { prefix: infer P } ? P : never;
};
type ExtractColumns<Spec> = Spec extends { columns: infer Cols } ? Cols : never;
type ExtractNewColumns<Spec> = Spec extends { newColumns: infer NewCols }
  ? NewCols
  : never;
type ExtractPrefixesFromNewCols<NewCols> = NewCols extends
  readonly (infer Item)[] ? Item extends { prefix: infer P } ? P : never
  : never;
type GenerateColumnNames<Cols, Prefixes> = Cols extends readonly (infer Col)[]
  ? Col extends string ? {
      [P in Prefixes extends string ? Prefixes : never]: `${P}${Col}`;
    }[Prefixes extends string ? Prefixes : never]
  : never
  : never;

export type SummariseColumnsResult<
  T extends object,
  C extends keyof ColumnTypeMap,
  Spec extends SummariseColumnsSpec<T, C>,
> = {
  [
    K in GenerateColumnNames<
      ExtractColumns<Spec>,
      ExtractPrefixesFromNewCols<ExtractNewColumns<Spec>>
    >
  ]: unknown;
};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends
  (k: infer I) => void ? I
  : never;

type GenerateColumnNamesWithTypes<
  Cols extends readonly string[],
  NewCols extends readonly { prefix: string; fn: (...args: any[]) => any }[],
> = UnionToIntersection<
  {
    [I in keyof NewCols]: NewCols[I] extends
      { prefix: infer P; fn: (...args: any[]) => infer R }
      ? P extends string ? {
          [K in Cols[number] as `${P}${K}`]: R;
        }
      : never
      : never;
  }[number]
>;

/**
 * Summarise across multiple columns of the same type.
 *
 * Applies aggregation functions to entire columns (group-level operations)
 * across multiple columns of the same type. Creates new columns for each
 * function × input-column combination.
 *
 * @example
 * ```ts
 * // Numeric columns
 * pipe(df, summarise_columns({
 *   colType: "number",
 *   columns: ["score1", "score2", "score3"],
 *   newColumns: [
 *     { prefix: "mean_", fn: (col) => mean(col) },
 *     { prefix: "sum_", fn: (col) => sum(col) }
 *   ]
 * }))
 *
 * // Grouped: one row per group
 * pipe(df, group_by("age"), summarise_columns({
 *   colType: "number",
 *   columns: ["score1", "score2"],
 *   newColumns: [{ prefix: "mean_", fn: (col) => mean(col) }]
 * }))
 *
 * // String column operations
 * pipe(df, summarise_columns({
 *   colType: "string",
 *   columns: ["name", "city"],
 *   newColumns: [
 *     { prefix: "count_", fn: (col) => col.length },
 *     { prefix: "unique_", fn: (col) => new Set(col).size }
 *   ]
 * }))
 * ```
 *
 * @remarks
 * - Functions receive entire column arrays (not row values)
 * - For ungrouped data, returns a single-row summary
 * - For grouped data, returns one row per group
 * - New column names are `{prefix}{original_column_name}`
 * - Works with both grouped and ungrouped dataframes
 */
// OPTIONAL: add these overloads above the implementation for better direct-call inference

export function summarise_columns<
  T extends object,
  C extends keyof ColumnTypeMap,
  const Cols extends readonly string[],
  const NewCols extends readonly {
    prefix: string;

    fn: (col: ColumnTypeMap[C]) => any;
  }[],
  K extends keyof T,
>(
  spec: { colType: C; columns: Cols; newColumns: NewCols },
): (df: GroupedDataFrame<T, K>) => DataFrame<
  Prettify<Pick<T, K> & GenerateColumnNamesWithTypes<Cols, NewCols>>
>;

export function summarise_columns<
  T extends object,
  C extends keyof ColumnTypeMap,
  const Cols extends readonly string[],
  const NewCols extends readonly {
    prefix: string;

    fn: (col: ColumnTypeMap[C]) => any;
  }[],
>(
  spec: { colType: C; columns: Cols; newColumns: NewCols },
): (df: DataFrame<T>) => DataFrame<
  Prettify<GenerateColumnNamesWithTypes<Cols, NewCols>>
>;

// ---------- Implementation: return `any` and cast createDataFrame(...) ----------

export function summarise_columns<
  T extends object,
  C extends keyof ColumnTypeMap,
>(spec: SummariseColumnsSpec<T, C>) {
  return (
    df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
  ): any => {
    const groupedDf = df as GroupedDataFrame<T, keyof T>;

    const getColumnData = (
      data: DataFrame<T>,
      col: keyof T,
    ): ColumnTypeMap[C] => {
      const rawData = [...(data[col] as any)] as unknown[];
      return rawData as ColumnTypeMap[C];
    };

    if (groupedDf.__groups) {
      const {
        head,
        next,
        count: _count,
        keyRow,
        groupingColumns,
        size,
      } = groupedDf.__groups;
      const rows = [...df];

      const results: object[] = [];

      const buildKeyObj = (viewIdx: number): object => {
        const o: object = {};
        for (const c of groupingColumns) {
          const name = String(c);
          (o as any)[name] = (rows[viewIdx] as any)[name];
        }
        return o;
      };

      for (let g = 0; g < size; g++) {
        // Collect rows for this group
        const groupRows: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          groupRows.push(rowIdx);
          rowIdx = next[rowIdx];
        }

        const groupData = createDataFrame(
          groupRows.map((rowIndex) => rows[rowIndex]),
        );

        const result: object = {
          ...buildKeyObj(keyRow[g]),
        };

        for (const col of spec.columns) {
          const columnData = getColumnData(
            groupData as unknown as DataFrame<T>,
            col,
          );
          for (const newCol of spec.newColumns) {
            const newColName = `${newCol.prefix}${String(col)}`;
            (result as any)[newColName] = newCol.fn(columnData);
          }
        }
        results.push(result);
      }

      return createDataFrame(results) as any;
    } else {
      const result: object = {};
      for (const col of spec.columns) {
        const columnData = getColumnData(df as DataFrame<T>, col);
        for (const newCol of spec.newColumns) {
          const newColName = `${newCol.prefix}${String(col)}`;
          (result as any)[newColName] = newCol.fn(columnData);
        }
      }

      return createDataFrame([result]) as any;
    }
  };
}
