// Columnar DataFrame implementation
// deno-lint-ignore-file no-explicit-any
// Remove stats import to break circular dependency
import { buildToMarkdown } from "../printing/print.ts";
import { ARRAY_METHODS, buildColumnarProxyHandlers } from "./columnar-proxy.ts";
import type { DataFrame } from "../types/dataframe.type.ts";
import { type ColumnarStore, toColumnarStorage } from "./columnar-store.ts";
import { materializeIndex, type View } from "./columnar-view.ts";
import { detectColumnTypes } from "./column-helpers.ts";
import { tracer } from "../../telemetry/tracer.ts";

export type PrintOptions = {
  maxRows?: number;
  maxColWidth?: number;
  includeRowIndex?: boolean;
};

/**
 * Create a new DataFrame with columnar storage for high performance.
 * Same API as createDataFrame but with internal columnar optimization.
 */
export function createColumnarDataFrame<
  R extends readonly object[],
>(
  rows: R,
  options?: DataFrameOptions,
): DataFrame<R[number]>;

export function createColumnarDataFrame<
  R extends readonly object[],
>(
  rows: R,
  options: DataFrameOptions = {},
): DataFrame<R[number]> {
  type Row = (typeof rows)[number];

  // Convert to columnar storage (no row cloning needed)
  const store: ColumnarStore = toColumnarStorage(
    rows as readonly object[],
  );
  return createColumnarDataFrameFromStore<Row>(store, options);
}

/**
 * Create a DataFrame directly from a ColumnarStore (optimized path)
 */
export function createColumnarDataFrameFromStore<
  Row extends object,
