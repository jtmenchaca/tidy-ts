// deno-lint-ignore-file no-explicit-any
import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Extract year from date column.
 *
 * @param col - Column name containing dates
 * @returns New DataFrame with extracted year values
 *
 * @example
 * ```typescript
 * const df = createDataFrame([
 *   { event: "A", date: new Date("2023-05-15") },
 *   { event: "B", date: new Date("2024-01-01") }
 * ]);
 *
 * const withYear = df.year("date");
 * // date column becomes [2023, 2024]
 * ```
 */
export function year<T extends Record<string, unknown>>(
  col: keyof T,
) {
  return function (df: DataFrame<T>): DataFrame<T> {
    const colName = String(col);
    const column = [...df[colName]] as (Date | string | number | null)[];

    if (!column || column.length === 0) {
      return df;
    }

    const yearValues = column.map((value) => {
      if (value == null) return null;

      let date: Date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === "string" || typeof value === "number") {
        date = new Date(value);
        if (isNaN(date.getTime())) return null;
      } else {
        return null;
      }

      return date.getFullYear();
    });

    return df.mutate(
      { [colName]: () => yearValues } as Record<keyof T, any>,
    ) as unknown as DataFrame<T>;
  };
}

/**
 * Extract month from date column (1-12).
 *
 * @param col - Column name containing dates
 * @returns New DataFrame with extracted month values (1-12)
 *
 * @example
 * ```typescript
 * const df = createDataFrame([
 *   { event: "A", date: new Date("2023-05-15") },
 *   { event: "B", date: new Date("2024-01-01") }
 * ]);
 *
 * const withMonth = df.month("date");
 * // date column becomes [5, 1]
 * ```
 */
export function month<T extends Record<string, unknown>>(
  col: keyof T,
) {
  return function (df: DataFrame<T>): DataFrame<T> {
    const colName = String(col);
    const column = [...df[colName]] as (Date | string | number | null)[];

    if (!column || column.length === 0) {
      return df;
    }

    const monthValues = column.map((value) => {
      if (value == null) return null;

      let date: Date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === "string" || typeof value === "number") {
        date = new Date(value);
        if (isNaN(date.getTime())) return null;
      } else {
        return null;
      }

      return date.getMonth() + 1; // JavaScript months are 0-indexed
    });

    return df.mutate(
      { [colName]: () => monthValues } as Record<keyof T, any>,
    ) as unknown as DataFrame<T>;
  };
}

/**
 * Extract day from date column (1-31).
 *
 * @param col - Column name containing dates
 * @returns New DataFrame with extracted day values (1-31)
 *
 * @example
 * ```typescript
 * const df = createDataFrame([
 *   { event: "A", date: new Date("2023-05-15") },
 *   { event: "B", date: new Date("2024-01-01") }
 * ]);
 *
 * const withDay = df.day("date");
 * // date column becomes [15, 1]
 * ```
 */
export function day<T extends Record<string, unknown>>(
  col: keyof T,
) {
  return function (df: DataFrame<T>): DataFrame<T> {
    const colName = String(col);
    const column = [...df[colName]] as (Date | string | number | null)[];

    if (!column || column.length === 0) {
      return df;
    }

    const dayValues = column.map((value) => {
      if (value == null) return null;

      let date: Date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === "string" || typeof value === "number") {
        date = new Date(value);
        if (isNaN(date.getTime())) return null;
      } else {
        return null;
      }

      return date.getDate();
    });

    return df.mutate(
      { [colName]: () => dayValues } as Record<keyof T, any>,
    ) as unknown as DataFrame<T>;
  };
}
