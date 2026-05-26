// deno-lint-ignore-file no-explicit-any
import {
  createDataFrame,
  materializeIndex,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { throwColumnNotFound } from "../../utilities/errors.ts";
import { collectGroupPhysicalIndices } from "../verb-helpers.ts";
import type { FillMethod } from "./upsample.types.ts";
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

/**
 * Internal upsample implementation: Generate time sequence and fill missing values.
 */
function upsampleImpl(
  df: any,
  timeColumn: any,
  _frequency: Frequency,
  frequencyMs: number,
  fillMethod: FillMethod,
  timeSample: unknown,
  startDate?: Date,
  endDate?: Date,
): any {
  const timeColName = String(timeColumn);

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

      // Get time range for this group
      const timeMs = groupRows
        .map((row: any) => toEpochMs(row[timeColumn]))
        .filter((t: number) => !isNaN(t));

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
          [timeColName]: reconstructEpochTime(bucketTime, timeSample),
        };

        // Fill columns based on fillMethod
        const firstRow = groupRows[0];
        for (const key of Object.keys(firstRow)) {
          if (key === timeColName) continue;
          // Skip grouping columns (already included in groupKeys)
          if (groupingColumns.some((col: any) => String(col) === key)) {
            continue;
          }

          const colName = key;

          if (fillMethod === "forward") {
            // Forward fill: use most recent value before or at this time
            const valuesUpToNow = groupRows
              .filter((r: any) => {
                const rtMs = toEpochMs(r[timeColumn]);
                return !isNaN(rtMs) && rtMs <= bucketTime;
              })
              .map((r: any) => r[colName]);

            if (valuesUpToNow.length > 0) {
              resultRow[key] = valuesUpToNow[valuesUpToNow.length - 1];
            } else {
              // No values before this time - use first available value
              resultRow[key] = firstRow[colName];
            }
          } else {
            // Backward fill: use next value after this time
            const valuesFromNow = groupRows
              .filter((r: any) => {
                const rtMs = toEpochMs(r[timeColumn]);
                return !isNaN(rtMs) && rtMs >= bucketTime;
              })
              .map((r: any) => r[colName]);

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
      // Then by time (epoch comparison works for Date, Instant, ZonedDateTime)
      return toEpochMs(a[timeColName]) - toEpochMs(b[timeColName]);
    });

    const out = createDataFrame(allResults);
    return withGroupsRebuilt(df, allResults, out);
  }

  // Ungrouped: Process all rows together
  const rows = Array.from(df);

  if (rows.length === 0) {
    return createDataFrame([]);
  }

  // Get time range
  const timeMs = rows
    .map((row: any) => toEpochMs(row[timeColumn]))
    .filter((t: number) => !isNaN(t));

  if (timeMs.length === 0) {
    return createDataFrame([]);
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
      [timeColName]: reconstructEpochTime(bucketTime, timeSample),
    };

    // Fill columns based on fillMethod
    const firstRow = rows[0] as any;
    for (const key of Object.keys(firstRow)) {
      if (key === timeColName) continue;

      const colName = key;

      if (fillMethod === "forward") {
        // Forward fill: use most recent value before or at this time
        const valuesUpToNow = rows
          .filter((r: any) => {
            const rtMs = toEpochMs(r[timeColumn]);
            return !isNaN(rtMs) && rtMs <= bucketTime;
          })
          .map((r: any) => r[colName]);

        if (valuesUpToNow.length > 0) {
          resultRow[key] = valuesUpToNow[valuesUpToNow.length - 1];
        } else {
          // No values before this time - use first available value
          resultRow[key] = firstRow[colName];
        }
      } else {
        // Backward fill: use next value after this time
        const valuesFromNow = rows
          .filter((r: any) => {
            const rtMs = toEpochMs(r[timeColumn]);
            return !isNaN(rtMs) && rtMs >= bucketTime;
          })
          .map((r: any) => r[colName]);

        if (valuesFromNow.length > 0) {
          resultRow[key] = valuesFromNow[0];
        } else {
          // No values after this time - use last available value
          resultRow[key] = (rows[rows.length - 1] as any)[colName];
        }
      }
    }

    result.push(resultRow);
  }

  return createDataFrame(result);
}

/**
 * Bucket-fill a single (already-partitioned) set of rows by calendar frequency.
 * Returns result rows that include `extraColumns` (e.g. group keys) on every
 * output row. Does not handle grouping itself.
 */
