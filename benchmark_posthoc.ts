#!/usr/bin/env -S deno run --allow-read --allow-ffi

import { tukeyHSD, gamesHowellTest, dunnTest } from "./src/dataframe/ts/stats/statistical-tests/post-hoc.ts";

const groups = [
  [12.1, 13.4, 11.8, 14.2, 12.9],
  [15.2, 16.1, 14.8, 17.3, 15.9],
  [12.3, 13.1, 12.8, 13.5, 12.9],
  [18.1, 19.2, 17.8, 18.9, 19.5]
];

const alpha = 0.05;
const iterations = 1000;

console.log(`Benchmarking post-hoc tests with ${iterations} iterations each...\n`);

// Warm up WASM
tukeyHSD(groups, alpha);
gamesHowellTest(groups, alpha);
dunnTest(groups, alpha);

// Benchmark Tukey HSD
console.log("Benchmarking Tukey HSD...");
const tukeyStart = performance.now();
for (let i = 0; i < iterations; i++) {
  tukeyHSD(groups, alpha);
}
const tukeyEnd = performance.now();
const tukeyTime = tukeyEnd - tukeyStart;

// Benchmark Games-Howell
console.log("Benchmarking Games-Howell...");
const ghStart = performance.now();
for (let i = 0; i < iterations; i++) {
  gamesHowellTest(groups, alpha);
}
const ghEnd = performance.now();
const ghTime = ghEnd - ghStart;

// Benchmark Dunn's test
console.log("Benchmarking Dunn's test...");
const dunnStart = performance.now();
for (let i = 0; i < iterations; i++) {
  dunnTest(groups, alpha);
}
const dunnEnd = performance.now();
const dunnTime = dunnEnd - dunnStart;

// Results
console.log(`\n=== Benchmark Results (${iterations} iterations) ===`);
console.log(`Tukey HSD:     ${tukeyTime.toFixed(2)}ms total, ${(tukeyTime/iterations).toFixed(3)}ms per call`);
console.log(`Games-Howell:  ${ghTime.toFixed(2)}ms total, ${(ghTime/iterations).toFixed(3)}ms per call`);
console.log(`Dunn's test:   ${dunnTime.toFixed(2)}ms total, ${(dunnTime/iterations).toFixed(3)}ms per call`);

// Single call timing
console.log(`\n=== Single Call Performance ===`);
const singleTukeyStart = performance.now();
const tukeyResult = tukeyHSD(groups, alpha);
const singleTukeyEnd = performance.now();

const singleGHStart = performance.now();
const ghResult = gamesHowellTest(groups, alpha);
const singleGHEnd = performance.now();

const singleDunnStart = performance.now();
const dunnResult = dunnTest(groups, alpha);
const singleDunnEnd = performance.now();

console.log(`Tukey HSD:     ${(singleTukeyEnd - singleTukeyStart).toFixed(3)}ms`);
console.log(`Games-Howell:  ${(singleGHEnd - singleGHStart).toFixed(3)}ms`);
console.log(`Dunn's test:   ${(singleDunnEnd - singleDunnStart).toFixed(3)}ms`);

console.log(`\n=== Results Validation ===`);
console.log(`Tukey HSD comparisons: ${tukeyResult.comparisons.length}`);
console.log(`Games-Howell comparisons: ${ghResult.comparisons.length}`);
console.log(`Dunn's test comparisons: ${dunnResult.comparisons.length}`);