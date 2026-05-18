/**
 * RPython SO#47333227 — Pandas: ValueError: cannot convert float NaN to integer
 * Effect: Crash
 * Bug class: Nullable type
 *
 * In pandas, NaN in a column prevents astype(int) because NaN has no integer
 * representation. The user must filter nulls first.
 *
 * In tidy-ts, a column with nulls is typed as number | null. Operations
 * that require non-null values (like Math.round()) force the user to handle nulls.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { x: 1.0 as number | null, y: 10 },
  { x: 2.0, y: 20 },
  { x: null, y: 30 },
  { x: 4.0, y: 40 },
  { x: 5.0, y: 50 },
]);

// x is number | null — calling Math.round without null-check is an error
// @ts-expect-error — 'x' is possibly 'null'
const wrong = df.mutate({ x_int: (r) => Math.round(r.x) });

// Fix: handle nulls in the mutate
const fixed = df.mutate({ x_int: (r) => (r.x === null ? null : Math.round(r.x)) });
fixed.print();
