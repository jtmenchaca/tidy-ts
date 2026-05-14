// packages/dataframe/ts/types/verbs/reshaping/transpose-types.ts
import type {
  ColumnsFromUnion,
  DataFrame,
  DataKeys,
  DataOnly,
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
 * Generate row column names like row_0, row_1, row_2 from a tuple of numbers.
 */
export type MapRowNumbers<
  RowNumbers extends readonly number[],
> = { [K in `row_${RowNumbers[number]}`]: unknown };

/**
 * Generate row column names with types from a tuple of numbers.
 */
export type MapRowNumbersWithTypes<
  RowNumbers extends readonly number[],
  T = unknown,
> = { [K in `row_${RowNumbers[number]}`]: T };

/**
 * Generate exact column names from row labels (when row labels are set).
 */
export type MapRowLabels<
  RowLabels extends readonly string[],
  T = unknown,
> = { [K in RowLabels[number]]: T };

/**
 * Convert a string union to an object with those strings as keys.
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
  <R extends object, const ExpectedRows extends number>(
    this: DataFrame<R>,
    { numberOfRows }: {
      numberOfRows: RestrictEmptyDataFrame<
        R,
        ExpectedRows,
        EmptyDataFrameTranspose
      >;
    },
  ): // Case 3: Double transpose — restore exact types
  R extends { "__tidy_row_label__": infer Labels extends string }
    ? R extends { "__tidy_row_types__": infer RowTypes extends object } ? DataFrame<{
        [K in "__tidy_row_label__" | "__tidy_row_types__" | keyof RowTypes]:
          K extends "__tidy_row_label__" ? DataKeys<R>
          : K extends "__tidy_row_types__" ? ColumnsFromUnion<DataKeys<R>, R[DataKeys<R>]>
          : K extends keyof RowTypes ? RowTypes[K]
          : never;
      }>
      // Case 2: Single transpose with row labels — use labels as columns
    : DataFrame<{
        [K in "__tidy_row_label__" | "__tidy_row_types__" | Labels]:
          K extends "__tidy_row_label__" ? DataKeys<R>
          : K extends "__tidy_row_types__" ? DataOnly<R>
          : DataOnly<R>[DataKeys<R>];
      }>
    // Case 1: First transpose — store row types, generate row_* columns
    : DataFrame<{
        [K in
          | "__tidy_row_label__"
          | "__tidy_row_types__"
          | keyof MapRowNumbersWithTypes<GenerateNumberTuple<ExpectedRows>, R[keyof R]>
        ]: K extends "__tidy_row_label__" ? keyof R
          : K extends "__tidy_row_types__" ? R
          : R[keyof R];
      }>;
};
