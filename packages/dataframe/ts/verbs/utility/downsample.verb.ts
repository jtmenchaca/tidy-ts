// deno-lint-ignore-file no-explicit-any
import {
  createDataFrame,
  materializeIndex,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { throwColumnNotFound } from "../../utilities/errors.ts";
import { collectGroupPhysicalIndices } from "../verb-helpers.ts";
import type { Frequency } from "./downsample.types.ts";
import { frequencyToMs, getTimeBucket } from "./time-bucket.ts";
import {
  type CalendarTemporal,
  floorCalendarTemporal,
  generateCalendarTemporalValues,
  isCalendarTemporal,
  isWallClockTemporalWithoutCalendar,
  parseFrequencyForCalendar,
  reconstructEpochTime,
  toEpochMs,
} from "../../stats/temporal-helpers.ts";
import {
  generateCalendarBuckets,
  getCalendarBucket,
  isCalendarFrequency,
  parseCalendarFrequency,
} from "./calendar.ts";
import { applyAggregation } from "./sample-helpers.ts";

type AggregationFn = (...args: any[]) => any;
type AggregationSpec = { column: string; fn: AggregationFn };

/**
 * Resolve an aggregation entry to its source column + function.
 *
 * Every entry must be the explicit `{ column, fn }` form. A plain function is
 * rejected so there is no implicit "key matches a column" shortcut and no
 * silent fallback to picking a column for you.
 */
function resolveAggregation(
  outputCol: string,
  spec: AggregationSpec | AggregationFn,
  availableColumns: readonly string[],
): { sourceCol: string; fn: AggregationFn } {
  if (typeof spec === "function") {
    throw new Error(
      `downsample: aggregation for "${outputCol}" must be the object form ` +
        `{ column: <sourceCol>, fn: <aggregator> }. ` +
        `Use { column: "${outputCol}", fn: <aggregator> } if the source ` +
        `column has the same name. ` +
        `(Available columns: ${availableColumns.join(", ")}.)`,
    );
  }
  if (!availableColumns.includes(spec.column)) {
    throw new Error(
      `downsample: aggregation for "${outputCol}" references source column ` +
        `"${spec.column}", which does not exist (available: ${availableColumns.join(", ")}).`,
    );
  }
  return { sourceCol: spec.column, fn: spec.fn };
}

/**
 * Internal downsample implementation: Group by time buckets and apply aggregations.
 *
 * `timeSample` is a representative non-null value from the input time column —
 * the output buckets are reconstructed in the same type (Date / Instant /
 * ZonedDateTime) via `reconstructEpochTime`.
 */
function downsampleImpl(
  df: any,
  timeColumn: any,
  frequency: Frequency,
  frequencyMs: number,
  aggregations: Record<string, AggregationSpec>,
  timeSample: unknown,
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
    const baseIndex = usesRawIndices
      ? null
      : materializeIndex(store.length, api.__view);
    const allResults: any[] = [];

    // Process each group separately
    for (let g = 0; g < size; g++) {
      const groupIndices = collectGroupPhysicalIndices({ head, next, groupIndex: g, usesRawIndices, baseIndex });
      const groupRows: any[] = [];
      for (const physIdx of groupIndices) {
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
          [timeColName]: reconstructEpochTime(bucketTime, timeSample),
        };

        for (const [colName, aggregation] of Object.entries(aggregations)) {
          if (colName === timeColName) continue;
          const { sourceCol, fn } = resolveAggregation(
            colName,
            aggregation,
            availableColumns,
          );
          resultRow[colName] = applyAggregation(bucketDf, sourceCol, fn);
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
      // Then by time (epoch comparison works for Date, Instant, ZonedDateTime)
      return toEpochMs(a[timeColName]) - toEpochMs(b[timeColName]);
    });

    // Preserve grouping: rebuild groups from the source so the caller can
    // chain mutateOverGroup / summarize without cross-group bleed.
    const out = createDataFrame(allResults);
    return withGroupsRebuilt(df, allResults, out);
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
      [timeColName]: reconstructEpochTime(bucketTime, timeSample),
    };

    for (const [colName, aggregation] of Object.entries(aggregations)) {
      if (colName === timeColName) continue; // Skip time column
      const { sourceCol, fn } = resolveAggregation(
        colName,
        aggregation,
        availableColumns,
      );
      resultRow[colName] = applyAggregation(bucketDf, sourceCol, fn);
    }

    result.push(resultRow);
  }

  // Sort by time (epoch comparison works for Date, Instant, ZonedDateTime)
  result.sort((a, b) => toEpochMs(a[timeColName]) - toEpochMs(b[timeColName]));

  return createDataFrame(result);
}

