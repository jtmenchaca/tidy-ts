// deno-lint-ignore-file no-explicit-any
import {
  createColumnarDataFrameFromStore,
  type DataFrame,
  type GroupedDataFrame,
  withGroups,
} from "../../dataframe/index.ts";
import { tracer } from "../../telemetry/tracer.ts";

// Policy mapping for aggregation functions (simplified for non-WASM approach)
type Policy = "first" | "last" | "sum" | "mean";

function mapValuesFnToPolicy(values_fn?: (values: any[]) => unknown): Policy {
  if (!values_fn) return "first";

  // Get the function name to identify common aggregation functions
  const fnName = values_fn.name;

  // Map common aggregation functions to policies
  if (fnName === "sum" || fnName.includes("sum")) return "sum";
  if (fnName === "mean" || fnName.includes("mean")) return "mean";
  if (fnName === "min" || fnName.includes("min")) return "first"; // min is like first
  if (fnName === "max" || fnName.includes("max")) return "last"; // max is like last

  // Check function body for common patterns
  const fnStr = values_fn.toString();
  if (fnStr.includes("stats.mean") || fnStr.includes("mean")) return "mean";
  if (fnStr.includes("stats.sum") || fnStr.includes("sum")) return "sum";
  if (fnStr.includes("reduce") && fnStr.includes("+") && fnStr.includes("/")) {
    return "mean";
  }
  if (fnStr.includes("reduce") && fnStr.includes("+") && !fnStr.includes("/")) {
    return "sum";
  }

  // For other functions, default to first
  return "first";
}

/**
 * Generate the result type for pivot_wider
 */
type PivotWiderResult<
  T extends Record<string, unknown>,
  NamesFrom extends keyof T,
  ValuesFrom extends keyof T,
  Cols extends readonly string[],
  ValuesFn,
  Prefix extends string = "",
> =
  & {
    // Keep all columns except names_from and values_from
    [K in keyof T as K extends NamesFrom | ValuesFrom ? never : K]: T[K];
  }
  & {
    // Add expected columns with proper types and prefix

    [K in Cols[number] as `${Prefix}${K}`]: ValuesFn extends
      (values: any) => infer R ? R
      : T[ValuesFrom];
  };

/** Utility that makes `A & B` show up as `{ … }` instead of an
 *  ugly intersection in IntelliSense tool-tips. */
