// deno-lint-ignore-file no-explicit-any
import { materializeIndex } from "../dataframe/index.ts";
import type { DataFrame, GroupedDataFrame } from "../dataframe/index.ts";
import {
  type ConcurrencyOptions,
  processConcurrently,
} from "./concurrency-utils.ts";

/* =================================================================================
   Generic Async/Sync Processing Utilities

   These utilities abstract the common patterns between sync and async operations:
   - Row iteration (grouped vs ungrouped)
   - Row data access (direct vs snapshot)
   - Result collection (immediate vs Promise.all)
   ================================================================================= */

/**
 * Create a snapshot of row data at a logical index to avoid closure issues in async operations
 */
export function makeRowSnapshot<Row extends object>(
  api: any,
  logicalIndex: number,
): Row {
  const store = api.__store;
  const view = api.__view;
  const storeLength = store.length;

  // Get physical index for this logical row
  const materializedIndex = materializeIndex(storeLength, view);
  const physicalIndex = materializedIndex[logicalIndex];

  const snapshot = {} as Row;
  for (const colName of store.columnNames) {
    (snapshot as any)[colName] = store.columns[colName][physicalIndex];
  }
  return snapshot;
}

/**
 * Check if a value is a Promise
 */
export function returnsPromise(value: unknown): value is Promise<unknown> {
  return value !== null && typeof value === "object" && "then" in value;
}

/**
 * Row processor function signature for sync operations
 */
export type SyncRowProcessor<Row extends object, TResult> = (
  row: Row,
  logicalIndex: number,
  groupIndex: number,
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => TResult;

/**
 * Row processor function signature for async operations
 */
export type AsyncRowProcessor<Row extends object, TResult> = (
  rowSnapshot: Row,
  logicalIndex: number,
  groupIndex: number,
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => TResult | Promise<TResult>;

/**
 * Generic grouped data processor that handles both sync and async modes
 */
export function processGroupedRows<Row extends object, TResult>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  processor: SyncRowProcessor<Row, TResult>,
  resultCollector: (physicalIndex: number, result: TResult) => void,
): void {
  const api = df as any;
  const row = api.__rowView;
  const g = api.__groups;

  if (!g) {
    throw new Error("processGroupedRows called on ungrouped DataFrame");
  }

  const { head, next, size } = g;

  // Iterate through each group using adjacency list
  for (let groupIdx = 0; groupIdx < size; groupIdx++) {
    let k = 0; // index within group
    let rowIdx = head[groupIdx];
    while (rowIdx !== -1) {
      row.setCursor(rowIdx);
      const result = processor(row, k, groupIdx, df);
      resultCollector(rowIdx, result);
      k++;
      rowIdx = next[rowIdx];
    }
  }
}

/**
 * Generic grouped data processor for async operations
 */
export async function processGroupedRowsAsync<Row extends object, TResult>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  processor: AsyncRowProcessor<Row, TResult>,
  options: ConcurrencyOptions = {},
): Promise<{ physicalIndex: number; result: TResult | Error }[]> {
  const api = df as any;
  const store = api.__store;
  const g = api.__groups;
  const view = api.__view;

  if (!g) {
    throw new Error("processGroupedRowsAsync called on ungrouped DataFrame");
  }

  const { head, next, size } = g;
  const operations: {
    physicalIndex: number;
    promise: () => Promise<TResult>;
  }[] = [];
  const materialized = materializeIndex(store.length, view);
  const usesRaw = !!g?.usesRawIndices;

  // Collect all operations as promises
  for (let groupIdx = 0; groupIdx < size; groupIdx++) {
    // Create group-specific DataFrame for this group
    const groupRows: Record<string, unknown>[] = [];
    let tempRowIdx = head[groupIdx];

    // First pass: collect all rows in this group
    while (tempRowIdx !== -1) {
      const groupRow: Record<string, unknown> = {};
      const physicalIndex = usesRaw ? tempRowIdx : materialized[tempRowIdx];
      for (const colName of store.columnNames) {
        groupRow[colName] = store.columns[colName][physicalIndex];
      }
      groupRows.push(groupRow);
      tempRowIdx = g.next[tempRowIdx];
    }

    // Create group DataFrame
    const { createDataFrame } = await import("../dataframe/index.ts");
    const groupDF = createDataFrame(groupRows);

    // Second pass: create operations with group DataFrame
    let k = 0; // index within group
    let rowIdx = head[groupIdx];
    while (rowIdx !== -1) {
      // Create snapshot to avoid closure issues
      const rowSnapshot = {} as Row;
      const physicalIndex = usesRaw ? rowIdx : materialized[rowIdx];
      for (const colName of store.columnNames) {
        (rowSnapshot as any)[colName] = store.columns[colName][physicalIndex];
      }

      // Store the processor function to be called later, not the result
      operations.push({
        physicalIndex,
        promise: () => {
          const result = processor(rowSnapshot, k, groupIdx, groupDF as any);
          return returnsPromise(result) ? result : Promise.resolve(result);
        },
      });
      k++;
      rowIdx = next[rowIdx];
    }
  }

  // Resolve all promises with concurrency control and error capture
  const results = await processConcurrently(
    operations.map((op) => () => op.promise()),
    options,
  );

  return operations.map((op, index) => ({
    physicalIndex: op.physicalIndex,
    result: results[index],
  }));
}

