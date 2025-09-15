#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust Poisson functions...\n");

  const testCases = [
    { func: "dpois", distribution: "poisson", args: [3, 2, 0] },
    { func: "ppois", distribution: "poisson", args: [3, 2, 1, 0] },
    { func: "qpois", distribution: "poisson", args: [0.5, 2, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rpois separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rpoisResult = await callR("rpois", "poisson", 1, 2);
    console.log(`rpois(2) = ${rpoisResult}`);
  } catch (error) {
    console.log(`rpois: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
