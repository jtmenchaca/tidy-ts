import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Minimal reproduction
const df = createDataFrame([
  { id: "P1", code: "A", date: "2025-01-01" },
  { id: "P1", code: "A", date: "2025-02-01" },
  { id: "P1", code: "B", date: "2025-03-01" },
  { id: "P2", code: "A", date: "2025-04-01" },
]);

const chain = df
  // deno-lint-ignore no-explicit-any
  .filter((r: any) => r.code === "A")
  // deno-lint-ignore no-explicit-any
  .mutate({ _dateStr: (r: any) => r.date });

// Inspect the group proxy's column data
const grouped = chain.groupBy("id");
const result = grouped.summarize({
  // deno-lint-ignore no-explicit-any
  value: (g: any) => {
    const col = g._dateStr;
    console.log("column type:", typeof col, "isArray:", Array.isArray(col));
    console.log("column value:", JSON.stringify(col));
    console.log("column length:", col?.length);
    if (col && col.length > 0) {
      console.log("first element type:", typeof col[0], "value:", col[0]);
    }
    try {
      const u = s.unique(col);
      console.log("unique result:", u);
      return u.length;
    } catch (e) {
      console.log("unique error:", (e as Error).message);
      return -1;
    }
  },
});
console.log([...result]);
