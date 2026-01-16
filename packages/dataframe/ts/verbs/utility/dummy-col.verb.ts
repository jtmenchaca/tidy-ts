import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import { createDataFrame, withGroups } from "../../dataframe/index.ts";

/**
 * Type for the result of dummy_col transformation
 */
type DummyColResult<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
  Categories extends readonly string[],
  Prefix extends string,
  Suffix extends string,
  DropOriginal extends boolean,
> = Prettify<
  & (DropOriginal extends true ? Omit<Row, ColName> : Row)
  & {
    [Category in Categories[number] as `${Prefix}${Category}${Suffix}`]:
      boolean;
  }
>;

/**
 * Create boolean dummy columns from a categorical column (one-hot encoding).
 *
 * By default:
 * - Drops the original column
 * - Derives categories from the data (unique values, first-seen order)
 * - Skips null/undefined unless include_na: true (then columns "null"/"undefined")
 *
 * Options:
 * - expected_categories: provide explicit category list for type inference (replaces 'categories')
 * - prefix/suffix: decorate new column names
 * - drop_original: keep or drop original column (default: true)
 * - include_na: include "null"/"undefined" columns (default: false)
 *   When true and expected_categories is provided, "null" and "undefined" are automatically
 *   added to the categories list if not already present.
 *
 * @example
 * ```ts
 * // With expected_categories for full type inference
 * const result = df.dummy_col("letter", {
 *   expected_categories: ["A", "B", "C", "D"],
 *   prefix: "letter_"
 * });
 * // Result type: DataFrame<{ id: number; letter_A: boolean; letter_B: boolean; ... }>
 *
 * // Without expected_categories (returns Record<string, boolean>)
 * const result2 = df.dummy_col("letter");
 * // Result type: DataFrame<{ id: number; [x: string]: boolean }>
 * ```
 */
// Overload with expected_categories for type inference
export function dummy_col<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
  const Categories extends readonly string[],
  const Prefix extends string = "",
  const Suffix extends string = "",
  const DropOriginal extends boolean = true,
>(
  column: ColName,
  opts: {
    expected_categories: Categories;
    prefix?: Prefix;
    suffix?: Suffix;
    drop_original?: DropOriginal;
    include_na?: boolean;
  },
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<
  DummyColResult<Row, ColName, Categories, Prefix, Suffix, DropOriginal>
>;

// Overload without expected_categories (returns Record<string, boolean>)
export function dummy_col<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
>(
  column: ColName,
  opts?: {
    prefix?: string;
    suffix?: string;
    drop_original?: boolean;
    include_na?: boolean;
  },
): (
  df: DataFrame<Row> | GroupedDataFrame<Row>,
) => DataFrame<Prettify<Row & Record<string, boolean>>>;

// Implementation
export function dummy_col<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
>(column: ColName, opts: {
  expected_categories?: readonly string[];
  prefix?: string;
  suffix?: string;
  drop_original?: boolean;
  include_na?: boolean;
} = {}) {
  const {
    expected_categories,
    prefix = "",
    suffix = "",
    drop_original = true,
    include_na = false,
  } = opts;

  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    if (df.nrows() === 0) return createDataFrame([] as Row[]);

    // Compute categories once (global, not per-group) unless provided
    const cats: string[] = expected_categories
      ? (() => {
        // Auto-inject NA categories when include_na is true
        const baseCategories = [...expected_categories];
        if (include_na) {
          if (!baseCategories.includes("null")) baseCategories.push("null");
          if (!baseCategories.includes("undefined")) {
            baseCategories.push(
              "undefined",
            );
          }
        }
        return baseCategories;
      })()
      : (() => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const row of df) {
          // Map group_by semantics: keep null/undefined distinct if requested; otherwise skip
          const raw = row[column];
          let key: string | null;
          if (raw === null) key = include_na ? "null" : null;
          else if (raw === undefined) key = include_na ? "undefined" : null;
          else key = String(raw);
          if (key !== null && !seen.has(key)) {
            seen.add(key);
            out.push(key);
          }
        }
        return out;
      })();

    // Build rows
    const out: Record<string, unknown>[] = [];
    for (const row of df) {
      const r: Record<string, unknown> = { ...row };

      const raw = row[column];
      const key = raw === null
        ? "null"
        : raw === undefined
        ? "undefined"
        : String(raw);

      for (const category of cats) {
        const name = `${prefix}${category}${suffix}`;
        r[name] = key === category;
      }

      if (drop_original) delete r[String(column)];

      out.push(r);
    }

    // Validate expected_categories if provided
    if (expected_categories) {
      const actualCats = new Set<string>();
      for (const row of df) {
        const raw = row[column];
        const key = raw === null
          ? (include_na ? "null" : null)
          : raw === undefined
          ? (include_na ? "undefined" : null)
          : String(raw);
        if (key !== null) actualCats.add(key);
      }

      const expectedSet = new Set(expected_categories);
      const actualArray = Array.from(actualCats).sort();
      const expectedArray = Array.from(expectedSet).sort();

      // Check if expected_categories contains all actual categories
      // Extra expected categories are allowed (e.g., auto-injected NA categories)
      const missing = actualArray.filter((c) => !expectedSet.has(c));
      if (missing.length > 0) {
        let errorMsg = `Dummy column validation failed:\n`;
        errorMsg += `  expected_categories must contain all unique values in '${
          String(column)
        }' column.\n`;
        errorMsg += `  Categories not found in expected_categories: [${
          missing.join(", ")
        }]\n`;
        errorMsg += `  You provided: [${expectedArray.join(", ")}]\n`;
        errorMsg += `  Actual values in '${String(column)}' column: [${
          actualArray.join(", ")
        }]`;
        throw new Error(errorMsg);
      }
    }

    const result = createDataFrame(out) as unknown as DataFrame<
      Prettify<Row & Record<string, boolean>>
    >;

    // Preserve groups if they exist (column-only operation)
    const groupedDf = df as GroupedDataFrame<Row, keyof Row>;
    // Return `any` from the function so it lines up with both overloads
    // deno-lint-ignore no-explicit-any
    return groupedDf.__groups ? withGroups(groupedDf, result) : (result as any);
  };
}
