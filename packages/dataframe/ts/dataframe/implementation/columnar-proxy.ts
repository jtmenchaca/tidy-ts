// Columnar-optimized proxy handlers
import { resolveVerb } from "./resolve-verb.ts";
import type { ColumnarStore } from "./columnar-store.ts";
import { isTypedColumn } from "./columnar-store.ts";
import { materializeIndex } from "./columnar-view.ts";

/** Disabled array APIs to nudge users to tidy verbs */
export const ARRAY_METHODS = new Set<string>([
  "map",
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
  // Column access cache — keyed by column name, invalidated when store/view changes
  // deno-lint-ignore no-explicit-any
  let cachedStore: any = null;
  // deno-lint-ignore no-explicit-any
  let cachedView: any = null;
  const columnCache = new Map<string, readonly unknown[] | Float64Array>();

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

      // Direct column access - returns cached, read-only column data
      // deno-lint-invoke no-explicit-any
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
          // deno-lint-ignore no-explicit-any
          const currentView = (api as any).__view;

          // Invalidate cache if store or view changed
          if (currentStore !== cachedStore || currentView !== cachedView) {
            columnCache.clear();
            cachedStore = currentStore;
            cachedView = currentView;
          }

          // Return cached result if available
          const cached = columnCache.get(prop);
          if (cached !== undefined) return cached;

          const col = currentStore.columns[prop];
          const hasView = currentView && (currentView.mask || currentView.index);

          if (hasView) {
            // View case: must gather through index
            const materializedIndex = materializeIndex(
              currentStore.length,
              currentView,
            );

            if (isTypedColumn(col)) {
              // Gather Float64Array through view, attach as __typedArray
              const gathered = new Float64Array(materializedIndex.length);
              for (let i = 0; i < materializedIndex.length; i++) {
                gathered[i] = col[materializedIndex[i]];
              }
              const arr = Array.from(gathered) as unknown[];
              Object.defineProperty(arr, "__typedArray", {
                value: gathered,
                enumerable: false,
                writable: false,
                configurable: false,
              });
              Object.defineProperty(arr, "toArray", {
                value: () => Array.from(gathered),
                enumerable: false,
                writable: false,
                configurable: false,
              });
              const result = Object.freeze(arr) as readonly unknown[];
              columnCache.set(prop, result);
              return result;
            } else {
              const gathered = new Array(materializedIndex.length);
              for (let i = 0; i < materializedIndex.length; i++) {
                gathered[i] = col[materializedIndex[i]];
              }
              Object.defineProperty(gathered, "toArray", {
                value: () => [...gathered],
                enumerable: false,
                writable: false,
                configurable: false,
              });
              const result = Object.freeze(gathered) as readonly unknown[];
              columnCache.set(prop, result);
              return result;
            }
          }

          // No view: return column data directly
          if (isTypedColumn(col)) {
            // Spread Float64Array into a regular array for API compatibility,
            // but attach the original Float64Array so stats functions can
            // use it directly without re-copying
            const arr = Array.from(col) as unknown[];
            Object.defineProperty(arr, "__typedArray", {
              value: col,
              enumerable: false,
              writable: false,
              configurable: false,
            });
            Object.defineProperty(arr, "toArray", {
              value: () => Array.from(col),
              enumerable: false,
              writable: false,
              configurable: false,
            });
            const frozen = Object.freeze(arr) as readonly unknown[];
            columnCache.set(prop, frozen);
            return frozen;
          }

          // Plain array: freeze a copy (existing behavior)
          const arrayWithToArray = [...col] as unknown[];
          Object.defineProperty(arrayWithToArray, "toArray", {
            value: () => [...col],
            enumerable: false,
            writable: false,
            configurable: false,
          });
          const frozen = Object.freeze(arrayWithToArray) as readonly unknown[];
          columnCache.set(prop, frozen);
          return frozen;
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

    set(target, prop, value) {
      if (typeof prop === "string" && /^\d+$/.test(prop)) {
        throw new TypeError("Cannot assign by numeric index on DataFrame");
      }

      // Check if this is a column assignment
      // deno-lint-ignore no-explicit-any
      const currentStore = (api as any).__store;

      if (typeof prop === "string" && Array.isArray(value)) {
        // Validate array length matches DataFrame length
        // deno-lint-ignore no-explicit-any
        const currentView = (api as any).__view;
        const materializedIndex = materializeIndex(
          currentStore.length,
          currentView,
        );

        if (value.length !== materializedIndex.length) {
          throw new Error(
            `Cannot assign column "${prop}": array length ${value.length} does not match ` +
              `DataFrame length ${materializedIndex.length}`,
          );
        }

        // Add or update the column in the store
        if (currentView && (currentView.mask || currentView.index)) {
          // If there's a view, we need to expand the values to full store size
          const fullColumn = currentStore.columns[prop] ||
            new Array(currentStore.length);
          for (let i = 0; i < materializedIndex.length; i++) {
            fullColumn[materializedIndex[i]] = value[i];
          }
          currentStore.columns[prop] = fullColumn;
        } else {
          // No view, direct assignment
          currentStore.columns[prop] = [...value];
        }

        // Add column name if it's new
        if (!currentStore.columnNames.includes(prop)) {
          currentStore.columnNames.push(prop);
        }

        return true;
      }

      // deno-lint-ignore no-explicit-any
      (target as any)[prop] = value;
      return true;
    },
  };
}
