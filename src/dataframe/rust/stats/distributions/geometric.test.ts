#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust geometric functions...\n");

  const testCases = [
    { func: "dgeom", distribution: "geometric", args: [2, 0.3, 0] },
    { func: "pgeom", distribution: "geometric", args: [2, 0.3, 1, 0] },
    { func: "qgeom", distribution: "geometric", args: [0.657, 0.3, 1, 0] },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test rgeom separately since it's not available in Rust interface
  console.log("\nR-only tests:");
  try {
    const rgeomResult = await callR("rgeom", "geometric", 1, 0.3);
    console.log(`rgeom(0.3) = ${rgeomResult}`);
  } catch (error) {
    console.log(`rgeom: Error - ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
