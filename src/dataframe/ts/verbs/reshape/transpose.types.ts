// src/dataframe/ts/types/verbs/reshaping/transpose-types.ts
import type {
  ColumnsFromUnion,
  DataFrame,
  DataKeys,
  DataOnly,
  Prettify,
  PrettifyDeep,
  UnionToIntersection,
} from "../../dataframe/index.ts";

/**
 * Internal string key for tracking row labels with minimal collision risk
 * Users can still use this, but it's unlikely to conflict in practice
 */
export const ROW_LABEL = "__tidy_row_label__" as const;

/**
 * Internal type-only key for storing row data types during transpose
 * This enables perfect type recovery on double transpose
 */
export const ROW_TYPES = "__tidy_row_types__" as const;

/**
 * Generate row column names using the EXACT same pattern as summarise_columns.
 * Takes a tuple of numbers and generates exact column names like row_0, row_1, row_2.
 */
export type MapRowNumbers<
  RowNumbers extends readonly number[],
> = UnionToIntersection<
  {
    [Index in keyof RowNumbers]: RowNumbers[Index] extends number
      ? { [ColName in `row_${RowNumbers[Index]}`]: unknown }
      : never;
  }[number]
>;

/**
 * Generate row column names with types, following summarise_columns pattern exactly.
 */
export type MapRowNumbersWithTypes<
  RowNumbers extends readonly number[],
  T = unknown,
> = UnionToIntersection<
  {
    [Index in keyof RowNumbers]: RowNumbers[Index] extends number
      ? { [ColName in `row_${RowNumbers[Index]}`]: T }
      : never;
  }[number]
>;

/**
 * Generate exact column names from row labels (when row labels are set)
 */
export type MapRowLabels<
  RowLabels extends readonly string[],
  T = unknown,
> = UnionToIntersection<
  {
    [Index in keyof RowLabels]: RowLabels[Index] extends string
      ? { [ColName in RowLabels[Index]]: T }
      : never;
  }[number]
>;

/**
 * Convert a string union to an object with those strings as keys
 */
export type MapStringUnionToColumns<
  Labels extends string,
  T = unknown,
> = { [K in Labels]: T };

/**
 * Generate a tuple type [0, 1, 2, ..., N-1] from a number N
 * This is the key insight: we generate the tuple TYPE, not the runtime array
 */
export type GenerateNumberTuple<N extends number, Acc extends number[] = []> =
  Acc["length"] extends N ? Acc
    : GenerateNumberTuple<N, [...Acc, Acc["length"]]>;

/**
 * Method type for DataFrame.transpose() with enhanced type preservation
 * Three cases:
 * 1. No row labels: Store original types, generate row_* columns
 * 2. Has row labels only: Use labels as columns with clean type display
 * 3. Has row labels + original types: Restore exact original types (double transpose)
 */
import type {
  EmptyDataFrameTranspose,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type TransposeMethod<Row extends object> = {
  <const ExpectedRows extends number>(
    { numberOfRows }: {
      numberOfRows: RestrictEmptyDataFrame<
        Row,
        ExpectedRows,
        EmptyDataFrameTranspose
      >;
    },
  ): // Case 3: Double transpose — restore exact types
  Row extends { "__tidy_row_label__": infer Labels extends string }
    ? Row extends { "__tidy_row_types__": infer RowTypes } ? DataFrame<
        PrettifyDeep<
          & {
            "__tidy_row_label__": DataKeys<Row>; // ← prints as "first_row" | "second_row"
          }
          & {
            // Wrap the mapped type so it expands to { first_row: T; second_row: T }
            "__tidy_row_types__": Prettify<
              ColumnsFromUnion<
                DataKeys<Row>,
                Row[DataKeys<Row>]
              >
            >;
          }
          & RowTypes
        >
      >
      // Case 2: Single transpose with row labels — use labels as columns
    : DataFrame<
      PrettifyDeep<
        & { "__tidy_row_label__": DataKeys<Row> }
        & { "__tidy_row_types__": Prettify<DataOnly<Row>> } // ← expands to { name: string; age: number; … }
        & Prettify<
          ColumnsFromUnion<
            Labels,
            DataOnly<Row>[DataKeys<Row>]
          >
        >
      >
    >
    // Case 1: First transpose — store row types, generate row_* columns
    : DataFrame<
      PrettifyDeep<
        & { "__tidy_row_label__": keyof Row }
        & { "__tidy_row_types__": Row }
        & MapRowNumbersWithTypes<
          GenerateNumberTuple<ExpectedRows>,
          Row[keyof Row]
        >
      >
    >;
};
