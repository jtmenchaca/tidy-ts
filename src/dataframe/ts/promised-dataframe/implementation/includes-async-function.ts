// deno-lint-ignore-file no-explicit-any
import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Runtime async detection helpers for tidy-ts verbs.
 *
 * This module provides utilities to detect async functions and determine
 * whether a verb should use async or sync execution paths.
 */

// Get the AsyncFunction constructor for detecting declared async functions
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

/**
 * Type guard to check if a value is a Promise
 */
export function returnsPromise(x: unknown): x is Promise<unknown> {
  return !!x && typeof (x as any).then === "function";
}

/**
 * Creates a minimal row snapshot for testing functions.
 * Used by mutate and filter verbs.
 */
export function makeRowSnapshot(
  api: any,
  rowIndex: number,
): object {
  const store = api.__store;
  const row: object = {};
  for (const colName of store.columnNames) {
    (row as any)[colName] = store.columns[colName][rowIndex];
  }
  return row;
}

/**
 * Creates a minimal DataFrame probe for testing functions.
 * Used by summarise verb.
 */
export function makeDataFrameProbe<Row extends object>(
  df: DataFrame<Row>,
): DataFrame<Row> {
  const n = df.nrows();
  const api: any = df as any;
  const store = api.__store;

  return {
    nrows: () => n,
    ...Object.fromEntries(
      store.columnNames.map((
        colName: string,
      ) => [colName, store.columns[colName]]),
    ),
    toArray: () => df.toArray(),
    // Add ALL DataFrame methods that might be called in summarise functions
    // Core methods
    mutate: () => makeDataFrameProbe(df),
    mutateColumns: () => makeDataFrameProbe(df),
    filter: () => makeDataFrameProbe(df),
    select: () => makeDataFrameProbe(df),
    arrange: () => makeDataFrameProbe(df),
    sort: () => makeDataFrameProbe(df),
    distinct: () => makeDataFrameProbe(df),
    rename: () => makeDataFrameProbe(df),
    drop: () => makeDataFrameProbe(df),
    reorder: () => makeDataFrameProbe(df),

    // Date methods
    year: () => makeDataFrameProbe(df),
    month: () => makeDataFrameProbe(df),
    day: () => makeDataFrameProbe(df),

    // Join methods
    innerJoin: () => makeDataFrameProbe(df),
    leftJoin: () => makeDataFrameProbe(df),
    rightJoin: () => makeDataFrameProbe(df),
    outerJoin: () => makeDataFrameProbe(df),
    crossJoin: () => makeDataFrameProbe(df),
    asofJoin: () => makeDataFrameProbe(df),

    // Grouping methods
    groupBy: () => makeDataFrameProbe(df),
    summarise: () => makeDataFrameProbe(df),
    summarize: () => makeDataFrameProbe(df),
    summariseColumns: () => makeDataFrameProbe(df),
    summarizeColumns: () => makeDataFrameProbe(df),
    crossTabulate: () => makeDataFrameProbe(df),
    ungroup: () => makeDataFrameProbe(df),

    // Slice methods
    slice: () => makeDataFrameProbe(df),
    slice_indices: () => makeDataFrameProbe(df),
    head: () => makeDataFrameProbe(df),
    sliceHead: () => makeDataFrameProbe(df),
    tail: () => makeDataFrameProbe(df),
    sliceTail: () => makeDataFrameProbe(df),
    sliceMin: () => makeDataFrameProbe(df),
    sliceMax: () => makeDataFrameProbe(df),
    sample: () => makeDataFrameProbe(df),
    sliceSample: () => makeDataFrameProbe(df),

    // Extract methods (return primitive values)
    extract: () => "test_value",
    extractHead: () => "test_value",
    extractTail: () => "test_value",
    extractNth: () => "test_value",
    extractSample: () => "test_value",
    extractUnique: () => ["test_value"],
    extractNthWhereSorted: () => makeDataFrameProbe(df),

    // Reshape methods
    pivotWider: () => makeDataFrameProbe(df),
    pivotLonger: () => makeDataFrameProbe(df),
    transpose: () => makeDataFrameProbe(df),

    // Row label methods
    setRowLabels: () => makeDataFrameProbe(df),
    getRowLabels: () => [],

    // Index methods
    loc: () => makeDataFrameProbe(df),
    iloc: () => makeDataFrameProbe(df),

    // Utility methods
    dummyCol: () => makeDataFrameProbe(df),
    graph: () => ({}), // Return empty object for graph
    forEachRow: () => makeDataFrameProbe(df),
    forEachCol: () => makeDataFrameProbe(df),
    replaceNA: () => makeDataFrameProbe(df),
    append: () => makeDataFrameProbe(df),
    prepend: () => makeDataFrameProbe(df),
    shuffle: () => makeDataFrameProbe(df),
    bindRows: () => makeDataFrameProbe(df),
    bind: () => makeDataFrameProbe(df),
  } as unknown as DataFrame<Row>;
}

