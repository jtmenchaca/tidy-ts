// deno-lint-ignore-file no-explicit-any

import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import {
  isThenable,
  isThenableDataFrame,
} from "../../../utilities/isThenable.ts";
import { wrapThenable } from "../../implementation/utils.ts";

/**
 * Generic utility to resolve a property from either a resolved object or a promise
 * This is the most common pattern across all handlers
 */
export function resolveProperty<T>(
  prop: string | number | symbol,
  objOrPromise: T | Promise<T>,
  promise: Promise<T>,
): any | Promise<any> {
  // Check if this is already a resolved object (not a promise)
  if (
    objOrPromise && typeof objOrPromise === "object" &&
    !isThenable(objOrPromise)
  ) {
    return (objOrPromise as any)[prop];
  }
  return promise.then((obj) => {
    return (obj as any)[prop];
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
export function processMethodResult<
  Row extends Record<string, unknown>,
  K extends keyof Row,
>(
  result: unknown,
  isDataFrame: (x: unknown) => x is DataFrame<Row>,
  isGroupedDataFrame: (x: unknown) => x is GroupedDataFrame<Row, K>,
  chainFn: (df: DataFrame<Row>) => any,
  chainGroupedFn: (gdf: GroupedDataFrame<Row, K>) => any,
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
    return chainFn(result as unknown as DataFrame<Row>);
  } else if (isGroupedDataFrame(result)) {
    return chainGroupedFn(result as unknown as GroupedDataFrame<Row, K>);
  }

  return result;
}

/**
 * Process method call results for async contexts (with Promise chaining)
 * Common pattern in async method call handlers
 */
export function processAsyncMethodResult<
  Row extends Record<string, unknown>,
  K extends keyof Row,
>(
  result: unknown,
  isDataFrame: (x: unknown) => x is DataFrame<Row>,
  isGroupedDataFrame: (x: unknown) => x is GroupedDataFrame<Row, K>,
  chainFn: (df: DataFrame<Row> | Promise<DataFrame<Row>>) => any,
  chainGroupedFn: (gdf: GroupedDataFrame<Row, K>) => any,
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
    return chainFn(result as unknown as DataFrame<Row>);
  } else if (isGroupedDataFrame(result)) {
    return chainGroupedFn(result as unknown as GroupedDataFrame<Row, K>);
  }

  return result;
}

/**
 * Create a print method handler that returns the chain proxy
 * Common pattern in print method handlers
 */
export function createPrintMethodHandler<T>(
  chainFn: (obj: T) => any,
) {
  return (
    prop: string | number | symbol,
    objOrPromise: T | Promise<T>,
    promise: Promise<T>,
  ): any => {
    if (prop === "print") {
      if (
        objOrPromise && typeof objOrPromise === "object" &&
        !isThenable(objOrPromise)
      ) {
        return ((...args: unknown[]) => {
          const printMethod = (objOrPromise as any).print;
          if (typeof printMethod === "function") {
            printMethod.apply(objOrPromise, args);
            return chainFn(objOrPromise as any);
          }
          return chainFn(objOrPromise as any);
        });
      }
      return promise.then((obj) => {
        return ((...args: unknown[]) => {
          const printMethod = (obj as any).print;
          if (typeof printMethod === "function") {
            printMethod.apply(obj, args);
            return chainFn(obj as any);
          }
          return chainFn(obj as any);
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
export function createWriteCSVMethodHandler<T>(
  chainFn: (obj: T) => any,
) {
  return (
    prop: string | number | symbol,
    objOrPromise: T | Promise<T>,
    promise: Promise<T>,
  ): any => {
    if (prop === "writeCSV") {
      if (
        objOrPromise && typeof objOrPromise === "object" &&
        !isThenable(objOrPromise)
      ) {
        return ((...args: unknown[]) => {
          const writeCSVMethod = (objOrPromise as any).writeCSV;
          if (typeof writeCSVMethod === "function") {
            writeCSVMethod.apply(objOrPromise, args);
            return chainFn(objOrPromise as any);
          }
          return chainFn(objOrPromise as any);
        });
      }
      return promise.then((obj) => {
        return ((...args: unknown[]) => {
          const writeCSVMethod = (obj as any).writeCSV;
          if (typeof writeCSVMethod === "function") {
            writeCSVMethod.apply(obj, args);
            return chainFn(obj as any);
          }
          return chainFn(obj as any);
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
export function createPropertyMatcher<T>(
  predicate: (prop: string | number | symbol) => boolean,
  handler: (
    prop: string | number | symbol,
    objOrPromise: T | Promise<T>,
    promise: Promise<T>,
  ) => any,
) {
  return (
    prop: string | number | symbol,
    objOrPromise: T | Promise<T>,
    promise: Promise<T>,
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
export function createNumericIndexHandler<T>() {
  return createPropertyMatcher<T>(
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
export function createSymbolPropertyHandler<T>() {
  return createPropertyMatcher<T>(
    (prop) => typeof prop === "symbol",
    resolveProperty,
  );
}

/**
 * Create a sync methods handler for specific method names
 * Common pattern for internal properties and core methods
 */
export function createSyncMethodsHandler<T>(
  syncMethods: string[],
) {
  return createPropertyMatcher<T>(
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
      return promise.then((obj) => {
        return accessPropertyWithBinding(obj, prop);
      });
    },
  );
}

/**
 * Create a column access handler
 * Common pattern for checking if property is a column name
 */
export function createColumnAccessHandler<T>(
  getColumns: (obj: T) => string[] | undefined,
) {
  return createPropertyMatcher<T>(
    (prop) => typeof prop === "string",
    (prop, objOrPromise, _promise) => {
      if (
        objOrPromise && typeof objOrPromise === "object" &&
        !isThenable(objOrPromise)
      ) {
        const cols = getColumns(objOrPromise);
        if (cols && typeof prop === "string" && cols.includes(prop)) {
          return (objOrPromise as any)[prop];
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
