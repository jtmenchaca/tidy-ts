#!/usr/bin/env -S deno run --allow-read --allow-run

import { tukeyHSD } from "../../../ts/stats/statistical-tests/index.ts";
import { callR } from "./test-helpers.ts";

const data = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
const alpha = 0.05;

console.log("=== TUKEY HSD DEBUG ===");
console.log("Data:", JSON.stringify(data));
console.log("Alpha:", alpha);

// Get R result
console.log("\n--- R Result ---");
try {
  const rResult = await callR("tukey.hsd", "post_hoc_tests", JSON.stringify(data), alpha.toString());
  console.log("R full result:", JSON.stringify(rResult, null, 2));
} catch (error) {
  console.error("R error:", error);
}

// Get Rust result
console.log("\n--- Rust Result ---");
try {
  const rustResult = tukeyHSD(data, alpha);
  console.log("Rust full result:", JSON.stringify(rustResult, null, 2));
  
  if (rustResult.comparisons && rustResult.comparisons.length > 0) {
    console.log("\nFirst comparison details:");
    const firstComp = rustResult.comparisons[0];
    console.log("- Test statistic:", firstComp?.test_statistic);
    console.log("- P-value:", firstComp?.p_value);
    console.log("- Groups:", firstComp?.group1, "vs", firstComp?.group2);
  }
} catch (error) {
  console.error("Rust error:", error);
}