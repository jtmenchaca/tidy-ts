#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust hypergeometric functions...\n");

  const testCases = [
    { func: "dhyper", distribution: "hypergeometric", args: [3, 10, 5, 7, 0] },
    {
      func: "phyper",
      distribution: "hypergeometric",
      args: [3, 10, 5, 7, 1, 0],
    },
    {
      func: "qhyper",
      distribution: "hypergeometric",
      args: [0.1002331, 10, 5, 7, 1, 0],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rhyper separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rhyperResult = await callR("rhyper", "hypergeometric", 1, 10, 5, 7);
    console.log(`rhyper(10, 5, 7) = ${rhyperResult}`);
  } catch (error) {
    console.log(`rhyper: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
