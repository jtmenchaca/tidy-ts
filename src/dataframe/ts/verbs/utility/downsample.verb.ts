// deno-lint-ignore-file no-explicit-any
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import { createDataFrame } from "../../dataframe/index.ts";
import type {
  AggregationFunction,
  AggregationMap,
  DownsampleArgs,
} from "./downsample.types.ts";
import type { Frequency } from "./downsample.types.ts";
import { frequencyToMs, getTimeBucket } from "./time-bucket.ts";
import {
  generateCalendarBuckets,
  getCalendarBucket,
  isCalendarFrequency,
  parseCalendarFrequency,
} from "./calendar.ts";
import { applyAggregation } from "./sample-helpers.ts";

/**
 * Internal downsample implementation: Group by time buckets and apply aggregations.
 */
function downsampleImpl<T extends Record<string, unknown>>(
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
  timeColumn: keyof T,
  frequency: Frequency,
  frequencyMs: number,
  aggregations: AggregationMap<T>,
  startDate?: Date,
  endDate?: Date,
): DataFrame<any> {
  const timeColName = String(timeColumn);
  const rows = Array.from(df);

  // Check if we need calendar-aware bucketing
  const useCalendarBucketing = isCalendarFrequency(frequency);
  const calendarFreq = useCalendarBucketing
    ? parseCalendarFrequency(frequency)
    : null;

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

      // Determine effective start and end times for this group
      let effectiveStartTime: number | undefined;
      let effectiveEndTime: number | undefined;

      if (startDate) {
        effectiveStartTime = getTimeBucket(startDate.getTime(), frequencyMs);
      }
      if (endDate) {
        // For endDate, find the bucket containing the endDate timestamp
        // We want to include that bucket, but not create extra buckets after it
        const endMs = endDate.getTime();
        effectiveEndTime = getTimeBucket(endMs, frequencyMs);
      }

      // Filter rows based on startDate (truncate if needed)
      const filteredGroupRows = startDate
        ? groupRows.filter((row) => {
          const timestamp = row[timeColumn];
          if (timestamp === null || timestamp === undefined) return false;
          const rowTime = timestamp instanceof Date
            ? timestamp.getTime()
            : typeof timestamp === "string"
            ? new Date(timestamp).getTime()
            : typeof timestamp === "number"
            ? timestamp
            : NaN;
          return !isNaN(rowTime) && rowTime >= effectiveStartTime!;
        })
        : groupRows;

      // Group rows by time bucket within this group
      const buckets = new Map<number, T[]>();
      for (const row of filteredGroupRows) {
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

      // Determine the actual time range for bucket generation for this group
      let bucketStartTime: number;
      let bucketEndTime: number;

      if (effectiveStartTime !== undefined) {
        bucketStartTime = effectiveStartTime;
      } else if (buckets.size > 0) {
        bucketStartTime = Math.min(...Array.from(buckets.keys()));
      } else {
        // No data for this group - skip
        continue;
      }

      if (effectiveEndTime !== undefined) {
        bucketEndTime = effectiveEndTime;
      } else if (buckets.size > 0) {
        bucketEndTime = Math.max(...Array.from(buckets.keys()));
      } else {
        // No data for this group - skip
        continue;
      }

      // Generate all buckets in the range (including empty ones) for this group
      const allBuckets = new Map<number, T[]>();
      // Generate buckets from start to end, inclusive
      const startBucket = bucketStartTime;
      const endBucket = bucketEndTime;

      // Safety check: prevent infinite loop if frequencyMs is invalid
      if (frequencyMs <= 0) continue;

      for (
        let currentTime = startBucket;
        currentTime <= endBucket;
        currentTime += frequencyMs
      ) {
        if (!allBuckets.has(currentTime)) {
          allBuckets.set(currentTime, buckets.get(currentTime) || []);
        }
      }

      // Get available columns from first row with data
      const firstBucketWithData = Array.from(allBuckets.entries()).find(
        ([_, rows]) => rows.length > 0,
      );
      const firstBucketRows = firstBucketWithData?.[1] || [];
      const availableColumns = firstBucketRows.length > 0
        ? Object.keys(firstBucketRows[0])
        : [];

      // Apply aggregations to each bucket in this group
      for (const [bucketTime, bucketRows] of allBuckets.entries()) {
        const bucketDf = createDataFrame(
          bucketRows,
        ) as unknown as GroupedDataFrame<T, keyof T>;
        const resultRow: any = {
          ...groupKeys, // Include group keys
          [timeColName]: new Date(bucketTime),
        };

        for (const [colName, aggregation] of Object.entries(aggregations)) {
          if (colName === timeColName) continue;

          const col = colName as keyof T;

          // Check if column exists in data - use it directly
          if (availableColumns.includes(colName)) {
            resultRow[colName] = applyAggregation(
              bucketDf,
              col,
              aggregation as AggregationFunction<T>,
            );
          } else {
            // Column doesn't exist - find appropriate source column
            const numericColumns = availableColumns.filter(
              (c) =>
                c !== timeColName && !Object.hasOwn(groupKeys, c) &&
                bucketRows.some((r) => typeof r[c as keyof T] === "number"),
            );

            if (numericColumns.length === 1) {
              // Only one numeric column - use it as the source
              const sourceCol = numericColumns[0] as keyof T;
              resultRow[colName] = applyAggregation(
                bucketDf,
                sourceCol,
                aggregation as AggregationFunction<T>,
              );
            } else if (numericColumns.length > 1) {
              // Multiple numeric columns - ambiguous, use first one
              const sourceCol = numericColumns[0] as keyof T;
              resultRow[colName] = applyAggregation(
                bucketDf,
                sourceCol,
                aggregation as AggregationFunction<T>,
              );
            } else {
              // No numeric columns - try any column
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

  // Determine effective start and end times
  let effectiveStartTime: number | undefined;
  let effectiveEndTime: number | undefined;

  if (startDate) {
    if (useCalendarBucketing && calendarFreq) {
      effectiveStartTime = getCalendarBucket(
        startDate.getTime(),
        calendarFreq.unit,
        calendarFreq.value,
      );
    } else {
      effectiveStartTime = getTimeBucket(startDate.getTime(), frequencyMs);
    }
  }
  if (endDate) {
    // For endDate, include the bucket that contains the endDate timestamp
    if (useCalendarBucketing && calendarFreq) {
      effectiveEndTime = getCalendarBucket(
        endDate.getTime(),
        calendarFreq.unit,
        calendarFreq.value,
      );
    } else {
      effectiveEndTime = getTimeBucket(endDate.getTime(), frequencyMs);
    }
  }

  // Filter rows based on startDate (truncate if needed)
  const filteredRows = startDate
    ? rows.filter((row) => {
      const timestamp = row[timeColumn];
      if (timestamp === null || timestamp === undefined) return false;
      const rowTime = timestamp instanceof Date
        ? timestamp.getTime()
        : typeof timestamp === "string"
        ? new Date(timestamp).getTime()
        : typeof timestamp === "number"
        ? timestamp
        : NaN;
      return !isNaN(rowTime) && rowTime >= effectiveStartTime!;
    })
    : rows;

  // Group filtered rows by time bucket
  for (const row of filteredRows) {
    const timestamp = row[timeColumn];
    if (timestamp === null || timestamp === undefined) {
      continue; // Skip rows with null timestamps
    }

    const bucket = useCalendarBucketing && calendarFreq
      ? getCalendarBucket(
        timestamp instanceof Date
          ? timestamp.getTime()
          : typeof timestamp === "string"
          ? new Date(timestamp).getTime()
          : timestamp as number,
        calendarFreq.unit,
        calendarFreq.value,
      )
      : getTimeBucket(
        timestamp as Date | string | number,
        frequencyMs,
      );
    if (!buckets.has(bucket)) {
      buckets.set(bucket, []);
    }
    buckets.get(bucket)!.push(row);
  }

  // Determine the actual time range for bucket generation
  let bucketStartTime: number;
  let bucketEndTime: number;

  if (effectiveStartTime !== undefined) {
    bucketStartTime = effectiveStartTime;
  } else if (buckets.size > 0) {
    // Use first bucket time
    bucketStartTime = Math.min(...Array.from(buckets.keys()));
  } else {
    // No data and no startDate - return empty
    return createDataFrame([]) as unknown as DataFrame<any>;
  }

  if (effectiveEndTime !== undefined) {
    bucketEndTime = effectiveEndTime;
  } else if (buckets.size > 0) {
    // Use last bucket time
    bucketEndTime = Math.max(...Array.from(buckets.keys()));
  } else {
    // No data and no endDate - return empty
    return createDataFrame([]) as unknown as DataFrame<any>;
  }

  // Generate all buckets in the range (including empty ones)
  const allBuckets = new Map<number, T[]>();

  if (useCalendarBucketing && calendarFreq) {
    // Use calendar-aware bucket generation
    const calendarBuckets = generateCalendarBuckets(
      bucketStartTime,
      bucketEndTime,
      calendarFreq.value,
      calendarFreq.unit,
    );
    for (const bucketTime of calendarBuckets) {
      allBuckets.set(bucketTime, buckets.get(bucketTime) || []);
    }
  } else {
    // Use fixed-time bucket generation
    // Safety check: prevent infinite loop if frequencyMs is invalid
    if (frequencyMs <= 0) {
      return createDataFrame([]) as unknown as DataFrame<any>;
    }

    for (
      let currentTime = bucketStartTime;
      currentTime <= bucketEndTime;
      currentTime += frequencyMs
    ) {
      if (!allBuckets.has(currentTime)) {
        allBuckets.set(currentTime, buckets.get(currentTime) || []);
      }
    }
  }

  // Apply aggregations to each bucket
  const result: any[] = [];

  // Get all available columns from the first row of the first bucket with data
  const firstBucketWithData = Array.from(allBuckets.entries()).find(
    ([_, rows]) => rows.length > 0,
  );
  const firstBucketRows = firstBucketWithData?.[1] || [];
  const availableColumns = firstBucketRows.length > 0
    ? Object.keys(firstBucketRows[0])
    : [];

  for (const [bucketTime, bucketRows] of allBuckets.entries()) {
    const bucketDf = createDataFrame(bucketRows) as unknown as GroupedDataFrame<
      T,
      keyof T
    >;
    const resultRow: any = {
      [timeColName]: new Date(bucketTime),
    };

    for (const [colName, aggregation] of Object.entries(aggregations)) {
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

    result.push(resultRow);
  }

  // Sort by time
  result.sort((a, b) => a[timeColName].getTime() - b[timeColName].getTime());

  return createDataFrame(result) as unknown as DataFrame<any>;
}

/**
 * Downsample time-series data by aggregating to a lower frequency.
 *
 * Groups rows by time buckets and applies aggregation functions to each bucket.
 * Use this when converting from higher frequency to lower frequency (e.g., hourly to daily).
 *
 * @param args - Named arguments object
 * @param args.timeColumn - Name of the Date column to use for downsampling
 * @param args.frequency - Target frequency (e.g., "1D", "1H", "15min", "1W", "1M")
 * @param args.aggregations - Object mapping output column names to aggregation functions
 *   - Column name can be new (renamed) or same as source column
 *   - Aggregation functions: stats.mean, stats.sum, stats.min, stats.max, stats.first, stats.last, etc.
 * @param args.startDate - Optional: Start date for downsampling period (hard constraint)
 * @param args.endDate - Optional: End date for downsampling period (hard constraint)
 * @returns A function that takes a DataFrame and returns a DataFrame with downsampled data
 *
 * @example
 * // Downsample hourly to daily
 * const daily = df.downsample({
 *   timeColumn: "timestamp",
 *   frequency: "1D",
 *   aggregations: {
 *     avg_price: stats.mean,
 *     total_volume: stats.sum
 *   }
 * });
 *
 * @example
 * // Downsample with date range (fiscal year)
 * const fiscalQ2 = df.downsample({
 *   timeColumn: "timestamp",
 *   frequency: "1M",
 *   aggregations: {
 *     monthly_revenue: stats.sum
 *   },
 *   startDate: new Date("2024-04-01"),
 *   endDate: new Date("2024-06-30")
 * });
 *
 * @example
 * // OHLC bars from tick data
 * const ohlc = df.downsample({
 *   timeColumn: "timestamp",
 *   frequency: "1H",
 *   aggregations: {
 *     open: stats.first,
 *     high: stats.max,
 *     low: stats.min,
 *     close: stats.last
 *   }
 * });
 *
 * @example
 * // Works with grouped DataFrames
 * const result = df.groupBy("symbol").downsample({
 *   timeColumn: "timestamp",
 *   frequency: "1D",
 *   aggregations: {
 *     daily_avg: stats.mean
 *   }
 * });
 */
export function downsample<
  T extends Record<string, unknown>,
  TimeCol extends keyof T,
  Aggregations extends AggregationMap<T>,
>(
  args: DownsampleArgs<T, TimeCol, Aggregations>,
) {
  return (df: DataFrame<T> | GroupedDataFrame<T, keyof T>): DataFrame<any> => {
    const rows = Array.from(df);
    if (rows.length === 0) {
      return createDataFrame([]) as unknown as DataFrame<any>;
    }

    const frequencyMs = frequencyToMs(args.frequency);
    return downsampleImpl(
      df,
      args.timeColumn,
      args.frequency,
      frequencyMs,
      args.aggregations,
      args.startDate,
      args.endDate,
    );
  };
}
