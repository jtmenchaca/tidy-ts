// deno-lint-ignore-file no-explicit-any

import {
  isThenable,
  isThenableDataFrame,
} from "../../../utilities/isThenable.ts";
import { wrapThenable } from "../utils.ts";

/**
 * Generic utility to resolve a property from either a resolved object or a promise
 * This is the most common pattern across all handlers
 */
export function resolveProperty(
  prop: string | number | symbol,
  objOrPromise: any,
  promise: Promise<any>,
): any {
  // Check if this is already a resolved object (not a promise)
  if (
    objOrPromise && typeof objOrPromise === "object" &&
    !isThenable(objOrPromise)
  ) {
    return objOrPromise[prop];
  }
  return promise.then((obj: any) => {
    return obj[prop];
  });
}

/**
 * Access a property and bind it if it's a function
 * Common pattern in sync methods handlers
 */
export function accessPropertyWithBinding(
  obj: any,
  prop: string | number | symbol,
): any {
  const directProp = obj[prop];
  if (typeof directProp === "function") {
    return directProp.bind(obj);
  }
  return directProp;
}

/**
 * Process method call results and handle different return types
 * Common pattern in method call handlers
 */
export function processMethodResult(
  result: unknown,
  isDataFrame: (x: unknown) => boolean,
  isGroupedDataFrame: (x: unknown) => boolean,
  chainFn: (df: any) => any,
  chainGroupedFn: (gdf: any) => any,
): any {
  // Handle Promise results
  if (isThenable(result)) {
    return wrapThenable(
      result as Promise<unknown>,
      chainFn,
      chainGroupedFn,
    );
  }

  // Only chain DataFrames, return primitives directly
  if (isDataFrame(result)) {
    return chainFn(result);
  } else if (isGroupedDataFrame(result)) {
    return chainGroupedFn(result);
  }

  return result;
}

/**
 * Process method call results for async contexts (with Promise chaining)
 * Common pattern in async method call handlers
 */
export function processAsyncMethodResult(
  result: unknown,
  isDataFrame: (x: unknown) => boolean,
  isGroupedDataFrame: (x: unknown) => boolean,
  chainFn: (df: any) => any,
  chainGroupedFn: (gdf: any) => any,
): any {
  // Handle Promise results
  if (isThenable(result)) {
    return wrapThenable(
      result as Promise<unknown>,
      chainFn,
      chainGroupedFn,
    );
  }

  // Only chain DataFrames, return primitives directly
  if (isDataFrame(result)) {
    return chainFn(result);
  } else if (isGroupedDataFrame(result)) {
    return chainGroupedFn(result);
  }

  return result;
}

/**
 * Create a print method handler that returns the chain proxy
 * Common pattern in print method handlers
 */
export function createPrintMethodHandler(
  chainFn: (obj: any) => any,
) {
  return (
    prop: string | number | symbol,
    objOrPromise: any,
    promise: Promise<any>,
  ): any => {
    if (prop === "print") {
      if (
        objOrPromise && typeof objOrPromise === "object" &&
        !isThenable(objOrPromise)
      ) {
        return ((...args: unknown[]) => {
          const printMethod = objOrPromise.print;
          if (typeof printMethod === "function") {
            printMethod.apply(objOrPromise, args);
            return chainFn(objOrPromise);
          }
          return chainFn(objOrPromise);
        });
      }
      return promise.then((obj: any) => {
        return ((...args: unknown[]) => {
          const printMethod = obj.print;
          if (typeof printMethod === "function") {
            printMethod.apply(obj, args);
            return chainFn(obj);
          }
          return chainFn(obj);
        });
      });
    }
    return null;
  };
}

/**
 * Create a writeCSV method handler that returns the chain proxy
 * Common pattern in writeCSV method handlers
 */
