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
