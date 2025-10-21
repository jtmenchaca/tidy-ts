// deno-lint-ignore-file no-explicit-any
import {
  createColumnarDataFrameFromStore,
  createDataFrame,
  type DataFrame,
  type GroupedDataFrame,
  materializeIndex,
} from "../../dataframe/index.ts";
import { shouldUseAsyncForSummarise } from "../../promised-dataframe/index.ts";
import { withErrorHandling } from "../../promised-dataframe/async-sync-processor.ts";
import {
  type ConcurrencyOptions,
  DEFAULT_CONCURRENCY,
} from "../../promised-dataframe/concurrency-utils.ts";
import { tracer } from "../../telemetry/tracer.ts";

export type SummariseFn<T extends object> = (
  df: DataFrame<T>,
) => unknown;

export type SummariseSpecMap<T extends object> = Record<
  string,
  SummariseFn<T>
>;

export type SummariseResult<
  T extends object,
  S extends SummariseSpecMap<T>,
> = { [K in keyof S]: ReturnType<S[K]> };

export type GroupedSummariseResult<
  T extends object,
  S extends SummariseSpecMap<T>,
  K extends keyof T,
> = Pick<T, K> & SummariseResult<T, S>;

export type SummariseSpec<T extends object> =
  | Record<string, (df: DataFrame<T>) => unknown>
  | ((df: DataFrame<T>) => object);

export function summarise<T extends object>(
  spec: SummariseSpec<T>,
  options?: ConcurrencyOptions,
): (
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
) => DataFrame<any> | Promise<DataFrame<any>> {
  return (df: DataFrame<T> | GroupedDataFrame<T, keyof T>) => {
    const span = tracer.startSpan(df, "summarise", { spec: typeof spec });

    try {
      // Check if any formulas are async or if options are provided
      const isAsync = shouldUseAsyncForSummarise(df as DataFrame<T>, spec) ||
        (options !== undefined);

      if (isAsync) {
        // Get DataFrame's default options if available
        const dfOptions = (df as any).__options as
          | ConcurrencyOptions
          | undefined;
        // Apply default concurrency if no options provided
        const concurrencyOptions = options || dfOptions ||
          DEFAULT_CONCURRENCY.summarise;
        return summariseAsync(df, spec, concurrencyOptions);
      } else {
        const result = summariseSync(df, spec);
        tracer.copyContext(df, result);
        return result;
      }
    } finally {
      tracer.endSpan(df, span);
    }
  };
}

