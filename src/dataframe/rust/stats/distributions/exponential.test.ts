#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust exponential functions...\n");

  const testCases = [
    { func: "dexp", distribution: "exponential", args: [1, 1, 0] },
    { func: "pexp", distribution: "exponential", args: [1, 1, 1, 0] },
    { func: "qexp", distribution: "exponential", args: [0.5, 1, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rexp separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rexpResult = await callR("rexp", "exponential", 1, 1);
    console.log(`rexp(1) = ${rexpResult}`);
  } catch (error) {
    console.log(`rexp: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
