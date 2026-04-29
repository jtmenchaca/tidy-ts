import { createDataFrame } from "@tidy-ts/dataframe";

const N = 100_000;
const rows = Array.from({ length: N }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);

// Warmup
for (let w = 0; w < 20; w++) df.filter((r: any) => r.x > 50).mutate({ z: (r: any) => r.x + r.y });

// Single profiled run
(globalThis as any).__TIDY_PROFILE = true;
console.log("\n=== Profiled filter→mutate ===");
let t = performance.now();
const filtered = df.filter((r: any) => r.x > 50);
console.log(`WALL filter: ${(performance.now() - t).toFixed(4)}ms`);
t = performance.now();
const result = filtered.mutate({ z: (r: any) => r.x + r.y });
console.log(`WALL mutate: ${(performance.now() - t).toFixed(4)}ms`);
(globalThis as any).__TIDY_PROFILE = false;

// Now measure just the overhead pieces
const ITERS = 100;
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// nrows() call on filtered view
const t1: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  filtered.nrows();
  t1.push(performance.now() - t0);
}
console.log(`\nnrows() on filtered: ${median(t1).toFixed(4)}ms`);

// tracer overhead
const { tracer } = await import("../../dataframe/ts/telemetry/tracer.ts");
const t2: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  const span = tracer.startSpan(filtered, "test", {});
  tracer.endSpan(filtered, span);
  t2.push(performance.now() - t0);
}
console.log(`tracer.startSpan+endSpan: ${median(t2).toFixed(4)}ms`);

// shouldUseAsyncForMutate overhead
const { shouldUseAsyncForMutate } = await import("../../dataframe/ts/promised-dataframe/index.ts");
const spec = { z: (r: any) => r.x + r.y };
const t2b: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  shouldUseAsyncForMutate(filtered as any, spec);
  t2b.push(performance.now() - t0);
}
console.log(`shouldUseAsyncForMutate: ${median(t2b).toFixed(4)}ms`);

// Proxy access overhead
const t3: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const api = filtered as any;
  const t0 = performance.now();
  const _store = api.__store;
  const _view = api.__view;
  const _row = api.__rowView;
  const _groups = api.__groups;
  t3.push(performance.now() - t0);
}
console.log(`proxy access (store+view+row+groups): ${median(t3).toFixed(4)}ms`);

// Full mutate call (includes verb dispatch overhead)
const t5: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  filtered.mutate({ z: (r: any) => r.x + r.y });
  t5.push(performance.now() - t0);
}
console.log(`\nfull filtered.mutate() median: ${median(t5).toFixed(4)}ms`);

// Direct mutateSyncImpl call (bypasses Proxy + resolveVerb + shouldUseAsync)
const { mutateSyncImpl } = await import("../../dataframe/ts/verbs/transformation/mutate/mutate-sync.ts");
const t6: number[] = [];
for (let i = 0; i < ITERS; i++) {
  const t0 = performance.now();
  mutateSyncImpl(filtered, { z: (r: any) => r.x + r.y });
  t6.push(performance.now() - t0);
}
console.log(`direct mutateSyncImpl() median: ${median(t6).toFixed(4)}ms`);
console.log(`verb dispatch overhead: ${(median(t5) - median(t6)).toFixed(4)}ms`);
