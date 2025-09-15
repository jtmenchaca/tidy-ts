#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust Weibull functions...\n");

  const testCases = [
    { func: "dweibull", distribution: "weibull", args: [2, 1, 2, 0] },
    { func: "pweibull", distribution: "weibull", args: [2, 1, 2, 1, 0] },
    {
      func: "qweibull",
      distribution: "weibull",
      args: [0.8646647, 1, 2, 1, 0],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rweibull separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rweibullResult = await callR("rweibull", "weibull", 1, 1, 2);
    console.log(`rweibull(1, 2) = ${rweibullResult}`);
  } catch (error) {
    console.log(`rweibull: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
