// deno-lint-ignore-file no-explicit-any
import { materializeIndex } from "../../dataframe/index.ts";

/**
 * Execute a side effect for each row in the DataFrame.
 * Returns the same DataFrame for chaining.
 */
export function for_each_row(
  fn: any,
) {
  return (df: any): any => {
    if (df.nrows() === 0) return df;
    return forEachRowSync(df, fn);
  };
}

export function for_each_row_async(
  fn: any,
) {
  return (df: any): any => {
    if (df.nrows() === 0) return df;
    return forEachRowAsync(df, fn);
  };
}

// Sync implementation
function forEachRowSync(
  df: any,
  fn: any,
) {
  for (let i = 0; i < df.nrows(); i++) {
    fn(df[i], i, df);
  }

  return df;
}

// Async implementation
async function forEachRowAsync(
  df: any,
  fn: any,
) {
  const promises: Promise<unknown>[] = [];

  for (let i = 0; i < df.nrows(); i++) {
    const promise = fn(df[i], i, df);
    promises.push(promise);
  }

  await Promise.all(promises);

  return df;
}

/**
 * Execute a side effect for each column in the DataFrame.
 * Returns the same DataFrame for chaining.
 */
export function for_each_col(
  fn: any,
) {
  return (df: any): any => {
    if (df.nrows() === 0) return df;
    return forEachColSync(df, fn);
  };
}

export function for_each_col_async(
  fn: any,
) {
  return (df: any): any => {
    if (df.nrows() === 0) return df;
    return forEachColAsync(df, fn);
  };
}

// Sync implementation
function forEachColSync(
  df: any,
  fn: any,
) {
  // Get column names directly from store instead of inferring from rows
  const store = df.__store;
  const names = store.columnNames;

  for (const name of names) {
    // Pass the original DataFrame reference but with view-aware column access
    fn(name, createViewAwareProxy(df));
  }

  return df;
}

// Async implementation
async function forEachColAsync(
  df: any,
  fn: any,
) {
  // Get column names directly from store instead of inferring from rows
  const store = df.__store;
  const names = store.columnNames;

  const promises: Promise<unknown>[] = [];
  for (const name of names) {
    // Pass the original DataFrame reference but with view-aware column access
    const promise = fn(name, createViewAwareProxy(df));
    promises.push(promise);
  }

  await Promise.all(promises);

  return df;
}

// Helper to create a DataFrame proxy that returns filtered columns when accessed
function createViewAwareProxy(
  df: any,
): any {
  const api = df;
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
