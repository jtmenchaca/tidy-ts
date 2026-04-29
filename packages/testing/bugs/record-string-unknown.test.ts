// import { expect } from "@std/expect";
// import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// // Can we assign a typed DataFrame to DataFrame<Record<string, unknown>>?
// Deno.test("assign typed to Record<string, unknown>", () => {
//   const typed = createDataFrame([{ pat_id: "P001", name: "Alice" }]);
//   const _untyped: DataFrame<Record<string, unknown>> = typed;
// });

// // Can we reassign after mutate?
// Deno.test("reassign after mutate", () => {
//   const typed = createDataFrame([{ pat_id: "P001", name: "Alice" }]);
//   let df: DataFrame<Record<string, unknown>> = typed;
//   df = df.mutate({ b: 42 });
//   df = df.mutate({ c: "hello" });
//   expect(df.columns()).toContain("b");
//   expect(df.columns()).toContain("c");
// });

// // Can we leftJoin and reassign?
// Deno.test("leftJoin and reassign", () => {
//   const typed = createDataFrame([{ pat_id: "P001", name: "Alice" }]);
//   let df: DataFrame<Record<string, unknown>> = typed;
//   const other = createDataFrame([{ pat_id: "P001", count: 5 }]);
//   df = df.leftJoin(other, "pat_id");
//   expect(df.columns()).toContain("count");
// });

// // Can we chain mutate then reassign?
// Deno.test("chain mutate then reassign", () => {
//   const typed = createDataFrame([{ pat_id: "P001" }]);
//   let df: DataFrame<Record<string, unknown>> = typed;
//   df = df.mutate({ a: 1 }).mutate({ b: 2 });
//   expect(df.columns()).toContain("a");
//   expect(df.columns()).toContain("b");
// });