// deno-lint-ignore ban-types
type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Pivot data from long to wide format.
 * Similar to R's tidyverse pivot_wider() function.
 *
 * @param config - Configuration for the pivot operation
 * @returns A function that takes a DataFrame and returns the pivoted DataFrame
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { group: "A", variable: "x", value: 1 },
 *   { group: "A", variable: "y", value: 2 },
 *   { group: "B", variable: "x", value: 3 },
 *   { group: "B", variable: "y", value: 4 }
 * ]);
 *
 * // Basic usage with expected columns
 * // IMPORTANT: expected_columns should only contain values from the names_from column!
 * const result = pipe(
 *   df,
 *   pivot_wider({
 *     names_from: "variable",
 *     values_from: "value",
 *     expected_columns: ["x", "y"]  // Values from 'variable' column, NOT 'group'!
 *   })
 * );
 * // Result: { group: ["A", "B"], x: [1, 3], y: [2, 4] }
 *
 * // Using .unique() to get expected columns automatically
 * const result2 = pipe(
 *   df,
 *   pivot_wider({
 *     names_from: "variable",
 *     values_from: "value",
 *     expected_columns: df.variable.unique()  // Automatically gets ["x", "y"]
 *   })
 * );
 *
 * // With aggregation function (no type casting needed!)
 * const result3 = pipe(
 *   df,
 *   pivot_wider({
 *     names_from: "variable",
 *     values_from: "value",
 *     expected_columns: ["x", "y"],
 *     values_fn: (values) => sum(values) // values automatically typed as number[]
 *   })
 * );
 *
 * // Without expected_columns (returns Record<string, unknown>)
 * const result4 = pipe(
 *   df,
 *   pivot_wider({
 *     names_from: "variable",
 *     values_from: "value"
 *   })
 * );
 * ```
 *
 * @remarks
 * - Converts long format data to wide format
 * - Groups by all columns except names_from and values_from
 * - Handles duplicate combinations by using values_fn if provided
 * - **IMPORTANT**: expected_columns should ONLY contain the unique values from the names_from column
 *   that will become new column names. Do NOT include preserved columns (like 'id', 'group', etc.)
 * - Validates that expected_columns exactly match unique values in names_from column
 * - Use `df.columnName.unique()` to automatically get correct expected_columns
 * - Omit expected_columns to skip validation (returns Record<string, unknown>)
 * - values_fn parameter is automatically typed based on values_from column type
 * - Preserves the original dataframe (does not mutate)
 * - Column matching uses String() coercion, so mixed types (e.g., 1 and "1") will collide
 */

// Overload with explicit expected_columns for type inference
export function pivot_wider<
  Row extends Record<string, unknown>,
  NamesFrom extends keyof Row,
  ValuesFrom extends keyof Row,
  const ExpectedCols extends readonly string[],
  ValuesFn extends ((values: Row[ValuesFrom][]) => unknown) | undefined =
    undefined,
  const Prefix extends string = "",
>(
  config: {
    names_from: NamesFrom;
    values_from: ValuesFrom;
    expected_columns: ExpectedCols;
    values_fn?: ValuesFn;
    names_prefix?: Prefix;
  },
): (df: DataFrame<Row>) => DataFrame<
  Prettify<
    PivotWiderResult<
      Row,
      NamesFrom,
      ValuesFrom,
      ExpectedCols,
      ValuesFn,
      Prefix
    >
  >
>;

// Overload without expected_columns (preserves original types with dynamic columns)
export function pivot_wider<
  Row extends Record<string, unknown>,
  NamesFrom extends keyof Row,
  ValuesFrom extends keyof Row,
>(
  config: {
    names_from: NamesFrom;
    values_from: ValuesFrom;
    values_fn?: (values: Row[ValuesFrom][]) => unknown;
    names_prefix?: string;
  },
): (df: DataFrame<Row>) => DataFrame<
  Prettify<
    & {
      // Keep all columns except names_from and values_from
      [K in keyof Row as K extends NamesFrom | ValuesFrom ? never : K]: Row[K];
    }
    & {
      // Add dynamic columns as unknown
      [key: string]: unknown;
    }
  >
>;

// Implementation
// Implementation (make return type `any` so it's compatible with both overloads)
export function pivot_wider<Row extends Record<string, unknown>>(
  config: {
    names_from: keyof Row;
    values_from: keyof Row;
    expected_columns?: readonly string[];

    values_fn?: (values: any[]) => unknown;
    names_prefix?: string;
  },
) {
  // Return a function whose type is `any` at the implementation level.
  // Overloads above provide precise types to callers.

  return (df: DataFrame<Row>): any => {
    const span = tracer.startSpan(df, "pivot_wider", config);

    try {
      const {
        names_from,
        values_from,
        expected_columns,
        values_fn,
        names_prefix = "",
      } = config;

      // Get columnar store to avoid redundant scans
      const store = (df as any).__store;

      // id columns: all columns except names_from and values_from
      const id_cols = store.columnNames.filter(
        (col: string) =>
          col !== String(names_from) && col !== String(values_from),
      ) as (keyof Row)[];

      // Extract unique names early for validation (will be replaced by namesDict)
      const unique_names = tracer.withSpan(df, "extract-unique-names", () => {
        const namesSet = new Set<string>();
        for (let i = 0; i < store.length; i++) {
          namesSet.add(String(store.columns[String(names_from)][i]));
        }
        return Array.from(namesSet);
      }, {
        names_from: String(names_from),
        uniqueCount: 0,
      });

      // Update metadata with actual unique count
      if (span?.metadata) {
        span.metadata.uniqueNamesCount = unique_names.length;
      }

      if (expected_columns) {
        tracer.withSpan(df, "validate-expected-columns", () => {
          const expectedNames = [...expected_columns].sort();
          const actualNames = [...unique_names].sort();
          if (
            expectedNames.length !== actualNames.length ||
            !expectedNames.every((name, i) => name === actualNames[i])
          ) {
            throw new Error(
              `Pivot wider validation failed:\n` +
                `  expected_columns should only contain values from the '${
                  String(names_from)
                }' column.\n` +
                `  You provided: [${expectedNames.join(", ")}]\n` +
                `  Actual values in '${String(names_from)}' column: [${
                  actualNames.join(", ")
                }]`,
            );
          }
        }, {
          expectedCount: expected_columns.length,
          actualCount: unique_names.length,
        });
      }

      // OPTIMIZED: Use columnar operations without WASM overhead
      const result = tracer.withSpan(df, "optimized-pivot", () => {
        const inputRowCount = store.length;

        // Step 1: Build composite group keys from id columns (columnar approach)
        const groupKeys = tracer.withSpan(df, "build-group-keys", () => {
          const keys = new Array(inputRowCount);

          if (id_cols.length === 0) {
            // No grouping columns - single group
            for (let i = 0; i < inputRowCount; i++) {
              keys[i] = "";
            }
          } else {
            // Build composite keys from id columns
            for (let i = 0; i < inputRowCount; i++) {
              const keyParts: string[] = [];
              for (const col of id_cols) {
                const value = store.columns[String(col)][i];
                keyParts.push(
                  value === undefined ? "__UNDEFINED__" : String(value),
                );
              }
              keys[i] = keyParts.join("⟘"); // Use rare separator to avoid collisions
            }
          }
          return keys;
        }, {
          inputRowCount,
          groupColumns: id_cols.length,
        });

        // Step 2: Extract names and values (columnar access)
        const namesColumn = store.columns[String(names_from)] as unknown[];
        const valuesColumn = store.columns[String(values_from)] as unknown[];

        // Step 3: Get unique group keys and unique names
        const uniqueGroupKeys = Array.from(new Set(groupKeys));
        const uniqueNames = Array.from(
          new Set(
            namesColumn.map((v) => String(v)),
          ),
        );

        // Step 4: Create group and name lookup maps
        const groupKeyToIndex = new Map<string, number>();
        uniqueGroupKeys.forEach((key, i) => groupKeyToIndex.set(key, i));

        const nameToIndex = new Map<string, number>();
        uniqueNames.forEach((name, i) => nameToIndex.set(name, i));

        const outputRowCount = uniqueGroupKeys.length;
        const pivotColumnCount = uniqueNames.length;

        // Step 5: Pre-allocate output columns
        const outputColumns = tracer.withSpan(
          df,
          "allocate-output-columns",
          () => {
            const outCols: Record<string, unknown[]> = {};

            // Allocate id columns
            for (const col of id_cols) {
              outCols[String(col)] = new Array(outputRowCount);
            }

            // Allocate pivot columns
            for (const name of uniqueNames) {
              const columnName = names_prefix + name;
              outCols[columnName] = new Array(outputRowCount).fill(undefined);
            }

            return outCols;
          },
          {
            outputRowCount,
            idColumns: id_cols.length,
            pivotColumns: pivotColumnCount,
          },
        );

        // Step 6: Fill output columns efficiently
        tracer.withSpan(df, "fill-output-columns", () => {
          // Group data for aggregation if needed
          const aggregationGroups = values_fn
            ? new Map<string, unknown[]>()
            : null;

          for (let i = 0; i < inputRowCount; i++) {
            const groupKey = groupKeys[i];
            const groupIndex = groupKeyToIndex.get(groupKey)!;
            const name = String(namesColumn[i]);
            const value = valuesColumn[i];

            // Fill id columns (only once per group)
            if (
              id_cols.length > 0 &&
              outputColumns[String(id_cols[0])][groupIndex] === undefined
            ) {
              for (const col of id_cols) {
                const originalValue = store.columns[String(col)][i];
                outputColumns[String(col)][groupIndex] = originalValue;
              }
            }

            // Handle values
            const pivotColumnName = names_prefix + name;

            // Ensure column exists (dynamic column creation)
            if (!outputColumns[pivotColumnName]) {
              outputColumns[pivotColumnName] = new Array(outputRowCount).fill(
                undefined,
              );
            }

            if (values_fn) {
              // Collect values for aggregation
              const aggKey = `${groupKey}⟘${name}`;
              if (!aggregationGroups!.has(aggKey)) {
                aggregationGroups!.set(aggKey, []);
              }
              aggregationGroups!.get(aggKey)!.push(value);
            } else {
              // Use first value (or last, depending on policy)
              if (
                outputColumns[pivotColumnName][groupIndex] === undefined ||
                mapValuesFnToPolicy(values_fn) === "last"
              ) {
                outputColumns[pivotColumnName][groupIndex] = value;
              }
            }
          }

          // Apply aggregation function if provided
          if (values_fn && aggregationGroups) {
            for (const [aggKey, values] of aggregationGroups) {
              const [groupKey, name] = aggKey.split("⟘");
              const groupIndex = groupKeyToIndex.get(groupKey)!;
              const pivotColumnName = names_prefix + name;

              // Ensure column exists (dynamic column creation for aggregation)
              if (!outputColumns[pivotColumnName]) {
                outputColumns[pivotColumnName] = new Array(outputRowCount).fill(
                  undefined,
                );
              }

              try {
                outputColumns[pivotColumnName][groupIndex] = values_fn(
                  values as any,
                );
              } catch (_error) {
                outputColumns[pivotColumnName][groupIndex] = undefined;
              }
            }
          }
        }, {
          inputRowCount,
          aggregationRequired: !!values_fn,
        });

        // Step 7: Add missing expected columns if provided
        if (expected_columns) {
          const actualPivotColumns = uniqueNames.map((name) =>
            names_prefix + name
          );
          const expectedPivotColumns = expected_columns.map((name) =>
            names_prefix + name
          );
          const missing = expectedPivotColumns.filter((col) =>
            !actualPivotColumns.includes(col)
          );
          if (missing.length > 0) {
            for (const missingCol of missing) {
              outputColumns[missingCol] = new Array(outputRowCount).fill(
                undefined,
              );
            }
          }
        }

        const columnNames = Object.keys(outputColumns);
        return createColumnarDataFrameFromStore({
          columns: outputColumns,
          columnNames,
          length: outputRowCount,
        });
      }, {
        idColumns: id_cols.length,
        outputColumnCount: (expected_columns || unique_names).length,
      });

      // Result is already a DataFrame from createColumnarDataFrameFromStore
      // Cast to `any` so the implementation stays compatible with both overloads.

      const resultDf = result as any;

      // Copy trace context to new DataFrame
      tracer.copyContext(df, resultDf);

      return resultDf;
    } finally {
      tracer.endSpan(df, span);
    }
  };
}
/**
 * Result type for pivot_longer
 */
