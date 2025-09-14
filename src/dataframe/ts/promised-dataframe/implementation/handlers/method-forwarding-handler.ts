// deno-lint-ignore-file no-explicit-any

import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import { isThenableDataFrame } from "../../../utilities/isThenable.ts";
import { createPropertyError } from "./shared-handler-utils.ts";
import { wrapThenable } from "../../implementation/utils.ts";

// Handle method forwarding: call the verb after we have the df
export function handleMethodForwarding<Row extends Record<string, unknown>>(
  prop: string | number | symbol,
  p: Promise<DataFrame<Row>>,
  resolveVerb: (prop: string | number | symbol, df: DataFrame<Row>) => any,
  chainFn: (df: DataFrame<Row> | Promise<DataFrame<Row>>) => any,
  chainGroupedFn: (gdf: GroupedDataFrame<Row, keyof Row>) => any,
) {
  return ((...args: unknown[]) => {
    const promiseOut = p.then((df) => {
      const method = resolveVerb(prop, df);

      if (typeof method !== "function") {
        // Try to access the property directly from the DataFrame
        const directProp = (df as any)[prop];
        if (directProp !== undefined) {
          if (typeof directProp === "function") {
            // Bind the function to the correct context to preserve 'this'
            const out = directProp.bind(df)(...args);
            // Return raw result; wrapping will be handled uniformly below
            return out as unknown;
          } else {
            // Non-callable property - return it directly
            return directProp;
          }
        }
        throw createPropertyError(prop, "DataFrame");
      }

      const out = (method as any)(...args);

      // If it's already a thenableDataFrame wrapper - return it directly for chaining
      if (isThenableDataFrame(out)) {
        return out as unknown;
      }

      // Return raw result; will be wrapped in thenable at the call site
      return out as unknown;
    });

    // Wrap the promise result into a chainable thenable immediately
    return wrapThenable<Row>(
      promiseOut as Promise<unknown>,
      chainFn as unknown as (df: DataFrame<Row>) => any,
      chainGroupedFn as unknown as (
        gdf: GroupedDataFrame<Row, keyof Row>,
      ) => any,
    );
  }) as any;
}
