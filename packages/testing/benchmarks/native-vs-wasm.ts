/**
 * Benchmark: Native (.node) vs WASM backend
 *
 * Run with: deno run -A packages/testing/benchmarks/native-vs-wasm.ts
 */

import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import {
  usingNativeBackend,
} from "../../dataframe/ts/wasm/wasm-init.ts";
import {
  coxph,
  survfit,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  glmFit,
} from "../../dataframe/ts/wasm/glm-functions.ts";
import {
  chi_square_independence,
  pearson_correlation_test,
  shapiro_wilk_test,
  t_test_one_sample,
} from "../../dataframe/ts/wasm/statistical-tests.ts";
import {
  wasm_dnorm,
  wasm_pnorm,
  wasm_qnorm,
} from "../../dataframe/ts/wasm/probability-distributions.ts";
import {
  inner_join_typed_multi_u32,
  left_join_typed_multi_u32,
} from "../../dataframe/ts/wasm/join-functions.ts";

const WARMUP = 3;
const ITERATIONS = 10;

function bench(name: string, fn: () => void): number {
  for (let i = 0; i < WARMUP; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const min = times[0];
  console.log(
    `  ${name}: ${median.toFixed(3)}ms median, ${min.toFixed(3)}ms min`,
  );
  return median;
}

const backend = usingNativeBackend() ? "NATIVE (.node)" : "WASM";
console.log(`\nBackend: ${backend}\n`);

// --- Data generation ---
const N = 100_000;
const smallN = 1_000;
const tinyN = 50;

const bigArray = new Float64Array(N);
for (let i = 0; i < N; i++) bigArray[i] = Math.random() * 100;

const smallArray = new Float64Array(smallN);
for (let i = 0; i < smallN; i++) smallArray[i] = Math.random() * 100;

const tinyArray = new Float64Array(tinyN);
for (let i = 0; i < tinyN; i++) tinyArray[i] = Math.random() * 100;

// DataFrame for sum/mean
const rows = Array.from({ length: N }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
}));
const df = createDataFrame(rows);

// GLM data
const glmN = 500;
const glmData: Record<string, number[]> = {
  y: Array.from({ length: glmN }, () => Math.random() > 0.5 ? 1 : 0),
  x1: Array.from({ length: glmN }, () => Math.random() * 10),
  x2: Array.from({ length: glmN }, () => Math.random() * 5),
};

// Survival data
const survN = 200;
const survTime = Array.from({ length: survN }, () => Math.random() * 100);
const survStatus = Array.from({ length: survN }, () =>
  Math.random() > 0.3 ? 1 : 0
);
const survCovariates: Record<string, number[]> = {
  age: Array.from({ length: survN }, () => 30 + Math.random() * 40),
  treatment: Array.from({ length: survN }, () =>
    Math.random() > 0.5 ? 1 : 0
  ),
};

// Chi-square data
const chiData = new Float64Array([10, 20, 30, 40, 50, 60, 70, 80, 90]);

// Correlation data
const corrX = new Float64Array(smallN);
const corrY = new Float64Array(smallN);
for (let i = 0; i < smallN; i++) {
  corrX[i] = Math.random() * 100;
  corrY[i] = corrX[i] + Math.random() * 20;
}

// ── Benchmarks ──

console.log("=== Basic Stats (100K elements) ===");
bench("s.sum (via DataFrame)", () => s.sum(df.x));
bench("s.mean (via DataFrame)", () => s.mean(df.x));
bench("s.median (via DataFrame)", () => s.median(df.x));

console.log("\n=== Distributions (single calls, 10K iterations) ===");
bench("dnorm x10000", () => {
  for (let i = 0; i < 10_000; i++) wasm_dnorm(i * 0.001, 0, 1, false);
});
bench("pnorm x10000", () => {
  for (let i = 0; i < 10_000; i++) wasm_pnorm(i * 0.001, 0, 1, true, false);
});
bench("qnorm x10000", () => {
  for (let i = 0; i < 10_000; i++)
    wasm_qnorm(i * 0.0001, 0, 1, true, false);
});

console.log("\n=== Statistical Tests ===");
bench("t-test (n=1000)", () => {
  t_test_one_sample(smallArray, 50, 0.05, "two-sided");
});
bench("t-test (n=50)", () => {
  t_test_one_sample(tinyArray, 50, 0.05, "two-sided");
});
bench("chi-square 3x3", () => {
  chi_square_independence(chiData, 3, 3, 0.05);
});
bench("pearson correlation (n=1000)", () => {
  pearson_correlation_test(corrX, corrY, "two-sided", 0.05);
});
bench("shapiro-wilk (n=50)", () => {
  shapiro_wilk_test(tinyArray, 0.05);
});

console.log("\n=== GLM (n=500, binomial logistic) ===");
bench("glmFit binomial", () => {
  glmFit("y ~ x1 + x2", "binomial", "logit", glmData);
});

console.log("\n=== Survival Analysis ===");
bench("survfit KM (n=200)", () => {
  survfit({ time: survTime, status: survStatus });
});
bench("coxph (n=200, 2 covariates)", () => {
  coxph({
    time: survTime,
    status: survStatus,
    covariates: survCovariates,
    method: "efron",
  });
});

// Join data — simulate key columns
const joinN = 10_000;
const leftKey = new Uint32Array(joinN);
const rightKey = new Uint32Array(joinN);
for (let i = 0; i < joinN; i++) {
  leftKey[i] = Math.floor(Math.random() * 5000);
  rightKey[i] = Math.floor(Math.random() * 5000);
}

console.log("\n=== Joins (10K rows, single key) ===");
bench("inner_join", () => {
  inner_join_typed_multi_u32([leftKey], [rightKey]);
});
bench("left_join", () => {
  left_join_typed_multi_u32([leftKey], [rightKey]);
});

console.log("\n=== DataFrame Operations (100K rows) ===");
bench("filter", () => {
  df.filter((r) => r.x > 50);
});
bench("mutate", () => {
  df.mutate({ z: (r) => r.x + r.y });
});
bench("arrange", () => {
  df.arrange("x", "asc");
});

console.log(`\nDone. Backend: ${backend}\n`);