type PivotLongerResult<
  T extends Record<string, unknown>,
  Cols extends readonly (keyof T)[],
  NamesTo extends string,
  ValuesTo extends string,
> =
  & {
    // Keep all columns except the pivoted ones
    [K in keyof T as K extends Cols[number] ? never : K]: T[K];
  }
  & {
    // Add the new name and value columns
    [K in NamesTo]: string;
  }
  & {
    [K in ValuesTo]: T[Cols[number]];
  };

/**
 * Pivot data from wide to long format.
 * Similar to R's tidyverse pivot_longer() function.
 *
 * @param config - Configuration for the pivot operation
 * @returns A function that takes a DataFrame and returns the pivoted DataFrame
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { id: 1, x: 10, y: 20 },
 *   { id: 2, x: 15, y: 25 }
 * ]);
 *
 * const result = pipe(
 *   df,
 *   pivot_longer({
 *     cols: ["x", "y"],
 *     names_to: "variable",
 *     values_to: "value"
 *   })
 * );
 * // Result: { id: [1, 1, 2, 2], variable: ["x", "y", "x", "y"], value: [10, 20, 15, 25] }
 * ```
 *
 * @remarks
 * - Converts wide format data to long format
 * - Validates that specified columns exist in the data
 * - Preserves the original dataframe (does not mutate)
 * - Provides full type safety for result columns
 * - When the input DataFrame is grouped, the output DataFrame will also be grouped,
 *   and the pivoted columns will be added to the group keys.
 * - Column matching uses String() coercion, so mixed types (e.g., 1 and "1") will collide
 */
