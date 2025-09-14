// deno-lint-ignore-file no-explicit-any

import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import {
  isDataFrame,
  isGroupedDataFrame,
} from "../../utilities/isDataFrame.ts";

export const wrapOutput = <Row extends Record<string, unknown>>(
  v: unknown,
  chainFn: (df: DataFrame<Row>) => any,
  chainGroupedFn: (gdf: GroupedDataFrame<Row, any>) => any,
) =>
  isGroupedDataFrame(v)
    ? chainGroupedFn(v as any)
    : isDataFrame(v)
    ? chainFn(v as any)
    : v;

export const wrapThenable = <Row extends Record<string, unknown>>(
  promise: Promise<unknown>,
  chainFn: (df: DataFrame<Row>) => any,
  _chainGroupedFn: (gdf: GroupedDataFrame<Row, any>) => any,
) => {
  // We need to return a thenable wrapper, not just a promise
  // The transformed promise should resolve to an unwrapped DataFrame
  const transformedPromise = promise.then((v) => {
    if (isGroupedDataFrame(v)) {
      return v; // Return unwrapped grouped dataframe
    } else if (isDataFrame(v)) {
      return v; // Return unwrapped dataframe
    }
    return v; // Return primitive value
  });

  // Now wrap the promise in a thenable - chainFn should be thenableDataFrame
  return chainFn(transformedPromise as any);
};
