// Re-export all join types from modular files

// Core types
export type {
  ColumnMapping,
  DFLike,
  JoinArgs,
  JoinKey,
  JoinOptions,
  JoinSuffixes,
  ObjectJoinOptions,
  RowAfterAsofJoin,
  RowAfterCrossJoin,
  RowAfterInnerJoin,
  RowAfterLeftJoin,
  RowAfterOuterJoin,
  RowAfterRightJoin,
  RowOfLike,
  SimpleJoinOptions,
  StoreAndIndex,
} from "./core.types.ts";

// Result types
export type {
  FullJoinResult,
  InnerJoinResult,
  LeftJoinResult,
  RightJoinResult,
} from "./result.types.ts";

// Method types
export type {
  AsofJoinMethod,
  CrossJoinMethod,
  InnerJoinDuckDBMethod,
  InnerJoinMethod,
  LeftJoinMethod,
  LeftJoinParallelMethod,
  OuterJoinMethod,
  RightJoinMethod,
} from "./method.types.ts";

// Suffix-aware types
export type {
  SuffixAwareAsofJoinResult,
  SuffixAwareInnerJoinResult,
  SuffixAwareLeftJoinResult,
  SuffixAwareOuterJoinResult,
  SuffixAwareRightJoinResult,
} from "./suffix.types.ts";
