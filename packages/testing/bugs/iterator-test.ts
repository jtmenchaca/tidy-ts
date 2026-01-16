import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("DataFrame iterator - for...of loop", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25, city: "NYC" },
    { name: "Bob", age: 30, city: "LA" },
    { name: "Carol", age: 35, city: "Chicago" },
  ]);

  console.log("=== Testing for...of loop ===");

  // Basic for...of iteration
  console.log("\n1. Basic for...of:");
  for (const row of df) {
    console.log("Row:", row);
    expect(row).toHaveProperty("name");
    expect(row).toHaveProperty("age");
    expect(row).toHaveProperty("city");
  }

  // Collecting rows
  console.log("\n2. Collecting rows from iterator:");
  const rows = [];
  for (const row of df) {
    rows.push(row);
  }
  console.log("Collected rows:", rows);
  expect(rows).toHaveLength(3);
  expect(rows[0].name).toBe("Alice");
  expect(rows[2].name).toBe("Carol");

  // Destructuring in for...of
  console.log("\n3. Destructuring in for...of:");
  for (const { name, age } of df) {
    console.log(`${name} is ${age} years old`);
    expect(typeof name).toBe("string");
    expect(typeof age).toBe("number");
  }

  // Early exit
  console.log("\n4. Early exit from loop:");
  let count = 0;
  for (const row of df) {
    console.log("Processing:", row.name);
    count++;
    if (count === 2) break;
  }
  expect(count).toBe(2);
});

Deno.test("DataFrame iterator - for...in loop", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Carol", age: 35 },
  ]);

  console.log("=== Testing for...in loop ===");

  // for...in iterates over properties/indices
  console.log("\n1. Basic for...in:");
  const properties = [];
  for (const prop in df) {
    properties.push(prop);
    console.log(`Property: ${prop}, Type: ${typeof prop}`);
  }
  console.log("All properties found:", properties);

  // Check if numeric indices work
  console.log("\n2. Accessing by index:");
  for (let i = 0; i < df.nrows(); i++) {
    const row = df[i];
    if (row !== undefined) {
      console.log(`df[${i}]:`, row);
    }
  }
});

Deno.test("DataFrame iterator - entries and indexed iteration", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Carol", age: 35 },
  ]);

  console.log("=== Testing indexed iteration patterns ===");

  // Manual index tracking
  console.log("\n1. Manual index tracking:");
  let index = 0;
  for (const row of df) {
    console.log(`Index ${index}:`, row);
    expect(index).toBeLessThan(3);
    index++;
  }
  expect(index).toBe(3);

  // Using Array.from
  console.log("\n2. Using Array.from:");
  const arrayFromDf = Array.from(df);
  console.log("Array from DataFrame:", arrayFromDf);
  expect(arrayFromDf).toHaveLength(3);

  // With index using Array.from
  console.log("\n3. Array.from with mapping:");
  const withIndices = Array.from(df, (row, idx) => ({ index: idx, ...row }));
  console.log("With indices:", withIndices);
  expect(withIndices[0].index).toBe(0);
  expect(withIndices[2].index).toBe(2);

  // Using spread operator
  console.log("\n4. Using spread operator:");
  const spread = [...df];
  console.log("Spread result:", spread);
  expect(spread).toHaveLength(3);

  // forEach-like iteration with entries
  console.log("\n5. forEach-like with entries:");
  const entries = [...df].entries();
  for (const [idx, row] of entries) {
    console.log(`Entry ${idx}:`, row);
    expect(idx).toBeLessThan(3);
    expect(row).toHaveProperty("name");
  }
});

Deno.test("DataFrame iterator - with filtering and slicing", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Carol", age: 35 },
    { name: "Dave", age: 40 },
    { name: "Eve", age: 45 },
  ]);

  console.log("=== Testing iteration after transformations ===");

  // After filter
  console.log("\n1. After filter:");
  const filtered = df.filter((row) => row.age > 30);
  for (const row of filtered) {
    console.log("Filtered row:", row);
    expect(row.age).toBeGreaterThan(30);
  }

  // After slice
  console.log("\n2. After slice:");
  const sliced = df.slice(1, 4);
  const slicedRows = [...sliced];
  console.log("Sliced rows:", slicedRows);
  expect(slicedRows).toHaveLength(3);
  expect(slicedRows[0].name).toBe("Bob");

  // Chained operations
  console.log("\n3. After chained operations:");
  const transformed = df
    .filter((row) => row.age >= 30)
    .mutate({ ageGroup: (row) => row.age >= 40 ? "40+" : "30-39" });

  for (const row of transformed) {
    console.log("Transformed row:", row);
    expect(row).toHaveProperty("ageGroup");
  }
});

Deno.test("DataFrame iterator - performance considerations", () => {
  // Create a larger dataset
  const data = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    value: Math.random() * 100,
    category: i % 5,
  }));
  const df = createDataFrame(data);

  console.log("=== Testing iterator performance ===");

  // Measure iteration time
  console.log("\n1. Timing iteration:");
  const start = performance.now();
  let count = 0;
  for (const _row of df) {
    count++;
  }
  const iterTime = performance.now() - start;
  console.log(`Iterated ${count} rows in ${iterTime.toFixed(2)}ms`);
  expect(count).toBe(1000);

  // Compare with toArray()
  console.log("\n2. Comparing with toArray():");
  const startArray = performance.now();
  const array = df.toArray();
  const arrayTime = performance.now() - startArray;
  console.log(`toArray() took ${arrayTime.toFixed(2)}ms`);

  const startArrayIter = performance.now();
  let arrayCount = 0;
  for (const _row of array) {
    arrayCount++;
  }
  const arrayIterTime = performance.now() - startArrayIter;
  console.log(`Array iteration took ${arrayIterTime.toFixed(2)}ms`);

  console.log(
    `\nIterator is ${
      (iterTime / arrayIterTime).toFixed(1)
    }x slower than array iteration`,
  );
});

// Test if we can make iteration work with index decomposition
Deno.test("DataFrame iterator - custom iteration patterns", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Carol", age: 35 },
  ]);

  console.log("=== Testing custom iteration patterns ===");

  // Using entries() pattern similar to arrays
  console.log("\n1. Entries-like pattern:");
  const rows = [...df];
  for (const [index, row] of rows.entries()) {
    console.log(`[${index}]:`, row);
    expect(index).toBeLessThan(3);
    expect(row).toHaveProperty("name");
  }

  // Using forEach if available
  console.log("\n2. forEach pattern (if available):");
  try {
    if (typeof df.forEach === "function") {
      df.forEach((row, idx) => {
        console.log(`forEach [${idx}]:`, row);
      });
    }
  } catch (error) {
    console.log("forEach disabled on DataFrame:", (error as Error).message);
    // Implement forEach-like behavior using standard iteration
    [...df].forEach((row, idx) => {
      console.log(`Array forEach [${idx}]:`, row);
    });
  }

  // Map-like behavior
  console.log("\n3. Map-like transformation:");
  const transformed = [...df].map((row, idx) => ({
    ...row,
    index: idx,
    upperName: row.name.toUpperCase(),
  }));
  console.log("Mapped result:", transformed);
  expect(transformed[0].upperName).toBe("ALICE");
  expect(transformed[2].index).toBe(2);
});
