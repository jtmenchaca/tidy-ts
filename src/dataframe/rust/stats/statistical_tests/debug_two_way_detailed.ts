#!/usr/bin/env -S deno run --allow-read --allow-run

// Debug two-way ANOVA with detailed output

import { 
  anova_two_way_wasm,
  serializeTestResult 
} from "../../../ts/wasm/statistical-tests.ts";

console.log("=== DETAILED TWO-WAY ANOVA DEBUG ===");

// Test data - 2x3 factorial design
const data = [
  // Factor A level 1
  [
    [1, 2, 3, 4, 5], // Factor B level 1
    [2, 3, 4, 5, 6], // Factor B level 2
    [3, 4, 5, 6, 7], // Factor B level 3
  ],
  // Factor A level 2
  [
    [4, 5, 6, 7, 8], // Factor B level 1
    [5, 6, 7, 8, 9], // Factor B level 2
    [6, 7, 8, 9, 10], // Factor B level 3
  ],
];

// Flatten data like the real function does
const flattenedData: number[] = [];
const cellSizes: number[] = [];

const aLevels = data.length;
const bLevels = data[0].length;

for (let i = 0; i < aLevels; i++) {
  for (let j = 0; j < bLevels; j++) {
    const cellData = data[i][j];
    flattenedData.push(...cellData);
    cellSizes.push(cellData.length);
  }
}

console.log("Flattened data:", flattenedData);
console.log("Cell sizes:", cellSizes);
console.log("A levels:", aLevels);
console.log("B levels:", bLevels);

try {
  console.log("Calling WASM function...");
  const wasmResult = anova_two_way_wasm(
    new Float64Array(flattenedData),
    aLevels,
    bLevels, 
    new Uint32Array(cellSizes),
    0.05,
  );
  
  console.log("WASM result:", wasmResult);
  console.log("WASM result type:", typeof wasmResult);
  console.log("WASM result keys:", Object.keys(wasmResult || {}));
  
  if (wasmResult) {
    console.log("Serializing result...");
    const serialized = serializeTestResult(wasmResult);
    console.log("Serialized result:", JSON.stringify(serialized, null, 2));
  }
} catch (error) {
  console.error("Error:", error);
  console.error("Stack:", error.stack);
}