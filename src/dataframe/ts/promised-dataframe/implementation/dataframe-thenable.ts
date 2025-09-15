// deno-lint-ignore-file no-explicit-any

/*
 * CRITICAL PROXY SYSTEM DISCOVERY: How Thenable DataFrames Work
 * ==============================================================
 *
 * RUNTIME BEHAVIOR: This proxy system handles ALL method calls on PromisedDataFrames
 * - All DataFrame methods (mutate, filter, etc.) go through this proxy's get trap
 * - The proxy calls resolveVerb() to find the actual method implementation
 * - resolveVerb() BYPASSES TypeScript's overload resolution entirely
 * - This is why adding PromisedDataFrame overloads to verb files doesn't work
 *
 * ASYNC/SYNC PATHWAY DETECTION:
 * - isSync = !(dfOrPromise instanceof Promise) determines if data is resolved
 * - Async pathway: forwards method through Promise.then() chains
 * - Sync pathway: calls method immediately but STILL returns thenable wrapper
 * - Both pathways return wrapped results via thenableDataFrame() recursion
 *
 * TYPE SYSTEM INTERACTION:
 * - Runtime proxy behavior is invisible to TypeScript compilation
 * - TypeScript only sees the PromisedDataFrame type definition signatures
 * - This is why type-level overrides work where runtime overloads fail
 *
 * DEBUGGING INSIGHTS:
 * - Add console.log here to see which methods are being called
 */

// Import DataFrame type and verb resolution function
import { type DataFrame, resolveVerb } from "../../dataframe/index.ts";
// Import utilities to check DataFrame types
import {
  isDataFrame,
  isGroupedDataFrame,
} from "../../utilities/isDataFrame.ts";
// Import handler functions for different property access patterns
import {
  createColumnAccessHandler, // Handles column access like df['columnName']
  createNumericIndexHandler, // Handles row access like df[0]
  createPrintMethodHandler, // Handles print() method specially
  createSymbolPropertyHandler, // Handles Symbol properties
  createSyncMethodsHandler, // Handles sync methods like nrows(), toArray()
} from "./handlers/shared-handler-utils.ts";
// Import async method forwarding handler
import { handleMethodForwarding } from "./handlers/method-forwarding-handler.ts";
// No longer importing handleMethodForwarding - inlined below
// Import grouped thenable wrapper
import { thenableGroupedDataFrame } from "./grouped-thenable.ts";
// Import utility to check if something is thenable
import { isThenable } from "../../utilities/isThenable.ts";

// Import the PromisedDataFrame type
import type { PromisedDataFrame } from "../types/promised-dataframe.type.ts";

