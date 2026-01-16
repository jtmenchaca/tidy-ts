import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Test data
const testData = createDataFrame([
  { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  {
    id: 2,
    name: "Chewbacca",
    mass: 112,
    species: "Wookiee",
    homeworld: "Kashyyyk",
  },
]);

Deno.test("select single column", () => {
  const result = testData.select("name");
  console.log("Select single column result:", result);

  // Verify structure and type
  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["name"]);

  // Verify row access
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[1]).toHaveProperty("name", "Chewbacca");

  // Verify columns not present
  expect(result[0]).not.toHaveProperty("id");
  expect(result[0]).not.toHaveProperty("mass");
  expect(result[0]).not.toHaveProperty("species");
  expect(result[0]).not.toHaveProperty("homeworld");
});

Deno.test("select multiple columns", () => {
  const result = testData.select("name", "species");
  console.log("Select multiple columns result:", result);

  // Verify structure
  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["name", "species"]);

  // Verify row access
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[0]).toHaveProperty("species", "Human");
  expect(result[1]).toHaveProperty("name", "Chewbacca");
  expect(result[1]).toHaveProperty("species", "Wookiee");

  // Verify columns not present
  expect(result[0]).not.toHaveProperty("id");
  expect(result[0]).not.toHaveProperty("mass");
  expect(result[0]).not.toHaveProperty("homeworld");
});

Deno.test("select all columns explicitly", () => {
  const result = testData.select("id", "name", "mass", "species", "homeworld");
  console.log("All columns explicit result:", result);

  // Should have same structure as original
  expect(result.nrows()).toBe(testData.nrows());
  expect(result.columns()).toEqual([
    "id",
    "name",
    "mass",
    "species",
    "homeworld",
  ]);

  // Verify all data is preserved
  expect(result[0]).toHaveProperty("id", 1);
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[0]).toHaveProperty("mass", 77);
  expect(result[0]).toHaveProperty("species", "Human");
  expect(result[0]).toHaveProperty("homeworld", "Tatooine");
});

Deno.test("select from empty data", () => {
  const result = createDataFrame([]);

  // @ts-expect-error - correctly has error for selecting columns from empty DataFrame
  result.select("name", "species");
  console.log("Select from empty data result:", result);

  // Should be empty but still have proper structure
  expect(result.nrows()).toBe(0);
});

Deno.test("select non-existent column should throw", () => {
  expect(() => {
    testData
      // @ts-expect-error - correctly has error
      .select("nonexistent");
  }).toThrow('Column "nonexistent" not found');
});

Deno.test("select preserves data types", () => {
  const typedData = createDataFrame([
    {
      str: "hello",
      num: 42,
      bool: true,
      arr: [1, 2, 3],
      obj: { nested: "value" },
      nullVal: null,
      undefinedVal: undefined,
    },
  ]);

  const result = typedData.select(
    "str",
    "num",
    "bool",
    "arr",
    "obj",
    "nullVal",
    "undefinedVal",
  );
  console.log("Type preservation result:", result);

  // Verify all types are preserved
  expect(result.nrows()).toBe(1);
  expect(result.toArray()[0]).toHaveProperty("str", "hello");
  expect(result.toArray()[0]).toHaveProperty("num", 42);
  expect(result.toArray()[0]).toHaveProperty("bool", true);
  expect(result.toArray()[0]).toHaveProperty("arr");
  expect(result.toArray()[0]).toHaveProperty("obj");
  expect(result.toArray()[0]).toHaveProperty("nullVal", null);
  expect(result.toArray()[0].undefinedVal).toBe(undefined);

  // Verify complex types
  expect(result.toArray()[0].arr).toEqual([1, 2, 3]);
  expect(result.toArray()[0].obj).toEqual({ nested: "value" }); // Object is preserved as object
});

Deno.test("select with duplicate columns", () => {
  const result = testData.select("name", "name", "name");
  console.log("Duplicate columns result:", result);

  // Should deduplicate columns automatically
  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["name"]);
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[1]).toHaveProperty("name", "Chewbacca");
});

Deno.test("select column order is preserved", () => {
  const result = testData.select("species", "name", "id");
  console.log("Column order result:", result);

  // Column order should match the select order
  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["species", "name", "id"]);

  // Verify data and order
  expect(result[0]).toHaveProperty("species", "Human");
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[0]).toHaveProperty("id", 1);
  expect(result[1]).toHaveProperty("species", "Wookiee");
  expect(result[1]).toHaveProperty("name", "Chewbacca");
  expect(result[1]).toHaveProperty("id", 2);
});

Deno.test("select with array syntax", () => {
  const result = testData.select(["name", "species"]);
  console.log("Select array syntax result:", result);

  // Should work the same as rest parameters
  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["name", "species"]);

  // Verify row access
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[0]).toHaveProperty("species", "Human");
  expect(result[1]).toHaveProperty("name", "Chewbacca");
  expect(result[1]).toHaveProperty("species", "Wookiee");

  // Verify columns not present
  expect(result[0]).not.toHaveProperty("id");
  expect(result[0]).not.toHaveProperty("mass");
  expect(result[0]).not.toHaveProperty("homeworld");
});

Deno.test("select array syntax preserves column order", () => {
  const result = testData.select(["species", "name", "id"]);
  console.log("Array syntax column order result:", result);

  // Column order should match the array order
  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["species", "name", "id"]);

  // Verify data and order
  expect(result[0]).toHaveProperty("species", "Human");
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[0]).toHaveProperty("id", 1);
  expect(result[1]).toHaveProperty("species", "Wookiee");
  expect(result[1]).toHaveProperty("name", "Chewbacca");
  expect(result[1]).toHaveProperty("id", 2);
});

Deno.test("select array syntax with single column", () => {
  const result = testData.select(["name"]);
  console.log("Array syntax single column result:", result);

  // Should work the same as single column rest parameter
  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["name"]);

  // Verify row access
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[1]).toHaveProperty("name", "Chewbacca");

  // Verify columns not present
  expect(result[0]).not.toHaveProperty("id");
  expect(result[0]).not.toHaveProperty("mass");
  expect(result[0]).not.toHaveProperty("species");
  expect(result[0]).not.toHaveProperty("homeworld");
});

Deno.test("select array syntax with duplicates", () => {
  const result = testData.select(["name", "name", "name"]);
  console.log("Array syntax duplicates result:", result);

  // Should deduplicate columns automatically
  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["name"]);
  expect(result[0]).toHaveProperty("name", "Luke");
  expect(result[1]).toHaveProperty("name", "Chewbacca");
});