>(
  store: ColumnarStore,
  options: DataFrameOptions = {},
): DataFrame<Row> {
  const api: any = {};

  (api as any).__store = store;
  (api as any).__view = {} as View;
  (api as any).__rowView = makeRowView<Row>(store);

  // Store options including concurrency and tracing
  (api as any).__options = options;

  api.columns = () => [...((api as any).__store.columnNames)]; // Copy to prevent mutation

  api.ncols = () => ((api as any).__store.columnNames.length);

  api.dtypes = () => {
    const currentStore = (api as any).__store;
    return detectColumnTypes(currentStore.columns, currentStore.columnNames);
  };

  api.isEmpty = () => api.nrows() === 0;

  // Iterator - lazy row reconstruction with view support
  api[Symbol.iterator] = function* () {
    const currentStore = (api as any).__store;

    const idx = materializeIndex(currentStore.length, (api as any).__view);
    for (let i = 0; i < idx.length; i++) {
      const row = {} as Row;
      for (const colName of currentStore.columnNames) {
        (row as any)[colName] = currentStore.columns[colName][idx[i]];
      }
      yield row;
    }
  };

  // Kind tag for robust DataFrame detection
  (api as any).__kind = "DataFrame";

  // Fast, view-aware length
  api.nrows = () => {
    const currentStore = (api as any).__store;

    return materializeIndex(currentStore.length, (api as any).__view).length;
  };

  // Fast row read (no object creation in compute code that uses rowView)
  api.at = (i: number) => {
    const currentStore = (api as any).__store;

    const idx = materializeIndex(currentStore.length, (api as any).__view);
    if (i < 0 || i >= idx.length) return undefined;
    // reconstruct only when a plain object is explicitly requested:

    const row = {} as any;
    for (const col of currentStore.columnNames) {
      row[col] = currentStore.columns[col][idx[i]];
    }
    return row;
  };

  // Array conversion (for compatibility - avoid if possible)
  api.toArray = () => {
    const currentStore = (api as any).__store;

    const idx = materializeIndex(currentStore.length, (api as any).__view);
    const result: Row[] = new Array(idx.length);
    for (let i = 0; i < idx.length; i++) {
      const row = {} as Row;
      for (const colName of currentStore.columnNames) {
        (row as any)[colName] = currentStore.columns[colName][idx[i]];
      }
      result[i] = row;
    }
    return result;
  };

  // ---- Tracing utilities ----
  api.getTrace = function () {
    return tracer.getSpans(this);
  };

  api.printTrace = function () {
    tracer.printTrace(this);
  };

  // ---- Pretty-printer (reuse existing with lazy conversion) ----
  api.toMarkdown = (opts?: PrintOptions) => {
    const currentStore = (api as any).__store;
    // Convert small subset for printing to avoid full materialization
    const rowsToShow = Math.min(currentStore.length, opts?.maxRows ?? 100);
    const rowSample: Row[] = new Array(rowsToShow);
    for (let i = 0; i < rowsToShow; i++) {
      const row = {} as Row;
      for (const colName of currentStore.columnNames) {
        (row as any)[colName] = currentStore.columns[colName][i];
      }
      rowSample[i] = row;
    }
    return buildToMarkdown(rowSample)(opts);
  };

  // Print method is now a formal verb in verbs/utility/print.verb.ts
  // It's automatically available through the proxy's verb resolution

  // Table display - optimized for columnar data
  api.toTable = (
    opts?: { maxCols?: number; maxWidth?: number; transpose?: boolean },
  ) => {
    const { maxCols = 8, maxWidth = 20, transpose = false } = opts || {};

    const currentStore = (api as any).__store;

    const currentView = (api as any).__view;

    // Use materialized index to respect filtering/views
    const idx = materializeIndex(currentStore.length, currentView);

    if (idx.length === 0) return [];

    const displayCols = currentStore.columnNames.slice(0, maxCols);

    if (transpose) {
      // Transpose view - show columns as rows
      return displayCols.map((colName: string) => {
        const columnData: object = { column: colName };
        const column = currentStore.columns[colName];

        for (let i = 0; i < Math.min(idx.length, 20); i++) {
          const actualRowIndex = idx[i];
          let value = column[actualRowIndex];

          // Handle nested objects and long strings
          if (value instanceof Date) {
            // Keep Date objects as-is for proper display
          } else if (
            typeof value === "object" && value !== null && !Array.isArray(value)
          ) {
            const entries = Object.entries(value);
            const compact = entries.slice(0, 2).map(([k, v]) => `${k}:${v}`)
              .join(", ");
            const suffix = entries.length > 2
              ? `, +${entries.length - 2} more`
              : "";
            value = `{${compact}${suffix}}`;
          } else if (typeof value === "string" && value.length > maxWidth) {
            value = value.substring(0, maxWidth - 3) + "...";
          }

          (columnData as any)[`row_${i}`] = value;
        }
        return columnData;
      });
    } else {
      // Normal table format
      const result: object[] = [];
      const rowsToShow = Math.min(idx.length, 1000); // Reasonable limit

      for (let i = 0; i < rowsToShow; i++) {
        const actualRowIndex = idx[i];
        const row: object = {};

        for (const colName of displayCols) {
          let value = currentStore.columns[colName][actualRowIndex];

          // Handle nested objects and long strings
          if (value instanceof Date) {
            // Keep Date objects as-is for proper display
          } else if (
            typeof value === "object" && value !== null && !Array.isArray(value)
          ) {
            const entries = Object.entries(value);
            const compact = entries.slice(0, 2).map(([k, v]) => `${k}:${v}`)
              .join(", ");
            const suffix = entries.length > 2
              ? `, +${entries.length - 2} more`
              : "";
            value = `{${compact}${suffix}}`;
          } else if (typeof value === "string" && value.length > maxWidth) {
            value = value.substring(0, maxWidth - 3) + "...";
          }

          (row as any)[colName] = value;
        }

        if (displayCols.length < currentStore.columnNames.length) {
          (row as any)[
            `+${currentStore.columnNames.length - displayCols.length} more cols`
          ] = "...";
        }

        result.push(row);
      }

      return result;
    }
  };

  // Custom inspect for debugging - MUST respect views/masks
  const customInspect = () => {
    const currentStore = (api as any).__store;

    const currentView = (api as any).__view;

    // Use materialized index to respect filtering/views
    const idx = materializeIndex(currentStore.length, currentView);
    const sample = Math.min(idx.length, 10);
    const result: object[] = [];

    for (let i = 0; i < sample; i++) {
      const actualRowIndex = idx[i];
      const row: object = {};
      for (const colName of currentStore.columnNames) {
        const value = currentStore.columns[colName][actualRowIndex];
        if (
          typeof value === "object" && value !== null && !Array.isArray(value)
        ) {
          (row as any)[colName] = JSON.stringify(value, null, 2);
        } else {
          (row as any)[colName] = value;
        }
      }
      result.push(row);
    }

    return result;
  };

  const kNodeInspect = Symbol.for("nodejs.util.inspect.custom");
  api[kNodeInspect] = customInspect;

  const kDenoInspect = (globalThis as any).Deno?.customInspect;
  if (kDenoInspect) api[kDenoInspect] = customInspect;

  // Unique helper (simple implementation to avoid circular dependency)
  const unique = <U>(xs: ReadonlyArray<U>): U[] => Array.from(new Set(xs));

  // ---- Columnar Proxy: numeric index, fluent routing, direct column access ----
  const handlers = buildColumnarProxyHandlers({
    api,
    store,
    unique,
    arrayMethods: ARRAY_METHODS,
  });

  const dataFrame = new Proxy(api, handlers) as unknown as DataFrame<Row>;

  // Initialize tracing if enabled - track the Proxy object, not the api
  if (options.trace) {
    tracer.initContext(dataFrame, true);
  }

  return dataFrame;
}