function calendarFillRows(
  rows: any[],
  timeColumn: any,
  freq: ReturnType<typeof parseFrequencyForCalendar>,
  fillMethod: FillMethod,
  extraColumns: Record<string, unknown> = {},
): any[] {
  if (!freq) return [];
  const timeColName = String(timeColumn);

  let minVal: CalendarTemporal | null = null;
  let maxVal: CalendarTemporal | null = null;
  for (const row of rows) {
    const ts = row[timeColumn];
    if (!isCalendarTemporal(ts)) continue;
    if (!minVal || ts.constructor.compare(ts, minVal) < 0) minVal = ts;
    if (!maxVal || ts.constructor.compare(ts, maxVal) > 0) maxVal = ts;
  }

  if (!minVal || !maxVal) return [];

  const startFloored = floorCalendarTemporal(minVal, freq);
  const endFloored = floorCalendarTemporal(maxVal, freq);
  const bucketValues = generateCalendarTemporalValues(
    startFloored,
    endFloored,
    freq,
  );

  const rowByKey = new Map<string, any>();
  for (const row of rows) {
    const ts = row[timeColumn];
    if (!isCalendarTemporal(ts)) continue;
    const key = floorCalendarTemporal(ts, freq).toString();
    rowByKey.set(key, row);
  }

  const result: any[] = [];
  const firstRow = rows[0];

  for (let i = 0; i < bucketValues.length; i++) {
    const bucketValue = bucketValues[i];
    const resultRow: any = { ...extraColumns, [timeColName]: bucketValue };

    for (const key of Object.keys(firstRow)) {
      if (key === timeColName) continue;
      // Group keys are sourced from extraColumns; don't overwrite with the
      // sample firstRow value (which may differ from the bucket's group).
      if (key in extraColumns) continue;
      const colName = key;

      if (fillMethod === "forward") {
        let value: unknown = undefined;
        for (let j = i; j >= 0; j--) {
          const match = rowByKey.get(bucketValues[j].toString());
          if (match) {
            value = match[colName];
            break;
          }
        }
        resultRow[key] = value !== undefined ? value : firstRow[colName];
      } else {
        let value: unknown = undefined;
        for (let j = i; j < bucketValues.length; j++) {
          const match = rowByKey.get(bucketValues[j].toString());
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

  return result;
}

function upsampleCalendarTemporal(
  df: any,
  rows: any[],
  timeColumn: any,
  frequency: Frequency,
  fillMethod: FillMethod,
): any {
  const freq = parseFrequencyForCalendar(frequency);
  if (!freq) {
    throw new Error(
      'Cannot use raw millisecond frequency with calendar Temporal types. Use a string frequency like "1D", "1M", etc.',
    );
  }

  const groupedDf = df as any;
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
      if (groupRows.length === 0) continue;

      const groupKeys: Record<string, unknown> = {};
      const keyPhys = keyRow[g];
      for (const col of groupingColumns) {
        groupKeys[String(col)] = store.columns[String(col)][keyPhys];
      }
      allResults.push(
        ...calendarFillRows(
          groupRows,
          timeColumn,
          freq,
          fillMethod,
          groupKeys,
        ),
      );
    }

    const out = createDataFrame(allResults);
    return withGroupsRebuilt(df, allResults, out);
  }

  return createDataFrame(
    calendarFillRows(rows, timeColumn, freq, fillMethod),
  );
}

/**
 * Upsample time-series data by filling gaps to a higher frequency.
 *
 * Generates a complete time sequence and fills missing values using a simple fill strategy.
 * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
 */
export function upsample(
  args: any,
) {
  return (df: any): any => {
    const store = (df as any).__store;
    if (store && store.length > 0 && !(String(args.timeColumn) in store.columns)) {
      throwColumnNotFound(String(args.timeColumn), store.columnNames);
    }

    const rows: any[] = Array.from(df);
    if (rows.length === 0) {
      return createDataFrame([]);
    }

    // Detect calendar Temporal types (PlainDate/PlainDateTime)
    const firstTimestamp = rows.find((r: any) => r[args.timeColumn] != null)
      ?.[args.timeColumn as string];
    if (isWallClockTemporalWithoutCalendar(firstTimestamp)) {
      throw new Error(
        "PlainTime cannot be used for time-series upsampling (no date component).",
      );
    }
    if (isCalendarTemporal(firstTimestamp)) {
      return upsampleCalendarTemporal(
        df,
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
      firstTimestamp,
      args.startDate,
      args.endDate,
    );
  };
}
