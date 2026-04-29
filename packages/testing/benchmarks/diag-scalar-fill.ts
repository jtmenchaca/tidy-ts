#!/usr/bin/env -S deno run -A
const N = 500_000;
const ITERS = 50;
const WARMUP = 10;

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function bench(label: string, fn: () => void) {
  for (let i = 0; i < WARMUP; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < ITERS; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }
  console.log(`  ${label}: ${median(times).toFixed(4)}ms`);
}

// 1. new Array(N).fill(42)
bench("new Array(N).fill(42)", () => { new Array(N).fill(42); });

// 2. Array.from({length: N}, () => 42)
bench("Array.from(() => 42)", () => { Array.from({length: N}, () => 42); });

// 3. Float64Array(N).fill(42)
bench("Float64Array(N).fill(42)", () => { new Float64Array(N).fill(42); });

// 4. napi mutate_fill_scalar
import { mutate_fill_scalar } from "../../dataframe/ts/wasm/sorting-functions.ts";
bench("napi mutate_fill_scalar", () => { mutate_fill_scalar(N, 42); });

// 5. Pre-allocated Array, manual loop
bench("manual loop", () => {
  const out = new Array(N);
  for (let i = 0; i < N; i++) out[i] = 42;
});
