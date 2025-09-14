// deno-lint-ignore-file no-explicit-any
import {
  type DataFrame,
  type GroupedDataFrame,
  materializeIndex,
} from "../../dataframe/index.ts";

/**
 * Execute a side effect for each row in the DataFrame.
 * Returns the same DataFrame for chaining.
 */

// Grouped overload: preserve grouping type
export function for_each_row<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
>(
  fn: (row: Readonly<Row>, idx: number, df: DataFrame<Row>) => void,
): (df: GroupedDataFrame<Row, GroupName>) => GroupedDataFrame<Row, GroupName>;

// Ungrouped overload
export function for_each_row<Row extends Record<string, unknown>>(
  fn: (row: Readonly<Row>, idx: number, df: DataFrame<Row>) => void,
): (df: DataFrame<Row>) => DataFrame<Row>;

// Implementation
export function for_each_row<Row extends Record<string, unknown>>(
  fn: any,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>): any => {
    if (df.nrows() === 0) return df;

    // Simple async detection - only check for declared async functions
    // For side-effect functions like forEachRow, we avoid calling the function for testing
    const AsyncFunction =
      Object.getPrototypeOf(async function () {}).constructor;
    const isAsync = fn instanceof AsyncFunction;

    if (isAsync) {
      return forEachRowAsync(df, fn);
    } else {
      return forEachRowSync(df, fn);
    }
  };
}

// Sync implementation
function forEachRowSync<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fn: (row: Readonly<Row>, idx: number, df: DataFrame<Row>) => void,
) {
  for (let i = 0; i < df.nrows(); i++) {
    fn((df as any)[i] as Row, i, df as DataFrame<Row>);
  }

  return df;
}

// Async implementation
async function forEachRowAsync<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fn: (row: Readonly<Row>, idx: number, df: DataFrame<Row>) => Promise<unknown>,
) {
  const promises: Promise<unknown>[] = [];

  for (let i = 0; i < df.nrows(); i++) {
    const promise = fn((df as any)[i] as Row, i, df as DataFrame<Row>);
    promises.push(promise);
  }

  await Promise.all(promises);

  return df;
}

/**
 * Execute a side effect for each column in the DataFrame.
 * Returns the same DataFrame for chaining.
 */

// Grouped overload: preserve grouping type
export function for_each_col<
  Row extends Record<string, unknown>,
  GroupName extends keyof Row,
>(
  fn: (
    colName: keyof Row,
    df: DataFrame<Row>,
  ) => void,
): (df: GroupedDataFrame<Row, GroupName>) => GroupedDataFrame<Row, GroupName>;

// Ungrouped overload
export function for_each_col<Row extends Record<string, unknown>>(
  fn: (
    colName: keyof Row,
    df: DataFrame<Row>,
  ) => void,
): (df: DataFrame<Row>) => DataFrame<Row>;

// Implementation
export function for_each_col<Row extends Record<string, unknown>>(
  fn: any,
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>): any => {
    if (df.nrows() === 0) return df;

    // Simple async detection - only check for declared async functions
    const AsyncFunction =
      Object.getPrototypeOf(async function () {}).constructor;
    const isAsync = fn instanceof AsyncFunction;

    if (isAsync) {
      return forEachColAsync(df, fn);
    } else {
      return forEachColSync(df, fn);
    }
  };
}

// Sync implementation
function forEachColSync<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fn: (colName: keyof Row, df: DataFrame<Row>) => void,
) {
  // Get column names directly from store instead of inferring from rows
  const store = (df as any).__store;
  const names = store.columnNames as (keyof Row)[];

  for (const name of names) {
    // Pass the original DataFrame reference but with view-aware column access
    fn(name, createViewAwareProxy(df as DataFrame<Row>));
  }

  return df;
}

// Async implementation
async function forEachColAsync<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  fn: (colName: keyof Row, df: DataFrame<Row>) => Promise<unknown>,
) {
  // Get column names directly from store instead of inferring from rows
  const store = (df as any).__store;
  const names = store.columnNames as (keyof Row)[];

  const promises: Promise<unknown>[] = [];
  for (const name of names) {
    // Pass the original DataFrame reference but with view-aware column access
    const promise = fn(name, createViewAwareProxy(df as DataFrame<Row>));
    promises.push(promise);
  }

  await Promise.all(promises);

  return df;
}

// Helper to create a DataFrame proxy that returns filtered columns when accessed
function createViewAwareProxy<Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
): DataFrame<Row> {
  const api = df as any;
  const store = api.__store;
  const view = api.__view;

  // If no view, return original DataFrame to preserve reference equality
  if (!view || (!view.mask && !view.index)) return df;

  return new Proxy(df, {
    get(target, prop, receiver) {
      // For column access, return filtered column if there's a view
      if (typeof prop === "string" && store.columnNames.includes(prop)) {
        const col = store.columns[prop];
        const materializedIndex = materializeIndex(store.length, view);
        const filteredCol = new Array(materializedIndex.length);
        for (let i = 0; i < materializedIndex.length; i++) {
          filteredCol[i] = col[materializedIndex[i]];
        }
        return filteredCol;
      }

      // For all other properties, delegate to original
      return Reflect.get(target, prop, receiver);
    },
  });
}
