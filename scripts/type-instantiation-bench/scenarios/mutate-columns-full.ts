import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([{ a: 1, b: 2, c: 3, d: 4, e: 5 }]);
const out = df.mutateColumns({
  colType: "number",
  columns: ["a", "b", "c", "d", "e"] as const,
  newColumns: [
    { prefix: "p1_", fn: (x: number) => x * 2 },
    { prefix: "p2_", fn: (x: number) => x + 1 },
    { prefix: "p3_", fn: (x: number) => x - 1 },
  ] as const,
});
export type T = typeof out;
