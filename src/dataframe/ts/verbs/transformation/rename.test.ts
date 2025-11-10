import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Test data
const testData = createDataFrame([
  { id: 1, name: "Luke", mass: 77, species: "Human" },
  { id: 2, name: "Chewbacca", mass: 112, species: "Wookiee" },
]);

Deno.test("rename single column", () => {
  const result = testData.rename({ mass: "weight" });
  console.log("Rename single column result:", result);

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", weight: 77, species: "Human" },
    { id: 2, name: "Chewbacca", weight: 112, species: "Wookiee" },
  ]);
});

Deno.test("rename multiple columns", () => {
  const result = testData.rename({
    name: "character_name",
    mass: "weight",
  });
  result.print();

  expect(result.toArray()).toEqual([
    { id: 1, character_name: "Luke", weight: 77, species: "Human" },
    { id: 2, character_name: "Chewbacca", weight: 112, species: "Wookiee" },
  ]);
});

Deno.test("rename with empty mapping (no change)", () => {
  const result = testData.rename({});
  console.log("Empty mapping result:", result);

  expect(result.toArray()).toEqual(testData.toArray());
});

Deno.test("rename non-existent column should throw", () => {
  expect(() => {
    // @ts-expect-error - Testing runtime error
    testData.rename({ nonexistent: "weight" });
  }).toThrow('Column "nonexistent" not found');
});

Deno.test("rename preserves data types", () => {
  const typedData = createDataFrame([
    {
      str: "hello",
      num: 42,
      bool: true,
      arr: [1, 2, 3],
      obj: { nested: "value" },
    },
  ]);

  const result = typedData.rename({
    str: "string_val",
    num: "number_val",
    bool: "boolean_val",
    arr: "array_val",
    obj: "object_val",
  });

  console.log("Type preservation result:", result);

  expect(result.toArray()).toEqual([
    {
      string_val: "hello",
      number_val: 42,
      boolean_val: true,
      array_val: [1, 2, 3],
      object_val: { nested: "value" },
    },
  ]);
});

Deno.test("rename with numeric keys", () => {
  const dataWithNumericKeys = createDataFrame([
    { 1: "one", 2: "two", name: "test" },
  ]);

  const result = dataWithNumericKeys.rename({ 1: "first", 2: "second" });
  console.log("Numeric keys rename result:", result);

  expect(result.toArray()).toEqual([
    { first: "one", second: "two", name: "test" },
  ]);
});