// Sync implementation (original logic)
function summariseSync<T extends object>(
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
  spec: SummariseSpec<T>,
): DataFrame<any> {
  const gdf = df as GroupedDataFrame<T, keyof T>;
  const groups = (gdf as any).__groups;

  // Ungrouped: same as before
  if (!groups) {
    return tracer.withSpan(df, "summarise-ungrouped", () => {
      const out: object = {};
      if (typeof spec === "function") {
        const safe = withErrorHandling(
          () => spec(df as DataFrame<T>),
          {},
          "summarise(spec:function) [ungrouped]",
        );
        Object.assign(out, safe);
      } else {
        for (const [k, expr] of Object.entries(spec)) {
          (out as any)[k] = typeof expr === "function"
            ? withErrorHandling(
              () => expr(df as DataFrame<T>),
              undefined,
              `summarise(${String(k)}) [ungrouped]`,
            )
            : expr;
        }
      }
      return createDataFrame([out]) as unknown as DataFrame<any>;
    });
  }

  // Grouped: single-pass, zero materialization of arrays/DataFrames
  const api = gdf as any;
  const store = api.__store;

  const {
    head,
    next,
    count,
    keyRow,
    groupingColumns,
    usesRawIndices,
  } = tracer.withSpan(df, "extract-group-metadata", () => {
    return groups as {
      head: Int32Array;
      next: Int32Array;
      count: Uint32Array;
      keyRow: Uint32Array;
      groupingColumns: (keyof T)[];
      usesRawIndices: boolean;
    };
  });

  // Optimize: avoid materializing baseIndex when using raw indices
  const baseIndex = tracer.withSpan(df, "materialize-base-index", () => {
    let baseIndex: Uint32Array | null = null;
    if (!usesRawIndices) {
      baseIndex = materializeIndex(store.length, api.__view);
    }
    return baseIndex;
  });

  const results = tracer.withSpan(df, "process-groups", () => {
    const results: object[] = [];
    const G = head.length;

    const buildKeyObj = (viewIdx: number): object => {
      return tracer.withSpan(df, "build-key-object", () => {
        const o: object = {};
        for (const c of groupingColumns) {
          const name = String(c);
          const actualIdx = usesRawIndices ? viewIdx : baseIndex![viewIdx];
          (o as any)[name] = store.columns[name][actualIdx];
        }
        return o;
      });
    };

    for (let g = 0; g < G; g++) {
      const groupSpan = tracer.withSpan(df, `process-group-${g}`, () => {
        // Extract group row indices using adjacency list
        const groupIndices = tracer.withSpan(df, "extract-indices", () => {
          // OPTIMIZED: Pre-allocate array with known size to avoid push() overhead
          const groupSize = count[g];
          const groupIndices = new Array(groupSize);

          // Fill array in forward order (adjacency list now maintains original order)
          let rowIdx = head[g];
          let writePos = 0;
          while (rowIdx !== -1) {
            const actualIdx = usesRawIndices ? rowIdx : baseIndex![rowIdx];
            groupIndices[writePos] = actualIdx;
            writePos++;
            rowIdx = next[rowIdx];
          }

          return groupIndices;
        });

        // OPTIMIZED: Create lightweight DataFrame proxy with lazy column extraction
        const groupDF = tracer.withSpan(df, "create-group-proxy", () => {
          const groupSize = groupIndices.length;

          // Lazy column cache - only extract columns when accessed
          const columnCache: Record<string, unknown[]> = {};

          // Lazy DataFrame - only create if methods are called
          let realDataFrame: DataFrame<T> | null = null;

          // Symbol to mark arrays as pre-validated (skip expensive type checking in stats functions)
          const VALIDATED_ARRAY = Symbol.for("tidy-ts:validated-array");

          const getColumn = (colName: string): unknown[] => {
            if (columnCache[colName]) {
              return columnCache[colName];
            }

            const sourceColumn = store.columns[colName];
            if (!sourceColumn) {
              throw new Error(`Column '${colName}' not found`);
            }

            // Extract column on demand
            const groupColumn = new Array(groupSize);
            for (let i = 0; i < groupSize; i++) {
              groupColumn[i] = sourceColumn[groupIndices[i]];
            }

            // Mark array as validated to skip expensive type checks in stats functions
            // This is safe because we know the data comes from a typed DataFrame column
            (groupColumn as any)[VALIDATED_ARRAY] = true;

            columnCache[colName] = groupColumn;
            return groupColumn;
          };

          const getRealDataFrame = (): DataFrame<T> => {
            if (realDataFrame) return realDataFrame;

            // Extract all columns if not already cached
            for (const colName of store.columnNames) {
              if (!columnCache[colName]) {
                getColumn(colName);
              }
            }

            // Create real DataFrame from cached columns
            const groupStore = {
              columns: columnCache,
              columnNames: store.columnNames,
              length: groupSize,
            };
            realDataFrame = createColumnarDataFrameFromStore(
              groupStore,
            ) as DataFrame<T>;
            return realDataFrame;
          };

          // Create proxy that looks like a DataFrame but only extracts columns on demand
          const proxy = new Proxy({
            nrows: () => groupSize,
            ncols: () => store.columnNames.length,
            columnNames: store.columnNames,
          } as any, {
            get(target, prop: string | symbol) {
              // Handle basic DataFrame properties
              if (
                prop === "nrows" || prop === "ncols" || prop === "columnNames"
              ) {
                return target[prop];
              }

              // Handle column access - lazily extract the column
              if (
                typeof prop === "string" && store.columnNames.includes(prop)
              ) {
                return getColumn(prop);
              }

              // For any other property/method, create and use real DataFrame
              // This handles filter(), select(), mutate(), etc.
              if (prop !== "then" && prop !== "catch") { // Avoid promise-like behavior
                const realDF = getRealDataFrame();
                const value = (realDF as any)[prop];
                if (typeof value === "function") {
                  return value.bind(realDF);
                }
                return value;
              }

              return target[prop];
            },
          });

          return proxy as DataFrame<T>;
        });

        // Apply summarization functions
        const row = tracer.withSpan(df, "apply-functions", () => {
          const keyObj = tracer.withSpan(
            df,
            "build-group-keys",
            () => buildKeyObj(keyRow[g]),
          );
          const row: object = { ...keyObj };

          if (typeof spec === "function") {
            const result = tracer.withSpan(
              df,
              "spec-function",
              () => spec(groupDF),
            );
            tracer.withSpan(df, "assign-spec-result", () => {
              Object.assign(row, result);
            });
          } else {
            tracer.withSpan(df, "compute-all-expressions", () => {
              for (const [k, expr] of Object.entries(spec)) {
                const value = tracer.withSpan(df, `compute-${k}`, () => {
                  return typeof expr === "function" ? expr(groupDF) : expr;
                });
                (row as any)[k] = value;
              }
            });
          }
          return row;
        });

        return row;
      });

      results.push(groupSpan);
    }
    return results;
  }, { totalGroups: head.length });

  return tracer.withSpan(df, "create-result-dataframe", () => {
    // Avoid toColumnarStorage by building columnar store directly
    if (results.length === 0) {
      return tracer.withSpan(df, "create-empty-dataframe", () => {
        // Build empty columns preserving grouping keys
        const columns: Record<string, unknown[]> = {};
        for (const colName of groupingColumns) {
          columns[String(colName)] = [];
        }
        return createDataFrame({ columns }) as unknown as DataFrame<any>;
      });
    }

    const firstResult = results[0];
    const columnNames = tracer.withSpan(
      df,
      "extract-column-names",
      () => Object.keys(firstResult),
    );
    const columns: Record<string, unknown[]> = {};

    // Pre-allocate column arrays
    tracer.withSpan(df, "allocate-result-columns", () => {
      for (const colName of columnNames) {
        columns[colName] = new Array(results.length);
      }
    });

    // Fill column arrays directly
    tracer.withSpan(df, "fill-result-columns", () => {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        for (const colName of columnNames) {
          columns[colName][i] = (result as any)[colName];
        }
      }
    });

    const store = tracer.withSpan(df, "build-result-store", () => {
      return {
        columns,
        columnNames,
        length: results.length,
      };
    });

    return tracer.withSpan(df, "instantiate-result-dataframe", () => {
      return createColumnarDataFrameFromStore(store) as unknown as DataFrame<
        any
      >;
    });
  });
}

