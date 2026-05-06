import { createDataFrame } from "@tidy-ts/dataframe";
import type { Prettify, Subset } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { name: "Alice", age: 25, city: "NYC", score: 85 },
  { name: "Bob", age: 30, city: "LA", score: 92 },
]);

// === IDENTITY PRETTIFY ===
// arrange uses Prettify<Row> — does it actually expand?
const arranged = df.arrange("age");

// filter uses bare Row (no Prettify) — compare
const filtered = df.filter((r) => r.age > 25);

// === BARE PICK / OMIT ===
// drop uses Prettify<Omit<Row, ColName>>
const dropped = df.drop("city");

// select uses Pick without Prettify (RowAfterSelect = Pick<Row, ColName>)
const selected = df.select("name", "age");

// Subset = Prettify<Pick<Type, Key>> — test directly
type TestSubset = Subset<{ a: number; b: string; c: boolean }, "a" | "b">;
const subsetVal: TestSubset = { a: 1, b: "x" };

// === INTERSECTION FLATTENING (the core use case) ===
// mutate uses Prettify<Row & { newCol: type }>
const mutated = df.mutate({ revenue: (r) => r.age * r.score });

// count uses Prettify<Pick<R, K> & { count: number }>
const counted = df.groupBy("city").count();

// === DOUBLE WRAPS ===
// pivotLonger: PivotLongerResult already Prettifies, then wrapped again
const pivoted = df.pivotLonger({ cols: ["age", "score"], namesTo: "metric", valuesTo: "value" });

// pivotWider: PivotWiderResult already Prettifies, then wrapped again
const pivotedWide = df.pivotWider({ namesFrom: "name", valuesFrom: "score" });

// === PRETTIFYDEEP ON STATS ===
import { chiSquareTest } from "@tidy-ts/dataframe";
const chiResult = chiSquareTest.independence({
  observed: [[10, 20], [30, 40]],
});
