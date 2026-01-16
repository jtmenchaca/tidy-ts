#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust t distribution functions...\n");

  const testCases = [
    { func: "dt", distribution: "t_distribution", args: [0, 5, 0] },
    { func: "pt", distribution: "t_distribution", args: [0, 5, 1, 0] },
    { func: "qt", distribution: "t_distribution", args: [0.5, 5, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rt separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rtResult = await callR("rt", "t_distribution", 1, 5);
    console.log(`rt(5) = ${rtResult}`);
  } catch (error) {
    console.log(`rt: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
