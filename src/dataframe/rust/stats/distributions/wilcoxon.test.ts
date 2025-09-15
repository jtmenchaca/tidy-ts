#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust Wilcoxon functions...\n");

  const testCases = [
    { func: "dwilcox", distribution: "wilcoxon", args: [6, 3, 4, 0] },
    { func: "pwilcox", distribution: "wilcoxon", args: [6, 3, 4, 1, 0] },
    {
      func: "qwilcox",
      distribution: "wilcoxon",
      args: [0.5714286, 3, 4, 1, 0],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rwilcox separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rwilcoxResult = await callR("rwilcox", "wilcoxon", 1, 3, 4);
    console.log(`rwilcox(3, 4) = ${rwilcoxResult}`);
  } catch (error) {
    console.log(`rwilcox: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
