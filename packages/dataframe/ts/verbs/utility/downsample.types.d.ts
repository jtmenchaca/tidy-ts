import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
/**
 * Frequency specification for time-series operations.
 *
 * Supports common time periods as strings (e.g., "1H", "6H", "15min")
 * or as objects (e.g., { value: 6, unit: "h" }) or as raw milliseconds (number).
 *
 * Pattern: `<number><unit>` where unit is:
 * - S: seconds
 * - min: minutes
 * - H: hours
 * - D: days
 * - W: weeks
 * - M: months (calendar-aware)
 * - Q: quarters (calendar-aware)
 * - Y: years (calendar-aware)
 */
export type Frequency = `${number}S` | `${number}min` | `${number}H` | `${number}D` | `${number}W` | `${number}M` | `${number}Q` | `${number}Y` | number | {
    value: number;
    unit: "ms" | "s" | "min" | "h" | "d" | "w" | "M" | "Q" | "Y";
};
/**
 * Aggregation function for downsampling.
 * Must be a function that receives values and returns a single aggregated value.
 *
 * Examples:
 * - stats.mean, stats.sum, stats.min, stats.max, stats.first, stats.last (takes array/values)
 * - Custom function: (values: unknown[]) => value (receives array of values)
 * - Custom function: (group: GroupedDataFrame) => value (receives grouped DataFrame)
 */
export type AggregationFunction<T extends object> = (...args: any[]) => any;
/**
 * Arguments for downsample operation.
 */
export type DownsampleArgs<Row extends Record<string, unknown>, TimeCol extends keyof Row, Aggregations> = {
    timeColumn: TimeCol;
    frequency: Frequency;
    aggregations: Aggregations;
    startDate?: Date;
    endDate?: Date;
};
/**
 * Method signature for downsample on DataFrame.
 * Uses the same pattern as resample to preserve function return types and group columns.
 */
export interface DownsampleMethod<Row extends object> {
    /**
     * Downsample grouped DataFrame - preserves group columns in result.
     */
    <R extends object, GroupName extends keyof R, TimeCol extends keyof R & string, Aggregations extends Record<string, (...args: any[]) => any>>(this: GroupedDataFrame<R, GroupName>, args: DownsampleArgs<R & Record<string, unknown>, TimeCol, Aggregations>): DataFrame<{
        [K in GroupName | Exclude<keyof Aggregations, TimeCol> | TimeCol]: K extends TimeCol ? Date : K extends keyof Aggregations ? Aggregations[K] extends (...args: any[]) => infer Ret ? Ret : ReturnType<Aggregations[K]> : K extends keyof R ? R[K] : never;
    }>;
    /**
     * Downsample regular DataFrame.
     */
    <R extends object, TimeCol extends keyof R & string, Aggregations extends Record<string, (...args: any[]) => any>>(this: DataFrame<R>, args: DownsampleArgs<R & Record<string, unknown>, TimeCol, Aggregations>): DataFrame<{
        [K in Exclude<keyof Aggregations, TimeCol> | TimeCol]: K extends TimeCol ? Date : K extends keyof Aggregations ? Aggregations[K] extends (...args: any[]) => infer Ret ? Ret : ReturnType<Aggregations[K]> : never;
    }>;
}