export function pivot_longer<
  Row extends Record<string, unknown>,
  const Cols extends readonly (keyof Row)[],
  const NamesTo extends string,
  const ValuesTo extends string,
>(
  config: {
    cols: Cols;
    names_to: NamesTo;
    values_to: ValuesTo;
    names_prefix?: string;
    names_pattern?: RegExp;
  },
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) =>
  | DataFrame<Prettify<PivotLongerResult<Row, Cols, NamesTo, ValuesTo>>>
  | GroupedDataFrame<
    Prettify<PivotLongerResult<Row, Cols, NamesTo, ValuesTo>>
  > {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const span = tracer.startSpan(df, "pivot_longer", config);

    try {
      const { cols, names_to, values_to } = config;
      const groupedDf = df as GroupedDataFrame<Row>;

      // Validate that all specified columns exist in the data
      tracer.withSpan(df, "validate-columns", () => {
        if (df.nrows() > 0) {
          const availableColumns = Object.keys(df[0]);
          const missingColumns = cols.filter((col) =>
            !availableColumns.includes(String(col))
          );

          if (missingColumns.length > 0) {
            throw new Error(
              `Columns [${
                missingColumns.join(", ")
              }] not found in data. Available columns: [${
                availableColumns.join(", ")
              }]`,
            );
          }
        }
      }, {
        foldColumns: cols.length,
        columnNames: cols.map(String),
      });

      // OPTIMIZED: Use columnar operations instead of row-by-row processing
      const store = tracer.withSpan(df, "extract-columnar-store", () => {
        return (df as unknown as {
          __store: {
            columns: Record<string, unknown[]>;
            length: number;
            columnNames: string[];
          };
        }).__store;
      });

      const inputRowCount = store.length;
      const foldColumnCount = cols.length;
      const outputRowCount = inputRowCount * foldColumnCount;

      // Identify columns to keep (not being folded)
      const keepColumns = tracer.withSpan(df, "identify-keep-columns", () => {
        return store.columnNames.filter(
          (name) => !cols.includes(name as keyof Row),
        );
      }, {
        totalColumns: store.columnNames.length,
        foldColumns: foldColumnCount,
        keepColumns: 0, // Will be updated after filtering
      });

      // Update metadata with actual keep column count
      if (span?.metadata) {
        span.metadata.keepColumns = keepColumns.length;
        span.metadata.inputRowCount = inputRowCount;
        span.metadata.outputRowCount = outputRowCount;
      }

      // Pre-allocate output columns
      const outputColumns = tracer.withSpan(
        df,
        "allocate-output-columns",
        () => {
          const outputCols: Record<string, unknown[]> = {};

          // Allocate arrays for kept columns
          for (const colName of keepColumns) {
            outputCols[colName] = new Array(outputRowCount);
          }

          // Allocate arrays for new columns
          outputCols[String(names_to)] = new Array(outputRowCount);
          outputCols[String(values_to)] = new Array(outputRowCount);

          return outputCols;
        },
        {
          outputRowCount,
          totalOutputColumns: keepColumns.length + 2,
        },
      );

      // Fill output columns efficiently
      tracer.withSpan(df, "fill-output-columns", () => {
        let outputIndex = 0;

        for (let rowIdx = 0; rowIdx < inputRowCount; rowIdx++) {
          // For each fold column, create an output row
          for (let foldIdx = 0; foldIdx < foldColumnCount; foldIdx++) {
            // Copy kept column values (these repeat for each fold)
            for (const colName of keepColumns) {
              outputColumns[colName][outputIndex] =
                store.columns[colName][rowIdx];
            }

            // Add the name column (the column being folded)
            const foldColName = String(cols[foldIdx]);
            const processedName = config.names_prefix
              ? foldColName.replace(
                new RegExp(
                  "^" +
                    config.names_prefix.replace(
                      /[.*+?^${}()|[\]\\]/g,
                      "\\$&",
                    ),
                ),
                "",
              )
              : foldColName;

            outputColumns[String(names_to)][outputIndex] = config.names_pattern
              ? (processedName.match(config.names_pattern)?.slice(1)
                .join(
                  "_",
                ) ?? processedName)
              : processedName;

            // Add the value column
            outputColumns[String(values_to)][outputIndex] =
              store.columns[foldColName][rowIdx];

            outputIndex++;
          }
        }
      }, {
        inputRowCount,
        foldColumnCount,
        outputRowCount,
      });

      // Return columnar DataFrame directly (no row conversion)
      const columnNames = [...keepColumns, String(names_to), String(values_to)];
      const outDf = createColumnarDataFrameFromStore({
        columns: outputColumns,
        columnNames,
        length: outputRowCount,
      }) as unknown as DataFrame<
        Prettify<PivotLongerResult<Row, Cols, NamesTo, ValuesTo>>
      >;

      // Copy trace context to new DataFrame
      tracer.copyContext(df, outDf);

      // Preserve groups if they exist and id columns contain group keys
      if (groupedDf.__groups) {
        return withGroups(groupedDf as GroupedDataFrame<Row, keyof Row>, outDf);
      }

      return outDf;
    } finally {
      tracer.endSpan(df, span);
    }
  };
}
