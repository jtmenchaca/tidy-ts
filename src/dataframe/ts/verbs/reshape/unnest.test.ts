import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("unnest - basic string array", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", tags: ["admin", "user"] },
    { id: 2, name: "Bob", tags: ["user"] },
    { id: 3, name: "Charlie", tags: [] }, // Empty array
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("tags");

  console.log("\nUnnested DataFrame:");
  unnested.print();

  expect(unnested.nrows()).toBe(4); // 2 + 1 + 1 = 4 rows (empty array becomes null row)
  expect(unnested.columns()).toEqual(["id", "name", "tags"]);

  // Check specific values
  const aliceRows = unnested.filter((row) => row.name === "Alice");
  expect(aliceRows.nrows()).toBe(2);
  expect(aliceRows.extract("tags")).toEqual(["admin", "user"]);

  const bobRows = unnested.filter((row) => row.name === "Bob");
  expect(bobRows.nrows()).toBe(1);
  expect(bobRows.extract("tags")).toEqual(["user"]);

  // Charlie should have one row with null for tags (empty array)
  const charlieRows = unnested.filter((row) => row.name === "Charlie");
  expect(charlieRows.nrows()).toBe(1);
  expect(charlieRows.at(0)?.tags).toBe(null);
});

Deno.test("unnest - number array", () => {
  const df = createDataFrame([
    { id: 1, scores: [85, 92, 78] },
    { id: 2, scores: [90] },
    { id: 3, scores: [] },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("scores");

  console.log("\nUnnested DataFrame:");
  unnested.print();

  expect(unnested.nrows()).toBe(5); // 3 + 1 + 1 = 5 rows (empty array becomes null row)
  expect(unnested.columns()).toEqual(["id", "scores"]);

  const id1Rows = unnested.filter((row) => row.id === 1);
  expect(id1Rows.nrows()).toBe(3);
  expect(id1Rows.extract("scores")).toEqual([85, 92, 78]);

  const id3Rows = unnested.filter((row) => row.id === 3);
  expect(id3Rows.nrows()).toBe(1);
  expect(id3Rows.at(0)?.scores).toBe(null);
});

Deno.test("unnest - object array", () => {
  const df = createDataFrame([
    {
      id: 1,
      items: [
        { name: "apple", price: 1.5 },
        { name: "banana", price: 0.8 },
      ],
    },
    {
      id: 2,
      items: [
        { name: "orange", price: 2.0 },
      ],
    },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("items");

  console.log("\nUnnested DataFrame:");
  unnested.print();

  expect(unnested.nrows()).toBe(3); // 2 + 1 = 3 rows
  expect(unnested.columns()).toEqual(["id", "items"]);

  const id1Rows = unnested.filter((row) => row.id === 1);
  expect(id1Rows.nrows()).toBe(2);
  expect(id1Rows.at(0)?.items).toEqual({ name: "apple", price: 1.5 });
  expect(id1Rows.at(1)?.items).toEqual({ name: "banana", price: 0.8 });
});

Deno.test("unnest - mixed array types", () => {
  const df = createDataFrame([
    { id: 1, data: ["a", 1, true] },
    { id: 2, data: [null, undefined] },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("data");

  console.log("\nUnnested DataFrame:");
  unnested.print();

  expect(unnested.nrows()).toBe(5); // 3 + 2 = 5 rows
  expect(unnested.columns()).toEqual(["id", "data"]);

  const id1Rows = unnested.filter((row) => row.id === 1);
  expect(id1Rows.nrows()).toBe(3);
  expect(id1Rows.extract("data")).toEqual(["a", 1, true]);

  const id2Rows = unnested.filter((row) => row.id === 2);
  expect(id2Rows.nrows()).toBe(2);
  expect(id2Rows.extract("data")).toEqual([null, undefined]);
});

Deno.test("unnest - preserves other columns", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", tags: ["admin"], extra: "data1" },
    { id: 2, name: "Bob", tags: ["user", "moderator"], extra: "data2" },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("tags");

  console.log("\nUnnested DataFrame:");
  unnested.print();

  expect(unnested.nrows()).toBe(3); // 1 + 2 = 3 rows
  expect(unnested.columns()).toEqual(["id", "name", "tags", "extra"]);

  // Check that other columns are preserved
  const aliceRows = unnested.filter((row) => row.name === "Alice");
  expect(aliceRows.nrows()).toBe(1);
  expect(aliceRows.at(0)?.id).toBe(1);
  expect(aliceRows.at(0)?.extra).toBe("data1");
  expect(aliceRows.at(0)?.tags).toBe("admin");

  const bobRows = unnested.filter((row) => row.name === "Bob");
  expect(bobRows.nrows()).toBe(2);
  expect(bobRows.extract("id")).toEqual([2, 2]);
  expect(bobRows.extract("extra")).toEqual(["data2", "data2"]);
  expect(bobRows.extract("tags")).toEqual(["user", "moderator"]);
});

Deno.test("unnest - error on non-array column", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
  ]);

  expect(() => {
    // @ts-expect-error - age is not an array column
    df.unnest("age");
  }).toThrow("Column 'age' is not an array column");
});

Deno.test("unnest - error on non-existent column", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
  ]);

  expect(() => {
    // @ts-expect-error - nonexistent column
    df.unnest("nonexistent");
  }).toThrow("Column 'nonexistent' not found in DataFrame");
});

