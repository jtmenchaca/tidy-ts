/**
 * General error type system for providing informative TypeScript errors
 * across the dataframe library when operations are invalid.
 */

/**
 * Creates a descriptive error array type for TypeScript error messages.
 * The array wrapper ensures compatibility with rest parameters.
 */
export type ErrorMessage<T extends string> = [T];

/**
 * Check if a Row type is effectively empty (DataFrame<never>)
 */
export type IsEmptyDataFrame<T> = [T] extends [never] ? true : false;

/**
 * Standard error messages for common invalid operations
 */
export type EmptyDataFrameSelect =
  "🚨 Cannot select columns from empty DataFrame - no columns available! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameDrop =
  "🚨 Cannot drop columns from empty DataFrame - no columns exist! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameExtract =
  "🚨 Cannot extract columns from empty DataFrame - no columns available! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameTranspose =
  "🚨 Cannot transpose empty DataFrame - no data to transpose! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameReorder =
  "🚨 Cannot reorder columns in empty DataFrame - no columns exist! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameSlice =
  "🚨 Cannot slice empty DataFrame - no rows to slice! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameGroupBy =
  "🚨 Cannot group empty DataFrame - no columns available for grouping! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameJoin =
  "🚨 Cannot join with empty DataFrame - no columns available for joining! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameForEach =
  "🚨 Cannot iterate over empty DataFrame - no rows to process! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameSummarise =
  "🚨 Cannot summarise empty DataFrame - no rows to summarise! Try adding data first with createDataFrame([...rows])";
export type EmptyDataFrameResample =
  "🚨 Cannot resample empty DataFrame - no time column available! Try adding data first with createDataFrame([...rows])";

/**
 * Column type validation error messages
 */
export type ColumnTypeMismatchNumber =
  "🚨 Column type mismatch - expected numeric values but found non-numeric data. Use col_type: 'number' only with numeric columns.";
export type ColumnTypeMismatchString =
  "🚨 Column type mismatch - expected string values but found non-string data. Use col_type: 'string' only with string columns.";
export type ColumnTypeMismatchBoolean =
  "🚨 Column type mismatch - expected boolean values but found non-boolean data. Use col_type: 'boolean' only with boolean columns.";
export type ColumnTypeMismatchDate =
  "🚨 Column type mismatch - resample() requires a Date column for the time column. The specified column must be of type Date (or Date | null).";

/**
 * Missing column validation error messages
 */
export type MissingColumnPivot =
  "🚨 Missing column in pivot operation - specified column does not exist in DataFrame. Check column names and try again.";
export type MissingColumnCrossTabulate =
  "🚨 Missing column in cross-tabulation - specified column does not exist in DataFrame. Check column names and try again.";
export type MissingColumnDummyCol =
  "🚨 Missing column for dummy encoding - specified column does not exist in DataFrame. Check column names and try again.";

/**
 * Join operation error messages
 */
export type InvalidJoinKey =
  "🚨 Invalid join key - specified key does not exist in both DataFrames. Join keys must be present in both left and right DataFrames.";
export type EmptyJoinKey =
  "🚨 Empty join key - cannot join DataFrames without specifying valid join keys. Provide at least one column name that exists in both DataFrames.";

/**
 * Pivot operation error messages
 */
export type InvalidPivotColumn =
  "🚨 Invalid pivot column - specified column does not exist in DataFrame. Check column names for pivot operation.";
export type InvalidPivotConfiguration =
  "🚨 Invalid pivot configuration - names_from and values_from must be different columns. Cannot use the same column for both names and values.";

/**
 * Grouping operation error messages
 */
export type InvalidGroupingColumn =
  "🚨 Invalid grouping column - specified column does not exist in DataFrame. Check column names for grouping operation.";
export type EmptyGroupingColumn =
  "🚨 Empty grouping column - cannot group DataFrame without specifying valid columns. Provide at least one column name that exists in the DataFrame.";

