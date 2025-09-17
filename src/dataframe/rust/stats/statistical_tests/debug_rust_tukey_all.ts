#!/usr/bin/env -S deno run --allow-read --allow-run

import { tukeyHSD } from "../../../ts/stats/statistical-tests/index.ts";

// Exact test data
const group1 = [1, 2, 3, 4, 5];
const group2 = [2, 3, 4, 5, 6];
const group3 = [3, 4, 5, 6, 7];
const groups = [group1, group2, group3];
const alpha = 0.05;

console.log("=== COMPLETE RUST TUKEY ANALYSIS ===");

const result = tukeyHSD(groups, alpha);
console.log("Full result:", JSON.stringify(result, null, 2));

console.log("\n=== ALL COMPARISONS ===");
result.comparisons.forEach((comp, i) => {
  console.log(`\nComparison ${i + 1}: ${comp.group1} vs ${comp.group2}`);
  console.log(`  Test statistic: ${comp.test_statistic}`);
  console.log(`  Raw p-value: ${comp.p_value}`);
  console.log(`  Adjusted p-value: ${comp.adjusted_p_value}`);
  console.log(`  Mean difference: ${comp.mean_difference}`);
  console.log(`  Std error: ${comp.std_error}`);
  console.log(`  Significant: ${comp.significant}`);
});

console.log("\n=== TARGET VALUES ===");
console.log("R expects:");
console.log("  Test statistic: 1.0");
console.log("  P-value: 0.5908");

console.log("\nCurrent Rust:");
console.log(`  Test statistic: ${result.comparisons[0].test_statistic}`);
console.log(`  Raw p-value: ${result.comparisons[0].p_value}`);
console.log(`  Adjusted p-value: ${result.comparisons[0].adjusted_p_value}`);