// Create a thenable, chainable wrapper around a DataFrame or a Promise<DataFrame>
// This function returns a Proxy that acts like both a DataFrame and a Promise
export function thenableDataFrame<Row extends Record<string, unknown>>(
  dfOrPromise: DataFrame<Row> | Promise<DataFrame<Row>>, // Can wrap either sync or async DataFrame
): PromisedDataFrame<Row> {
  const p = Promise.resolve(dfOrPromise); // Always wrap in Promise for consistent .then/.catch/.finally behavior

  // Create a Proxy that intercepts all property access
  const proxy = new Proxy({}, {
    get(_t, prop, _r) {
      // Special marker property to identify this as a thenableDataFrame wrapper
      // Used by utilities like isThenableDataFrame() to detect wrapped DataFrames
      if (prop === Symbol.for("__thenableDataFrame")) {
        return true;
      }

      // Determine if we have a resolved DataFrame (sync) or a Promise<DataFrame> (async)
      // This affects how we handle method calls - sync can be called immediately,
      // async needs to be forwarded through Promise chains
      const isSync = !(dfOrPromise instanceof Promise);

      // Promise interface - expose Promise methods so this can be awaited
      // These make the thenable act like a real Promise
      if (prop === "then") {
        return p.then.bind(p); // Forward to internal Promise's then method
      }
      if (prop === "catch") {
        return p.catch.bind(p); // Forward to internal Promise's catch method
      }
      if (prop === "finally") {
        return p.finally.bind(p); // Forward to internal Promise's finally method
      }

      // Handle numeric indices for row access (e.g., df[0] to get first row)
      const numericHandler = createNumericIndexHandler<DataFrame<Row>>();
      const numericResult = numericHandler(prop, dfOrPromise, p);
      if (numericResult !== null) {
        return numericResult; // Return row data if numeric index was accessed
      }

      // Handle special Symbol properties (like Symbol.iterator, Symbol.toStringTag)
      // These are special JavaScript symbols that need direct access
      const symbolHandler = createSymbolPropertyHandler<DataFrame<Row>>();
      const symbolResult = symbolHandler(prop, dfOrPromise, p);
      if (symbolResult !== null) {
        return symbolResult; // Return symbol property value directly
      }

      // Handle core DataFrame methods that need immediate access (not wrapped in functions)
      // These are methods that should work directly on the thenable without await
      // Examples: df.nrows(), df.toArray(), df.columns()
      const syncMethods = ["nrows", "extract", "toArray", "columns"];
      const syncHandler = createSyncMethodsHandler<DataFrame<Row>>(syncMethods);
      const syncResult = syncHandler(prop, dfOrPromise, p);
      if (syncResult !== null) {
        return syncResult; // Return method result directly
      }

      // Handle direct column access - check if property is a column name
      // Allows access like df.columnName or df['columnName'] to get column data
      const columnHandler = createColumnAccessHandler<DataFrame<Row>>(
        (df) => (df as any).columns?.(), // Function to get column names from DataFrame
      );
      const columnResult = columnHandler(
        prop,
        dfOrPromise,
        Promise.resolve(dfOrPromise),
      );
      if (columnResult !== null) {
        return columnResult; // Return column data array
      }

      // Special handling for print method - it should return the thenable for chaining
      // Rather than returning void, print() returns the thenable so you can do df.print().mutate(...)
      const printHandler = createPrintMethodHandler<DataFrame<Row>>(
        thenableDataFrame, // Function to wrap result back in thenable
      );
      const printResult = printHandler(prop, dfOrPromise, p);
      if (printResult !== null) {
        return printResult; // Return chainable thenable after printing
      }

      // Method forwarding: handle DataFrame verbs (mutate, filter, select, etc.)
      // This is where the magic happens - we intercept method calls and decide
      // whether to execute immediately (sync) or forward through Promise chain (async)

      if (isSync) {
        // SYNC PATH: We have a resolved DataFrame, can call methods immediately
        // But we need to preserve the thenable nature for chaining
        const df = dfOrPromise; // Cast to DataFrame since we know it's resolved

        // Get the verb function (mutate, filter, etc.) for this property name
        // resolveVerb returns a function that applies the verb to the DataFrame
        const method = resolveVerb(prop, df);

        if (typeof method === "function") {
          // If resolveVerb found a method, return a wrapper function
          // This wrapper will be called when user does df.mutate(args)
          return ((...args: unknown[]) => {
            const result = (method as any)(...args); // Call the actual verb function

            // CRITICAL: Always wrap DataFrame results back in thenables
            // This preserves the thenable nature through the chain
            // Even sync operations on thenables should return thenables
            if (isDataFrame(result)) {
              return thenableDataFrame(result); // Wrap DataFrame in thenable for chaining
            } else if (isGroupedDataFrame(result)) {
              return thenableGroupedDataFrame(result); // Wrap GroupedDataFrame in thenable
            } else if (isThenable(result)) {
              return result; // Already a thenable, keep it
            }
            return result; // Non-DataFrame result (primitives, etc.)
          }) as any;
        } else {
          // If resolveVerb didn't find a method, try direct property access
          // This handles properties that aren't standard verbs
          const directProp = (df as any)[prop];
          if (directProp !== undefined) {
            return typeof directProp === "function"
              ? directProp.bind(df) // Bind function to correct 'this' context
              : directProp; // Return property value directly
          }
          throw new Error(
            `Property '${String(prop)}' is not callable on sync DataFrame`,
          );
        }
      } else {
        // ASYNC PATH: We have a Promise<DataFrame>, need to forward method calls
        // through the Promise chain using .then()

        const methodResult = handleMethodForwarding(
          prop, // The method name (mutate, filter, etc.)
          p, // The Promise<DataFrame>
          resolveVerb, // Function to resolve verb names to functions
          thenableDataFrame, // Function to wrap DataFrame results
          thenableGroupedDataFrame, // Function to wrap GroupedDataFrame results
        );
        return methodResult; // Returns a function that creates chained Promises
      }
    },
  });
  return proxy as PromisedDataFrame<Row>; // Return the Proxy, which acts as both DataFrame and Promise
}