// Async implementation with concurrency control
async function summariseAsync<T extends object>(
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
  spec: SummariseSpec<T>,
  _options: ConcurrencyOptions = DEFAULT_CONCURRENCY.summarise,
): Promise<DataFrame<any>> {
  const gdf = df as GroupedDataFrame<T, keyof T>;
  // @ts-ignore internal field

  const groups = (gdf as any).__groups;

  // Ungrouped: async version
  if (!groups) {
    const out: object = {};
    if (typeof spec === "function") {
      const asyncResult = withErrorHandling(
        () => spec(df as DataFrame<T>),
        {},
        "summarise(spec:function) [ungrouped async]",
      );
      const resolved = asyncResult instanceof Promise
        ? await asyncResult
        : asyncResult;
      Object.assign(out, resolved);
    } else {
      // Process all async formulas in parallel
      const promises = Object.entries(spec).map(async ([k, expr]) => {
        if (typeof expr === "function") {
          const result = withErrorHandling(
            () => expr(df as DataFrame<T>),
            undefined,
            `summarise(${String(k)}) [ungrouped async]`,
          );
          return [k, result instanceof Promise ? await result : result];
        }
        return [k, expr];
      });

      const resolvedEntries = await Promise.all(promises);
      for (const [k, value] of resolvedEntries) {
        (out as any)[k] = value;
      }
    }
    return createDataFrame([out]) as unknown as DataFrame<any>;
  }

  // Grouped: async version with parallel processing per group
  // @ts-ignore internal fields

  const api = gdf as any;
  const store = api.__store;

  const {
    head,
    next,
    count: _count,
    keyRow,
    groupingColumns,
    usesRawIndices,
  } = groups as {
    head: Int32Array;
    next: Int32Array;
    count: Uint32Array;
    keyRow: Uint32Array;
    groupingColumns: (keyof T)[];
    usesRawIndices: boolean;
  };

  // Optimize: avoid materializing baseIndex when using raw indices
  let baseIndex: Uint32Array | null = null;
  if (!usesRawIndices) {
    baseIndex = materializeIndex(store.length, api.__view);
  }

  const G = head.length;

  const buildKeyObj = (viewIdx: number): object => {
    const o: object = {};
    for (const c of groupingColumns) {
      const name = String(c);
      const actualIdx = usesRawIndices ? viewIdx : baseIndex![viewIdx];
      (o as any)[name] = store.columns[name][actualIdx];
    }
    return o;
  };

  // Process all groups in parallel
  const groupPromises: Promise<object>[] = [];

  for (let g = 0; g < G; g++) {
    const groupPromise = (async () => {
      // Create a lightweight columnar group view without materializing rows
      // Extract group row indices using adjacency list
      const groupIndices: number[] = [];
      let rowIdx = head[g];
      while (rowIdx !== -1) {
        const actualIdx = usesRawIndices ? rowIdx : baseIndex![rowIdx];
        groupIndices.push(actualIdx);
        rowIdx = next[rowIdx];
      }
      // Adjacency list gives us rows in reverse order, so reverse to get original order
      groupIndices.reverse();

      // Create columnar group data by extracting column slices
      const groupColumns: Record<string, unknown[]> = {};
      for (const colName of store.columnNames) {
        const column = store.columns[colName];
        groupColumns[colName] = groupIndices.map((idx) => column[idx]);
      }

      // Create a proper DataFrame with full API access for the group slice
      const groupRows: T[] = [];
      for (let i = 0; i < groupIndices.length; i++) {
        const row: object = {};
        for (const colName of store.columnNames) {
          (row as any)[colName] = groupColumns[colName][i];
        }
        groupRows.push(row as T);
      }
      const groupDF = createDataFrame(groupRows);

      // Compose output row (keys + summaries)
      const row: object = {
        ...buildKeyObj(keyRow[g]),
      };

      if (typeof spec === "function") {
        const asyncResult = withErrorHandling(
          () => spec(groupDF),
          {},
          "summarise(spec:function) [grouped async]",
        );
        const resolved = asyncResult instanceof Promise
          ? await asyncResult
          : asyncResult;
        Object.assign(row, resolved);
      } else {
        // Process all async formulas for this group in parallel
        const promises = Object.entries(spec).map(async ([k, expr]) => {
          if (typeof expr === "function") {
            const result = withErrorHandling(
              () => expr(groupDF),
              undefined,
              `summarise(${String(k)}) [grouped async]`,
            );
            return [k, result instanceof Promise ? await result : result];
          }
          return [k, expr];
        });

        const resolvedEntries = await Promise.all(promises);
        for (const [k, value] of resolvedEntries) {
          (row as any)[k] = value;
        }
      }

      return row;
    })();

    groupPromises.push(groupPromise);
  }

  // Wait for all groups to complete
  const results = await Promise.all(groupPromises);
  return createDataFrame(results) as unknown as DataFrame<any>;
}
