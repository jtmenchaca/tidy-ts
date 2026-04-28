/**
 * Profile where time is spent in arrange() pipeline.
 * Isolates: column coercion, Rust sort, column gather, full arrange.
 *
 * Run with: deno run -A packages/testing/benchmarks/bench-arrange-profile.ts
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { usingNativeBackend } from "../../dataframe/ts/wasm/wasm-init.ts";
import {
  arrange_multi_f64_wasm,
} from "../../dataframe/ts/wasm/wasm-loader.ts";

const N = 500_000;
const TRIALS = 10;
const WARMUP = 3;
const backend = usingNativeBackend() ? "NATIVE" : "WASM";
// Force WASM for raw sort profiling (napi has different arg signatures for arrange_multi)
const forceWasm = Deno.env.get("TIDY_TS_NATIVE") === "0";
console.log(
  `\nProfiling arrange pipeline — ${N.toLocaleString()} rows, ${backend}\n`,
);

// Build data
const numericData = Array.from({ length: N }, () => ({
  value: Math.random() * 1000,
}));
const df = createDataFrame(numericData);
// deno-lint-ignore no-explicit-any
const store = (df as any).__store;
const col = store.columns.value as number[];

function avg(fn: () => void): number {
  for (let i = 0; i < WARMUP; i++) fn();
  let total = 0;
  for (let i = 0; i < TRIALS; i++) {
    const t = performance.now();
    fn();
    total += performance.now() - t;
  }
  return total / TRIALS;
}

// --- Phase 1: Column extraction + coercion to Float64Array ---
const coercionTime = avg(() => {
  const flat = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const v = col[i];
    flat[i] = v == null ? Number.NaN : typeof v === "number" ? v : Number.NaN;
  }
});
console.log(`  1. Coerce col → Float64Array:  ${coercionTime.toFixed(2)}ms`);

// Pre-build for remaining tests
const flat = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const v = col[i];
  flat[i] = v == null ? Number.NaN : typeof v === "number" ? v : Number.NaN;
}
const dirs = new Int8Array([1]);

// --- Phase 2: Rust sort only ---
const outIdx = new Uint32Array(N);
const sortTime = avg(() => {
  arrange_multi_f64_wasm(flat, N, 1, dirs, outIdx);
});
console.log(`  2. Rust sort (${backend}):        ${sortTime.toFixed(2)}ms`);

// --- Phase 3: Gather columns by sorted index ---
const gatherTime = avg(() => {
  for (const [_name, colData] of Object.entries(store.columns)) {
    const src = colData as unknown[];
    const dst = new Array(N);
    for (let i = 0; i < N; i++) {
      dst[i] = src[outIdx[i]];
    }
  }
});
console.log(`  3. Gather cols by index:       ${gatherTime.toFixed(2)}ms`);

// --- Phase 4: Full .arrange() ---
const fullTime = avg(() => {
  df.arrange("value", "asc");
});
console.log(`  4. Full df.arrange():          ${fullTime.toFixed(2)}ms`);

const sum123 = coercionTime + sortTime + gatherTime;
console.log(`\n  Sum of phases 1+2+3:           ${sum123.toFixed(2)}ms`);
console.log(
  `  Unaccounted (DF overhead):     ${(fullTime - sum123).toFixed(2)}ms`,
);
console.log(`\n  Polars pure sort (pre-built):  ~18ms`);
