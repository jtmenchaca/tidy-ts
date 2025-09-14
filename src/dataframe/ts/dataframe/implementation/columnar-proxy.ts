// Columnar-optimized proxy handlers
import { resolveVerb } from "./resolve-verb.ts";
import type { ColumnarStore } from "./columnar-store.ts";
import { materializeIndex } from "./columnar-view.ts";

/** Disabled array APIs to nudge users to tidy verbs */
export const ARRAY_METHODS = new Set<string>([
  "map",
  "forEach",
  "reduce",
  "concat",
  "find",
  "some",
  "every",
  "flat",
  "flatMap",
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "includes",
  "indexOf",
  "lastIndexOf",
  "join",
  "entries",
  "keys",
  "values",
  "toString",
  "toLocaleString",
  "valueOf",
  "copyWithin",
  "fill",
]);

type ColumnarProxyDeps = {
  // deno-lint-ignore no-explicit-any
  api: any;
  store: ColumnarStore;
  unique: (xs: readonly unknown[]) => unknown[];
  arrayMethods: Set<string>;
};

/**
 * Build columnar-optimized Proxy handlers for DataFrame
 *
 * Key optimizations:
 * - Direct column access without row reconstruction
 * - Lazy row reconstruction only when needed
 * - Efficient numeric indexing
 */
export function buildColumnarProxyHandlers(
  // deno-lint-ignore no-unused-vars
  { api, store, unique, arrayMethods }: ColumnarProxyDeps,
): ProxyHandler<object> {
  return {
    get(_target, prop, _recv) {
      // Numeric indices: lazy row reconstruction
      if (
        (typeof prop === "string" && /^\d+$/.test(prop)) ||
        (typeof prop === "number" && Number.isInteger(prop))
      ) {
        const index = Number(prop);
        // deno-lint-ignore no-explicit-any
        const currentStore = (api as any).__store;
        // deno-lint-ignore no-explicit-any
        const currentView = (api as any).__view;

        const materializedIndex = materializeIndex(
          currentStore.length,
          currentView,
        );

        if (index < 0 || index >= materializedIndex.length) return undefined;

        // Use the materialized view index to get the correct row
        const actualRowIndex = materializedIndex[index];

        // Lazy row reconstruction
        const row: Record<string, unknown> = {};
        for (const colName of currentStore.columnNames) {
          row[colName] = currentStore.columns[colName][actualRowIndex];
        }
        return row;
      }

      // Ban plain array APIs on DataFrame
      if (typeof prop === "string" && arrayMethods.has(prop)) {
        return () => {
          throw new TypeError(
            `DataFrame.${prop}() is disabled. Use tidy-ts verbs.`,
          );
        };
      }

      // Fluent method routing
      const routed = resolveVerb(prop, _recv);
      if (routed) return routed;

      // Direct column access - returns accessor object with .toArray() method
      // deno-lint-ignore no-explicit-any
      const currentStore = (api as any).__store;
      if (typeof prop === "string" && currentStore.columnNames.includes(prop)) {
        const reserved = [
          "nrows",
          "columns",
          "groupKeys",
          "isGrouped",
          "get",
          "has",
        ];

        if (!reserved.includes(prop)) {
          const col = currentStore.columns[prop];
          // deno-lint-ignore no-explicit-any
          const currentView = (api as any).__view;

          // Get the filtered column data
          let columnData: unknown[];
          if (currentView && (currentView.mask || currentView.index)) {
            const materializedIndex = materializeIndex(
              currentStore.length,
              currentView,
            );
            columnData = new Array(materializedIndex.length);
            for (let i = 0; i < materializedIndex.length; i++) {
              columnData[i] = col[materializedIndex[i]];
            }
          } else {
            columnData = col; // Use original column if no view
          }

          // Create array with toArray method, then make it read-only
          const arrayWithToArray = [...columnData] as unknown[];

          // Add toArray method to get mutable copy
          Object.defineProperty(arrayWithToArray, "toArray", {
            value: () => [...columnData],
            enumerable: false,
            writable: false,
            configurable: false,
          });

          // Now freeze the array to make it read-only
          return Object.freeze(arrayWithToArray) as readonly unknown[];
        }
      }

      // Otherwise defer to api surface (length/iterators/print etc.)
      // deno-lint-ignore no-explicit-any
      return (api as any)[prop];
    },

    ownKeys() {
      // Include all non-configurable keys from api
      const required = Reflect.ownKeys(api).filter((k) => {
        const d = Reflect.getOwnPropertyDescriptor(api, k);
        return d && d.configurable === false;
      });

      // Add numeric row indices - use view-aware length
      // deno-lint-ignore no-explicit-any
      const currentStore = (api as any).__store;
      // deno-lint-ignore no-explicit-any
      const currentView = (api as any).__view;
      const materializedIndex = materializeIndex(
        currentStore.length,
        currentView,
      );

      const rows = Array.from(
        { length: materializedIndex.length },
        (_, i) => String(i),
      );
      return [...required, ...rows];
    },

    getOwnPropertyDescriptor(_t, prop) {
      // Numeric rows enumerable for console.table
      if (typeof prop === "string" && /^\d+$/.test(prop)) {
        const index = Number(prop);
        // Use view-aware length check
        // deno-lint-ignore no-explicit-any
        const currentStore = (api as any).__store;
        // deno-lint-ignore no-explicit-any
        const currentView = (api as any).__view;
        const materializedIndex = materializeIndex(
          currentStore.length,
          currentView,
        );

        if (index >= 0 && index < materializedIndex.length) {
          return {
            configurable: true,
            enumerable: true,
            writable: false,
            value: this.get?.(_t, prop, _t), // Use our lazy reconstruction
          };
        }
      }

      // Forward non-configurable descriptors (e.g. length getter)
      // deno-lint-ignore no-explicit-any
      const d = Reflect.getOwnPropertyDescriptor(api, prop as any);
      if (d && d.configurable === false) return d;

      // Hide everything else
      return d ? { ...d, enumerable: false } : undefined;
    },

    set(target, prop, _value) {
      if (typeof prop === "string" && /^\d+$/.test(prop)) {
        throw new TypeError("Cannot assign by numeric index on DataFrame");
      }
      // deno-lint-ignore no-explicit-any
      (target as any)[prop] = _value;
      return true;
    },
  };
}
