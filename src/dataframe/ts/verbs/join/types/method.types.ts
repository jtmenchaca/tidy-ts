// Join method signatures
import type {
  DataFrame,
  Prettify,
  UnifyUnion,
} from "../../../dataframe/index.ts";
import type {
  EmptyDataFrameJoin,
  RestrictEmptyDataFrame,
} from "../../../dataframe/types/error-types.ts";
import type {
  DFLike,
  JoinOptions,
  ObjectJoinOptions,
  RowOfLike,
  SimpleJoinOptions,
} from "./core.types.ts";
import type {
  FullJoinResult,
  InnerJoinResult,
  LeftJoinResult,
  RightJoinResult,
} from "./result.types.ts";
import type {
  SuffixAwareAsofJoinResult,
  SuffixAwareInnerJoinResult,
  SuffixAwareLeftJoinResult,
  SuffixAwareOuterJoinResult,
  SuffixAwareRightJoinResult,
} from "./suffix.types.ts";

// -----------------------------------------------------------------------------
// Method Signatures
// -----------------------------------------------------------------------------

export type InnerJoinMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names)
  /**
   * Join two DataFrames, keeping only matching rows from both.
   *
   * Returns rows where the join key(s) match in both DataFrames. Non-matching rows
   * are excluded. For overlapping column names (other than join keys), use the
   * `suffixes` option to disambiguate.
   *
   * @example
   * // Join on a single column
   * users.innerJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.innerJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.innerJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <OtherRow extends object>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      Extract<keyof Row, keyof OtherRow> | Extract<
        keyof Row,
        keyof OtherRow
      >[],
      EmptyDataFrameJoin
    >,
    options?: SimpleJoinOptions,
  ): DataFrame<
    Prettify<InnerJoinResult<Row, OtherRow, keyof Row & keyof OtherRow>>
  >;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping only matching rows from both.
   *
   * Returns rows where the join key(s) match in both DataFrames. Non-matching rows
   * are excluded. For overlapping column names (other than join keys), use the
   * `suffixes` option to disambiguate.
   *
   * @example
   * // Join on a single column
   * users.innerJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.innerJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.innerJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <
    OtherRow extends object,
    const Keys extends ObjectJoinOptions<Row, OtherRow>["keys"],
    const Suffixes extends ObjectJoinOptions<Row, OtherRow>["suffixes"],
  >(
    other: DataFrame<OtherRow>,
    options: RestrictEmptyDataFrame<
      Row,
      { keys: Keys; suffixes?: Suffixes },
      EmptyDataFrameJoin
    >,
  ): DataFrame<
    UnifyUnion<
      SuffixAwareInnerJoinResult<
        Row,
        OtherRow,
        { keys: Keys; suffixes: Suffixes }
      >
    >
  >;
};

export type InnerJoinDuckDBMethod<Row extends object> = {
  /**
   * Join two DataFrames, keeping only matching rows from both.
   *
   * Returns rows where the join key(s) match in both DataFrames. Non-matching rows
   * are excluded. For overlapping column names (other than join keys), use the
   * `suffixes` option to disambiguate.
   *
   * @example
   * // Join on a single column
   * users.innerJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.innerJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.innerJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <OtherRow extends object>(
    other: DataFrame<OtherRow>,
    on: Extract<keyof Row, keyof OtherRow> | Extract<
      keyof Row,
      keyof OtherRow
    >[],
    options?: JoinOptions,
  ): Promise<
    DataFrame<InnerJoinResult<Row, OtherRow, keyof Row & keyof OtherRow>>
  >;
};

export type LeftJoinMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names) - keep existing behavior
  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Returns all rows from the left DataFrame with matching data from the right DataFrame
   * where available. Non-matching rows from the right become null. All left rows are preserved.
   *
   * @example
   * // Keep all users, add order data where available
   * users.leftJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.leftJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.leftJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <OtherRow extends object>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      Extract<keyof Row, keyof OtherRow> | Extract<
        keyof Row,
        keyof OtherRow
      >[],
      EmptyDataFrameJoin
    >,
    options?: SimpleJoinOptions,
  ): DataFrame<
    Prettify<LeftJoinResult<Row, OtherRow, keyof Row & keyof OtherRow>>
  >;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Returns all rows from the left DataFrame with matching data from the right DataFrame
   * where available. Non-matching rows from the right become null. All left rows are preserved.
   *
   * @example
   * // Keep all users, add order data where available
   * users.leftJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.leftJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.leftJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <
    OtherRow extends object,
    const Keys extends ObjectJoinOptions<Row, OtherRow>["keys"],
    const Suffixes extends ObjectJoinOptions<Row, OtherRow>["suffixes"],
  >(
    other: DataFrame<OtherRow>,
    options: RestrictEmptyDataFrame<
      Row,
      { keys: Keys; suffixes?: Suffixes },
      EmptyDataFrameJoin
    >,
  ): DataFrame<
    UnifyUnion<
      SuffixAwareLeftJoinResult<
        Row,
        OtherRow,
        { keys: Keys; suffixes: Suffixes }
      >
    >
  >;
};

export type LeftJoinParallelMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names) - returns Promise
  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Returns all rows from the left DataFrame with matching data from the right DataFrame
   * where available. Non-matching rows from the right become null. All left rows are preserved.
   *
   * @example
   * // Keep all users, add order data where available
   * users.leftJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.leftJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.leftJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <OtherRow extends object>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      Extract<keyof Row, keyof OtherRow> | Extract<
        keyof Row,
        keyof OtherRow
      >[],
      EmptyDataFrameJoin
    >,
    options?: {
      suffixes?: { left?: string; right?: string };
      workers?: number;
    },
  ): Promise<DataFrame<Prettify<Row & Partial<OtherRow>>>>;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Returns all rows from the left DataFrame with matching data from the right DataFrame
   * where available. Non-matching rows from the right become null. All left rows are preserved.
   *
   * @example
   * // Keep all users, add order data where available
   * users.leftJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.leftJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.leftJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <
    OtherRow extends object,
    const Keys extends ObjectJoinOptions<Row, OtherRow>["keys"],
    const Suffixes extends ObjectJoinOptions<Row, OtherRow>["suffixes"],
  >(
    other: DataFrame<OtherRow>,
    options: RestrictEmptyDataFrame<
      Row,
      { keys: Keys; suffixes?: Suffixes; workers?: number },
      EmptyDataFrameJoin
    >,
  ): Promise<
    DataFrame<
      UnifyUnion<
        SuffixAwareLeftJoinResult<
          Row,
          OtherRow,
          { keys: Keys; suffixes: Suffixes }
        >
      >
    >
  >;
};

export type RightJoinMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names) - keep existing behavior
  /**
   * Join two DataFrames, keeping all rows from the right DataFrame.
   *
   * Returns all rows from the right DataFrame with matching data from the left DataFrame
   * where available. Non-matching rows from the left become null. All right rows are preserved.
   *
   * @example
   * // Keep all orders, add user data where available
   * users.rightJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.rightJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.rightJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <OtherRow extends object>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      Extract<keyof Row, keyof OtherRow> | Extract<
        keyof Row,
        keyof OtherRow
      >[],
      EmptyDataFrameJoin
    >,
    options?: SimpleJoinOptions,
  ): DataFrame<
    Prettify<RightJoinResult<Row, OtherRow, keyof Row & keyof OtherRow>>
  >;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping all rows from the right DataFrame.
   *
   * Returns all rows from the right DataFrame with matching data from the left DataFrame
   * where available. Non-matching rows from the left become null. All right rows are preserved.
   *
   * @example
   * // Keep all orders, add user data where available
   * users.rightJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.rightJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.rightJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <
    OtherRow extends object,
    const Keys extends ObjectJoinOptions<Row, OtherRow>["keys"],
    const Suffixes extends ObjectJoinOptions<Row, OtherRow>["suffixes"],
  >(
    other: DataFrame<OtherRow>,
    options: RestrictEmptyDataFrame<
      Row,
      { keys: Keys; suffixes?: Suffixes },
      EmptyDataFrameJoin
    >,
  ): DataFrame<
    UnifyUnion<
      SuffixAwareRightJoinResult<
        Row,
        OtherRow,
        { keys: Keys; suffixes: Suffixes }
      >
    >
  >;
};

export type OuterJoinMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names) - keep existing behavior
  /**
   * Join two DataFrames, keeping all rows from both (full outer join).
   *
   * Returns all rows from both DataFrames. Rows without matches have null values
   * for columns from the other DataFrame. This is the union of left and right joins.
   *
   * @example
   * // Keep all users and all orders
   * users.outerJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.outerJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.outerJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <OtherRow extends object>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      Extract<keyof Row, keyof OtherRow> | Extract<
        keyof Row,
        keyof OtherRow
      >[],
      EmptyDataFrameJoin
    >,
    options?: SimpleJoinOptions,
  ): DataFrame<
    Prettify<FullJoinResult<Row, OtherRow, keyof Row & keyof OtherRow>>
  >;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping all rows from both (full outer join).
   *
   * Returns all rows from both DataFrames. Rows without matches have null values
   * for columns from the other DataFrame. This is the union of left and right joins.
   *
   * @example
   * // Keep all users and all orders
   * users.outerJoin(orders, "userId")
   *
   * @example
   * // Join on multiple columns
   * df1.outerJoin(df2, ["country", "year"])
   *
   * @example
   * // Advanced: different key names and suffixes
   * df1.outerJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" }
   * })
   */
  <
    OtherRow extends object,
    const Keys extends ObjectJoinOptions<Row, OtherRow>["keys"],
    const Suffixes extends ObjectJoinOptions<Row, OtherRow>["suffixes"],
  >(
    other: DataFrame<OtherRow>,
    options: RestrictEmptyDataFrame<
      Row,
      { keys: Keys; suffixes?: Suffixes },
      EmptyDataFrameJoin
    >,
  ): DataFrame<
    UnifyUnion<
      SuffixAwareOuterJoinResult<
        Row,
        OtherRow,
        { keys: Keys; suffixes: Suffixes }
      >
    >
  >;
};

