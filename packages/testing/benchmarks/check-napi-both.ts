import { createRequire } from "node:module";
import process from "node:process";

const N = 500_000;
const WARMUP = 3;
const TRIALS = 10;

const suffix = `${process.platform}-${process.arch}`;
const req = createRequire(import.meta.url);

// Load via package name
let nativePackage: Record<string, Function> | null = null;
try {
  nativePackage = req(`@tidy-ts/dataframe-${suffix}`);
  console.log("Loaded via package name");
} catch (e: unknown) {
  console.log("Package name failed:", (e as Error).message?.slice(0, 80));
}

// Load via direct path
const directPath = "/Users/jtmenchaca/tidy-ts/packages/dataframe/lib/tidy_ts_dataframe.darwin-arm64.node";
const nativeDirect = req(directPath);
console.log("Loaded via direct path");

const flat = new Float64Array(N);
for (let i = 0; i < N; i++) flat[i] = Math.random() * 1000;
const dirs = [1];

function bench(label: string, native: Record<string, Function>) {
  for (let i = 0; i < WARMUP; i++) {
    native.arrangeMultiF64Napi(flat, N, 1, dirs);
  }
  const times: number[] = [];
  for (let i = 0; i < TRIALS; i++) {
    const t = performance.now();
    native.arrangeMultiF64Napi(flat, N, 1, dirs);
    times.push(performance.now() - t);
  }
  times.sort((a: number, b: number) => a - b);
  console.log(`  ${label}: median=${times[Math.floor(times.length / 2)].toFixed(2)}ms  min=${times[0].toFixed(2)}ms`);
}

if (nativePackage) bench("Package name", nativePackage);
bench("Direct path ", nativeDirect);
// Run package again to see if order matters
if (nativePackage) bench("Package (2nd)", nativePackage);
