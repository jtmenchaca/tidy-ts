import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { g: "a", x: 1 },
  { g: "a", x: 2 },
  { g: "b", x: 10 },
  { g: "b", x: 20 },
]);

// Per agent's repro:
const out = df.groupBy("g").summarize({
  first_x: (group) => s.first(group.x),
  max_x:   (group) => s.max(group.x),
});

console.log("first_x runtime:", out.first_x);
console.log("max_x runtime:  ", out.max_x);

// Type checks: do these compile?
const z1: number = (out.first_x[0] ?? 0) + 1;
const z2: number = (out.max_x[0] ?? 0) + 1;
console.log("z1:", z1, "z2:", z2);

// Compare to direct use
const literal: number | null = s.first([1, 2, 3]);
console.log("s.first([1,2,3]):", literal);
