import { usingNativeBackend } from "../../dataframe/ts/wasm/wasm-init.ts";
import {
  arrange_multi_f64_wasm,
} from "../../dataframe/ts/wasm/sorting-functions.ts";

// Set TIDY_TS_NATIVE=0 to force WASM for comparison
const forceWasm = Deno.env.get("TIDY_TS_NATIVE") === "0";

const N = 500_000;
const WARMUP = 3;
const TRIALS = 10;
const backend = usingNativeBackend() ? "NATIVE" : "WASM";
console.log(`Raw sort benchmark — ${N.toLocaleString()} rows, ${backend}\n`);

const flat = new Float64Array(N);
for (let i = 0; i < N; i++) flat[i] = Math.random() * 1000;
const dirs = new Int8Array([1]);

// Warmup (includes rayon thread pool init)
for (let i = 0; i < WARMUP; i++) {
  const outIdx = new Uint32Array(N);
  arrange_multi_f64_wasm(flat, N, 1, dirs, outIdx);
}

// Timed
const times: number[] = [];
for (let i = 0; i < TRIALS; i++) {
  const outIdx = new Uint32Array(N);
  const t = performance.now();
  arrange_multi_f64_wasm(flat, N, 1, dirs, outIdx);
  times.push(performance.now() - t);
}
times.sort((a, b) => a - b);
console.log(`  Raw sort (${backend}):`);
console.log(`    median: ${times[Math.floor(times.length / 2)].toFixed(2)}ms`);
console.log(`    min:    ${times[0].toFixed(2)}ms`);
console.log(`    max:    ${times[times.length - 1].toFixed(2)}ms`);
console.log(`    all:    [${times.map(t => t.toFixed(1)).join(", ")}]`);
