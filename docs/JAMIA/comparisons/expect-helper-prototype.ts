import { createDataFrame, type DataFrame, type GroupedDataFrame } from "@tidy-ts/dataframe";

type IsExact<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? (<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2)
      ? true
      : false
    : false;

type RowOf<T> = T extends DataFrame<infer R> ? R : never;

// Strategy: assert via assignment — the type resolves to true when correct,
// false when wrong. We assign to a `true` variable to get the error at the usage site.
type ExpectDataFrameRow<T, Expected extends object> = IsExact<RowOf<T>, Expected>;

// Test it
type BaseRow = { name: string; age: number; city: string; score: number };
const df = createDataFrame([
  { name: "Alice", age: 25, city: "NYC", score: 90 },
]);

// Should pass — assign true to const expecting true
const _ok1: ExpectDataFrameRow<typeof df, BaseRow> = true;

// Should fail
// @ts-expect-error — resolves to false, can't assign true
const _bad1: ExpectDataFrameRow<typeof df, { name: string }> = true;

const filtered = df.filter((r) => r.age > 25);
const _ok2: ExpectDataFrameRow<typeof filtered, BaseRow> = true;

const selected = df.select("name", "age");
const _ok3: ExpectDataFrameRow<typeof selected, { name: string; age: number }> = true;

// Should fail — wrong expected type
// @ts-expect-error
const _bad2: ExpectDataFrameRow<typeof selected, BaseRow> = true;
