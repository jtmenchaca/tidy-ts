/**
 * Detailed breakdown of column-based DataFrame creation performance
 */

import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { expect } from "@std/expect";

const ROWS = 1_000_000;

Deno.test("Column creation performance breakdown", () => {
  console.log(`\n=== Column Creation Breakdown (${ROWS.toLocaleString()} rows) ===\n`);

  // Step 1: Prepare arrays
  const t0 = performance.now();
  const ids = new Array(ROWS);
  const names = new Array(ROWS);
  const ages = new Array(ROWS);
  const scores = new Array(ROWS);
  const actives = new Array(ROWS);
  const t1 = performance.now();
  console.log(`1. Array allocation: ${(t1 - t0).toFixed(2)}ms`);

  // Step 2: Fill arrays
  const t2 = performance.now();
  for (let i = 0; i < ROWS; i++) {
    ids[i] = i;
    names[i] = `Person_${i}`;
    ages[i] = 20 + (i % 50);
    scores[i] = Math.random() * 100;
    actives[i] = i % 2 === 0;
  }
  const t3 = performance.now();
  console.log(`2. Fill arrays: ${(t3 - t2).toFixed(2)}ms`);

  // Step 3: Create DataFrame (this is what we optimized)
  const t4 = performance.now();
  const df = createDataFrame({
    columns: {
      id: ids,
      name: names,
      age: ages,
      score: scores,
      active: actives,
    },
  });
  const t5 = performance.now();
  console.log(`3. createDataFrame: ${(t5 - t4).toFixed(2)}ms`);

  // Step 4: First property access (to ensure no lazy evaluation)
  const t6 = performance.now();
  const nrows = df.nrows();
  const t7 = performance.now();
  console.log(`4. First property access (nrows): ${(t7 - t6).toFixed(2)}ms`);

  // Step 5: Column access
  const t8 = performance.now();
  const col = df.name;
  const t9 = performance.now();
  console.log(`5. Column access: ${(t9 - t8).toFixed(2)}ms`);

  // Step 6: Row access
  const t10 = performance.now();
  const row = df[0];
  const t11 = performance.now();
  console.log(`6. Row access: ${(t11 - t10).toFixed(2)}ms`);

  console.log(`\nTotal: ${(t11 - t0).toFixed(2)}ms`);

  // What's actually happening in createDataFrame?
  console.log("\n=== What's in createDataFrame (step 3)? ===");
  console.log("- Validate all columns have same length");
  console.log("- Copy each column array (spread operator)");
  console.log("- Create ColumnarStore object");
  console.log("- Create DataFrame proxy");

  // Let's test just the array copying
  const copyStart = performance.now();
  const idsCopy = [...ids];
  const namesCopy = [...names];
  const agesCopy = [...ages];
  const scoresCopy = [...scores];
  const activesCopy = [...actives];
  const copyEnd = performance.now();
  console.log(`\nArray copying alone (5 columns): ${(copyEnd - copyStart).toFixed(2)}ms`);

  expect(nrows).toBe(ROWS);
  expect(col.length).toBe(ROWS);
  expect(row.id).toBe(0);
});