/**
 * Calendar-path downsample for PlainDate/PlainDateTime.
 * Emits bucket keys as the same Temporal type that came in (no string keys
 * leak out into the result).
 */
/**
 * Bucket a single (already-partitioned) set of rows by calendar frequency.
 * Returns result rows that include `extraColumns` (e.g. group keys) on every
 * output row. Does not handle grouping itself.
 */
function calendarBucketRows(
  rows: any[],
  timeColumn: any,
  freq: ReturnType<typeof parseFrequencyForCalendar>,
  aggregations: Record<string, AggregationSpec>,
  extraColumns: Record<string, unknown> = {},
): any[] {
  if (!freq) return [];
  const timeColName = String(timeColumn);

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

  if (!firstTemporal || !lastTemporal) return [];

  const startFloored = floorCalendarTemporal(firstTemporal, freq);
  const endFloored = floorCalendarTemporal(lastTemporal, freq);
  const allBucketValues = generateCalendarTemporalValues(
    startFloored,
    endFloored,
    freq,
  );

  const result: any[] = [];
  const availableColumns = rows.length > 0 ? Object.keys(rows[0]) : [];

  for (const bucketValue of allBucketValues) {
    const bucketRows = buckets.get(bucketValue.toString()) || [];
    const bucketDf = createDataFrame(bucketRows) as any;
    const resultRow: any = {
      ...extraColumns,
      [timeColName]: bucketValue,
    };

    for (const [colName, aggregation] of Object.entries(aggregations)) {
      if (colName === timeColName) continue;
      const { sourceCol, fn } = resolveAggregation(
        colName,
        aggregation,
        availableColumns,
      );
      resultRow[colName] = applyAggregation(bucketDf, sourceCol, fn);
    }
    result.push(resultRow);
  }

  return result;
}

function downsampleCalendarTemporal(
  df: any,
  rows: any[],
  timeColumn: any,
  frequency: Frequency,
  aggregations: Record<string, AggregationSpec>,
): any {
  const freq = parseFrequencyForCalendar(frequency);
  if (!freq) {
    throw new Error(
      'Cannot use raw millisecond frequency with calendar Temporal types. Use a string frequency like "1D", "1M", etc.',
    );
  }

  const groupedDf = df as any;
  // Grouped path: partition rows by group, bucket each partition, re-group result.
  if (groupedDf.__groups) {
    const { head, next, keyRow, groupingColumns, size, usesRawIndices } =
      groupedDf.__groups;
    const store = groupedDf.__store;
    const baseIndex = usesRawIndices
      ? null
      : materializeIndex(store.length, groupedDf.__view);

    const allResults: any[] = [];
    for (let g = 0; g < size; g++) {
      const groupIndices = collectGroupPhysicalIndices({
        head,
        next,
        groupIndex: g,
        usesRawIndices,
        baseIndex,
      });
      const groupRows: any[] = [];
      for (const physIdx of groupIndices) {
        const row: any = {};
        for (const colName of store.columnNames) {
          row[colName] = store.columns[colName][physIdx];
        }
        groupRows.push(row);
      }
      const groupKeys: Record<string, unknown> = {};
      const keyPhys = keyRow[g];
      for (const col of groupingColumns) {
        groupKeys[String(col)] = store.columns[String(col)][keyPhys];
      }
      allResults.push(
        ...calendarBucketRows(
          groupRows,
          timeColumn,
          freq,
          aggregations,
          groupKeys,
        ),
      );
    }

    const out = createDataFrame(allResults);
    return withGroupsRebuilt(df, allResults, out);
  }

  return createDataFrame(
    calendarBucketRows(rows, timeColumn, freq, aggregations),
  );
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
    const store = (df as any).__store;
    if (store && store.length > 0 && !(String(args.timeColumn) in store.columns)) {
      throwColumnNotFound(String(args.timeColumn), store.columnNames);
    }

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
        df,
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
      firstTimestamp,
      args.startDate,
      args.endDate,
    );
  };
}
