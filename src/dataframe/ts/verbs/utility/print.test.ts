import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("print() with string message and options", () => {
  const df = createDataFrame([
    {
      name: "Alice",
      age: 30,
      city: "New York",
      country: "USA",
      email: "alice@example.com",
    },
    {
      name: "Bob",
      age: 25,
      city: "Los Angeles",
      country: "USA",
      email: "bob@example.com",
    },
    {
      name: "Charlie",
      age: 35,
      city: "New York",
      country: "USA",
      email: "charlie@example.com",
    },
    {
      name: "Diana",
      age: 28,
      city: "Los Angeles",
      country: "USA",
      email: "diana@example.com",
    },
    {
      name: "Eve",
      age: 32,
      city: "New York",
      country: "USA",
      email: "eve@example.com",
    },
    {
      name: "Frank",
      age: 27,
      city: "Los Angeles",
      country: "USA",
      email: "frank@example.com",
    },
    {
      name: "Grace",
      age: 30,
      city: "New York",
      country: "USA",
      email: "grace@example.com",
    },
    {
      name: "Hank",
      age: 26,
      city: "Los Angeles",
      country: "USA",
      email: "hank@example.com",
    },
    {
      name: "Ivy",
      age: 29,
      city: "New York",
      country: "USA",
      email: "ivy@example.com",
    },
    {
      name: "Jack",
      age: 24,
      city: "Los Angeles",
      country: "USA",
      email: "jack@example.com",
    },
  ]);

  // Use print as a method through the proxy
  df.print("DataFrame with options:", { maxCols: 3 });
});

Deno.test("print() chaining works", () => {
  const df = createDataFrame([
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ]);

  console.log("=== Testing print() chaining ===");

  // Test chaining - print should return the same DataFrame for chaining
  const result = df
    .print("Original data:")
    .mutate({ doubleAge: (row) => row.age * 2 })
    .print("After mutation:");

  console.log("Result is DataFrame:", result !== null);
  console.log("Final data:", result.toArray());
});

// ============================================================================
// LIMIT TESTS - Testing print performance and API patterns with large datasets
// ============================================================================

