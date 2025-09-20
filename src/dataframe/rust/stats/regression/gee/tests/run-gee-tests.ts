#!/usr/bin/env -S deno run --allow-all

// Simple script to run GEE tests

import { runGeeglmTestSuite } from "./gee-runner.ts";

console.log("🧪 GEE Test Runner");
console.log("==================");

try {
  const results = await runGeeglmTestSuite();

  // Check if any tests failed
  const hasFailures = results.some((r) =>
    r.status === "FAIL" || r.status === "ERROR"
  );

  if (hasFailures) {
    console.log("\n❌ Some tests failed or errored");
    Deno.exit(1);
  } else {
    console.log("\n✅ All tests completed successfully");
    Deno.exit(0);
  }
} catch (error) {
  console.error("💥 Test runner failed:", error);
  Deno.exit(1);
}
