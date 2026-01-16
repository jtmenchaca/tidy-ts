export {
  type PromisedDataFrame,
  type PromisedGroupedDataFrame,
} from "./types/promised-dataframe.type.ts";

export type {
  AnyPredicateIsAsync,
  AnyPropertyIsAsync,
  HasAsyncFunctions,
  IsAsyncFunction,
} from "./types/isFunctionReturnAsync.type.ts";

export { thenableDataFrame } from "./implementation/dataframe-thenable.ts";
export { thenableGroupedDataFrame } from "./implementation/grouped-thenable.ts";

export {
  isAsyncFunction,
  returnsPromise,
  shouldUseAsyncForFilter,
  shouldUseAsyncForMutate,
  shouldUseAsyncForSummarise,
} from "./implementation/includes-async-function.ts";
