// deno-lint-ignore-file no-explicit-any
import { createDataFrame, materializeIndex } from "../../dataframe/index.ts";
import { collectGroupIndices } from "../verb-helpers.ts";
import type { Frequency } from "./downsample.types.ts";
import { frequencyToMs, getTimeBucket } from "./time-bucket.ts";
import {
  type CalendarTemporal,
  floorCalendarTemporal,
  generateCalendarTemporalSequence,
  isCalendarTemporal,
  isWallClockTemporalWithoutCalendar,
  parseFrequencyForCalendar,
  toEpochMs,
} from "../../stats/temporal-helpers.ts";
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
function downsampleImpl(
  df: any,
  timeColumn: any,
  frequency: Frequency,
  frequencyMs: number,
  aggregations: Record<string, (...args: any[]) => any>,
  startDate?: Date,
  endDate?: Date,
): any {
  const timeColName = String(timeColumn);

  // Check if we need calendar-aware bucketing
  const useCalendarBucketing = isCalendarFrequency(frequency);
  const calendarFreq = useCalendarBucketing
    ? parseCalendarFrequency(frequency)
    : null;

  // Check if this is a grouped DataFrame
  const groupedDf = df as any;
  if (groupedDf.__groups) {
    const { head, next, keyRow, groupingColumns, size, usesRawIndices } =
      groupedDf.__groups;
    const api = df as any;
    const store = api.__store;
    const mask = api.__view?.mask;
    const rawMask = api.__view?.rawMask;
    const baseIndex = usesRawIndices
      ? null
      : materializeIndex(store.length, api.__view);
    const allResults: any[] = [];

    // Process each group separately
    for (let g = 0; g < size; g++) {
      const groupIndices = collectGroupIndices({ head, next, groupIndex: g, mask, rawMask });
      const groupRows: any[] = [];
      for (const idx of groupIndices) {
        const physIdx = baseIndex ? baseIndex[idx] : idx;
        const row: any = {};
        for (const colName of store.columnNames) {
          row[colName] = store.columns[colName][physIdx];
        }
        groupRows.push(row);
      }

      if (groupRows.length === 0) continue;

      // Get group key values
      const keyViewIdx = keyRow[g];
      const keyPhysIdx = baseIndex ? baseIndex[keyViewIdx] : keyViewIdx;
      const groupKeys: Record<string, unknown> = {};
      for (const col of groupingColumns) {
        const colName = String(col);
        groupKeys[colName] = store.columns[colName][keyPhysIdx];
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
        ? groupRows.filter((row: any) => {
          const timestamp = row[timeColumn];
          if (timestamp === null || timestamp === undefined) return false;
          const rowTime = toEpochMs(timestamp);
          return !isNaN(rowTime) && rowTime >= effectiveStartTime!;
        })
        : groupRows;

      // Group rows by time bucket within this group
      const buckets = new Map<number, any[]>();
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
      const allBuckets = new Map<number, any[]>();
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
        const bucketDf = createDataFrame(bucketRows) as any;
        const resultRow: any = {
          ...groupKeys, // Include group keys
          [timeColName]: new Date(bucketTime),
        };

        for (const [colName, aggregation] of Object.entries(aggregations)) {
          if (colName === timeColName) continue;

          const col = colName;

          // Check if column exists in data - use it directly
          if (availableColumns.includes(colName)) {
            resultRow[colName] = applyAggregation(
              bucketDf,
              col,
              aggregation,
            );
          } else {
            // Column doesn't exist - find appropriate source column
            const numericColumns = availableColumns.filter(
              (c) =>
                c !== timeColName && !Object.hasOwn(groupKeys, c) &&
                bucketRows.some((r: any) => typeof r[c] === "number"),
            );

            if (numericColumns.length === 1) {
              // Only one numeric column - use it as the source
              const sourceCol = numericColumns[0];
              resultRow[colName] = applyAggregation(
                bucketDf,
                sourceCol,
                aggregation,
              );
            } else if (numericColumns.length > 1) {
              // Multiple numeric columns - ambiguous, use first one
              const sourceCol = numericColumns[0];
              resultRow[colName] = applyAggregation(
                bucketDf,
                sourceCol,
                aggregation,
              );
            } else {
              // No numeric columns - try any column
              const otherColumns = availableColumns.filter((c) =>
                c !== timeColName && !Object.hasOwn(groupKeys, c)
              );
              if (otherColumns.length > 0) {
                const sourceCol = otherColumns[0];
                resultRow[colName] = applyAggregation(
                  bucketDf,
                  sourceCol,
                  aggregation,
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

    return createDataFrame(allResults);
  }

  // Ungrouped: Group rows by time bucket
  const rows = Array.from(df);
  const buckets = new Map<number, any[]>();

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
    ? rows.filter((row: any) => {
      const timestamp = row[timeColumn];
      if (timestamp === null || timestamp === undefined) return false;
      const rowTime = toEpochMs(timestamp);
      return !isNaN(rowTime) && rowTime >= effectiveStartTime!;
    })
    : rows;

  // Group filtered rows by time bucket
  for (const row of filteredRows) {
    const timestamp = (row as any)[timeColumn];
    if (timestamp === null || timestamp === undefined) {
      continue; // Skip rows with null timestamps
    }

    const bucket = useCalendarBucketing && calendarFreq
      ? getCalendarBucket(
        toEpochMs(timestamp),
        calendarFreq.unit,
        calendarFreq.value,
      )
      : getTimeBucket(
        timestamp,
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
    return createDataFrame([]);
  }

  if (effectiveEndTime !== undefined) {
    bucketEndTime = effectiveEndTime;
  } else if (buckets.size > 0) {
    // Use last bucket time
    bucketEndTime = Math.max(...Array.from(buckets.keys()));
  } else {
    // No data and no endDate - return empty
    return createDataFrame([]);
  }

  // Generate all buckets in the range (including empty ones)
  const allBuckets = new Map<number, any[]>();

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
      return createDataFrame([]);
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
    const bucketDf = createDataFrame(bucketRows) as any;
    const resultRow: any = {
      [timeColName]: new Date(bucketTime),
    };

    for (const [colName, aggregation] of Object.entries(aggregations)) {
      if (colName === timeColName) continue; // Skip time column

      // Check if colName exists as a column in the data
      const col = colName;
      if (availableColumns.includes(colName)) {
        // Column exists - aggregate it
        resultRow[colName] = applyAggregation(
          bucketDf,
          col,
          aggregation,
        );
      } else {
        // Column doesn't exist - try to find a source column to aggregate
        // For now, if there's only one numeric column (besides time), use that
        // Otherwise, we need to infer or use the first available column
        const numericColumns = availableColumns.filter(
          (c) =>
            c !== timeColName &&
            bucketRows.some((r: any) => typeof r[c] === "number"),
        );

        if (numericColumns.length === 1) {
          // Single numeric column - use it as source
          const sourceCol = numericColumns[0];
          resultRow[colName] = applyAggregation(
            bucketDf,
            sourceCol,
            aggregation,
          );
        } else if (numericColumns.length > 0) {
          // Multiple numeric columns - use the first one (could be improved)
          const sourceCol = numericColumns[0];
          resultRow[colName] = applyAggregation(
            bucketDf,
            sourceCol,
            aggregation,
          );
        } else {
          // No numeric columns found - try first non-time column
          const otherColumns = availableColumns.filter((c) =>
            c !== timeColName
          );
          if (otherColumns.length > 0) {
            const sourceCol = otherColumns[0];
            resultRow[colName] = applyAggregation(
              bucketDf,
              sourceCol,
              aggregation,
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

  return createDataFrame(result);
}

/**
 * Calendar-path downsample for PlainDate/PlainDateTime.
 * Uses string bucket keys (ISO strings) and native Temporal operations.
 */
function downsampleCalendarTemporal(
  rows: any[],
  timeColumn: any,
  frequency: Frequency,
  aggregations: Record<string, (...args: any[]) => any>,
): any {
  const timeColName = String(timeColumn);
  const freq = parseFrequencyForCalendar(frequency);
  if (!freq) {
    throw new Error(
      'Cannot use raw millisecond frequency with calendar Temporal types. Use a string frequency like "1D", "1M", etc.',
    );
  }

  // Group rows by string bucket key
  const buckets = new Map<string, any[]>();
  let firstTemporal: CalendarTemporal | null = null;
  let lastTemporal: CalendarTemporal | null = null;

  for (const row of rows) {
    const timestamp = row[timeColumn];
    if (timestamp === null || timestamp === undefined) continue;
    if (!isCalendarTemporal(timestamp)) continue;

    const floored = floorCalendarTemporal(timestamp, freq);
    const key = floored.toString();

    if (
      !firstTemporal ||
      timestamp.constructor.compare(timestamp, firstTemporal) < 0
    ) {
      firstTemporal = timestamp;
    }
    if (
      !lastTemporal ||
      timestamp.constructor.compare(timestamp, lastTemporal) > 0
    ) {
      lastTemporal = timestamp;
    }

    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(row);
  }

  if (!firstTemporal || !lastTemporal) {
    return createDataFrame([]);
  }

  // Generate all bucket keys in the range
  const startFloored = floorCalendarTemporal(firstTemporal, freq);
  const endFloored = floorCalendarTemporal(lastTemporal, freq);
  const allKeys = generateCalendarTemporalSequence(
    startFloored,
    endFloored,
    freq,
  );

  // Apply aggregations to each bucket
  const result: any[] = [];
  const availableColumns = rows.length > 0 ? Object.keys(rows[0]) : [];

  for (const bucketKey of allKeys) {
    const bucketRows = buckets.get(bucketKey) || [];
    const bucketDf = createDataFrame(bucketRows) as any;
    const resultRow: any = { [timeColName]: bucketKey };

    for (const [colName, aggregation] of Object.entries(aggregations)) {
      if (colName === timeColName) continue;
      const col = colName;

      if (availableColumns.includes(colName)) {
        resultRow[colName] = applyAggregation(
          bucketDf,
          col,
          aggregation,
        );
      } else {
        const numericColumns = availableColumns.filter(
          (c) =>
            c !== timeColName &&
            bucketRows.some((r: any) => typeof r[c] === "number"),
        );
        if (numericColumns.length > 0) {
          resultRow[colName] = applyAggregation(
            bucketDf,
            numericColumns[0],
            aggregation,
          );
        } else {
          resultRow[colName] = null;
        }
      }
    }
    result.push(resultRow);
  }

  return createDataFrame(result);
}

/**
 * Downsample time-series data by aggregating to a lower frequency.
 *
 * Groups rows by time buckets and applies aggregation functions to each bucket.
 * Use this when converting from higher frequency to lower frequency (e.g., hourly to daily).
 */
export function downsample(
  args: any,
) {
  return (
    df: any,
  ): any => {
    const rows: any[] = Array.from(df);
    if (rows.length === 0) {
      return createDataFrame([]);
    }

    // Detect if the time column contains calendar Temporal types (PlainDate/PlainDateTime)
    const firstTimestamp = rows.find((r: any) => r[args.timeColumn] != null)
      ?.[args.timeColumn as string];
    if (isWallClockTemporalWithoutCalendar(firstTimestamp)) {
      throw new Error(
        "PlainTime cannot be used for time-series downsampling (no date component).",
      );
    }
    if (isCalendarTemporal(firstTimestamp)) {
      return downsampleCalendarTemporal(
        rows,
        args.timeColumn,
        args.frequency,
        args.aggregations,
      );
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
