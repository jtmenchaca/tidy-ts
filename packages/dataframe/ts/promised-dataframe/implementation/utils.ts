// deno-lint-ignore-file no-explicit-any

import {
  isDataFrame,
  isGroupedDataFrame,
} from "../../utilities/isDataFrame.ts";

export const wrapOutput = (
  v: unknown,
  chainFn: (df: any) => any,
  chainGroupedFn: (gdf: any) => any,
) =>
  isGroupedDataFrame(v)
    ? chainGroupedFn(v as any)
    : isDataFrame(v)
    ? chainFn(v as any)
    : v;

export const wrapThenable = (
  promise: Promise<unknown>,
  chainFn: (df: any) => any,
  _chainGroupedFn: (gdf: any) => any,
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
