import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import type { Frequency } from "./downsample.types.ts";

/**
 * Fill method for upsampling.
 * - "forward": Carry forward the last known value (forward fill)
 * - "backward": Use the next known value (backward fill)
 */
export type FillMethod = "forward" | "backward";

/**
 * Upsample arguments with time column and fill method.
 *
 * @template Row - The row type of the DataFrame
 * @template TimeCol - The time column name (must be keyof Row)
 */
export type UpsampleArgs<
  Row extends Record<string, unknown>,
  TimeCol extends keyof Row,
> = {
  timeColumn: TimeCol;
  frequency: Frequency;
  fillMethod: FillMethod;
  startDate?: Date;
  endDate?: Date;
};

/**
 * Compute the result row type after upsampling.
 * Preserves the time column and all other columns from the original row.
 */
type RowAfterUpsample<
  Row extends object,
  TimeCol extends keyof Row,
> = Prettify<
  & Pick<Row, TimeCol> // Preserve time column
  & {
    // Preserve all other columns
    [K in keyof Row as K extends TimeCol ? never : K]: Row[K];
  }
>;

/**
 * Method signature for upsample on DataFrame.
 *
 * Upsamples time-series data by filling gaps to a higher frequency.
 * Generates a complete time sequence and fills missing values using forward or backward fill.
 * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
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
 * // Upsample grouped data with consistent date ranges
 * const result = df.groupBy("symbol").upsample({
 *   timeColumn: "timestamp",
 *   frequency: "1H",
 *   fillMethod: "forward",
 *   startDate: new Date("2024-01-01"),
 *   endDate: new Date("2024-01-31")
 * });
 */
export type UpsampleMethod<Row extends object> = {
  /**
   * Upsample time-series data to a higher frequency (grouped DataFrame).
   *
   * Generates a complete time sequence for each group and fills missing values
   * using forward or backward fill. The time column must be of type Date (or Date | null).
   *
   * @param args - Named arguments object
   * @param args.timeColumn - Name of the Date column to use for upsampling
   * @param args.frequency - Target frequency (e.g., "1H", "15min", "1D")
   * @param args.fillMethod - Fill method: "forward" (carry forward) or "backward" (use next value)
   * @param args.startDate - Optional: Start date for upsampling period
   * @param args.endDate - Optional: End date for upsampling period
   * @returns DataFrame with upsampled data (ungrouped, includes group columns)
   *
   * @example
   * // Upsample grouped data with consistent date ranges
   * const result = df.groupBy("symbol").upsample({
   *   timeColumn: "timestamp",
   *   frequency: "1H",
   *   fillMethod: "forward",
   *   startDate: new Date("2024-01-01"),
   *   endDate: new Date("2024-01-31")
   * });
   */
  <
    GroupName extends keyof Row,
    TimeCol extends keyof Row,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    args: UpsampleArgs<Row & Record<string, unknown>, TimeCol>,
  ): DataFrame<
    Prettify<
      & Pick<Row, GroupName> // Include group columns
      & RowAfterUpsample<Row, TimeCol> // Include upsampled columns
    >
  >;

  /**
   * Upsample time-series data to a higher frequency (regular DataFrame).
   *
   * Generates a complete time sequence and fills missing values using forward or backward fill.
   * The time column must be of type Date (or Date | null).
   *
   * @param args - Named arguments object
   * @param args.timeColumn - Name of the Date column to use for upsampling
   * @param args.frequency - Target frequency (e.g., "1H", "15min", "1D")
   * @param args.fillMethod - Fill method: "forward" (carry forward) or "backward" (use next value)
   * @param args.startDate - Optional: Start date for upsampling period. If provided, always starts from this date.
   *   - If data starts before startDate: truncates and starts from startDate
   *   - If data starts after startDate: starts from startDate and forward-fills until first data point
   * @param args.endDate - Optional: End date for upsampling period. If provided, always extends to this date.
   *   - Forward-fills if needed when endDate is after last data point
   * @returns DataFrame with upsampled data
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
  <
    TimeCol extends keyof Row,
  >(
    args: UpsampleArgs<Row & Record<string, unknown>, TimeCol>,
  ): DataFrame<RowAfterUpsample<Row, TimeCol>>;
};
