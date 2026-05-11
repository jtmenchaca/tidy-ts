// deno-lint-ignore-file no-explicit-any
import { createDataFrame, withGroups } from "../../dataframe/index.ts";
import { throwColumnNotFound } from "../../utilities/errors.ts";

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
 */
export function dummy_col(column: any, opts: {
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

  return (df: any) => {
    if (df.nrows() === 0) return createDataFrame([]);

    const store = df.__store;
    if (store && store.length > 0 && !(String(column) in store.columns)) {
      throwColumnNotFound(String(column), store.columnNames);
    }

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
          const raw = (row as any)[column];
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
      const r: Record<string, unknown> = { ...(row as any) };

      const raw = (row as any)[column];
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
        const raw = (row as any)[column];
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

    const result = createDataFrame(out) as any;

    // Preserve groups if they exist (column-only operation)
    const groupedDf = df as any;
    return groupedDf.__groups ? withGroups(groupedDf, result) : result;
  };
}
