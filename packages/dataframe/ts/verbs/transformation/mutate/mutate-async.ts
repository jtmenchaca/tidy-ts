// deno-lint-ignore-file no-explicit-any
import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import type { MutateAssignments } from "./mutate.types.ts";
import { createUpdatedDataFrame } from "./mutate-helpers-sync.ts";
import {
  processGroupedMutationsAsync,
  processUngroupedMutationsAsync,
} from "./mutate-helpers-async.ts";
import type {
  ConcurrencyOptions,
} from "../../../promised-dataframe/concurrency-utils.ts";

/**
 * Asynchronous mutate implementation that handles Promise resolution with concurrency control
 *
 * @param df - The DataFrame to mutate
 * @param spec - Mutation specification (functions/values)
 * @param options - Concurrency control options
 */
export async function mutateAsyncImpl<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: MutateAssignments<Row>,
  options: ConcurrencyOptions = {},
) {
  const n = (df as DataFrame<Row>).nrows();
  const api = df as any;
  const _store = api.__store;
  const _view = api.__view;

  const updates: Record<string, unknown[]> = {};

  // 1) prepare arrays for columns being added/replaced
  for (const col of Object.keys(spec)) {
    if (spec[col] !== null) {
      updates[col] = new Array(n);
    }
  }

  // 2) Create async updates structure
  const asyncUpdates: Record<string, Promise<unknown>[]> = {};
  for (const col of Object.keys(spec)) {
    if (spec[col] !== null) {
      asyncUpdates[col] = new Array(n);
    }
  }

  // 3) Determine processing method based on whether data is grouped
  if ((df as any).__groups) {
    // Process grouped data
    await processGroupedMutationsAsync(
      df,
      spec,
      updates,
      asyncUpdates,
      options,
    );
  } else {
    // Process ungrouped data
    await processUngroupedMutationsAsync(
      df,
      spec,
      updates,
      asyncUpdates,
      options,
    );
  }

  // 4) Resolve all promises (concurrency control is handled in the async processing helpers)
  for (const [col, promises] of Object.entries(asyncUpdates)) {
    const resolvedValues = await Promise.all(promises);
    for (let i = 0; i < resolvedValues.length; i++) {
      updates[col][i] = resolvedValues[i];
    }
  }

  // Handle column drops (null values)
  const drops = new Set<string>();
  for (const [col, expr] of Object.entries(spec)) {
    if (expr === null) drops.add(col);
  }

  // 4) build copy-on-write store and return new DataFrame
  return createUpdatedDataFrame(df, updates, drops);
}
