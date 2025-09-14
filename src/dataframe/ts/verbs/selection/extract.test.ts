import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("pull - basic functionality", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25, city: "NYC" },
    { name: "Bob", age: 30, city: "LA" },
    { name: "Charlie", age: 35, city: "Chicago" },
  ]);

  const names = df.extract("name");
  const ages = df.extract("age");
  const cities = df.extract("city");

  expect(names).toEqual(["Alice", "Bob", "Charlie"]);
  expect(ages).toEqual([25, 30, 35]);
  expect(cities).toEqual(["NYC", "LA", "Chicago"]);
});

Deno.test("pull - with filter", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25, city: "NYC" },
    { name: "Bob", age: 30, city: "LA" },
    { name: "Charlie", age: 35, city: "Chicago" },
  ]);

  const oldNames = df.filter((row) => row.age > 28).extract("name");

  expect(oldNames).toEqual(["Bob", "Charlie"]);
});

Deno.test("pull - empty dataframe", () => {
  const df = createDataFrame([]);

  // @ts-expect-error - name does not exist in empty
  const names = df.extract("name");

  expect(names).toEqual([]);
});

Deno.test("pull - single row", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25 },
  ]);

  const names = df.extract("name");
  const ages = df.extract("age");

  expect(names).toEqual(["Alice"]);
  expect(ages).toEqual([25]);
});
