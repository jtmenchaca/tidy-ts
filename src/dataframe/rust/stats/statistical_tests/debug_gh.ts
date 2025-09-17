#!/usr/bin/env -S deno run --allow-read --allow-run

import { gamesHowellTest } from "../../../ts/stats/statistical-tests/index.ts";

const data = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
const alpha = 0.05;

console.log("=== GAMES-HOWELL DEBUG ===");
console.log("Data:", JSON.stringify(data));
console.log("Alpha:", alpha);

console.log("\n--- Rust Result ---");
try {
  const rustResult = gamesHowellTest(data, alpha);
  console.log("Rust full result:", JSON.stringify(rustResult, null, 2));
  
  if (rustResult.comparisons && rustResult.comparisons.length > 0) {
    console.log("\nFirst comparison details:");
    const firstComp = rustResult.comparisons[0];
    console.log("- Test statistic:", firstComp?.test_statistic);
    console.log("- P-value (raw):", firstComp?.p_value);
    console.log("- P-value (adjusted):", firstComp?.adjusted_p_value);
    console.log("- Groups:", firstComp?.group1, "vs", firstComp?.group2);
  }
} catch (error) {
  console.error("Rust error:", error);
}

console.log("\n--- Expected R Values ---");
console.log("- Test statistic: 5.1962");
console.log("- P-value: 0.0455");