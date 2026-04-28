import { createRequire } from "node:module";
import process from "node:process";
import { usingNativeBackend, wasmInternal } from "../../dataframe/ts/wasm/wasm-init.ts";
import { arrange_multi_f64_wasm } from "../../dataframe/ts/wasm/sorting-functions.ts";

const N = 500_000;
const WARMUP = 3;
const TRIALS = 5;

console.log("Backend:", usingNativeBackend() ? "NATIVE" : "WASM");

const flat = new Float64Array(N);
for (let i = 0; i < N; i++) flat[i] = Math.random() * 1000;
const dirs = new Int8Array([1]);

// Load native directly for comparison
const suffix = `${process.platform}-${process.arch}`;
const req = createRequire(import.meta.url);
const native = req(`@tidy-ts/dataframe-${suffix}`);

// Warmup all paths
for (let i = 0; i < WARMUP; i++) {
  native.arrangeMultiF64Napi(flat, N, 1, [1]);
  const outIdx = new Uint32Array(N);
  arrange_multi_f64_wasm(flat, N, 1, dirs, outIdx);
}

// 1. Direct napi call
let times: number[] = [];
for (let i = 0; i < TRIALS; i++) {
  const t = performance.now();
  native.arrangeMultiF64Napi(flat, N, 1, [1]);
  times.push(performance.now() - t);
}
times.sort((a, b) => a - b);
console.log(`  Direct napi:                ${times[Math.floor(times.length / 2)].toFixed(2)}ms`);

// 2. Through wasmInternal proxy only
times = [];
for (let i = 0; i < TRIALS; i++) {
  const outIdx = new Uint32Array(N);
  const t = performance.now();
  const result = wasmInternal.arrange_multi_f64_wasm(flat, N, 1, dirs, outIdx);
  if (result) outIdx.set(result);
  times.push(performance.now() - t);
}
times.sort((a, b) => a - b);
console.log(`  Through wasmInternal proxy: ${times[Math.floor(times.length / 2)].toFixed(2)}ms`);

// 3. Through full sorting-functions wrapper
times = [];
for (let i = 0; i < TRIALS; i++) {
  const outIdx = new Uint32Array(N);
  const t = performance.now();
  arrange_multi_f64_wasm(flat, N, 1, dirs, outIdx);
  times.push(performance.now() - t);
}
times.sort((a, b) => a - b);
console.log(`  Through sorting-functions:  ${times[Math.floor(times.length / 2)].toFixed(2)}ms`);

// 4. Through proxy with manual Int8Array → Array conversion (simulating what proxy does)
times = [];
for (let i = 0; i < TRIALS; i++) {
  const t = performance.now();
  native.arrangeMultiF64Napi(flat, N, 1, Array.from(dirs));
  times.push(performance.now() - t);
}
times.sort((a, b) => a - b);
console.log(`  Direct napi + Array.from:   ${times[Math.floor(times.length / 2)].toFixed(2)}ms`);
