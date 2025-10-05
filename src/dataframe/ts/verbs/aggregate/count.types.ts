import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Count method - shorthand for groupBy(...columns).summarize({ n: g => g.nrows() })
 *
 * Requires at least one column name (matches tidyverse behavior).
 *
 * @example
 * ```typescript
 * // Count rows by single column
 * df.count("category")
 * // equivalent to: df.groupBy("category").summarize({ n: g => g.nrows() })
 *
 * // Count rows by multiple columns
 * df.count("category", "status")
 * // equivalent to: df.groupBy("category", "status").summarize({ n: g => g.nrows() })
 * ```
 */
export type CountMethod<Row extends object> = <K extends keyof Row>(
  column: K,
  ...additionalColumns: K[]
) => DataFrame<Pick<Row, K> & { n: number }>;