Deno.test("unnest - empty DataFrame", () => {
  const df = createDataFrame([]);

  expect(() => {
    // @ts-expect-error - empty DataFrame has no columns
    df.unnest("tags");
  }).toThrow("Column 'tags' not found in DataFrame");
});

Deno.test("unnest - all empty arrays", () => {
  const df = createDataFrame([
    { id: 1, tags: [] },
    { id: 2, tags: [] },
    { id: 3, tags: [] },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("tags");

  console.log("\nUnnested DataFrame (empty arrays become null rows):");
  unnested.print();

  expect(unnested.nrows()).toBe(3); // Each empty array becomes a row with null
  expect(unnested.columns()).toEqual(["id", "tags"]);
  expect(unnested.extract("tags")).toEqual([null, null, null]);
});

Deno.test("unnest - nested arrays", () => {
  const df = createDataFrame([
    { id: 1, matrix: [[1, 2], [3, 4]] },
    { id: 2, matrix: [[5, 6]] },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("matrix");

  console.log("\nUnnested DataFrame (arrays remain nested):");
  unnested.print();

  expect(unnested.nrows()).toBe(3); // 2 + 1 = 3 rows
  expect(unnested.columns()).toEqual(["id", "matrix"]);

  const id1Rows = unnested.filter((row) => row.id === 1);
  expect(id1Rows.nrows()).toBe(2);
  expect(id1Rows.at(0)?.matrix).toEqual([1, 2]);
  expect(id1Rows.at(1)?.matrix).toEqual([3, 4]);
});

Deno.test("unnest - array with nulls only", () => {
  const df = createDataFrame([
    { id: 1, values: [null, null, null] },
    { id: 2, values: [undefined, null] },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("values");

  console.log("\nUnnested DataFrame:");
  unnested.print();

  expect(unnested.nrows()).toBe(5); // 3 + 2 = 5 rows
  const id1Rows = unnested.filter((row) => row.id === 1);
  expect(id1Rows.nrows()).toBe(3);
  expect(id1Rows.extract("values")).toEqual([null, null, null]);

  const id2Rows = unnested.filter((row) => row.id === 2);
  expect(id2Rows.nrows()).toBe(2);
  expect(id2Rows.extract("values")).toEqual([undefined, null]);
});

Deno.test("unnest - single element arrays", () => {
  const df = createDataFrame([
    { id: 1, tags: ["solo"] },
    { id: 2, tags: ["single"] },
    { id: 3, tags: ["one"] },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  const unnested = df.unnest("tags");

  console.log("\nUnnested DataFrame:");
  unnested.print();

  expect(unnested.nrows()).toBe(3);
  expect(unnested.extract("tags")).toEqual(["solo", "single", "one"]);
});

Deno.test("unnest - object with array properties (not an array column)", () => {
  const df = createDataFrame([
    {
      id: 1,
      fruit: "banana",
      count: 2,
      vitamins: ["B6", "C"],
    },
    {
      id: 2,
      fruit: "apple",
      count: 3,
      vitamins: ["C", "A"],
    },
  ]);

  console.log("\nOriginal DataFrame:");
  df.print();

  // Can only unnest array columns, not scalar properties
  expect(() => {
    // @ts-expect-error - fruit is not an array column
    df.unnest("fruit");
  }).toThrow("Column 'fruit' is not an array column");

  // But can unnest the actual array column
  const unnested = df.unnest("vitamins");

  console.log("\nUnnested DataFrame (only vitamins array was unnested):");
  unnested.print();

  expect(unnested.nrows()).toBe(4); // 2 + 2 = 4 rows
  expect(unnested.columns()).toEqual(["id", "fruit", "count", "vitamins"]);

  const bananaRows = unnested.filter((row) => row.fruit === "banana");
  expect(bananaRows.nrows()).toBe(2);
  expect(bananaRows.extract("vitamins")).toEqual(["B6", "C"]);
  expect(bananaRows.extract("count")).toEqual([2, 2]); // count duplicated
});

Deno.test("unnest - column containing objects with nested arrays", () => {
  const df = createDataFrame([
    {
      id: 1,
      product: {
        fruit: "banana",
        count: 2,
        vitamins: ["B6", "C"],
      },
    },
    {
      id: 2,
      product: {
        fruit: "apple",
        count: 3,
        vitamins: ["C", "A"],
      },
    },
  ]);

  console.log("\nOriginal DataFrame (product column contains objects):");
  df.print();

  // product is not an array column - it's an object column
  expect(() => {
    // @ts-expect-error - product is not an array column
    df.unnest("product");
  }).toThrow("Column 'product' is not an array column");

  // The product column itself is not an array, so we can't unnest it
  // To access the nested vitamins array, you'd need to first extract/transform it
  console.log("\nProduct is an object column, not an array column.");
  console.log("You cannot unnest object properties directly - only array columns.");
});

Deno.test("unnest - sequential unnest (flatten nested arrays)", () => {
  const df = createDataFrame([
    { id: 1, matrix: [[1, 2], [3, 4]] },
    { id: 2, matrix: [[5, 6]] },
    { id: 3, matrix: [[7]] },
  ]);

  console.log("\nOriginal DataFrame (nested arrays):");
  df.print();

  // First unnest - unwrap outer array
  const unnested1 = df.unnest("matrix");

  console.log("\nAfter first unnest (matrix is now array of numbers):");
  unnested1.print();

  expect(unnested1.nrows()).toBe(4); // 2 + 1 + 1 = 4 rows

  // Second unnest - unwrap inner array
  const unnested2 = unnested1.unnest("matrix");

  console.log("\nAfter second unnest (matrix is now individual numbers):");
  unnested2.print();

  expect(unnested2.nrows()).toBe(7); // 2 + 2 + 2 + 1 = 7 rows
  expect(unnested2.columns()).toEqual(["id", "matrix"]);

  // Check that we fully flattened
  const id1Rows = unnested2.filter((row) => row.id === 1);
  expect(id1Rows.nrows()).toBe(4);
  expect(id1Rows.extract("matrix")).toEqual([1, 2, 3, 4]);

  const id2Rows = unnested2.filter((row) => row.id === 2);
  expect(id2Rows.nrows()).toBe(2);
  expect(id2Rows.extract("matrix")).toEqual([5, 6]);

  const id3Rows = unnested2.filter((row) => row.id === 3);
  expect(id3Rows.nrows()).toBe(1);
  expect(id3Rows.extract("matrix")).toEqual([7]);
});