/**
 * Conditional type that returns an error message for empty DataFrames,
 * otherwise returns the expected parameter type.
 */
export type RestrictEmptyDataFrame<
  Row extends object,
  ParamType,
  ErrorMsg extends string,
> = IsEmptyDataFrame<Row> extends true ? ErrorMessage<ErrorMsg>
  : ParamType;

/**
 * Helper type for method parameters that should error on empty DataFrames
 */
export type EmptyDataFrameParam<Row extends object, ErrorMsg extends string> =
  RestrictEmptyDataFrame<Row, never, ErrorMsg>;

/**
 * Generic helper for making entire methods uncallable on empty DataFrames.
 * When DataFrame is empty, the method type becomes a string literal, causing
 * TypeScript to show "This expression is not callable" on the method call itself.
 *
 * Usage:
 * export type MyMethod<Row extends object> = RestrictMethodForEmptyDataFrame<
 *   Row,
 *   EmptyDataFrameMyMethod,
 *   {
 *     // Normal method signatures for non-empty DataFrames
 *     <T>(param: T): DataFrame<SomeResult>;
 *   }
 * >;
 */
export type RestrictMethodForEmptyDataFrame<
  Row extends object,
  ErrorMsg extends string,
  NormalMethodType,
> = IsEmptyDataFrame<Row> extends true ? ErrorMsg : NormalMethodType;

/**
 * Helper types for column validation
 */
export type ValidateColumnExists<
  Row extends object,
  ColName extends string,
  ErrorMsg extends string,
> = ColName extends keyof Row ? ColName : ErrorMessage<ErrorMsg>;

export type ValidateColumnType<
  Row extends object,
  ColName extends keyof Row,
  ExpectedType,
  ErrorMsg extends string,
> = Row[ColName] extends ExpectedType ? ColName : ErrorMessage<ErrorMsg>;

/**
 * Check if a column type includes Date (handles Date, Date | null, Date | undefined, etc.)
 */
export type ValidateDateColumn<
  Row extends object,
  ColName extends keyof Row,
  ErrorMsg extends string,
> = Row[ColName] extends Date ? ColName
  : Date extends Row[ColName] ? ColName
  : ErrorMessage<ErrorMsg>;

/**
 * Helper type for join key validation
 */
export type ValidateJoinKey<
  LeftRow extends object,
  RightRow extends object,
  KeyName extends string,
  ErrorMsg extends string,
> = KeyName extends keyof LeftRow & keyof RightRow ? KeyName
  : ErrorMessage<ErrorMsg>;

/**
 * Statistics function error messages
 */
export type NullableArrayWithoutRemoveNa =
  "🚨 Array contains null values. Use removeNA: true to exclude them.";

/**
 * Check if an array type contains nullable values
 */
export type HasNullableValues<T> = T extends ReadonlyArray<infer U>
  ? null extends U ? true : false
  : T extends (infer U)[] ? null extends U ? true : false
  : false;

/**
 * Conditional type that shows error for nullable arrays without removeNA
 * Similar to RestrictEmptyDataFrame but for nullable arrays
 */
export type RestrictNullableArray<
  T,
  ErrorMsg extends string,
> = HasNullableValues<T> extends true ? ErrorMessage<ErrorMsg> : T;

/**
 * Column type validation for mutate operations
 */
export type ValidateColumnTypeForMutate<
  Row extends object,
  ColType extends "number" | "string" | "boolean",
  ColName extends keyof Row,
> = ColType extends "number"
  ? ValidateColumnType<Row, ColName, number, ColumnTypeMismatchNumber>
  : ColType extends "string"
    ? ValidateColumnType<Row, ColName, string, ColumnTypeMismatchString>
  : ColType extends "boolean"
    ? ValidateColumnType<Row, ColName, boolean, ColumnTypeMismatchBoolean>
  : ColName;
