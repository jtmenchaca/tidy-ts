/**
 * RPython SO#33692532 — Pandas error "Can only use .str accessor with string values"
 * Effect: Crash
 * Bug class: Nullable type
 *
 * In pandas, .str accessor fails on columns containing NaN because the column
 * is object dtype with mixed string/NaN content.
 *
 * In tidy-ts, a nullable string column is typed as string|null. Calling string
 * methods without null-checking is a compile-time error.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { data: "100M" as string | null },
  { data: "5M" },
  { data: "75M" },
  { data: null },
  { data: "90M" },
]);

// @ts-expect-error — 'data' is possibly 'null'
const wrong = df.mutate({ num: (r) => r.data.match(/(\d+)/) });

// Fix: null-check first
const parsed = df.mutate({
  numeric: (r) => {
    if (r.data === null) return null;
    const match = r.data.match(/(\d+)/);
    return match ? parseFloat(match[1]) : null;
  },
});

parsed.print();
