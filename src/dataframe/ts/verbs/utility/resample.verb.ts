// deno-lint-ignore-file no-explicit-any
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import { createDataFrame } from "../../dataframe/index.ts";
import type {
  AggregationFunction,
  FillMethod,
  Frequency,
  ResampleOptions,
} from "./resample.types.ts";
import { stats } from "../../stats/stats.ts";

// Check if a function is stats.forwardFill or stats.backwardFill
function isForwardFill(fn: unknown): boolean {
  return fn === stats.forwardFill;
}

function isBackwardFill(fn: unknown): boolean {
  return fn === stats.backwardFill;
}

/**
 * Convert frequency string to milliseconds.
 */
function frequencyToMs(frequency: Frequency): number {
  if (typeof frequency === "number") {
    return frequency;
  }

  if (typeof frequency === "object") {
    const { value, unit } = frequency;
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      min: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
      M: 30 * 24 * 60 * 60 * 1000, // Approximate month
      Q: 90 * 24 * 60 * 60 * 1000, // Approximate quarter
      Y: 365 * 24 * 60 * 60 * 1000, // Approximate year
    };
    return value * (multipliers[unit] || 1000);
  }

  // Parse string frequencies
  const match = frequency.match(/^(\d+)([A-Za-z]+)$/);
  if (!match) {
    throw new Error(`Invalid frequency format: ${frequency}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    S: 1000,
    min: 60 * 1000,
    H: 60 * 60 * 1000,
    D: 24 * 60 * 60 * 1000,
    W: 7 * 24 * 60 * 60 * 1000,
    M: 30 * 24 * 60 * 60 * 1000, // Approximate month
    Q: 90 * 24 * 60 * 60 * 1000, // Approximate quarter
    Y: 365 * 24 * 60 * 60 * 1000, // Approximate year
  };

  const multiplier = multipliers[unit];
  if (!multiplier) {
    throw new Error(`Unknown frequency unit: ${unit}`);
  }

  return value * multiplier;
}

/**
 * Get time bucket key for a timestamp.
 */
function getTimeBucket(
  timestamp: Date | string | number,
  frequencyMs: number,
): number {
  const time = timestamp instanceof Date
    ? timestamp.getTime()
    : typeof timestamp === "string"
    ? new Date(timestamp).getTime()
    : timestamp;

  if (isNaN(time)) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  // Round down to nearest bucket
  return Math.floor(time / frequencyMs) * frequencyMs;
}

/**
 * Apply aggregation function to a grouped DataFrame.
 */
function applyAggregation<T extends object>(
  group: GroupedDataFrame<T, keyof T>,
  column: keyof T,
  aggregation: AggregationFunction<T>,
): unknown {
  const columnName = String(column);
  // Extract column values properly
  const values = group.extract(columnName as any) as unknown[];

  // Handle function aggregations (like stats.mean, stats.sum, or custom functions)
  if (typeof aggregation === "function") {
    // Check if it's a group function (takes GroupedDataFrame)
    if (aggregation.length === 1 && values.length === 0) {
      // Might be a group function - pass the group
      return (aggregation as (group: GroupedDataFrame<T, keyof T>) => unknown)(
        group,
      );
    }
    // Stats functions (stats.mean, stats.sum, etc.) accept arrays/values
    // They work directly with the values array
    return (aggregation as (values: unknown[] | unknown) => unknown)(values);
  }

  // All aggregations are functions - no string shortcuts
  throw new Error(
    "Aggregation must be a function (e.g., stats.mean, stats.sum)",
  );
}

/**
 * Resample time-series data to a different frequency.
 *
 * Resamples time-series data by either downsampling (aggregating) or upsampling (filling).
 * The time column must be of type Date (or Date | null).
 *
 * **Downsampling** (aggregation): Groups rows by time buckets and applies aggregation functions.
 * Use this when converting from higher frequency to lower frequency (e.g., hourly to daily).
 *
 * **Upsampling** (filling): Generates a time sequence and fills missing values.
 * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
 *
 * @param timeColumn - Name of the Date column to use for resampling
 * @param frequency - Target frequency (e.g., "1D", "1H", "15min", "1W", "1M")
 *   - Seconds: "1S", "5S", "15S", "30S"
 *   - Minutes: "1min", "5min", "15min", "30min"
 *   - Hours: "1H"
 *   - Days: "1D"
 *   - Weeks: "1W"
 *   - Months: "1M"
 *   - Quarters: "1Q"
 *   - Years: "1Y"
 *   - Custom: number (milliseconds) or { value: number, unit: "ms" | "s" | "min" | "h" | "d" | "w" | "M" | "Q" | "Y" }
 * @param options - Resampling options
 *   - For downsampling: object mapping column names to aggregation functions (e.g., `{ price: stats.mean, volume: stats.sum }`)
 *   - For upsampling: object with `method` key (e.g., `{ method: stats.forwardFill }`) or per-column fill methods
 * @returns A function that takes a DataFrame and returns a DataFrame with resampled data
 *
 * @example
 * // Downsample hourly to daily
 * const daily = pipe(df, resample("timestamp", "1D", {
 *   price: stats.mean,
 *   volume: stats.sum
 * }));
 *
 * @example
 * // Upsample daily to hourly with forward fill
 * const hourly = pipe(df, resample("timestamp", "1H", {
 *   method: stats.forwardFill
 * }));
 *
 * @remarks
 * - The time column must be of type Date (or Date | null)
 * - For downsampling, use aggregation functions like `stats.mean`, `stats.sum`, `stats.max`, `stats.min`, `stats.first`, `stats.last`
 * - For upsampling, use fill methods like `stats.forwardFill` or `stats.backwardFill`
 * - Works with both regular and grouped DataFrames
 */
export function resample<T extends Record<string, unknown>>(
  timeColumn: keyof T,
  frequency: Frequency,
  options: ResampleOptions<T>,
) {
  return (df: DataFrame<T> | GroupedDataFrame<T, keyof T>): DataFrame<any> => {
    const frequencyMs = frequencyToMs(frequency);
    const rows = Array.from(df);

    if (rows.length === 0) {
      return createDataFrame([]) as unknown as DataFrame<any>;
    }

    // Check if this is upsampling (fill method) or downsampling (aggregation)
    // Upsampling: has "method" key OR all values are functions that return arrays (fill functions)
    // Downsampling: values are functions that return single values (aggregation functions)
    const hasGlobalMethod = typeof options === "object" && "method" in options;
    const isUpsampling = hasGlobalMethod || Object.values(options).some(
      (opt) =>
        typeof opt === "function" &&
        (isForwardFill(opt) || isBackwardFill(opt)),
    );

    if (isUpsampling) {
      // Upsampling: Generate time sequence and fill
      return upsample(df, timeColumn, frequencyMs, options as any);
    } else {
      // Downsampling: Group by time buckets and aggregate
      return downsample(df, timeColumn, frequencyMs, options as any);
    }
  };
}

/**
 * Downsample: Group by time buckets and apply aggregations.
 */
function downsample<T extends Record<string, unknown>>(
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
  timeColumn: keyof T,
  frequencyMs: number,
  options: Record<string, AggregationFunction<T>>,
): DataFrame<any> {
  const timeColName = String(timeColumn);
  const rows = Array.from(df);

  // Check if this is a grouped DataFrame
  const groupedDf = df as any;
  if (groupedDf.__groups) {
    const { head, next, keyRow, groupingColumns, size } = groupedDf.__groups;
    const allResults: any[] = [];

    // Process each group separately
    for (let g = 0; g < size; g++) {
      // Collect rows for this group
      const groupRows: T[] = [];
      let rowIdx = head[g];
      while (rowIdx !== -1) {
        groupRows.push(rows[rowIdx]);
        rowIdx = next[rowIdx];
      }

      // Get group key values
      const groupKeyRow = rows[keyRow[g]];
      const groupKeys: Record<string, unknown> = {};
      for (const col of groupingColumns) {
        groupKeys[String(col)] = groupKeyRow[col];
      }

      // Group rows by time bucket within this group
      const buckets = new Map<number, T[]>();
      for (const row of groupRows) {
        const timestamp = row[timeColumn];
        if (timestamp === null || timestamp === undefined) {
          continue;
        }
        const bucket = getTimeBucket(
          timestamp as Date | string | number,
          frequencyMs,
        );
        if (!buckets.has(bucket)) {
          buckets.set(bucket, []);
        }
        buckets.get(bucket)!.push(row);
      }

      // Get available columns from first row
      const firstBucketRows = buckets.values().next().value || [];
      const availableColumns = firstBucketRows.length > 0
        ? Object.keys(firstBucketRows[0])
        : [];

      // Apply aggregations to each bucket in this group
      for (const [bucketTime, bucketRows] of buckets.entries()) {
        const bucketDf = createDataFrame(
          bucketRows,
        ) as unknown as GroupedDataFrame<T, keyof T>;
        const resultRow: any = {
          ...groupKeys, // Include group keys
          [timeColName]: new Date(bucketTime),
        };

        for (const [colName, aggregation] of Object.entries(options)) {
          if (colName === timeColName) continue;

          const col = colName as keyof T;
          if (availableColumns.includes(colName)) {
            resultRow[colName] = applyAggregation(
              bucketDf,
              col,
              aggregation as AggregationFunction<T>,
            );
          } else {
            // Column doesn't exist - find source column
            const numericColumns = availableColumns.filter(
              (c) =>
                c !== timeColName && !Object.hasOwn(groupKeys, c) &&
                bucketRows.some((r) => typeof r[c as keyof T] === "number"),
            );

            if (numericColumns.length === 1) {
              const sourceCol = numericColumns[0] as keyof T;
              resultRow[colName] = applyAggregation(
                bucketDf,
                sourceCol,
                aggregation as AggregationFunction<T>,
              );
            } else if (numericColumns.length > 0) {
              const sourceCol = numericColumns[0] as keyof T;
              resultRow[colName] = applyAggregation(
                bucketDf,
                sourceCol,
                aggregation as AggregationFunction<T>,
              );
            } else {
              const otherColumns = availableColumns.filter((c) =>
                c !== timeColName && !Object.hasOwn(groupKeys, c)
              );
              if (otherColumns.length > 0) {
                const sourceCol = otherColumns[0] as keyof T;
                resultRow[colName] = applyAggregation(
                  bucketDf,
                  sourceCol,
                  aggregation as AggregationFunction<T>,
                );
              } else {
                resultRow[colName] = null;
              }
            }
          }
        }

        allResults.push(resultRow);
      }
    }

    // Sort by group keys and time
    allResults.sort((a, b) => {
      // First sort by group keys
      for (const col of groupingColumns) {
        const colName = String(col);
        if (a[colName] !== b[colName]) {
          return a[colName] < b[colName] ? -1 : 1;
        }
      }
      // Then by time
      return a[timeColName].getTime() - b[timeColName].getTime();
    });

    return createDataFrame(allResults) as unknown as DataFrame<any>;
  }

  // Ungrouped: Group rows by time bucket
  const buckets = new Map<number, T[]>();

  for (const row of rows) {
    const timestamp = row[timeColumn];
    if (timestamp === null || timestamp === undefined) {
      continue; // Skip rows with null timestamps
    }

    const bucket = getTimeBucket(
      timestamp as Date | string | number,
      frequencyMs,
    );
    if (!buckets.has(bucket)) {
      buckets.set(bucket, []);
    }
    buckets.get(bucket)!.push(row);
  }

  // Apply aggregations to each bucket
  const result: any[] = [];

  // Get all available columns from the first row of the first bucket
  const firstBucketRows = buckets.values().next().value || [];
  const availableColumns = firstBucketRows.length > 0
    ? Object.keys(firstBucketRows[0])
    : [];

  for (const [bucketTime, bucketRows] of buckets.entries()) {
    const bucketDf = createDataFrame(bucketRows) as unknown as GroupedDataFrame<
      T,
      keyof T
    >;
    const resultRow: any = {
      [timeColName]: new Date(bucketTime),
    };

    for (const [colName, aggregation] of Object.entries(options)) {
      if (colName === timeColName) continue; // Skip time column

      // Check if colName exists as a column in the data
      const col = colName as keyof T;
      if (availableColumns.includes(colName)) {
        // Column exists - aggregate it
        resultRow[colName] = applyAggregation(
          bucketDf,
          col,
          aggregation as AggregationFunction<T>,
        );
      } else {
        // Column doesn't exist - try to find a source column to aggregate
        // For now, if there's only one numeric column (besides time), use that
        // Otherwise, we need to infer or use the first available column
        const numericColumns = availableColumns.filter(
          (c) =>
            c !== timeColName &&
            bucketRows.some((r) => typeof r[c as keyof T] === "number"),
        );

        if (numericColumns.length === 1) {
          // Single numeric column - use it as source
          const sourceCol = numericColumns[0] as keyof T;
          resultRow[colName] = applyAggregation(
            bucketDf,
            sourceCol,
            aggregation as AggregationFunction<T>,
          );
        } else if (numericColumns.length > 0) {
          // Multiple numeric columns - use the first one (could be improved)
          const sourceCol = numericColumns[0] as keyof T;
          resultRow[colName] = applyAggregation(
            bucketDf,
            sourceCol,
            aggregation as AggregationFunction<T>,
          );
        } else {
          // No numeric columns found - try first non-time column
          const otherColumns = availableColumns.filter((c) =>
            c !== timeColName
          );
          if (otherColumns.length > 0) {
            const sourceCol = otherColumns[0] as keyof T;
            resultRow[colName] = applyAggregation(
              bucketDf,
              sourceCol,
              aggregation as AggregationFunction<T>,
            );
          } else {
            resultRow[colName] = null;
          }
        }
      }
    }

    // Include other columns from first row (if not aggregated)
    for (const key of Object.keys(bucketRows[0] || {})) {
      if (!(key in resultRow) && key !== timeColName) {
        resultRow[key] = bucketRows[0][key as keyof T];
      }
    }

    result.push(resultRow);
  }

  // Sort by time
  result.sort((a, b) => a[timeColName].getTime() - b[timeColName].getTime());

  return createDataFrame(result) as unknown as DataFrame<any>;
}

/**
 * Upsample: Generate time sequence and fill missing values.
 */
function upsample<T extends Record<string, unknown>>(
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
  timeColumn: keyof T,
  frequencyMs: number,
  options: Record<string, FillMethod | number | null> | { method?: FillMethod },
): DataFrame<any> {
  const timeColName = String(timeColumn);
  const rows = Array.from(df);

  if (rows.length === 0) {
    return createDataFrame([]) as unknown as DataFrame<any>;
  }

  // Get time range - preserve original Date objects to maintain timezone
  const timeDates = rows
    .map((row) => {
      const ts = row[timeColumn];
      if (ts instanceof Date) return ts;
      if (typeof ts === "string") return new Date(ts);
      if (typeof ts === "number") return new Date(ts);
      return null;
    })
    .filter((t): t is Date => t !== null);

  if (timeDates.length === 0) {
    return createDataFrame([]) as unknown as DataFrame<any>;
  }

  // Get min/max times as milliseconds
  const times = timeDates.map((d) => d.getTime());
  const _minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  // Generate time sequence aligned to frequency boundaries
  // Start from the first date rounded down to frequency boundary
  const firstDate = timeDates[0];
  const startTime = getTimeBucket(firstDate.getTime(), frequencyMs);

  const sequence: number[] = [];
  // Generate sequence from startTime to maxTime (inclusive)
  for (let t = startTime; t <= maxTime; t += frequencyMs) {
    sequence.push(t);
  }

  // If maxTime doesn't fall exactly on a boundary, include it
  if (sequence.length === 0 || sequence[sequence.length - 1] < maxTime) {
    const lastBucket = getTimeBucket(maxTime, frequencyMs);
    if (lastBucket !== sequence[sequence.length - 1]) {
      sequence.push(lastBucket);
    }
  }

  // Determine fill method
  const globalMethod = typeof options === "object" && "method" in options
    ? options.method
    : undefined;

  // Create result rows
  const result: any[] = [];

  for (const bucketTime of sequence) {
    // Find closest row for this time bucket
    const closestRow = rows.reduce((closest, row) => {
      const rowTime = row[timeColumn];
      if (rowTime === null || rowTime === undefined) return closest;

      const rowTimeMs = rowTime instanceof Date
        ? rowTime.getTime()
        : typeof rowTime === "string"
        ? new Date(rowTime).getTime()
        : typeof rowTime === "number"
        ? rowTime
        : NaN;

      if (isNaN(rowTimeMs)) return closest;

      const closestTime = closest[timeColumn];
      const closestTimeMs = closestTime instanceof Date
        ? closestTime.getTime()
        : typeof closestTime === "string"
        ? new Date(closestTime).getTime()
        : typeof closestTime === "number"
        ? closestTime
        : NaN;

      if (isNaN(closestTimeMs)) return row;

      const closestDiff = Math.abs(closestTimeMs - bucketTime);
      const rowDiff = Math.abs(rowTimeMs - bucketTime);

      return rowDiff < closestDiff ? row : closest;
    }, rows[0]);

    const resultRow: any = {
      [timeColName]: new Date(bucketTime),
    };

    // Fill columns based on options
    for (const key of Object.keys(closestRow)) {
      if (key === timeColName) continue;

      const colName = key as keyof T;
      const fillOption = (options as any)[key] ?? globalMethod;

      if (typeof fillOption === "function") {
        // Fill function (stats.forwardFill, stats.backwardFill, or custom)
        if (isForwardFill(fillOption)) {
          // Forward fill: use values up to and including current time
          const valuesUpToNow = rows
            .filter((r) => {
              const rt = r[timeColumn];
              const rtMs = rt instanceof Date
                ? rt.getTime()
                : typeof rt === "string"
                ? new Date(rt).getTime()
                : rt;
              return typeof rtMs === "number" && !isNaN(rtMs) &&
                rtMs <= bucketTime;
            })
            .map((r) => r[colName]);

          const filled = fillOption(valuesUpToNow);
          resultRow[key] = Array.isArray(filled) && filled.length > 0
            ? filled[filled.length - 1]
            : null;
        } else if (isBackwardFill(fillOption)) {
          // Backward fill: use values from current time onwards (fill from future)
          const valuesFromNow = rows
            .filter((r) => {
              const rt = r[timeColumn];
              const rtMs = rt instanceof Date
                ? rt.getTime()
                : typeof rt === "string"
                ? new Date(rt).getTime()
                : rt;
              return typeof rtMs === "number" && !isNaN(rtMs) &&
                rtMs >= bucketTime;
            })
            .map((r) => r[colName]);

          const filled = fillOption(valuesFromNow);
          // For backward fill, get the first value (earliest future value)
          resultRow[key] = Array.isArray(filled) && filled.length > 0
            ? filled[0]
            : null;
        } else {
          // Custom function - collect all values and get last
          const allValues = rows.map((r) => r[colName]);
          const filled = fillOption(allValues);
          resultRow[key] = Array.isArray(filled) && filled.length > 0
            ? filled[filled.length - 1]
            : null;
        }
      } else if (typeof fillOption === "number") {
        resultRow[key] = fillOption;
      } else if (fillOption === null) {
        resultRow[key] = null;
      } else {
        // Default: use closest row's value
        resultRow[key] = closestRow[colName];
      }
    }

    result.push(resultRow);
  }

  return createDataFrame(result) as unknown as DataFrame<any>;
}
