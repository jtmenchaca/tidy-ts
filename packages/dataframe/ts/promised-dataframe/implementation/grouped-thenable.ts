// deno-lint-ignore-file no-explicit-any

import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import { resolveVerb } from "../../dataframe/implementation/resolve-verb.ts";
import {
  isDataFrame,
  isGroupedDataFrame,
} from "../../utilities/isDataFrame.ts";
import {
  createColumnAccessHandler,
  createNumericIndexHandler,
  createPrintMethodHandler,
  createPropertyError,
  createSymbolPropertyHandler,
  createSyncMethodsHandler,
  createWriteCSVMethodHandler,
  processAsyncMethodResult,
} from "./handlers/shared-handler-utils.ts";
import { wrapThenable } from "./utils.ts";
// No longer importing handleGroupedSyncMethodCall - inlined below
import { thenableDataFrame } from "./dataframe-thenable.ts";
import { isThenable, isThenableDataFrame } from "../../utilities/isThenable.ts";

// Grouped variant (optional: you can reuse the same thenableDataFrame() if resolveVerb keeps grouping)
export function thenableGroupedDataFrame<
  Row extends Record<string, unknown>,
  K extends keyof Row,
>(
  gdfOrPromise: GroupedDataFrame<Row, K> | Promise<GroupedDataFrame<Row, K>>,
): any /* ChainGrouped<Row, K> */ {
  const p = Promise.resolve(gdfOrPromise);

  const proxy = new Proxy({}, {
    get(_t, prop, _r) {
      if (prop === "then") return p.then.bind(p);
      if (prop === "catch") return p.catch.bind(p);
      if (prop === "finally") return p.finally.bind(p);

      // Mark this as a thenable wrapper to prevent double-wrapping
      if (prop === Symbol.for("__thenableDataFrame")) {
        return true;
      }

      // Handle numeric indices for row access
      const numericHandler = createNumericIndexHandler<
        GroupedDataFrame<Row, K>
      >();
      const numericResult = numericHandler(prop, gdfOrPromise, p);
      if (numericResult !== null) return numericResult;

      // Handle special Symbol properties that should not be callable
      const symbolHandler = createSymbolPropertyHandler<
        GroupedDataFrame<Row, K>
      >();
      const symbolResult = symbolHandler(prop, gdfOrPromise, p);
      if (symbolResult !== null) return symbolResult;

      // Special handling for internal properties and core methods that should not be wrapped in function calls
      // For sync contexts (like probe testing), provide immediate access to resolved value
      const syncMethods = ["nrows", "extract", "toArray", "columns"];
      const syncHandler = createSyncMethodsHandler<GroupedDataFrame<Row, K>>(
        syncMethods,
      );
      const syncResult = syncHandler(prop, gdfOrPromise, p);
      if (syncResult !== null) return syncResult;

      // Handle direct column access - check if it's a column name
      const columnHandler = createColumnAccessHandler<GroupedDataFrame<Row, K>>(
        (gdf) => (gdf as any).columns?.(),
      );
      const columnResult = columnHandler(
        prop,
        gdfOrPromise,
        Promise.resolve(gdfOrPromise),
      );
      if (columnResult !== null) return columnResult;

      // Special handling for forEachRow and forEachCol - return the proxy itself for thenableDataFrameing
      if (prop === "forEachRow" || prop === "forEachCol") {
        return ((...args: unknown[]) => {
          // If the original gdfOrPromise is not a Promise, call directly
          if (!isThenable(gdfOrPromise)) {
            const method = resolveVerb(prop, gdfOrPromise);
            if (typeof method === "function") {
              const result = (method as any)(...args);
              // If the result is a Promise (async forEach), wrap it
              if (isThenable(result)) {
                return thenableGroupedDataFrame(
                  result as Promise<GroupedDataFrame<Row, K>>,
                );
              }
              // For sync forEach, return the proxy to maintain reference
              return proxy;
            }
            return proxy;
          }

          // For async case, use the Promise chain
          return p.then((gdf) => {
            const method = resolveVerb(prop, gdf);
            if (typeof method === "function") {
              (method as any)(...args);
            }
            // Return the same proxy instance
            return proxy;
          });
        }) as any;
      }

      // Special handling for print method - need to return the thenableDataFrame proxy, not the underlying object
      const printHandler = createPrintMethodHandler<GroupedDataFrame<Row, K>>(
        thenableGroupedDataFrame,
      );
      const printResult = printHandler(prop, gdfOrPromise, p);
      if (printResult !== null) return printResult;

      // Special handling for writeCSV method - need to return the thenableDataFrame proxy, not the underlying object
      const writeCSVHandler = createWriteCSVMethodHandler<
        GroupedDataFrame<Row, K>
      >(
        thenableGroupedDataFrame,
      );
      const writeCSVResult = writeCSVHandler(prop, gdfOrPromise, p);
      if (writeCSVResult !== null) return writeCSVResult;

      // Handle direct property access to the GroupedDataFrame (non-functions only)
      if (
        gdfOrPromise && typeof gdfOrPromise === "object" &&
        !isThenable(gdfOrPromise)
      ) {
        const directProp = (gdfOrPromise as any)[prop];
        if (typeof directProp !== "function" && directProp !== undefined) {
          return directProp;
        }
      }

      // Special case: If gdfOrPromise is a thenable wrapper (not a real Promise),
      // try to access the property directly from it
      if (isThenableDataFrame(gdfOrPromise)) {
        const directProp = (gdfOrPromise as any)[prop];
        if (typeof directProp !== "function" && directProp !== undefined) {
          return directProp;
        }
      }

      // Check if we can handle this synchronously (gdf is not a Promise)
      // Inline sync method call handling
      let syncMethodResult = null;
      if (
        gdfOrPromise && typeof gdfOrPromise === "object" &&
        !isThenable(gdfOrPromise)
      ) {
        // Sync case - call method directly without Promise.resolve wrapper
        syncMethodResult = ((...args: unknown[]) => {
          const gdf = gdfOrPromise;
          const method = resolveVerb(prop, gdf);
          if (typeof method !== "function") {
            // Try to access the property directly from the GroupedDataFrame
            const directProp = (gdf as any)[prop];
            if (directProp !== undefined) {
              if (typeof directProp === "function") {
                // Bind the function to the correct context to preserve 'this'
                const out = directProp.bind(gdf)(...args);
                // Handle Promise results
                if (isThenable(out)) {
                  return wrapThenable(
                    out as Promise<unknown>,
                    thenableDataFrame,
                    thenableGroupedDataFrame,
                  );
                }
                // For DataFrame/GroupedDataFrame, return wrapped thenable for chaining
                if (isDataFrame(out)) {
                  return thenableDataFrame(out as unknown as DataFrame<Row>);
                }
                if (isGroupedDataFrame(out)) {
                  return thenableGroupedDataFrame(
                    out as unknown as GroupedDataFrame<Row, K>,
                  );
                }
                return out;
              } else {
                // Non-callable property - return it directly
                return directProp;
              }
            }
            throw createPropertyError(prop, "GroupedDataFrame");
          }
          const out = (method as any)(...args);

          // Special case for ungroup() - return the raw DataFrame without wrapping
          if (prop === "ungroup" && isDataFrame(out)) {
            return out;
          }

          // Check if the result is already a thenable wrapper - don't double-wrap
          if (isThenableDataFrame(out)) {
            return out;
          }

          // Handle Promise results
          if (isThenable(out)) {
            return wrapThenable(
              out as Promise<unknown>,
              thenableDataFrame,
              thenableGroupedDataFrame,
            );
          }
          // For DataFrame/GroupedDataFrame, return wrapped thenable for chaining
          if (isDataFrame(out)) {
            return thenableDataFrame(out as unknown as DataFrame<Row>);
          }
          if (isGroupedDataFrame(out)) {
            return thenableGroupedDataFrame(
              out as unknown as GroupedDataFrame<Row, K>,
            );
          }
          return out;
        }) as any;
      }
      if (syncMethodResult !== null) return syncMethodResult;

      // Async case - method calls through Promise
      return ((...args: unknown[]) =>
        p.then((gdf) => {
          const method = resolveVerb(prop, gdf);
          if (typeof method !== "function") {
            // Try to access the property directly from the GroupedDataFrame
            const directProp = (gdf as any)[prop];
            if (directProp !== undefined) {
              if (typeof directProp === "function") {
                // Bind the function to the correct context to preserve 'this'
                const out = directProp.bind(gdf)(...args);
                return processAsyncMethodResult(
                  out,
                  (x): x is DataFrame<Row> => isDataFrame(x),
                  (x): x is GroupedDataFrame<Row, K> => isGroupedDataFrame(x),
                  thenableDataFrame,
                  thenableGroupedDataFrame,
                );
              } else {
                // Non-callable property - return it directly
                return directProp;
              }
            }
            throw createPropertyError(prop, "GroupedDataFrame");
          }
          const out = (method as any)(...args);
          return processAsyncMethodResult(
            out,
            (x): x is DataFrame<Row> => isDataFrame(x),
            (x): x is GroupedDataFrame<Row, K> => isGroupedDataFrame(x),
            thenableDataFrame,
            thenableGroupedDataFrame,
          );
        })) as any;
    },
  });

  return proxy;
}
