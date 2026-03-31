import { createDataFrame } from "@tidy-ts/dataframe";

const N = 500_000;
const ITERATIONS = 5;
const WARMUP = 3;

const rows = Array.from({ length: N }, (_, i) => ({
  quantity: Math.random() * 100,
  price: Math.random() * 50,
  tax: Math.random() * 10,
  score: Math.random() * 100,
}));
const df = createDataFrame(rows);

function measure(name: string, fn: () => void) {
  for (let i = 0; i < WARMUP; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  console.log(`  ${name}: ${median.toFixed(2)}ms (median of ${ITERATIONS})`);
  return median;
}

console.log(`\nMutate benchmark — ${N.toLocaleString()} rows\n`);

console.log("JIT-eligible (polynomial arithmetic):");
measure("r.quantity * r.price", () => df.mutate({ rev: (r: any) => r.quantity * r.price }));
measure("r.quantity * r.price + r.tax", () => df.mutate({ rev: (r: any) => r.quantity * r.price + r.tax }));
measure("r.quantity * r.quantity", () => df.mutate({ rev: (r: any) => r.quantity * r.quantity }));
measure("3 * r.quantity - 2 * r.price", () => df.mutate({ rev: (r: any) => 3 * r.quantity - 2 * r.price }));

console.log("\nFallback (non-polynomial):");
measure("r.score / 100", () => df.mutate({ pct: (r: any) => r.score / 100 }));
measure("Math.log(r.quantity + 1)", () => df.mutate({ log: (r: any) => Math.log(r.quantity + 1) }));
measure("r.quantity > 50 ? r.price : 0", () => df.mutate({ v: (r: any) => r.quantity > 50 ? r.price : 0 }));

console.log("\nGrouped:");
const gdf = df.mutate({ region: (r: any, i: number) => ["N", "S", "E", "W"][i % 4] }).groupBy("region");
measure("grouped r.quantity * r.price", () => gdf.mutate({ rev: (r: any) => r.quantity * r.price }));