/**
 * Generic ungrouped data processor that handles sync mode
 */
export function processUngroupedRows<Row extends object, TResult>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  processor: SyncRowProcessor<Row, TResult>,
  resultCollector: (
    physicalIndex: number,
    result: TResult,
    logicalIndex: number,
  ) => void,
): void {
  const api = df as any;
  const store = api.__store;
  const row = api.__rowView;
  const view = api.__view;
  const storeLength = store.length;
  const materializedIndex = materializeIndex(storeLength, view);

  // Process visible rows using materialized index
  for (let i = 0; i < materializedIndex.length; i++) {
    const physicalIndex = materializedIndex[i];
    row.setCursor(physicalIndex);
    const result = processor(row, i, 0, df); // groupIndex = 0 for ungrouped
    resultCollector(physicalIndex, result, i);
  }
}

/**
 * Generic ungrouped data processor for async operations
 */
export async function processUngroupedRowsAsync<Row extends object, TResult>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  processor: AsyncRowProcessor<Row, TResult>,
  options: ConcurrencyOptions = {},
): Promise<
  { physicalIndex: number; logicalIndex: number; result: TResult | Error }[]
> {
  const api = df as any;
  const store = api.__store;
  const view = api.__view;
  const storeLength = store.length;
  const materializedIndex = materializeIndex(storeLength, view);

  const operations: {
    physicalIndex: number;
    logicalIndex: number;
    promise: () => Promise<TResult>;
  }[] = [];

  // Collect all operations as lazy functions (not promises yet)
  for (let i = 0; i < materializedIndex.length; i++) {
    const physicalIndex = materializedIndex[i];

    // Create snapshot to avoid closure issues
    const rowSnapshot = {} as Row;
    for (const colName of store.columnNames) {
      (rowSnapshot as any)[colName] = store.columns[colName][physicalIndex];
    }

    // Store the processor function to be called later, not the result
    operations.push({
      physicalIndex,
      logicalIndex: i,
      promise: () => {
        const result = processor(rowSnapshot, i, 0, df);
        return returnsPromise(result) ? result : Promise.resolve(result);
      },
    });
  }

  // Resolve all promises with concurrency control and error capture
  const results = await processConcurrently(
    operations.map((op) => () => op.promise()),
    options,
  );

  return operations.map((op, index) => ({
    physicalIndex: op.physicalIndex,
    logicalIndex: op.logicalIndex,
    result: results[index],
  }));
}

/* =================================================================================
   Promise Collection and Result Management Utilities
   ================================================================================= */

/**
 * Collect promises for batch resolution
 */
export function collectPromises<T>(
  promises: Promise<T>[],
): Promise<T[]> {
  return Promise.all(promises);
}

/**
 * Create a promise collector that can handle both sync and async results
 */
export function createPromiseCollector<T>(
  size: number,
): {
  promises: Promise<T>[];
  add: (index: number, value: T | Promise<T>) => void;
  resolve: () => Promise<T[]>;
} {
  const promises = new Array<Promise<T>>(size);

  return {
    promises,
    add: (index: number, value: T | Promise<T>) => {
      promises[index] = returnsPromise(value) ? value : Promise.resolve(value);
    },
    resolve: () => collectPromises(promises),
  };
}

/**
 * Create a result array manager for both sync and async operations
 */
export function createResultArrayManager<T>(
  size: number,
  isAsync: boolean,
): {
  results: T[];
  promises: Promise<T>[];
  set: (index: number, value: T | Promise<T>) => void;
  resolve: () => Promise<T[]> | T[];
} {
  const results = new Array<T>(size);
  const promises = isAsync ? new Array<Promise<T>>(size) : [];

  return {
    results,
    promises,
    set: (index: number, value: T | Promise<T>) => {
      if (isAsync) {
        promises[index] = returnsPromise(value)
          ? value
          : Promise.resolve(value);
      } else {
        results[index] = value as T;
      }
    },
    resolve: () => {
      if (isAsync) {
        return collectPromises(promises);
      } else {
        return results;
      }
    },
  };
}

/**
 * Generic error handling wrapper for row processing
 */
export function withErrorHandling<T>(
  processor: () => T | Promise<T>,
  fallback: T,
  context?: string,
): T | Promise<T> {
  try {
    const result = processor();
    if (returnsPromise(result)) {
      return result.catch((error) => {
        console.warn(`${context ? `${context}: ` : ""}${error}`);
        return fallback;
      });
    }
    return result;
  } catch (error) {
    console.warn(`${context ? `${context}: ` : ""}${error}`);
    return fallback;
  }
}

/**
 * Process a collection of operations with consistent error handling
 */
export async function processOperationsWithErrorHandling<T>(
  operations: (() => T | Promise<T>)[],
  fallback: T,
  context?: string,
): Promise<T[]> {
  const promises = operations.map((op, index) =>
    withErrorHandling(
      op,
      fallback,
      `${context ? `${context}[${index}]: ` : ""}`,
    )
  );

  // Ensure all results are promises before collecting
  const promiseResults = promises.map((p) =>
    returnsPromise(p) ? p : Promise.resolve(p)
  );
  const results = await collectPromises(promiseResults);
  return results;
}