class RowView<Row extends object> {
  private _i = 0;
  constructor(
    private cols: Record<string, unknown[]>,
    private names: string[],
  ) {
    // define getters once, no Proxy traps in hot loops:
    for (const name of names) {
      Object.defineProperty(this, name, {
        get: () => (this.cols as any)[name][this._i],
        enumerable: true,
        configurable: false,
      });
    }
  }
  setCursor(i: number) {
    this._i = i;
  }
}

function makeRowView<Row extends object>(
  store: ColumnarStore,
): RowView<Row> {
  return new RowView<Row>(store.columns as any, store.columnNames);
}

// ============================================================================
// Public API - High-level createDataFrame function
// ============================================================================

import { z } from "zod";
import type { ConcurrencyOptions } from "../../promised-dataframe/concurrency-utils.ts";

/**
 * Options for DataFrame creation, including concurrency settings and schema validation.
 *
 * @example
 * ```typescript
 * import { createDataFrame } from "@tidy-ts/dataframe";
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string()
 * });
 *
 * const df = createDataFrame(data, {
 *   schema,
 *   concurrency: 4,
 *   retry: { maxRetries: 3 }
 * });
 * ```
 */
export interface DataFrameOptions extends ConcurrencyOptions {
  /** Schema for row validation */
  schema?: z.ZodObject<any> | null;
  /** Enable operation tracing for performance profiling */
  trace?: boolean;
}

/**
 * Options for creating a DataFrame from columns.
 */
export interface ColumnBasedDataFrameOptions {
  /** Column data as record of column names to arrays */
  columns: Record<string, readonly unknown[]>;
}

/**
 * Create a new DataFrame from an array of objects.
 *
 * DataFrames provide a fluent API for data manipulation including filtering, grouping,
 * aggregation, joins, pivoting, and statistical operations. All operations are type-safe.
 *
 * @param rows - An array of objects representing the rows of the DataFrame
 * @param schemaOrOptions - Optional Zod schema for validation or DataFrame options
 * @returns A new DataFrame with type-safe column access and operations
 *
 * @example Basic usage
 * ```typescript
 * import { createDataFrame } from "@tidy-ts/dataframe";
 *
 * const df = createDataFrame([
 *   { name: "Alice", age: 25, city: "NYC" },
 *   { name: "Bob", age: 30, city: "LA" }
 * ]);
 *
 * console.log(df.nrows()); // 2
 * console.log(df.columns()); // ["name", "age", "city"]
 *
 * // Type-safe column access
 * const names: string[] = df.name;
 * const ages: number[] = df.age;
 * ```
 *
 * @example With schema validation
 * ```typescript
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * const df = createDataFrame(data, schema);
 * // Returns DataFrame<{ id: number; name: string; email: string; }>
 * ```
 *
 * @example Chaining operations
 * ```typescript
 * const result = df
 *   .filter(row => row.age >= 18)
 *   .groupBy("city")
 *   .summarize({
 *     avgAge: group => stats.mean(group.age),
 *     count: group => group.nrows()
 *   })
 *   .arrange("avgAge", "desc");
 * ```
 */

