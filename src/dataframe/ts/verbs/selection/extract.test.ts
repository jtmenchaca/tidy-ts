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

Deno.test("extractUnique - basic functionality", () => {
  const df = createDataFrame([
    { category: "A", value: 10 },
    { category: "B", value: 20 },
    { category: "A", value: 30 },
    { category: "C", value: 40 },
    { category: "B", value: 50 },
  ]);

  const uniqueCategories = df.extractUnique("category");
  const uniqueValues = df.extractUnique("value");

  expect(uniqueCategories).toEqual(["A", "B", "C"]);
  expect(uniqueValues).toEqual([10, 20, 30, 40, 50]);
});

Deno.test("extractUnique - with duplicates", () => {
  const df = createDataFrame([
    { age: 25, city: "NYC" },
    { age: 30, city: "LA" },
    { age: 25, city: "NYC" },
    { age: 30, city: "Chicago" },
    { age: 25, city: "LA" },
  ]);

  const uniqueAges = df.extractUnique("age");
  const uniqueCities = df.extractUnique("city");

  expect(uniqueAges).toEqual([25, 30]);
  expect(uniqueCities).toEqual(["NYC", "LA", "Chicago"]);
});

Deno.test("extractUnique - all unique", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ]);

  const uniqueIds = df.extractUnique("id");
  const uniqueNames = df.extractUnique("name");

  expect(uniqueIds).toEqual([1, 2, 3]);
  expect(uniqueNames).toEqual(["Alice", "Bob", "Charlie"]);
});

Deno.test("extractUnique - all same", () => {
  const df = createDataFrame([
    { status: "active", value: 10 },
    { status: "active", value: 20 },
    { status: "active", value: 30 },
  ]);

  const uniqueStatuses = df.extractUnique("status");

  expect(uniqueStatuses).toEqual(["active"]);
});

Deno.test("extractUnique - empty dataframe", () => {
  const df = createDataFrame([]);

  // @ts-expect-error - category does not exist in empty
  const uniqueCategories = df.extractUnique("category");

  expect(uniqueCategories).toEqual([]);
});

Deno.test("extractUnique - with filter", () => {
  const df = createDataFrame([
    { name: "Alice", department: "Engineering", level: "Senior" },
    { name: "Bob", department: "Sales", level: "Junior" },
    { name: "Charlie", department: "Engineering", level: "Senior" },
    { name: "David", department: "Engineering", level: "Mid" },
  ]);

  const engineeringLevels = df
    .filter((row) => row.department === "Engineering")
    .extractUnique("level");

  expect(engineeringLevels).toEqual(["Senior", "Mid"]);
});

Deno.test("extractUnique - null and undefined handling", () => {
  type TestRow = {
    id: number;
    category: string | null | undefined;
  };

  const df = createDataFrame([
    { id: 1, category: "A" },
    { id: 2, category: null },
    { id: 3, category: "B" },
    { id: 4, category: undefined },
    { id: 5, category: "A" },
    { id: 6, category: null },
  ]);

  const uniqueCategories = df.extractUnique("category");

  // Set preserves distinct values including null and undefined
  expect(uniqueCategories.length).toBe(4); // "A", "B", null, undefined
  expect(uniqueCategories).toContain("A");
  expect(uniqueCategories).toContain("B");
  expect(uniqueCategories).toContain(null);
  expect(uniqueCategories).toContain(undefined);
});