export type CrossJoinMethod<Row extends object> = {
  /**
   * Create a Cartesian product of two DataFrames.
   *
   * Returns all possible combinations of rows from both DataFrames (left_rows × right_rows).
   * Warning: Result size grows multiplicatively - use `maxRows` limit for safety.
   *
   * @example
   * // All combinations of products and colors
   * products.crossJoin(colors)
   *
   * @example
   * // Limit output size for safety
   * df1.crossJoin(df2, 10000)
   *
   * @example
   * // Handle overlapping columns with suffixes
   * df1.crossJoin(df2, undefined, { left: "_a", right: "_b" })
   */
  <
    // deno-lint-ignore no-explicit-any
    Other extends DFLike<any>,
    OtherRow extends RowOfLike<Other>,
  >(
    other: RestrictEmptyDataFrame<Row, Other, EmptyDataFrameJoin>,
    maxRows?: number,
    suffixes?: { left?: string; right?: string },
  ): DataFrame<Row & OtherRow>;
};

export type AsofJoinMethod<Row extends object> = {
  // Simple asof join - no suffix options
  /**
   * Join DataFrames by nearest key match (as-of join).
   *
   * Joins on a sorted column (typically timestamps), matching each left row with the
   * "nearest" right row based on direction (backward/forward/nearest). Useful for
   * time-series data where exact matches aren't required.
   *
   * @example
   * // Join trades to nearest prior quotes
   * trades.asofJoin(quotes, "timestamp")
   *
   * @example
   * // Forward-looking join with tolerance
   * events.asofJoin(logs, "time", {
   *   direction: "forward",
   *   tolerance: 1000
   * })
   *
   * @example
   * // Group by security before matching
   * trades.asofJoin(quotes, "timestamp", {
   *   group_by: ["symbol"]
   * })
   */
  <
    OtherRow extends object,
    K extends keyof Row & keyof OtherRow,
  >(
    other: DataFrame<OtherRow>,
    by: RestrictEmptyDataFrame<Row, K, EmptyDataFrameJoin>,
    options?: {
      direction?: "backward" | "forward" | "nearest";
      tolerance?: number;
      group_by?: (keyof Row & keyof OtherRow)[];
    },
  ): DataFrame<SuffixAwareAsofJoinResult<Row, OtherRow, Extract<K, string>>>;

  // Suffix-aware asof join with const assertions to preserve literal types
  /**
   * Join DataFrames by nearest key match (as-of join).
   *
   * Joins on a sorted column (typically timestamps), matching each left row with the
   * "nearest" right row based on direction (backward/forward/nearest). Useful for
   * time-series data where exact matches aren't required.
   *
   * @example
   * // Join trades to nearest prior quotes
   * trades.asofJoin(quotes, "timestamp")
   *
   * @example
   * // Forward-looking join with tolerance
   * events.asofJoin(logs, "time", {
   *   direction: "forward",
   *   tolerance: 1000
   * })
   *
   * @example
   * // Group by security before matching
   * trades.asofJoin(quotes, "timestamp", {
   *   group_by: ["symbol"]
   * })
   */
  <
    OtherRow extends object,
    K extends keyof Row & keyof OtherRow,
    const Suffixes extends { left?: string; right?: string },
  >(
    other: DataFrame<OtherRow>,
    by: RestrictEmptyDataFrame<Row, K, EmptyDataFrameJoin>,
    options: {
      direction?: "backward" | "forward" | "nearest";
      tolerance?: number;
      group_by?: (keyof Row & keyof OtherRow)[];
      suffixes: Suffixes;
    },
  ): DataFrame<
    UnifyUnion<
      SuffixAwareAsofJoinResult<
        Row,
        OtherRow,
        Extract<K, string>,
        { suffixes: Suffixes }
      >
    >
  >;
};