/**
 * Create a DataFrame from columns.
 *
 * Create a DataFrame by providing column data as arrays. Each column must have
 * the same length. This is useful when you have columnar data rather than row-based data.
 *
 * @param options - Object with a `columns` property containing column arrays
 * @returns A new DataFrame with the specified columns
 *
 * @example
 * ```typescript
 * const df = createDataFrame({
 *   columns: {
 *     name: ["Alice", "Bob", "Charlie"],
 *     age: [25, 30, 28],
 *     city: ["NYC", "LA", "Chicago"]
 *   }
 * });
 * // Returns DataFrame<{ name: string; age: number; city: string; }>
 * ```
 */
export function createDataFrame<
  T extends Record<string, readonly unknown[]>,
>(
  options: { columns: T },
  schemaOrOptions?: null | DataFrameOptions,
): DataFrame<{ [K in keyof T]: T[K][number] }>;

/**
 * Create a DataFrame from an empty array.
 *
 * Returns DataFrame<never> for proper type checking when no data is provided.
 * This ensures type safety and prevents operations on empty DataFrames.
 *
 * @param rows - An empty readonly array
 * @returns A DataFrame with never type for empty data
 *
 * @example
 * ```typescript
 * const emptyDf = createDataFrame([]);
 * console.log(emptyDf.nrows()); // 0
 * console.log(emptyDf.columns()); // []
 * ```
 */
export function createDataFrame(
  rows: readonly [],
): DataFrame<never>;

/**
 * Create a DataFrame from an array of objects with DataFrame options.
 *
 * This overload allows you to specify concurrency settings, retry options,
 * and schema validation when creating a DataFrame.
 *
 * @param rows - An array of objects representing the rows of the DataFrame
 * @param options - DataFrame options including concurrency settings and schema validation
 * @returns A new DataFrame with the specified options applied
 *
 * @example
 * ```typescript
 * const df = createDataFrame(data, {
 *   concurrency: 4,
 *   retry: { maxRetries: 3 },
 *   schema: z.object({ id: z.number(), name: z.string() })
 * });
 * ```
 */
export function createDataFrame<T extends object>(
  rows: readonly T[],
  options: DataFrameOptions,
): DataFrame<T>;

/**
 * Create a DataFrame from a readonly array with DataFrame options.
 *
 * This overload infers the row type from the array element type and applies
 * DataFrame options for concurrency and validation.
 *
 * @param rows - A readonly array of objects
 * @param options - DataFrame options including concurrency settings and schema validation
 * @returns A new DataFrame with inferred row type and applied options
 *
 * @example
 * ```typescript
 * const data = [{ name: "Alice", age: 25 }, { name: "Bob", age: 30 }] as const;
 * const df = createDataFrame(data, { concurrency: 2 }); // Returns DataFrame<{ name: "Alice", age: 25 } | { name: "Bob", age: 30 }>
 * ```
 */
export function createDataFrame<
  R extends readonly object[],
>(
  rows: R,
  options: DataFrameOptions,
): DataFrame<R[number]>;

/**
 * Create a DataFrame from an array of objects with explicit type parameter.
 *
 * This overload allows you to explicitly specify the row type, providing
 * better type safety and IntelliSense support.
 *
 * @param rows - An array of objects representing the rows of the DataFrame
 * @returns A new DataFrame with the explicitly specified row type
 *
 * @example
 * ```typescript
 * interface User { id: number; name: string; email: string; }
 * const users: User[] = [
 *   { id: 1, name: "Alice", email: "alice@example.com" },
 *   { id: 2, name: "Bob", email: "bob@example.com" }
 * ];
 * const df = createDataFrame<User>(users); // Returns DataFrame<User> with full type safety
 * ```
 */
export function createDataFrame<T extends object>(
  rows: readonly T[],
): DataFrame<T>;