Deno.test("print() large dataset (100 rows)", () => {
  console.log("\n=== Large Dataset Test (100 rows) ===");

  // Create dataset with 100 rows
  const largeData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Person_${i + 1}`,
    age: 20 + (i % 50),
    department: i % 3 === 0
      ? "Engineering"
      : i % 3 === 1
      ? "Marketing"
      : "Sales",
    salary: 50000 + (i * 1000),
    active: i % 4 !== 0,
  }));

  const largeDf = createDataFrame(largeData);

  console.log(
    `Dataset size: ${largeDf.nrows()} rows, ${largeDf.ncols()} columns`,
  );

  // Test basic print
  largeDf.print("Large dataset (first 1000 rows shown):");

  // Test with maxCols limit
  largeDf.print("Large dataset (max 3 columns):", { maxCols: 3 });

  // Test with showIndex
  largeDf.print("Large dataset (with index, max 3 cols):", {
    maxCols: 3,
    showIndex: true,
  });
});

Deno.test("print() wide dataset (12 columns)", () => {
  console.log("\n=== Wide Dataset Test (12 columns) ===");

  // Create dataset with many columns
  const wideData = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    first_name: `First${i + 1}`,
    last_name: `Last${i + 1}`,
    email: `person${i + 1}@example.com`,
    phone: `555-000${i + 1}`,
    department: ["Engineering", "Marketing", "Sales", "HR", "Finance"][i],
    salary: 50000 + (i * 10000),
    start_date: `2020-0${i + 1}-15`,
    manager: `Manager${i + 1}`,
    location: ["NYC", "SF", "LA", "CHI", "BOS"][i],
    active: i % 2 === 0,
    notes: `Employee notes for person ${i + 1}`,
  }));

  const wideDf = createDataFrame(wideData);

  console.log(
    `Dataset size: ${wideDf.nrows()} rows, ${wideDf.ncols()} columns`,
  );

  // Test basic print (should show truncation)
  wideDf.print("Wide dataset (default maxCols=8):");

  // Test with higher maxCols
  wideDf.print("Wide dataset (maxCols=10):", { maxCols: 10 });

  // Test with all columns
  wideDf.print("Wide dataset (all columns):", { maxCols: 20 });

  // Test transpose view
  wideDf.print("Wide dataset (transposed):", { transpose: true });
});

Deno.test("print() API patterns comprehensive test", () => {
  console.log("\n=== API Patterns Test ===");

  const testData = [
    { product: "Widget A", price: 19.99, category: "Tools", inStock: true },
    { product: "Widget B", price: 29.99, category: "Tools", inStock: false },
    {
      product: "Gadget X",
      price: 49.99,
      category: "Electronics",
      inStock: true,
    },
    {
      product: "Gadget Y",
      price: 39.99,
      category: "Electronics",
      inStock: true,
    },
  ];

  const df = createDataFrame(testData);

  // Pattern 1: Basic print
  console.log("\n--- Pattern 1: df.print() ---");
  df.print();

  // Pattern 2: Message only
  console.log("\n--- Pattern 2: df.print(message) ---");
  df.print("Product catalog:");

  // Pattern 3: Options only
  console.log("\n--- Pattern 3: df.print(options) ---");
  df.print({ maxCols: 2, showIndex: true });

  // Pattern 4: Message + Options
  console.log("\n--- Pattern 4: df.print(message, options) ---");
  df.print("Product catalog (with index):", { showIndex: true });

  // Pattern 5: Chaining with print
  console.log("\n--- Pattern 5: Chaining ---");
  const filtered = df
    .print("Before filtering:")
    .filter((row) => row.inStock)
    .print("After filtering (in stock only):");

  console.log("Chained result rows:", filtered.nrows());
});

Deno.test("print() with colorRows option", () => {
  console.log("\n=== ColorRows Test ===");
  console.log("Note: Colors may not display in all terminals/IDEs");

  const colorData = [
    { id: 1, name: "Alice", role: "Engineer", active: true },
    { id: 2, name: "Bob", role: "Designer", active: false },
    { id: 3, name: "Carol", role: "Manager", active: true },
    { id: 4, name: "David", role: "Analyst", active: false },
    { id: 5, name: "Eve", role: "Developer", active: true },
  ];

  const colorDf = createDataFrame(colorData);

  // Test default (no colors)
  console.log("\n--- Default display (no colors) ---");
  colorDf.print("Default table:");

  // Test enabling colors
  console.log("\n--- With colorRows enabled ---");
  colorDf.print("Table with colors:", { colorRows: true });

  // Test with other options combined
  console.log("\n--- colorRows + showIndex ---");
  colorDf.print("With index and colors:", { colorRows: true, showIndex: true });

  // Test with maxCols and colors
  console.log("\n--- colorRows + maxCols ---");
  colorDf.print("Limited columns with colors:", {
    colorRows: true,
    maxCols: 3,
  });
});

Deno.test("print() maxWidth option test", () => {
  console.log("\n=== MaxWidth Test ===");

  const longTextData = [
    {
      id: 1,
      title:
        "This is a very long title that should be truncated when maxWidth is applied",
      description:
        "This is an even longer description that contains a lot of text and should definitely be truncated to fit within the specified maximum width constraints",
      category: "Long Text Category Name",
    },
    {
      id: 2,
      title: "Short",
      description: "Brief",
      category: "Short",
    },
  ];

  const longDf = createDataFrame(longTextData);

  // Test default maxWidth
  longDf.print("Long text (default maxWidth=20):");

  // Test smaller maxWidth
  longDf.print("Long text (maxWidth=10):", { maxWidth: 10 });

  // Test larger maxWidth
  longDf.print("Long text (maxWidth=50):", { maxWidth: 50 });

  // Test printing just the description column
  console.log("\n--- Just the description column ---");
  longDf.select("description").print("Description column only:");
});

Deno.test("print() edge cases", () => {
  console.log("\n=== Edge Cases Test ===");

  // Empty DataFrame
  const emptyDf = createDataFrame([]);
  console.log("\n--- Empty DataFrame ---");
  emptyDf.print("Empty DataFrame:");

  // Single row
  const singleRowDf = createDataFrame([{ name: "Solo", value: 42 }]);
  console.log("\n--- Single Row ---");
  singleRowDf.print("Single row:");

  // Single column
  const singleColDf = createDataFrame([{ x: 1 }, { x: 2 }, { x: 3 }]);
  console.log("\n--- Single Column ---");
  singleColDf.print("Single column:");

  // Null/undefined values
  const nullData = [
    { name: "Alice", value: 100, notes: null },
    { name: null, value: undefined, notes: "Has notes" },
    { name: "Charlie", value: 0, notes: "" },
  ];
  const nullDf = createDataFrame(nullData);
  console.log("\n--- Null/Undefined Values ---");
  nullDf.print("Data with nulls:");
});
