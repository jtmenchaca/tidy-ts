import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const ITERS = 50;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);

// Warmup
for (let w = 0; w < 10; w++) df.filter((r: any) => r.x > 50);

// 1. Filter only
const timesFilter: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  df.filter((r: any) => r.x > 50);
  timesFilter.push(performance.now() - t);
}
console.log(`filter only (r.x > 50):   ${median(timesFilter).toFixed(3)}ms`);

// 2. Run one iteration with profiling to see breakdown
(globalThis as any).__TIDY_PROFILE = true;
console.log("\n--- Profile one filter call ---");
df.filter((r: any) => r.x > 50);
console.log("\n--- Profile one filter+mutate call ---");
df.filter((r: any) => r.x > 50).mutate({ z: (r: any) => r.x + r.y });
(globalThis as any).__TIDY_PROFILE = false;

// 3. Filter + mutate
const filtered = df.filter((r: any) => r.x > 50);
for (let w = 0; w < 10; w++) filtered.mutate({ z: (r: any) => r.x + r.y });

const timesMutateOnView: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  filtered.mutate({ z: (r: any) => r.x + r.y });
  timesMutateOnView.push(performance.now() - t);
}
console.log(`\nmutate-on-view (x+y):     ${median(timesMutateOnView).toFixed(3)}ms`);

const timesBoth: number[] = [];
for (let w = 0; w < 10; w++) df.filter((r: any) => r.x > 50).mutate({ z: (r: any) => r.x + r.y });
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  df.filter((r: any) => r.x > 50).mutate({ z: (r: any) => r.x + r.y });
  timesBoth.push(performance.now() - t);
}
console.log(`filter+mutate (x+y):      ${median(timesBoth).toFixed(3)}ms`);
console.log(`Polars filter→mutate:     0.068ms`);
