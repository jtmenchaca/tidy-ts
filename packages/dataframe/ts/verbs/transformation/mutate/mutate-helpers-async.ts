// deno-lint-ignore-file no-explicit-any
import { materializeIndex } from "../../../dataframe/index.ts";
import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import type { MutateAssignments } from "./mutate.types.ts";
import {
  processGroupedRowsAsync,
  processUngroupedRowsAsync,
  returnsPromise,
} from "../../../promised-dataframe/async-sync-processor.ts";
import type { ConcurrencyOptions } from "../../../promised-dataframe/concurrency-utils.ts";

/* =================================================================================
   Asynchronous helper functions for mutate operations
   ================================================================================= */

/**
 * Process grouped data mutations for async operations
 */
export async function processGroupedMutationsAsync<
  Row extends Record<string, unknown>,
>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: MutateAssignments<Row>,
  _updates: Record<string, unknown[]>,
  asyncUpdates: Record<string, Promise<unknown>[]>,
  options: ConcurrencyOptions = {},
): Promise<void> {
  const api = df as any;
  const _store = api.__store;
  const _g = (df as any).__groups;

  for (const [col, expr] of Object.entries(spec)) {
    if (expr === null) {
      continue;
    }

    if (typeof expr === "function") {
      // Use shared utility for grouped processing
      const results = await processGroupedRowsAsync(
        df,
        (rowSnapshot, k, _groupIdx, df) => {
          return (expr as any)(rowSnapshot, k, df);
        },
        options,
      );

      // Apply results to asyncUpdates
      for (const { physicalIndex, result } of results) {
        asyncUpdates[col][physicalIndex] = returnsPromise(result)
          ? result
          : Promise.resolve(result);
      }
    } else if (Array.isArray(expr)) {
      const n = (df as DataFrame<Row>).nrows();
      if (expr.length !== n) {
        throw new Error(
          `Array length mismatch for column "${col}": provided ${expr.length} values but DataFrame has ${n} rows. ` +
            `Array values must match the number of rows in the DataFrame.`,
        );
      }
      for (let i = 0; i < n; i++) {
        asyncUpdates[col][i] = Promise.resolve(expr[i]);
      }
    } else {
      const n = (df as DataFrame<Row>).nrows();
      for (let i = 0; i < n; i++) {
        asyncUpdates[col][i] = Promise.resolve(expr);
      }
    }
  }
}

/**
 * Process ungrouped data mutations for async operations
 */
export async function processUngroupedMutationsAsync<
  Row extends Record<string, unknown>,
>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: MutateAssignments<Row>,
  _updates: Record<string, unknown[]>,
  asyncUpdates: Record<string, Promise<unknown>[]>,
  options: ConcurrencyOptions = {},
): Promise<void> {
  const api = df as any;
  const store = api.__store;
  const n = (df as DataFrame<Row>).nrows();

  for (const [col, expr] of Object.entries(spec)) {
    if (expr === null) {
      continue;
    }
    if (typeof expr === "function") {
      // Use shared utility for ungrouped processing
      const results = await processUngroupedRowsAsync(
        df,
        (rowSnapshot, i, _groupIdx, df) => {
          return (expr as any)(rowSnapshot, i, df);
        },
        options,
      );

      // Apply results to asyncUpdates
      for (const { physicalIndex, result } of results) {
        asyncUpdates[col][physicalIndex] = returnsPromise(result)
          ? result
          : Promise.resolve(result);
      }
    } else if (Array.isArray(expr)) {
      if (expr.length !== n) {
        throw new Error(
          `Array length mismatch for column "${col}": provided ${expr.length} values but DataFrame has ${n} rows. ` +
            `Array values must match the number of rows in the DataFrame.`,
        );
      }
      // For array expressions, we need to handle the view mapping manually
      const view = api.__view;
      const storeLength = store.length;
      const materializedIndex = materializeIndex(storeLength, view);
      for (let i = 0; i < materializedIndex.length; i++) {
        const physicalIndex = materializedIndex[i];
        asyncUpdates[col][physicalIndex] = Promise.resolve(expr[i]);
      }
    } else {
      // For scalar expressions, we need to handle the view mapping manually
      const view = api.__view;
      const storeLength = store.length;
      const materializedIndex = materializeIndex(storeLength, view);
      for (let i = 0; i < materializedIndex.length; i++) {
        const physicalIndex = materializedIndex[i];
        asyncUpdates[col][physicalIndex] = Promise.resolve(expr);
      }
    }
  }
}
