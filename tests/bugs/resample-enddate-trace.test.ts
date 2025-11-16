import { getTimeBucket } from "../../src/dataframe/ts/verbs/utility/time-bucket.ts";

Deno.test("TRACE - endDate bucketing logic", () => {
  const dayMs = 24 * 60 * 60 * 1000;

  // User input
  const endDate = new Date("2023-01-05T23:59:59");
  const endMs = endDate.getTime();

  console.log("\n=== TRACE: endDate bucketing ===");
  console.log("endDate:", endDate.toISOString());
  console.log("endMs:", endMs);

  // What getTimeBucket returns
  const endDateBucket = getTimeBucket(endMs, dayMs);
  console.log("\ngetTimeBucket(endMs, dayMs):", endDateBucket);
  console.log("  = ", new Date(endDateBucket).toISOString());

  // Check condition
  console.log("\nendDateBucket > endMs?", endDateBucket > endMs);

  // What effectiveEndTime should be
  let effectiveEndTime;
  if (endDateBucket > endMs) {
    effectiveEndTime = endDateBucket - dayMs;
    console.log(
      "Using previous bucket:",
      new Date(effectiveEndTime).toISOString(),
    );
  } else {
    effectiveEndTime = endDateBucket;
    console.log("Using same bucket:", new Date(effectiveEndTime).toISOString());
  }

  // Now simulate the loop
  const startDate = new Date("2023-01-01T00:00:00");
  const bucketStartTime = getTimeBucket(startDate.getTime(), dayMs);
  const bucketEndTime = effectiveEndTime;

  console.log("\n=== Loop simulation ===");
  console.log("bucketStartTime:", new Date(bucketStartTime).toISOString());
  console.log("bucketEndTime:", new Date(bucketEndTime).toISOString());

  // The actual loop from resample.verb.ts
  const startBucket = getTimeBucket(bucketStartTime, dayMs);
  const endBucket = getTimeBucket(bucketEndTime, dayMs);

  console.log(
    "\nstartBucket (after getTimeBucket again):",
    new Date(startBucket).toISOString(),
  );
  console.log(
    "endBucket (after getTimeBucket again):",
    new Date(endBucket).toISOString(),
  );

  console.log("\nGenerated buckets:");
  let count = 0;
  let currentTime = startBucket;
  while (currentTime <= endBucket) {
    console.log(`  ${count}: ${new Date(currentTime).toISOString()}`);
    currentTime += dayMs;
    count++;
    if (count > 10) break;
  }

  console.log(`\nTotal: ${count} buckets`);
  console.log("Expected: 5 buckets");
});
