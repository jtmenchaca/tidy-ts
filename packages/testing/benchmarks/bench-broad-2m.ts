#!/usr/bin/env -S deno run -A --no-check
/**
 * Broad tidy-ts benchmark at 2M rows.
 * Covers: creation, filter, select, sort, mutate, distinct, groupBy,
 *         summarise, innerJoin, leftJoin, pivotLonger, bindRows, stats
 *
 * Prints a 3-way comparison table (tidy-ts vs Polars vs pandas).
 * Re-run bench-broad-2m.py to update the reference numbers below.
 */
import { createDataFrame, stats } from "@tidy-ts/dataframe";

const N = 2_000_000;
const ITERS = 10;
const WARMUP = 5;

// Reference medians from bench-broad-2m.py (2M rows, 10 iters, 5 warmup)
// Re-run: python3 packages/testing/benchmarks/bench-broad-2m.py
const POLARS: Record<string, number> = {
  "creation": 55.883,
  "filter (numeric)": 1.728,
  "filter (string)": 1.326,
  "filter (complex)": 1.489,
  "select": 0.037,
  "sort (numeric)": 72.893,
  "sort (string)": 95.259,
  "sort (multi-col)": 216.636,
  "mutate (col/scalar)": 1.969,
  "mutate (col+col)": 2.127,
  "mutate (string upper)": 39.760,
  "mutate (scalar)": 0.013,
  "distinct": 87.022,
  "groupBy (single)": 3.982,
  "groupBy (multi)": 11.251,
  "summarise (ungrouped)": 0.451,
  "summarise (grouped)": 19.398,
  "innerJoin": 54.833,
  "leftJoin": 68.612,
  "pivotLonger": 45.331,
  "bindRows": 0.036,
  "stats": 8.503,
};

const PANDAS: Record<string, number> = {
  "creation": 126.866,
  "filter (numeric)": 15.518,
  "filter (string)": 10.548,
  "filter (complex)": 7.514,
  "select": 0.189,
  "sort (numeric)": 301.104,
  "sort (string)": 470.756,
  "sort (multi-col)": 854.214,
  "mutate (col/scalar)": 0.835,
  "mutate (col+col)": 0.959,
  "mutate (string upper)": 21.248,
  "mutate (scalar)": 0.695,
  "distinct": 419.233,
  "groupBy (single)": 23.618,
  "groupBy (multi)": 37.184,
  "summarise (ungrouped)": 5.097,
  "summarise (grouped)": 33.479,
  "innerJoin": 278.515,
  "leftJoin": 276.623,
  "pivotLonger": 41.450,
  "bindRows": 1.281,
  "stats": 38.808,
};

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
  return median(times);
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

// ── 3-way comparison table ──
const pad = (s: string, n: number) => s.padEnd(n);
const rpad = (s: string, n: number) => s.padStart(n);

// Collect rows with delta for sorting
const rows: { op: string; ms: number; pl: number; pd: number; deltaPolars: number; deltaPandas: number }[] = [];
let totalTidy = 0, totalPolars = 0, totalPandas = 0;

for (const { op, ms } of results) {
  const pl = POLARS[op] ?? 0;
  const pdMs = PANDAS[op] ?? 0;
  totalTidy += ms;
  totalPolars += pl;
  totalPandas += pdMs;
  rows.push({ op, ms, pl, pd: pdMs, deltaPolars: ms - pl, deltaPandas: ms - pdMs });
}

// Sort by Δ vs Polars descending — biggest time gaps first
const sorted = [...rows].sort((a, b) => b.deltaPolars - a.deltaPolars);

const W = 100;
console.log(`\n${"─".repeat(W)}`);
console.log(`  ${pad("Operation", 30)} ${rpad("tidy-ts", 10)} ${rpad("Polars", 10)} ${rpad("pandas", 10)} ${rpad("Δ Polars", 10)} ${rpad("Δ pandas", 10)} ${rpad("vs Polars", 10)} ${rpad("vs pandas", 10)}`);
console.log(`${"─".repeat(W)}`);

for (const { op, ms, pl, pd, deltaPolars, deltaPandas } of sorted) {
  const fmtDelta = (d: number) => {
    const sign = d >= 0 ? "+" : "";
    return `${sign}${d.toFixed(1)}ms`;
  };
  const vsPolars = pl > 0 ? `${(ms / pl).toFixed(1)}x` : "—";
  const vsPandas = pd > 0 ? `${(ms / pd).toFixed(1)}x` : "—";

  console.log(
    `  ${pad(op, 30)} ${rpad(ms.toFixed(1) + "ms", 10)} ${rpad(pl.toFixed(1) + "ms", 10)} ${rpad(pd.toFixed(1) + "ms", 10)} ${rpad(fmtDelta(deltaPolars), 10)} ${rpad(fmtDelta(deltaPandas), 10)} ${rpad(vsPolars, 10)} ${rpad(vsPandas, 10)}`
  );
}

console.log(`${"─".repeat(W)}`);
const fmtTotalDelta = (d: number) => `${d >= 0 ? "+" : ""}${d.toFixed(1)}ms`;
console.log(
  `  ${pad("TOTAL", 30)} ${rpad(totalTidy.toFixed(1) + "ms", 10)} ${rpad(totalPolars.toFixed(1) + "ms", 10)} ${rpad(totalPandas.toFixed(1) + "ms", 10)} ${rpad(fmtTotalDelta(totalTidy - totalPolars), 10)} ${rpad(fmtTotalDelta(totalTidy - totalPandas), 10)} ${rpad((totalTidy / totalPolars).toFixed(1) + "x", 10)} ${rpad((totalTidy / totalPandas).toFixed(1) + "x", 10)}`
);

console.log("\nDone.");
