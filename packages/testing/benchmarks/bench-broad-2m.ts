#!/usr/bin/env -S deno run -A --no-check
/**
 * Broad tidy-ts benchmark at 2M rows.
 * Covers: creation, filter, select, sort, mutate, distinct, groupBy,
 *         summarise, innerJoin, leftJoin, pivotLonger, bindRows, stats
 */
import { createDataFrame, stats } from "@tidy-ts/dataframe";

const N = 2_000_000;
const ITERS = 10;
const WARMUP = 5;

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function bench(label: string, fn: () => unknown): number {
  for (let i = 0; i < WARMUP; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }
  const med = median(times);
  return med;
}

console.log(`\n=== Broad Benchmark (${(N/1e6).toFixed(0)}M rows, ${ITERS} iters, ${WARMUP} warmup) ===\n`);

// Generate data
console.log("Generating data...");
const t0 = performance.now();
const data = Array.from({ length: N }, (_, i) => ({
  id: i + 1,
  value: Math.random() * 1000,
  category: `cat_${i % 20}`,
  score: Math.random() * 100,
  active: i % 3 === 0,
}));
console.log(`  Data generated: ${(performance.now() - t0).toFixed(0)}ms`);

// Prebuild
console.log("Building DataFrame...");
const t1 = performance.now();
const df = createDataFrame(data);
console.log(`  DataFrame built: ${(performance.now() - t1).toFixed(0)}ms\n`);

// Join data
const joinRight = createDataFrame(
  Array.from({ length: Math.floor(N * 0.8) }, (_, i) => ({
    id: Math.floor(Math.random() * N) + 1,
    value_b: Math.random() * 1000,
    status: ["active", "pending", "complete"][i % 3],
  }))
);

// Split data for bindRows
const half = Math.floor(N / 2);
const df1 = createDataFrame(data.slice(0, half));
const df2 = createDataFrame(data.slice(half));

// Pivot data
const pivotData = createDataFrame(
  Array.from({ length: N }, (_, i) => ({
    id: i + 1,
    region: `region_${i % 5}`,
    product: `product_${i % 10}`,
    q1: Math.floor(Math.random() * 1000),
    q2: Math.floor(Math.random() * 1000),
    q3: Math.floor(Math.random() * 1000),
    q4: Math.floor(Math.random() * 1000),
  }))
);

const results: { op: string; ms: number }[] = [];

function run(label: string, fn: () => unknown) {
  const ms = bench(label, fn);
  results.push({ op: label, ms });
  console.log(`  ${label.padEnd(30)} ${ms.toFixed(3)}ms`);
}

// 1. Creation
run("creation", () => createDataFrame(data));

// 2. Filter (numeric)
run("filter (numeric)", () => df.filter((r) => r.value > 500));

// 3. Filter (string)
run("filter (string)", () => df.filter((r) => r.category === "cat_5"));

// 4. Filter (complex)
run("filter (complex)", () => df.filter((r) => r.value > 300 && r.score > 50 && r.active));

// 5. Select
run("select", () => df.select("id", "value", "category"));

// 6. Sort (numeric)
run("sort (numeric)", () => df.arrange("value", "asc"));

// 7. Sort (string)
run("sort (string)", () => df.arrange("category", "asc"));

// 8. Sort (multi-col)
run("sort (multi-col)", () => df.arrange(["category", "value"], ["asc", "desc"]));

// 9. Mutate (col/scalar)
run("mutate (col/scalar)", () => df.mutate({ score_pct: (r) => r.score / 100 }));

// 10. Mutate (col+col)
run("mutate (col+col)", () => df.mutate({ total: (r) => r.value + r.score }));

// 11. Mutate (string)
run("mutate (string upper)", () => df.mutate({ cat_upper: (r) => r.category.toUpperCase() }));

// 12. Mutate (scalar)
run("mutate (scalar)", () => df.mutate({ constant: 42 }));

// 13. Distinct
run("distinct", () => df.distinct("id", "value", "category"));

// 14. GroupBy (single)
run("groupBy (single)", () => df.groupBy("category"));

// 15. GroupBy (multi)
run("groupBy (multi)", () => df.groupBy("category", "active"));

// 16. Summarise (ungrouped)
run("summarise (ungrouped)", () =>
  df.summarise({
    count: (g) => g.nrows(),
    avg_value: (g) => stats.mean(g.value),
    total_value: (g) => stats.sum(g.value),
  })
);

// 17. Summarise (grouped)
run("summarise (grouped)", () =>
  df.groupBy("category").summarise({
    count: (g) => g.nrows(),
    avg_value: (g) => stats.mean(g.value),
    total_value: (g) => stats.sum(g.value),
  })
);

// 18. Inner Join
run("innerJoin", () => df.select("id", "value").innerJoin(joinRight, "id"));

// 19. Left Join
run("leftJoin", () => df.select("id", "value").leftJoin(joinRight, "id"));

// 20. Pivot Longer
run("pivotLonger", () =>
  pivotData.pivotLonger({
    cols: ["q1", "q2", "q3", "q4"],
    namesTo: "quarter",
    valuesTo: "sales",
  })
);

// 21. Bind Rows
run("bindRows", () => df1.bindRows(df2));

// 22. Stats
run("stats", () => {
  const values = df.value as number[];
  stats.sum(values);
  stats.mean(values);
  stats.median(values);
  stats.variance(values);
  stats.stdev(values);
});

console.log("\nDone.");
