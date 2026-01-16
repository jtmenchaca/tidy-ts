#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust gamma functions...\n");

  const testCases = [
    { func: "dgamma", distribution: "gamma", args: [1, 2, 1, 0] },
    { func: "pgamma", distribution: "gamma", args: [1, 2, 1, 1, 0] },
    { func: "qgamma", distribution: "gamma", args: [0.5, 2, 1, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rgamma separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rgammaResult = await callR("rgamma", "gamma", 1, 2, 1);
    console.log(`rgamma(2, 1) = ${rgammaResult}`);
  } catch (error) {
    console.log(`rgamma: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
