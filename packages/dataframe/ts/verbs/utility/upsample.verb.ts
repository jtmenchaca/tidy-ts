// deno-lint-ignore-file no-explicit-any
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import { createDataFrame, materializeIndex } from "../../dataframe/index.ts";
import { collectGroupIndices } from "../verb-helpers.ts";
import type { FillMethod, UpsampleArgs } from "./upsample.types.ts";
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

/**
 * Internal upsample implementation: Generate time sequence and fill missing values.
 */
function upsampleImpl<T extends Record<string, unknown>>(
  df: DataFrame<T> | GroupedDataFrame<T, keyof T>,
  timeColumn: keyof T,
  _frequency: Frequency,
  frequencyMs: number,
  fillMethod: FillMethod,
  startDate?: Date,
  endDate?: Date,
): DataFrame<any> {
  const timeColName = String(timeColumn);

  // Check if this is a grouped DataFrame
  const groupedDf = df as any;
  if (groupedDf.__groups) {
    const { head, next, keyRow, groupingColumns, size, usesRawIndices } =
      groupedDf.__groups;
    const api = df as any;
    const store = api.__store;
    const mask = api.__view?.mask;
    const baseIndex = usesRawIndices
      ? null
      : materializeIndex(store.length, api.__view);
    const allResults: any[] = [];

    // Process each group separately
    for (let g = 0; g < size; g++) {
      const groupIndices = collectGroupIndices({ head, next, groupIndex: g, mask });
      const groupRows: T[] = [];
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

      // Get time range for this group
      const timeMs = groupRows
        .map((row) => toEpochMs(row[timeColumn]))
        .filter((t) => !isNaN(t));

      if (timeMs.length === 0) {
        continue; // Skip groups with no valid timestamps
      }

      // Get min/max times as milliseconds for this group
      const minTime = Math.min(...timeMs);
      const maxTime = Math.max(...timeMs);

      // Determine effective start and end times for this group
      let effectiveStartTime: number;
      let effectiveEndTime: number;

      if (startDate) {
        // startDate is provided - always start from startDate (hard constraint)
        effectiveStartTime = getTimeBucket(startDate.getTime(), frequencyMs);
      } else {
        // No startDate - start from first data point in this group
        effectiveStartTime = getTimeBucket(minTime, frequencyMs);
      }

      if (endDate) {
        // endDate is provided - include the bucket containing endDate
        effectiveEndTime = getTimeBucket(endDate.getTime(), frequencyMs);
      } else {
        // No endDate - end at last data point in this group
        effectiveEndTime = getTimeBucket(maxTime, frequencyMs);
      }

      // Generate time sequence aligned to frequency boundaries for this group
      const sequenceSet = new Set<number>();
      for (
        let t = effectiveStartTime;
        t <= effectiveEndTime;
        t += frequencyMs
      ) {
        const bucketTime = getTimeBucket(t, frequencyMs);
        sequenceSet.add(bucketTime);
      }

      // Ensure we include the endTime bucket even if it doesn't align perfectly
      sequenceSet.add(effectiveEndTime);

      const sequence = Array.from(sequenceSet).sort((a, b) => a - b);

      // Create result rows for this group
      for (const bucketTime of sequence) {
        const resultRow: any = {
          ...groupKeys, // Include group keys
          [timeColName]: new Date(bucketTime),
        };

        // Fill columns based on fillMethod
        const firstRow = groupRows[0];
        for (const key of Object.keys(firstRow)) {
          if (key === timeColName) continue;
          // Skip grouping columns (already included in groupKeys)
          if (groupingColumns.some((col: keyof T) => String(col) === key)) {
            continue;
          }

          const colName = key as keyof T;

          if (fillMethod === "forward") {
            // Forward fill: use most recent value before or at this time
            const valuesUpToNow = groupRows
              .filter((r) => {
                const rtMs = toEpochMs(r[timeColumn]);
                return !isNaN(rtMs) && rtMs <= bucketTime;
              })
              .map((r) => r[colName]);

            if (valuesUpToNow.length > 0) {
              resultRow[key] = valuesUpToNow[valuesUpToNow.length - 1];
            } else {
              // No values before this time - use first available value
              resultRow[key] = firstRow[colName];
            }
          } else {
            // Backward fill: use next value after this time
            const valuesFromNow = groupRows
              .filter((r) => {
                const rtMs = toEpochMs(r[timeColumn]);
                return !isNaN(rtMs) && rtMs >= bucketTime;
              })
              .map((r) => r[colName]);

            if (valuesFromNow.length > 0) {
              resultRow[key] = valuesFromNow[0];
            } else {
              // No values after this time - use last available value
              resultRow[key] = groupRows[groupRows.length - 1][colName];
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

  // Ungrouped: Process all rows together
  const rows = Array.from(df);

  if (rows.length === 0) {
    return createDataFrame([]) as unknown as DataFrame<any>;
  }

  // Get time range
  const timeMs = rows
    .map((row) => toEpochMs(row[timeColumn]))
    .filter((t) => !isNaN(t));

  if (timeMs.length === 0) {
    return createDataFrame([]) as unknown as DataFrame<any>;
  }

  // Get min/max times as milliseconds
  const minTime = Math.min(...timeMs);
  const maxTime = Math.max(...timeMs);

  // Determine effective start and end times
  let effectiveStartTime: number;
  let effectiveEndTime: number;

  if (startDate) {
    // startDate is provided - always start from startDate (hard constraint)
    effectiveStartTime = getTimeBucket(startDate.getTime(), frequencyMs);
  } else {
    // No startDate - start from first data point
    effectiveStartTime = getTimeBucket(minTime, frequencyMs);
  }

  if (endDate) {
    // endDate is provided - include the bucket containing endDate
    effectiveEndTime = getTimeBucket(endDate.getTime(), frequencyMs);
  } else {
    // No endDate - end at last data point
    effectiveEndTime = getTimeBucket(maxTime, frequencyMs);
  }

  // Generate time sequence aligned to frequency boundaries
  const sequenceSet = new Set<number>();
  for (let t = effectiveStartTime; t <= effectiveEndTime; t += frequencyMs) {
    const bucketTime = getTimeBucket(t, frequencyMs);
    sequenceSet.add(bucketTime);
  }

  // Ensure we include the endTime bucket even if it doesn't align perfectly
  sequenceSet.add(effectiveEndTime);

  const sequence = Array.from(sequenceSet).sort((a, b) => a - b);

  // Create result rows
  const result: any[] = [];

  for (const bucketTime of sequence) {
    const resultRow: any = {
      [timeColName]: new Date(bucketTime),
    };

    // Fill columns based on fillMethod
    const firstRow = rows[0];
    for (const key of Object.keys(firstRow)) {
      if (key === timeColName) continue;

      const colName = key as keyof T;

      if (fillMethod === "forward") {
        // Forward fill: use most recent value before or at this time
        const valuesUpToNow = rows
          .filter((r) => {
            const rtMs = toEpochMs(r[timeColumn]);
            return !isNaN(rtMs) && rtMs <= bucketTime;
          })
          .map((r) => r[colName]);

        if (valuesUpToNow.length > 0) {
          resultRow[key] = valuesUpToNow[valuesUpToNow.length - 1];
        } else {
          // No values before this time - use first available value
          resultRow[key] = firstRow[colName];
        }
      } else {
        // Backward fill: use next value after this time
        const valuesFromNow = rows
          .filter((r) => {
            const rtMs = toEpochMs(r[timeColumn]);
            return !isNaN(rtMs) && rtMs >= bucketTime;
          })
          .map((r) => r[colName]);

        if (valuesFromNow.length > 0) {
          resultRow[key] = valuesFromNow[0];
        } else {
          // No values after this time - use last available value
          resultRow[key] = rows[rows.length - 1][colName];
        }
      }
    }

    result.push(resultRow);
  }

  return createDataFrame(result) as unknown as DataFrame<any>;
}

/**
 * Calendar-path upsample for PlainDate/PlainDateTime.
 * Uses string bucket keys and native Temporal add()/compare().
 */
function upsampleCalendarTemporal<T extends Record<string, unknown>>(
  rows: T[],
  timeColumn: keyof T,
  frequency: Frequency,
  fillMethod: FillMethod,
): DataFrame<any> {
  const timeColName = String(timeColumn);
  const freq = parseFrequencyForCalendar(frequency);
  if (!freq) {
    throw new Error(
      'Cannot use raw millisecond frequency with calendar Temporal types. Use a string frequency like "1D", "1M", etc.',
    );
  }

  // Find min/max Temporal values
  let minVal: CalendarTemporal | null = null;
  let maxVal: CalendarTemporal | null = null;
  for (const row of rows) {
    const ts = row[timeColumn];
    if (!isCalendarTemporal(ts)) continue;
    if (!minVal || ts.constructor.compare(ts, minVal) < 0) minVal = ts;
    if (!maxVal || ts.constructor.compare(ts, maxVal) > 0) maxVal = ts;
  }

  if (!minVal || !maxVal) {
    return createDataFrame([]) as unknown as DataFrame<any>;
  }

  const startFloored = floorCalendarTemporal(minVal, freq);
  const endFloored = floorCalendarTemporal(maxVal, freq);
  const sequence = generateCalendarTemporalSequence(
    startFloored,
    endFloored,
    freq,
  );

  // Build a lookup: ISO string key → row values
  const rowByKey = new Map<string, T>();
  for (const row of rows) {
    const ts = row[timeColumn];
    if (!isCalendarTemporal(ts)) continue;
    const key = floorCalendarTemporal(ts, freq).toString();
    rowByKey.set(key, row);
  }

  // Generate result with fill
  const result: any[] = [];
  const firstRow = rows[0];

  for (let i = 0; i < sequence.length; i++) {
    const bucketKey = sequence[i];
    const resultRow: any = { [timeColName]: bucketKey };

    for (const key of Object.keys(firstRow)) {
      if (key === timeColName) continue;
      const colName = key as keyof T;

      if (fillMethod === "forward") {
        // Find most recent value at or before this bucket
        let value: unknown = undefined;
        for (let j = i; j >= 0; j--) {
          const match = rowByKey.get(sequence[j]);
          if (match) {
            value = match[colName];
            break;
          }
        }
        resultRow[key] = value !== undefined ? value : firstRow[colName];
      } else {
        // Backward fill: find next value at or after this bucket
        let value: unknown = undefined;
        for (let j = i; j < sequence.length; j++) {
          const match = rowByKey.get(sequence[j]);
          if (match) {
            value = match[colName];
            break;
          }
        }
        resultRow[key] = value !== undefined
          ? value
          : rows[rows.length - 1][colName];
      }
    }
    result.push(resultRow);
  }

  return createDataFrame(result) as unknown as DataFrame<any>;
}

/**
 * Upsample time-series data by filling gaps to a higher frequency.
 *
 * Generates a complete time sequence and fills missing values using a simple fill strategy.
 * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
 *
 * @param args - Named arguments object
 * @param args.timeColumn - Name of the Date column to use for upsampling
 * @param args.frequency - Target frequency (e.g., "1H", "15min", "1D")
 * @param args.fillMethod - Fill method: "forward" (carry forward) or "backward" (use next value)
 * @param args.startDate - Optional: Start date for upsampling period
 * @param args.endDate - Optional: End date for upsampling period
 * @returns A function that takes a DataFrame and returns a DataFrame with upsampled data
 *
 * @example
 * // Upsample daily to hourly with forward fill
 * const hourly = df.upsample({
 *   timeColumn: "timestamp",
 *   frequency: "1H",
 *   fillMethod: "forward"
 * });
 *
 * @example
 * // Upsample with backward fill
 * const hourly = df.upsample({
 *   timeColumn: "timestamp",
 *   frequency: "1H",
 *   fillMethod: "backward"
 * });
 *
 * @example
 * // Upsample with date range
 * const hourly = df.upsample({
 *   timeColumn: "timestamp",
 *   frequency: "6H",
 *   fillMethod: "forward",
 *   startDate: new Date("2024-01-01"),
 *   endDate: new Date("2024-01-31")
 * });
 */
export function upsample<
  T extends Record<string, unknown>,
  TimeCol extends keyof T,
>(
  args: UpsampleArgs<T, TimeCol>,
) {
  return (df: DataFrame<T> | GroupedDataFrame<T, keyof T>): DataFrame<any> => {
    const rows = Array.from(df);
    if (rows.length === 0) {
      return createDataFrame([]) as unknown as DataFrame<any>;
    }

    // Detect calendar Temporal types (PlainDate/PlainDateTime)
    const firstTimestamp = rows.find((r) => r[args.timeColumn] != null)
      ?.[args.timeColumn];
    if (isWallClockTemporalWithoutCalendar(firstTimestamp)) {
      throw new Error(
        "PlainTime cannot be used for time-series upsampling (no date component).",
      );
    }
    if (isCalendarTemporal(firstTimestamp)) {
      return upsampleCalendarTemporal(
        rows,
        args.timeColumn,
        args.frequency,
        args.fillMethod,
      );
    }

    const frequencyMs = frequencyToMs(args.frequency);
    return upsampleImpl(
      df,
      args.timeColumn,
      args.frequency,
      frequencyMs,
      args.fillMethod,
      args.startDate,
      args.endDate,
    );
  };
}
