import type { DataFrame } from "../../dataframe/types/dataframe.type.ts";
import type { ColumnProfile } from "./profile.types.ts";
import { createDataFrame } from "../../dataframe/implementation/create-dataframe.ts";
import { iqr } from "../../stats/descriptive/spread/iqr.ts";
import { max } from "../../stats/aggregate/max.ts";
import { mean } from "../../stats/descriptive/central-tendency/mean.ts";
import { median } from "../../stats/descriptive/central-tendency/median.ts";
import { min } from "../../stats/aggregate/min.ts";
import { quantile } from "../../stats/descriptive/quantiles/quantile.ts";
import { sd as stdev } from "../../stats/descriptive/spread/stdev.ts";
import { variance } from "../../stats/descriptive/spread/variance.ts";

/**
 * Profile a DataFrame by computing comprehensive statistics for each column.
 *
 * For numeric columns, computes: mean, median, min, max, sd, q1, q3, iqr, variance
 * For categorical columns, computes: unique count, top 3 most frequent values
 *
 * @example
 * ```typescript
 * const data = createDataFrame([
 *   { name: "Alice", age: 30, score: 85 },
 *   { name: "Bob", age: 25, score: 92 },
 *   { name: "Charlie", age: 35, score: 78 }
 * ]);
 *
 * const profile = data.profile();
 * profile.print();
 * ```
 */
export function profile<T extends object>(
  df: DataFrame<T>,
): DataFrame<ColumnProfile> {
  const columnProfiles: ColumnProfile[] = df.columns().map((col: string) => {
    // @ts-ignore - dynamic column access for profiling
    const values = df.extract(col);
    const nonNull = values.filter(
      (v: unknown) => v !== null && v !== undefined,
    );
    const nullCount = values.length - nonNull.length;
    const nullPct = ((nullCount / values.length) * 100).toFixed(1);

    // Check if numeric
    const isNumeric = nonNull.every((v: unknown) => typeof v === "number");

    if (isNumeric) {
      const numericValues = nonNull as number[];
      const q1 = quantile(numericValues, 0.25);
      const q3 = quantile(numericValues, 0.75);
      return {
        column: col,
        type: "numeric",
        count: values.length,
        nulls: nullCount,
        null_pct: `${nullPct}%`,
        mean: mean(numericValues).toFixed(2),
        median: median(numericValues).toFixed(2),
        min: min(numericValues).toFixed(2),
        max: max(numericValues).toFixed(2),
        sd: stdev(numericValues).toFixed(2),
        q1: q1.toFixed(2),
        q3: q3.toFixed(2),
        iqr: iqr(numericValues).toFixed(2),
        variance: variance(numericValues).toFixed(2),
        unique: undefined,
        top_values: undefined,
      };
    } else {
      // Categorical column
      const unique = new Set(nonNull);
      const topValues = Array.from(
        nonNull.reduce((acc: Map<string, number>, val: unknown) => {
          const key = String(val);
          acc.set(key, (acc.get(key) || 0) + 1);
          return acc;
        }, new Map<string, number>()),
      )
        .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
        .slice(0, 3)
        .map(([val, count]: [string, number]) => `${val}(${count})`)
        .join(", ");

      return {
        column: col,
        type: "categorical",
        count: values.length,
        nulls: nullCount,
        null_pct: `${nullPct}%`,
        mean: undefined,
        median: undefined,
        min: undefined,
        max: undefined,
        sd: undefined,
        q1: undefined,
        q3: undefined,
        iqr: undefined,
        variance: undefined,
        unique: unique.size,
        top_values: topValues,
      };
    }
  });

  return createDataFrame(columnProfiles);
}
