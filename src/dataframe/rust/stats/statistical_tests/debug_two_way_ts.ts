#!/usr/bin/env -S deno run --allow-read --allow-run

// Debug two-way ANOVA TypeScript function directly

import { twoWayAnova } from "../../../ts/stats/statistical-tests/anova.ts";

console.log("=== DEBUGGING TWO-WAY ANOVA TYPESCRIPT ===");

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

console.log("Input data:", JSON.stringify(data));

try {
  const result = twoWayAnova({ data, alpha: 0.05 });
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Error:", error);
  console.error("Stack:", error.stack);
}