/**
 * Create a DataFrame from a readonly array with inferred row type.
 *
 * This overload automatically infers the row type from the array element type.
 * Perfect for when you want TypeScript to automatically determine the row structure.
 *
 * @param rows - A readonly array of objects
 * @returns A new DataFrame with inferred row type from the array elements
 *
 * @example
 * ```typescript
 * const data = [
 *   { name: "Alice", age: 25, city: "NYC" },
 *   { name: "Bob", age: 30, city: "LA" }
 * ] as const;
 * const df = createDataFrame(data); // Returns DataFrame<{ name: "Alice", age: 25, city: "NYC" } | { name: "Bob", age: 30, city: "LA" }>
 * ```
 */
export function createDataFrame<
  R extends readonly object[],
>(
  rows: R,
): DataFrame<R[number]>;
/**
 * Create a DataFrame from a readonly array with explicit null schema.
 *
 * This overload explicitly disables schema validation by passing null as the schema.
 * Useful when you want to skip validation but still use the readonly array overload.
 *
 * @param rows - A readonly array of objects
 * @param schema - Explicitly null to disable schema validation
 * @returns A new DataFrame with inferred row type and no validation
 *
 * @example
 * ```typescript
 * const data = [{ name: "Alice", age: 25 }] as const;
 * const df = createDataFrame(data, null); // Returns DataFrame with inferred type, no validation applied
 * ```
 */
export function createDataFrame<
  R extends readonly object[],
>(
  rows: R,
  schema: null,
): DataFrame<R[number]>;
/**
 * Create a DataFrame from an array of objects with Zod schema validation.
 *
 * This overload validates each row against a Zod schema and returns a DataFrame
 * with the inferred schema type. Invalid rows will throw an error.
 *
 * @param rows - An array of objects to validate and convert
 * @param schema - A Zod schema object for validation and type inference
 * @returns A new DataFrame with validated data and schema-inferred row type
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * const df = createDataFrame(rawData, schema); // Returns DataFrame<{ id: number; name: string; email: string; }>, throws error if any row fails validation
 * ```
 */
export function createDataFrame<
  S extends z.ZodObject<any>,
>(
  rows: readonly object[],
  schema: S,
): DataFrame<z.infer<S>>;

/**
 * Create a DataFrame with flexible schema parameter (union overload).
 *
 * This overload handles cases where the schema parameter can be either a Zod schema
 * or null, with flexible row type inference. Used internally for type resolution.
 *
 * @param rows - An array of objects (readonly or regular)
 * @param schema - Optional Zod schema for validation or null to skip validation
 * @returns A DataFrame with either inferred row type or schema-validated type
 *
 * @example
 * ```typescript
 * // With schema
 * const df1 = createDataFrame(data, userSchema);
 *
 * // Without schema (null)
 * const df2 = createDataFrame(data, null);
 *
 * // With optional schema
 * const df3 = createDataFrame(data, schema);
 * ```
 */
export function createDataFrame<
  R extends readonly object[],
  S extends z.ZodObject<any>,
>(
  rows: R | readonly object[],
  schema?: S | null,
): DataFrame<R[number]> | DataFrame<z.infer<S>>;

/**
 * Create a DataFrame from an array of objects with explicit type parameter (duplicate overload).
 *
 * This is a duplicate overload that provides the same functionality as the earlier
 * explicit type parameter overload. Maintains consistency in the overload chain.
 *
 * @param rows - An array of objects representing the rows of the DataFrame
 * @returns A new DataFrame with the explicitly specified row type
 *
 * @example
 * ```typescript
 * interface Product { id: number; name: string; price: number; }
 * const products: Product[] = [
 *   { id: 1, name: "Widget", price: 9.99 },
 *   { id: 2, name: "Gadget", price: 19.99 }
 * ];
 * const df = createDataFrame<Product>(products); // Returns DataFrame<Product> with full type safety
 * ```
 */
export function createDataFrame<T extends object>(
  rows: readonly T[],
): DataFrame<T>;

