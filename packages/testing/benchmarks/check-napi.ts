import { createRequire } from "node:module";
import process from "node:process";

const suffix = `${process.platform}-${process.arch}`;
console.log("suffix:", suffix);

const req = createRequire(import.meta.url);

// Try the package name
try {
  const native = req(`@tidy-ts/dataframe-${suffix}`);
  console.log("Loaded via package name");
  console.log("Sort function type:", typeof native.arrangeMultiF64Napi);
} catch (e: unknown) {
  console.log("Package name failed:", (e as Error).message?.slice(0, 80));
}

// Try direct path to .node file
const nodePath =
  "/Users/jtmenchaca/tidy-ts/packages/dataframe/lib/tidy_ts_dataframe.darwin-arm64.node";
try {
  const native = req(nodePath);
  console.log("\nLoaded via direct path");
  console.log("Keys:", Object.keys(native).length);
  console.log("arrangeMultiF64Napi:", typeof native.arrangeMultiF64Napi);

  // Small correctness test
  const flat = new Float64Array([5, 3, 8, 1, 9]);
  const dirs = [1];
  const result = native.arrangeMultiF64Napi(flat, 5, 1, dirs);
  console.log("Result type:", result?.constructor?.name);
  console.log("Result:", Array.from(result));

  // Benchmark
  const N = 500_000;
  const bigFlat = new Float64Array(N);
  for (let i = 0; i < N; i++) bigFlat[i] = Math.random() * 1000;
  const bigDirs = [1];

  // Warmup
  for (let i = 0; i < 3; i++) {
    native.arrangeMultiF64Napi(bigFlat, N, 1, bigDirs);
  }

  // Timed
  const times: number[] = [];
  for (let i = 0; i < 10; i++) {
    const t = performance.now();
    native.arrangeMultiF64Napi(bigFlat, N, 1, bigDirs);
    times.push(performance.now() - t);
  }
  times.sort((a: number, b: number) => a - b);
  console.log(
    `\nDirect napi call (${N.toLocaleString()} rows):`,
  );
  console.log(
    `  median: ${times[Math.floor(times.length / 2)].toFixed(2)}ms`,
  );
  console.log(`  min:    ${times[0].toFixed(2)}ms`);
  console.log(
    `  all:    [${times.map((t: number) => t.toFixed(1)).join(", ")}]`,
  );
} catch (e: unknown) {
  console.log("Direct path failed:", (e as Error).message);
}
