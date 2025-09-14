import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

const mtcars = createDataFrame([
  { name: "Mazda RX4", cyl: 6, disp: 160, hp: 110, vs: 0, am: 1, mpg: 21.0 },
  {
    name: "Mazda RX4 Wag",
    cyl: 6,
    disp: 160,
    hp: 110,
    vs: 0,
    am: 1,
    mpg: 21.0,
  },
  { name: "Datsun 710", cyl: 4, disp: 108, hp: 93, vs: 1, am: 1, mpg: 22.8 },
  {
    name: "Hornet 4 Drive",
    cyl: 6,
    disp: 258,
    hp: 110,
    vs: 1,
    am: 0,
    mpg: 21.4,
  },
  {
    name: "Hornet Sportabout",
    cyl: 8,
    disp: 360,
    hp: 175,
    vs: 0,
    am: 0,
    mpg: 18.7,
  },
  { name: "Valiant", cyl: 6, disp: 225, hp: 105, vs: 1, am: 0, mpg: 18.1 },
]);

Deno.test("arrange single column ascending", () => {
  const result = mtcars.arrange("mpg");

  // Should be sorted by mpg in ascending order
  expect(result[0].mpg).toBe(18.1); // Valiant
  expect(result[1].mpg).toBe(18.7); // Hornet Sportabout
  expect(result[2].mpg).toBe(21.0); // Mazda RX4
  expect(result[3].mpg).toBe(21.0); // Mazda RX4 Wag
  expect(result[4].mpg).toBe(21.4); // Hornet 4 Drive
  expect(result[5].mpg).toBe(22.8); // Datsun 710
});

Deno.test("arrange single column descending", () => {
  const result = mtcars.arrange("mpg", "desc");

  // Should be sorted by mpg in descending order
  expect(result[0].mpg).toBe(22.8); // Datsun 710
  expect(result[1].mpg).toBe(21.4); // Hornet 4 Drive
  expect(result[2].mpg).toBe(21.0); // Mazda RX4
  expect(result[3].mpg).toBe(21.0); // Mazda RX4 Wag
  expect(result[4].mpg).toBe(18.7); // Hornet Sportabout
  expect(result[5].mpg).toBe(18.1); // Valiant
});

Deno.test("arrange multiple columns", () => {
  const result = mtcars.arrange(["cyl", "mpg"], ["desc", "asc"]);

  // Should be sorted by cyl descending first, then mpg ascending within each cyl group
  // 8-cylinder cars first (only Hornet Sportabout)
  expect(result[0].cyl).toBe(8);
  expect(result[0].mpg).toBe(18.7);

  // 6-cylinder cars, sorted by mpg ascending
  expect(result[1].cyl).toBe(6);
  expect(result[1].mpg).toBe(18.1); // Valiant (lowest mpg in 6-cyl group)
  expect(result[2].cyl).toBe(6);
  expect(result[2].mpg).toBe(21.0); // Mazda RX4
  expect(result[3].cyl).toBe(6);
  expect(result[3].mpg).toBe(21.0); // Mazda RX4 Wag
  expect(result[4].cyl).toBe(6);
  expect(result[4].mpg).toBe(21.4); // Hornet 4 Drive (highest mpg in 6-cyl group)

  // 4-cylinder cars last (only Datsun 710)
  expect(result[5].cyl).toBe(4);
  expect(result[5].mpg).toBe(22.8);
});

Deno.test("arrange grouped data", () => {
  const result = mtcars.groupBy("cyl").arrange("mpg");

  // Should maintain grouping in order of first appearance: 6, 4, 8
  // 6-cylinder group, sorted by mpg ascending
  expect(result[0].cyl).toBe(6);
  expect(result[0].mpg).toBe(18.1); // Valiant (lowest mpg in 6-cyl group)
  expect(result[1].cyl).toBe(6);
  expect(result[1].mpg).toBe(21.0); // Mazda RX4
  expect(result[2].cyl).toBe(6);
  expect(result[2].mpg).toBe(21.0); // Mazda RX4 Wag
  expect(result[3].cyl).toBe(6);
  expect(result[3].mpg).toBe(21.4); // Hornet 4 Drive (highest mpg in 6-cyl group)

  // 4-cylinder group
  expect(result[4].cyl).toBe(4);
  expect(result[4].mpg).toBe(22.8);

  // 8-cylinder group
  expect(result[5].cyl).toBe(8);
  expect(result[5].mpg).toBe(18.7);
});

Deno.test("arrange with null values", () => {
  const dataWithNulls = createDataFrame([
    { name: "A", value: 3 },
    { name: "B", value: null },
    { name: "C", value: 1 },
    { name: "D", value: undefined },
    { name: "E", value: 2 },
  ]);

  const result = dataWithNulls.arrange("value");

  // Null/undefined values should be sorted to the end
  expect(result[0].value).toBe(1);
  expect(result[1].value).toBe(2);
  expect(result[2].value).toBe(3);
  expect(result[3].value).toBe(null);
  expect(result[4].value).toBe(undefined);
});