/**
 * Tests a single function to see if it's async.
 *
 * @param fn - The function to test
 * @param testArgs - Arguments to pass to the function for testing
 * @returns true if the function is async (declared async or returns a Promise)
 */
export function isAsyncFunction(
  fn: unknown,
  testArgs: unknown[] = [],
): boolean {
  if (typeof fn !== "function") return false;

  // Check if declared async
  if (fn instanceof AsyncFunction) return true;

  // Test if it returns a Promise
  try {
    const result = (fn as any)(...testArgs);
    // If it's already a Promise, it's async
    if (returnsPromise(result)) {
      return true;
    }

    // If it's not a Promise, it's sync
    return false;
  } catch (_error) {
    // If function throws during testing, assume it might be async
    return true;
  }
}

/**
 * Generic helper to test functions with row-based arguments.
 * Used by mutate and filter verbs.
 *
 * @param df - The DataFrame to test against
 * @param functions - Array of functions to test
 * @param testArgs - Arguments to pass to each function (includes row probe, index, df)
 * @returns true if any function is async
 */
function shouldUseAsyncWithRowArgs<Row extends object>(
  df: DataFrame<Row>,
  functions: unknown[],
  testArgs: unknown[],
): boolean {
  const n = df.nrows();
  if (n === 0) return false;

  for (const fn of functions) {
    if (typeof fn === "function") {
      if (isAsyncFunction(fn, testArgs)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Tests if any function in a record/spec is async.
 * Used by mutate verb.
 *
 * @param df - The DataFrame to test against
 * @param spec - Record of column names to functions/values
 * @returns true if any function in the spec is async
 */
export function shouldUseAsyncForMutate<Row extends object>(
  df: DataFrame<Row>,
  spec: object,
): boolean {
  const api: any = df as any;
  const probe = makeRowSnapshot(api, 0);
  const functions = Object.values(spec);

  return shouldUseAsyncWithRowArgs(df, functions, [probe, 0, df]);
}

/**
 * Tests if any predicate function is async.
 * Used by filter verb.
 *
 * @param df - The DataFrame to test against
 * @param predicates - Array of predicate functions or arrays
 * @returns true if any predicate function is async
 */
export function shouldUseAsyncForFilter<Row extends object>(
  df: DataFrame<Row>,
  predicates: unknown[],
): boolean {
  const api: any = df as any;
  const probe = makeRowSnapshot(api, 0);
  const functions = predicates.filter((p) => typeof p === "function");

  return shouldUseAsyncWithRowArgs(df, functions, [probe, 0, df]);
}

/**
 * Tests if any function in a summarise spec is async.
 * Used by summarise verb.
 *
 * @param df - The DataFrame to test against
 * @param spec - Summarise specification (function or record of functions)
 * @returns true if any function in the spec is async
 */
export function shouldUseAsyncForSummarise<Row extends object>(
  df: DataFrame<Row>,
  spec:
    | Record<string, (df: DataFrame<Row>) => unknown>
    | ((df: DataFrame<Row>) => object),
): boolean {
  const n = df.nrows();
  if (n === 0) return false;

  const probeDF = makeDataFrameProbe(df);

  if (typeof spec === "function") {
    return isAsyncFunction(spec, [probeDF]);
  }

  const functions = Object.values(spec).filter((expr) =>
    typeof expr === "function"
  );
  return shouldUseAsyncWithRowArgs(df, functions, [probeDF]);
}
