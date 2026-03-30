// deno-lint-ignore-file no-explicit-any

import { isThenableDataFrame } from "../../../utilities/isThenable.ts";
import { createPropertyError } from "./shared-handler-utils.ts";
import { wrapThenable } from "../utils.ts";

// Handle method forwarding: call the verb after we have the df
export function handleMethodForwarding(
  prop: string | number | symbol,
  p: Promise<any>,
  resolveVerb: (prop: string | number | symbol, df: any) => any,
  chainFn: (df: any) => any,
  chainGroupedFn: (gdf: any) => any,
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
    return wrapThenable(
      promiseOut as Promise<unknown>,
      chainFn,
      chainGroupedFn,
    );
  }) as any;
}
