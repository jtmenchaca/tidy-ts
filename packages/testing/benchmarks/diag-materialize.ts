import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const ITERS = 100;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);

// Test 1: filter with rawMask path, then mutate
for (let w = 0; w < 10; w++) df.filter((r: any) => r.x > 50).mutate({ z: (r: any) => r.x + r.y });
const t1: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  df.filter((r: any) => r.x > 50).mutate({ z: (r: any) => r.x + r.y });
  t1.push(performance.now() - t);
}
console.log(`filter+mutate:  ${median(t1).toFixed(3)}ms`);

// Test 2: Just filter
for (let w = 0; w < 10; w++) df.filter((r: any) => r.x > 50);
const t2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  df.filter((r: any) => r.x > 50);
  t2.push(performance.now() - t);
}
console.log(`filter only:    ${median(t2).toFixed(3)}ms`);

// Test 3: Pre-filter, then mutate on existing view
const filtered = df.filter((r: any) => r.x > 50);
console.log(`Filtered rows: ${filtered.nrows()}`);
for (let w = 0; w < 10; w++) filtered.mutate({ z: (r: any) => r.x + r.y });
const t3: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t = performance.now();
  filtered.mutate({ z: (r: any) => r.x + r.y });
  t3.push(performance.now() - t);
}
console.log(`mutate on view: ${median(t3).toFixed(3)}ms`);
console.log(`\nImplied filter cost: ${(median(t1) - median(t3)).toFixed(3)}ms`);
console.log(`Polars filter→mutate: 0.068ms`);
