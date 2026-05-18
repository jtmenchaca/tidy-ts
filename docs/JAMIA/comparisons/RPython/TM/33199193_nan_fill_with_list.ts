/**
 * RPython SO#33199193 — How to fill DataFrame NaN values with empty list []
 * Effect: Crash
 * Bug class: Nullable type
 *
 * Python bug: A column contains lists in some rows and NaN in others. Calling
 * df.fillna([]) crashes: "TypeError: Invalid 'to_replace' type: 'float'" because
 * pandas fillna doesn't support filling with a list value — the NaN is float type
 * and can't be replaced with a list through the standard API.
 *
 * In tidy-ts, if a column has type number[][] | null, the null must be handled
 * explicitly. Operations requiring strict number[][] catch the nullable type.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { date: "2011-04-23", ids: [0, 1, 2, 3] as number[] | null },
  { date: "2011-04-24", ids: [0, 1, 2, 3] as number[] | null },
  { date: "2011-04-25", ids: [0, 1, 2, 3] as number[] | null },
  { date: "2011-04-26", ids: null as number[] | null },
  { date: "2011-04-27", ids: [0, 1, 2, 3] as number[] | null },
]);

// The SO user's intent: fill NaN values in the ids column with [].
// pandas crashes because fillna doesn't handle list replacement.
// tidy-ts: the ids column is number[] | null. Accessing .length on it requires
// handling the null case — the type system forces explicit null handling.
// @ts-expect-error — 'ids' is possibly 'null'
df.mutate({ count: (r) => r.ids.length });