/**
 * Create a DataFrame with flexible parameters (implementation overload).
 *
 * This is the main implementation overload that handles all parameter combinations
 * including DataFrameOptions, Zod schemas, and various array types. This overload
 * contains the actual implementation logic.
 *
 * @param rows - An array of objects (readonly, regular, or empty)
 * @param schemaOrOptions - Optional Zod schema, null, or DataFrameOptions
 * @returns A DataFrame with appropriate type based on parameters
 *
 * @example
 * ```typescript
 * // With options
 * const df1 = createDataFrame(data, { concurrency: 4 });
 *
 * // With schema
 * const df2 = createDataFrame(data, userSchema);
 *
 * // With null schema
 * const df3 = createDataFrame(data, null);
 *
 * // Empty array
 * const df4 = createDataFrame([]);
 * ```
 */
export function createDataFrame<
  R extends readonly object[],
  S extends z.ZodObject<any>,
  T extends Record<string, readonly unknown[]>,
>(
  rows: R | readonly object[] | readonly [] | { columns: T },
  schemaOrOptions?: S | null | DataFrameOptions,
):
  | DataFrame<R[number]>
  | DataFrame<z.infer<S>>
  | DataFrame<never>
  | DataFrame<{ [K in keyof T]: T[K][number] }> {
  // Check for conflicting rows and columns first
  if (
    rows && typeof rows === "object" && !Array.isArray(rows) &&
    "rows" in rows && "columns" in rows
  ) {
    throw new Error(
      "Cannot specify both 'rows' and 'columns' in createDataFrame. " +
        "Use either row-based or column-based creation, not both.",
    );
  }

  // Check if this is column-based creation
  if (
    rows && typeof rows === "object" && !Array.isArray(rows) &&
    "columns" in rows
  ) {
    const columnsData = rows.columns as Record<string, readonly unknown[]>;

    // Validate all columns have the same length
    const columnNames = Object.keys(columnsData);
    if (columnNames.length === 0) {
      // Empty columns - return empty DataFrame
      const store = toColumnarStorage([]);
      return createColumnarDataFrameFromStore(store, {}) as DataFrame<never>;
    }

    const firstLength = columnsData[columnNames[0]].length;
    for (const colName of columnNames) {
      if (columnsData[colName].length !== firstLength) {
        throw new Error(
          `Column length mismatch: column "${colName}" has ${
            columnsData[colName].length
          } elements, ` +
            `but expected ${firstLength} (same as "${columnNames[0]}")`,
        );
      }
    }

    // Convert columns to rows for compatibility with existing storage
    const rowsArray: object[] = [];
    for (let i = 0; i < firstLength; i++) {
      const row: Record<string, unknown> = {};
      for (const colName of columnNames) {
        row[colName] = columnsData[colName][i];
      }
      rowsArray.push(row);
    }

    const store = toColumnarStorage(rowsArray);
    return createColumnarDataFrameFromStore(store, {}) as any;
  }

  // Original row-based logic
  const rowsArray = rows as R | readonly object[] | readonly [];

  // Determine what the second parameter is
  const isOptions = schemaOrOptions &&
    typeof schemaOrOptions === "object" &&
    !(schemaOrOptions instanceof z.ZodObject) &&
    schemaOrOptions !== null;

  const schema = isOptions
    ? (schemaOrOptions as DataFrameOptions).schema
    : schemaOrOptions as S | null;
  const options = isOptions ? schemaOrOptions as DataFrameOptions : {};

  // If schema is provided, validate each row
  if (schema && schema instanceof z.ZodObject) {
    const validatedRows: z.infer<typeof schema>[] = [];

    (rowsArray as readonly object[]).forEach((row, idx) => {
      const parsed = schema.safeParse(row);
      if (parsed.success) {
        validatedRows.push(parsed.data);
      } else {
        throw new Error(
          `Row ${idx + 1} validation failed: ${parsed.error.message}`,
        );
      }
    });

    const store = toColumnarStorage(validatedRows);
    const result = createColumnarDataFrameFromStore(
      store,
      options,
    ) as unknown as DataFrame<z.infer<S>>;

    return result;
  }

  const store = toColumnarStorage(rowsArray as R);
  const result = createColumnarDataFrameFromStore(
    store,
    options,
  ) as unknown as DataFrame<R[number]>;

  return result;
}
