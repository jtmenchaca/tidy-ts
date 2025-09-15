#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust normal functions...\n");

  const testCases = [
    { func: "dnorm", distribution: "normal", args: [0, 0, 1, 0] },
    { func: "pnorm", distribution: "normal", args: [0, 0, 1, 1, 0] },
    { func: "qnorm", distribution: "normal", args: [0.5, 0, 1, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rnorm separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rnormResult = await callR("rnorm", "normal", 1, 0, 1);
    console.log(`rnorm(0, 1) = ${rnormResult}`);
  } catch (error) {
    console.log(`rnorm: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
