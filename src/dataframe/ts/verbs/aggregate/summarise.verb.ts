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
): (
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
) => DataFrame<any> | Promise<DataFrame<any>> {
  return (df: DataFrame<T> | GroupedDataFrame<T, keyof T>) => {
    const span = tracer.startSpan(df, "summarise", { spec: typeof spec });

    try {
      // Check if any formulas are async
      if (shouldUseAsyncForSummarise(df as DataFrame<T>, spec)) {
        return summariseAsync(df, spec);
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

// Helper function to analyze column usage in summarise functions
function analyzeColumnUsage<T extends object>(
  spec: SummariseSpec<T>,
): Set<string> {
  const usedColumns = new Set<string>();

  if (typeof spec === "function") {
    // Parse function string to find g.columnName patterns
    const funcStr = spec.toString();
    const columnPattern = /\bg\.(\w+)(?!\.length)/g;
    let match;
    while ((match = columnPattern.exec(funcStr)) !== null) {
      usedColumns.add(match[1]);
    }
  } else {
    // Parse each function in the spec object
    for (const [, expr] of Object.entries(spec)) {
      if (typeof expr === "function") {
        const funcStr = expr.toString();
        const columnPattern = /\bg\.(\w+)(?!\.length)/g;
        let match;
        while ((match = columnPattern.exec(funcStr)) !== null) {
          usedColumns.add(match[1]);
        }
      }
    }
  }

  return usedColumns;
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

  // OPTIMIZATION: Analyze which columns are actually needed
  const requiredColumns = tracer.withSpan(df, "analyze-column-usage", () => {
    return analyzeColumnUsage(spec);
  });

  const {
    head,
    next,
    count: _count,
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
          const groupIndices: number[] = [];
          let rowIdx = head[g];
          while (rowIdx !== -1) {
            const actualIdx = usesRawIndices ? rowIdx : baseIndex![rowIdx];
            groupIndices.push(actualIdx);
            rowIdx = next[rowIdx];
          }
          // Adjacency list gives us rows in reverse order, so reverse to get original order
          groupIndices.reverse();
          return groupIndices;
        });

        // OPTIMIZED: Extract only required columns (lazy extraction)
        const groupColumns = tracer.withSpan(df, "extract-columns", () => {
          const groupColumns: Record<string, unknown[]> = {};
          const groupSize = groupIndices.length;

          // Always extract all columns for safety - column analysis is too simplistic for complex functions
          const columnsToExtract = new Set(store.columnNames);

          for (const colName of columnsToExtract) {
            const colNameStr = String(colName);
            if (store.columns[colNameStr]) {
              const sourceColumn = store.columns[colNameStr];
              const groupColumn = new Array(groupSize);

              // Direct loop instead of map for better performance
              for (let i = 0; i < groupSize; i++) {
                groupColumn[i] = sourceColumn[groupIndices[i]];
              }

              groupColumns[colNameStr] = groupColumn;
            }
          }
          return groupColumns;
        }, {
          rowCount: groupIndices.length,
          columnCount: requiredColumns.size || store.columnNames.length,
        });

        // OPTIMIZED: Create DataFrame directly from columnar store (avoid toColumnarStorage)
        const groupDF = tracer.withSpan(df, "create-dataframe", () => {
          const groupStore = {
            columns: groupColumns,
            columnNames: store.columnNames,
            length: groupIndices.length,
          };
          return createColumnarDataFrameFromStore(groupStore) as DataFrame<T>;
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
        return createDataFrame([]) as unknown as DataFrame<any>;
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

// Async implementation
async function summariseAsync<T extends object>(
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
  spec: SummariseSpec<T>,
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
