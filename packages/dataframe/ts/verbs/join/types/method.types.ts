// Join method signatures
import type { DataFrame } from "../../../dataframe/index.ts";
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
import type { SuffixAwareJoinResult } from "./suffix.types.ts";

// -----------------------------------------------------------------------------
// Method Signatures
// -----------------------------------------------------------------------------

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
  <OtherRow extends object, K extends keyof Row & keyof OtherRow>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      K | K[],
      EmptyDataFrameJoin
    >,
    options?: SimpleJoinOptions,
  ): DataFrame<
    SuffixAwareJoinResult<Row, OtherRow, K, Record<string, never>, true, true>
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
    SuffixAwareJoinResult<
        Row,
        OtherRow,
        keyof Row & keyof OtherRow,
        { keys: Keys; suffixes: Suffixes },
        true,
        true
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
  <OtherRow extends object, K extends keyof Row & keyof OtherRow>(
    other: DataFrame<OtherRow>,
    on: K | K[],
    options?: JoinOptions,
  ): Promise<
    DataFrame<SuffixAwareJoinResult<Row, OtherRow, K, Record<string, never>, true, true>>
  >;
};

/**
 * Join two DataFrames, keeping all rows from the left DataFrame.
 *
 * Returns all rows from the left DataFrame with matching data from the right DataFrame
 * where available. Where there is no key match, cells from the right are `undefined`. Every left row is preserved.
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
export type LeftJoinMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names) - keep existing behavior
  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Returns all rows from the left DataFrame with matching data from the right DataFrame
   * where available. Where there is no key match, cells from the right are `undefined`. Every left row is preserved.
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
  <OtherRow extends object, K extends keyof Row & keyof OtherRow>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      K | K[],
      EmptyDataFrameJoin
    >,
    options?: SimpleJoinOptions,
  ): DataFrame<
    SuffixAwareJoinResult<Row, OtherRow, K, Record<string, never>, true, false>
  >;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Returns all rows from the left DataFrame with matching data from the right DataFrame
   * where available. Where there is no key match, cells from the right are `undefined`. Every left row is preserved.
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
    SuffixAwareJoinResult<
        Row,
        OtherRow,
        keyof Row & keyof OtherRow,
        { keys: Keys; suffixes: Suffixes },
        true,
        false
      >
  >;
};

export type LeftJoinParallelMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names) - returns Promise
  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Returns all rows from the left DataFrame with matching data from the right DataFrame
   * where available. Where there is no key match, cells from the right are `undefined`. Every left row is preserved.
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
  <OtherRow extends object, K extends keyof Row & keyof OtherRow>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      K | K[],
      EmptyDataFrameJoin
    >,
    options?: {
      suffixes?: { left?: string; right?: string };
      workers?: number;
    },
  ): Promise<DataFrame<
    SuffixAwareJoinResult<Row, OtherRow, K, Record<string, never>, true, false>
  >>;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Returns all rows from the left DataFrame with matching data from the right DataFrame
   * where available. Where there is no key match, cells from the right are `undefined`. Every left row is preserved.
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
      SuffixAwareJoinResult<
          Row,
          OtherRow,
          keyof Row & keyof OtherRow,
          { keys: Keys; suffixes: Suffixes },
          true,
          false
        >
    >
  >;
};

/**
 * Join two DataFrames, keeping all rows from the right DataFrame.
 *
 * Returns all rows from the right DataFrame with matching data from the left DataFrame
 * where available. Where there is no key match, cells from the left are `undefined`. Every right row is preserved.
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
export type RightJoinMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names) - keep existing behavior
  /**
   * Join two DataFrames, keeping all rows from the right DataFrame.
   *
   * Returns all rows from the right DataFrame with matching data from the left DataFrame
   * where available. Where there is no key match, cells from the left are `undefined`. Every right row is preserved.
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
  <OtherRow extends object, K extends keyof Row & keyof OtherRow>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      K | K[],
      EmptyDataFrameJoin
    >,
    options?: SimpleJoinOptions,
  ): DataFrame<
    SuffixAwareJoinResult<Row, OtherRow, K, Record<string, never>, false, true>
  >;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping all rows from the right DataFrame.
   *
   * Returns all rows from the right DataFrame with matching data from the left DataFrame
   * where available. Where there is no key match, cells from the left are `undefined`. Every right row is preserved.
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
    SuffixAwareJoinResult<
        Row,
        OtherRow,
        keyof Row & keyof OtherRow,
        { keys: Keys; suffixes: Suffixes },
        false,
        true
      >
  >;
};

/**
 * Join two DataFrames, keeping all rows from both (full outer join).
 *
 * Returns all rows from both DataFrames. Cells from the side with no matching row are
 * `undefined`. This is the union of left and right joins.
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
export type OuterJoinMethod<Row extends object> = {
  // Simple API: single key or array of keys (same names) - keep existing behavior
  /**
   * Join two DataFrames, keeping all rows from both (full outer join).
   *
   * Returns all rows from both DataFrames. Cells from the side with no matching row are
   * `undefined`. This is the union of left and right joins.
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
  <OtherRow extends object, K extends keyof Row & keyof OtherRow>(
    other: DataFrame<OtherRow>,
    on: RestrictEmptyDataFrame<
      Row,
      K | K[],
      EmptyDataFrameJoin
    >,
    options?: SimpleJoinOptions,
  ): DataFrame<
    SuffixAwareJoinResult<Row, OtherRow, K, Record<string, never>, false, false>
  >;

  // Advanced API: object with keys and options (suffix-aware with literal type preservation)
  /**
   * Join two DataFrames, keeping all rows from both (full outer join).
   *
   * Returns all rows from both DataFrames. Cells from the side with no matching row are
   * `undefined`. This is the union of left and right joins.
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
    SuffixAwareJoinResult<
        Row,
        OtherRow,
        keyof Row & keyof OtherRow,
        { keys: Keys; suffixes: Suffixes },
        false,
        false
      >
  >;
};

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
  ): DataFrame<{
    [K in keyof Row | keyof OtherRow]: K extends keyof OtherRow
      ? OtherRow[K]
      : K extends keyof Row ? Row[K]
      : never;
  }>;
};

/**
 * Join DataFrames by nearest key match (as-of join).
 *
 * Joins on a sorted column (typically timestamps), matching each left row with the
 * "nearest" right row based on direction (backward/forward/nearest). Useful for
 * time-series data where exact matches aren't required.
 *
 * @example
 * // Match trade times to nearest quote times
 * trades.asofJoin(quotes, "timestamp")
 *
 * @example
 * // Forward-looking matches
 * df1.asofJoin(df2, "date", { direction: "forward" })
 *
 * @example
 * // With additional exact match columns
 * df1.asofJoin(df2, {
 *   on: "timestamp",
 *   by: "symbol",
 *   direction: "backward"
 * })
 */
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
  ): DataFrame<SuffixAwareJoinResult<Row, OtherRow, K, Record<string, never>, true, false>>;

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
    SuffixAwareJoinResult<
        Row,
        OtherRow,
        K,
        { suffixes: Suffixes },
        true,
        false
      >
  >;
};
