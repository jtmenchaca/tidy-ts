// deno-lint-ignore-file no-explicit-any
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import { createDataFrame } from "../../dataframe/index.ts";
import type { FillMethod, UpsampleArgs } from "./upsample.types.ts";
import type { Frequency } from "./downsample.types.ts";
import { frequencyToMs, getTimeBucket } from "./time-bucket.ts";

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
  const rows = Array.from(df);

  if (rows.length === 0) {
    return createDataFrame([]) as unknown as DataFrame<any>;
  }

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

      // Get time range for this group
      const timeDates = groupRows
        .map((row) => {
          const ts = row[timeColumn];
          if (ts instanceof Date) return ts;
          if (typeof ts === "string") return new Date(ts);
          if (typeof ts === "number") return new Date(ts);
          return null;
        })
        .filter((t): t is Date => t !== null);

      if (timeDates.length === 0) {
        continue; // Skip groups with no valid timestamps
      }

      // Get min/max times as milliseconds for this group
      const times = timeDates.map((d) => d.getTime());
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

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
                const rt = r[timeColumn];
                const rtMs = rt instanceof Date
                  ? rt.getTime()
                  : typeof rt === "string"
                  ? new Date(rt).getTime()
                  : typeof rt === "number"
                  ? rt
                  : NaN;
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
                const rt = r[timeColumn];
                const rtMs = rt instanceof Date
                  ? rt.getTime()
                  : typeof rt === "string"
                  ? new Date(rt).getTime()
                  : typeof rt === "number"
                  ? rt
                  : NaN;
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
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

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
            const rt = r[timeColumn];
            const rtMs = rt instanceof Date
              ? rt.getTime()
              : typeof rt === "string"
              ? new Date(rt).getTime()
              : typeof rt === "number"
              ? rt
              : NaN;
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
            const rt = r[timeColumn];
            const rtMs = rt instanceof Date
              ? rt.getTime()
              : typeof rt === "string"
              ? new Date(rt).getTime()
              : typeof rt === "number"
              ? rt
              : NaN;
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
