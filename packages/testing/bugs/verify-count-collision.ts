import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { name: "a", count: 5 },
  { name: "b", count: 7 },
  { name: "c", count: 3 },
]);

console.log("=== Finding 1: df.count column access ===");
console.log("typeof df.count:        ", typeof df.count);
console.log("Array.isArray(df.count):", Array.isArray(df.count));
console.log("df.count:               ", df.count);

console.log("\n=== inside summarize ===");
const summed = df.summarize({
  total: (g) => s.sum(g.count),
});
console.log("sum of count inside summarize:", summed.toRows());

console.log("\n=== Finding 2: GLM with 'count' response ===");
const numeric = createDataFrame([
  { count: 1, x: 1 },
  { count: 2, x: 2 },
  { count: 3, x: 3 },
  { count: 4, x: 4 },
  { count: 5, x: 5 },
]);
try {
  const model = s.glm({
    formula: "count ~ x",
    family: "poisson",
    link: "log",
    data: numeric,
  });
  console.log("GLM succeeded. coefficients:", model.coefficients);
} catch (e) {
  console.log("GLM failed:", String(e).slice(0, 300));
}