export function createWriteCSVMethodHandler(
  chainFn: (obj: any) => any,
) {
  return (
    prop: string | number | symbol,
    objOrPromise: any,
    promise: Promise<any>,
  ): any => {
    if (prop === "writeCSV") {
      if (
        objOrPromise && typeof objOrPromise === "object" &&
        !isThenable(objOrPromise)
      ) {
        return ((...args: unknown[]) => {
          const writeCSVMethod = objOrPromise.writeCSV;
          if (typeof writeCSVMethod === "function") {
            writeCSVMethod.apply(objOrPromise, args);
            return chainFn(objOrPromise);
          }
          return chainFn(objOrPromise);
        });
      }
      return promise.then((obj: any) => {
        return ((...args: unknown[]) => {
          const writeCSVMethod = obj.writeCSV;
          if (typeof writeCSVMethod === "function") {
            writeCSVMethod.apply(obj, args);
            return chainFn(obj);
          }
          return chainFn(obj);
        });
      });
    }
    return null;
  };
}

/**
 * Create a property matcher that handles specific property types
 * Common pattern for type-specific handlers
 */
export function createPropertyMatcher(
  predicate: (prop: string | number | symbol) => boolean,
  handler: (
    prop: string | number | symbol,
    objOrPromise: any,
    promise: Promise<any>,
  ) => any,
) {
  return (
    prop: string | number | symbol,
    objOrPromise: any,
    promise: Promise<any>,
  ): any => {
    if (predicate(prop)) {
      return handler(prop, objOrPromise, promise);
    }
    return null;
  };
}

/**
 * Create a numeric index handler
 * Common pattern for numeric property access
 */
export function createNumericIndexHandler() {
  return createPropertyMatcher(
    (prop) =>
      (typeof prop === "string" && /^\d+$/.test(prop)) ||
      (typeof prop === "number" && Number.isInteger(prop)),
    resolveProperty,
  );
}

/**
 * Create a symbol property handler
 * Common pattern for symbol property access
 */
export function createSymbolPropertyHandler() {
  return createPropertyMatcher(
    (prop) => typeof prop === "symbol",
    resolveProperty,
  );
}

/** Sync methods that should be accessible without await on thenable DataFrames */
export const SYNC_METHODS = [
  "nrows",
  "extract",
  "toArray",
  "toRows",
  "toColumns",
  "columns",
];

/**
 * Create a sync methods handler for specific method names
 * Common pattern for internal properties and core methods
 */
export function createSyncMethodsHandler(
  syncMethods: string[],
) {
  return createPropertyMatcher(
    (prop) =>
      typeof prop === "string" &&
      (prop.startsWith("__") || syncMethods.includes(prop)),
    (prop, objOrPromise, promise) => {
      if (
        objOrPromise && typeof objOrPromise === "object" &&
        !isThenable(objOrPromise)
      ) {
        return accessPropertyWithBinding(objOrPromise, prop);
      }
      // Special case: If objOrPromise is a thenable wrapper (not a real Promise),
      // we can still access sync methods directly
      if (isThenableDataFrame(objOrPromise)) {
        return accessPropertyWithBinding(objOrPromise, prop);
      }
      return promise.then((obj: any) => {
        return accessPropertyWithBinding(obj, prop);
      });
    },
  );
}

/**
 * Create a column access handler
 * Common pattern for checking if property is a column name
 */
export function createColumnAccessHandler(
  getColumns: (obj: any) => string[] | undefined,
) {
  return createPropertyMatcher(
    (prop) => typeof prop === "string",
    (prop, objOrPromise, _promise) => {
      if (
        objOrPromise && typeof objOrPromise === "object" &&
        !isThenable(objOrPromise)
      ) {
        const cols = getColumns(objOrPromise);
        if (cols && typeof prop === "string" && cols.includes(prop)) {
          return objOrPromise[prop];
        }
      }
      return null;
    },
  );
}

/**
 * Create error message for missing properties
 * Common pattern for error handling
 */
export function createPropertyError(
  prop: string | number | symbol,
  type: string,
): Error {
  return new Error(
    `Property '${
      String(prop)
    }' is not callable before await; await the ${type} first.`,
  );
}