Deno.test("arrange empty dataframe", () => {
  const emptyDf = createDataFrame([] as { mpg: number; name: string }[]);

  const result = emptyDf.arrange("mpg", "desc");

  expect(result.nrows()).toBe(0);
});

Deno.test("arrange with string columns", () => {
  const stringData = createDataFrame([
    { name: "Charlie", age: 30 },
    { name: "Alice", age: 25 },
    { name: "Bob", age: 35 },
  ]);

  const result = stringData.arrange("name");

  // Should be sorted alphabetically
  expect(result[0].name).toBe("Alice");
  expect(result[1].name).toBe("Bob");
  expect(result[2].name).toBe("Charlie");
});

Deno.test("arrange maintains original data integrity", () => {
  const originalData = [...mtcars.toArray()];
  const result = mtcars.arrange("mpg");

  // Original data should be unchanged - check the actual row data
  expect(mtcars.toArray()).toEqual(originalData);

  // Result should have same data but different order
  expect(result.nrows()).toBe(mtcars.nrows());
  expect(result.name.length).toBe(mtcars.name.length);
});

Deno.test("arrange - new API validation", () => {
  const data = createDataFrame([
    { a: 3, b: 1 },
    { a: 1, b: 2 },
    { a: 2, b: 3 },
  ]);

  // Test error on mismatched array lengths
  expect(() => {
    data.arrange(["a", "b"], ["desc"]);
  }).toThrow("Direction array length (1) must match column array length (2)");
});

Deno.test("arrange - multiple columns default ascending", () => {
  const data = createDataFrame([
    { x: 2, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
  ]);

  const result = data.arrange(["x", "y"]);

  // Should sort by x first, then y (both ascending)
  expect(result[0]).toEqual({ x: 1, y: 1 });
  expect(result[1]).toEqual({ x: 1, y: 2 });
  expect(result[2]).toEqual({ x: 2, y: 0 });
  expect(result[3]).toEqual({ x: 2, y: 1 });
});

Deno.test("arrange - mixed directions", () => {
  const data = createDataFrame([
    { x: 2, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
  ]);

  const result = data.arrange(["x", "y"], ["asc", "desc"]);

  // Should sort by x ascending, then y descending
  expect(result[0]).toEqual({ x: 1, y: 2 });
  expect(result[1]).toEqual({ x: 1, y: 1 });
  expect(result[2]).toEqual({ x: 2, y: 1 });
  expect(result[3]).toEqual({ x: 2, y: 0 });
});

Deno.test("arrange - Date comparison", () => {
  const df = createDataFrame([
    { name: "Luke", birth_date: new Date("1990-01-01") },
    { name: "Leia", birth_date: new Date("1985-06-15") },
    { name: "Anakin", birth_date: new Date("1980-12-25") },
  ]);

  // Sort by birth date ascending
  const result = df.arrange("birth_date");

  expect(result.nrows()).toBe(3);
  expect(result[0].name).toBe("Anakin"); // 1980
  expect(result[1].name).toBe("Leia"); // 1985
  expect(result[2].name).toBe("Luke"); // 1990

  // Sort by birth date descending
  const resultDesc = df.arrange("birth_date", "desc");

  expect(resultDesc.nrows()).toBe(3);
  expect(resultDesc[0].name).toBe("Luke"); // 1990
  expect(resultDesc[1].name).toBe("Leia"); // 1985
  expect(resultDesc[2].name).toBe("Anakin"); // 1980
});

Deno.test("arrange - mixed Date and non-Date columns", () => {
  const df = createDataFrame([
    { name: "Luke", birth_date: new Date("1990-01-01"), age: 30 },
    { name: "Leia", birth_date: new Date("1985-06-15"), age: 35 },
    { name: "Anakin", birth_date: new Date("1980-12-25"), age: 40 },
    { name: "Obi-Wan", birth_date: new Date("1980-12-25"), age: 45 }, // Same date, different age
  ]);

  // Sort by birth_date first, then age
  const result = df.arrange(["birth_date", "age"]);

  expect(result.nrows()).toBe(4);
  expect(result[0].name).toBe("Anakin"); // 1980, age 40
  expect(result[1].name).toBe("Obi-Wan"); // 1980, age 45
  expect(result[2].name).toBe("Leia"); // 1985, age 35
  expect(result[3].name).toBe("Luke"); // 1990, age 30
});

Deno.test("arrange - Date with null values", () => {
  const df = createDataFrame([
    { name: "Luke", birth_date: new Date("1990-01-01") },
    { name: "Unknown", birth_date: null },
    { name: "Leia", birth_date: new Date("1985-06-15") },
  ]);

  // Sort by birth_date (nulls should be handled appropriately)
  const result = df.arrange("birth_date");

  expect(result.nrows()).toBe(3);
  // null dates should be sorted to the end
  expect(result[0].name).toBe("Leia"); // 1985
  expect(result[1].name).toBe("Luke"); // 1990
  expect(result[2].name).toBe("Unknown"); // null
});
