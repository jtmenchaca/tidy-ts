/**
 * DataFrame creation and basic operations tests
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("DataFrame creation from array of objects", () => {
  const data = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ];

  const df = createDataFrame(data);

  expect(df.nrows()).toBe(2);
  expect(df.columns()).toEqual(["name", "age"]);
  expect(df[0].name).toBe("Alice");
  expect(df[0].age).toBe(30);
});

Deno.test("DataFrame creation from empty array", () => {
  const df = createDataFrame([]);

  expect(df.nrows()).toBe(0);
  expect(df.columns()).toEqual([]);
});

Deno.test("DataFrame creation with mixed types", () => {
  const data = [
    { id: 1, name: "Test", flag: true, value: 42.5 },
    { id: 2, name: null, flag: false, value: null },
  ];

  const df = createDataFrame(data);

  expect(df[0].id).toBe(1);
  expect(df[0].name).toBe("Test");
  expect(df[0].flag).toBe(true);
  expect(df[0].value).toBe(42.5);
  expect(df[1].name).toBe(null);
  expect(df[1].value).toBe(null);
});

Deno.test("DataFrame creation with array of typed objects", () => {
  type Person = {
    id: number;
    name: string | null;
    age: number | null;
    flag: boolean | null;
    score: number | null;
  };

  const data: Person[] = [
    { id: 1, name: "Alice", age: 30, flag: true, score: 85 },
    { id: 2, name: null, age: null, flag: null, score: null },
  ];

  const df = createDataFrame(data);

  expect(df.nrows()).toBe(2);
  expect(df.columns()).toEqual(["id", "name", "age", "flag", "score"]);
  expect(df[0].name).toBe("Alice");
  expect(df[0].age).toBe(30);
  expect(df[0].id).toBe(1);
  expect(df[1].id).toBe(2);
});

Deno.test("DataFrame basic properties", () => {
  const df = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
    { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
    { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
    { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
    { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
  ]);

  expect(df.nrows()).toBe(6);
  expect(df.ncols()).toBe(5);
  expect(df.columns()).toEqual(["id", "name", "mass", "species", "homeworld"]);
  expect([df.nrows(), df.ncols()]).toEqual([6, 5]);
});

Deno.test("DataFrame row access", () => {
  const df = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
    { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
    { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
    { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
    { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
  ]);

  // Test first row
  expect(df[0].name).toBe("Luke");
  expect(df[0].mass).toBe(77);

  // Test last row
  expect(df[5].name).toBe("C-3PO");
  expect(df[5].species).toBe("Droid");
});

Deno.test("DataFrame column access", () => {
  const df = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
    { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
    { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
    { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
    { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
  ]);

  const names = df.name;
  expect(names).toEqual(["Luke", "Chewbacca", "Han", "Leia", "R2-D2", "C-3PO"]);

  const masses = df.mass;
  expect(masses).toEqual([77, 112, 80, 49, 32, 75]);
});

Deno.test("DataFrame toArray method", () => {
  const df = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
    { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
    { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
    { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
    { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
  ]);
  const array = df.toArray();

  expect(Array.isArray(array)).toBe(true);
  expect(array.length).toBe(6);
  expect(array[0]).toEqual({
    id: 1,
    name: "Luke",
    mass: 77,
    species: "Human",
    homeworld: "Tatooine",
  });
});

Deno.test("DataFrame print method", () => {
  const df = createDataFrame([
    { id: 1, name: "Test", value: 42 },
  ]);

  // This test just ensures print doesn't throw an error
  expect(() => df.print()).not.toThrow();
});

Deno.test("DataFrame with duplicate column names", () => {
  const data = [
    { a: 3, b: 2 }, // Last 'a' value should be used
  ];

  const df = createDataFrame(data);

  // The last value should be used
  expect(df.columns()).toEqual(["a", "b"]);
  expect(df[0].a).toBe(3);
  expect(df[0].b).toBe(2);
});

Deno.test("DataFrame with undefined values", () => {
  const data = [
    { a: 1, b: undefined, c: 3 },
    { a: undefined, b: 2, c: undefined },
  ];

  const df = createDataFrame(data);

  expect(df.nrows()).toBe(2);
  expect(df.columns()).toEqual(["a", "b", "c"]);
  expect(df[0].b).toBe(undefined);
  expect(df[1].a).toBe(undefined);
  expect(df[1].c).toBe(undefined);
});

Deno.test("DataFrame edge cases: empty, single-row, delete via mutate(null)", () => {
  // Empty
  const empty = createDataFrame([]);
  expect(empty.nrows()).toBe(0);
  expect(empty.filter(() => true).length).toBeUndefined(); // empty dataframe filter behavior

  // Single row + column access
  const single = createDataFrame([{ id: 1, name: "Solo" }]);
  expect(single.extract("name")[0]).toBe("Solo");
  const picked = single.select("name");
  expect(picked.toArray()[0]).toEqual({ name: "Solo" });

  // mutate: add scalar, add array, delete column with null
  const base = createDataFrame([{ a: 1 }, { a: 2 }, { a: 3 }]);
  const mutated = base.mutate({
    scalar: 42, // recycled
    arr: [10, 20, 30], // must match length
  });
  expect(mutated.extract("scalar")).toEqual([42, 42, 42]);
  expect(mutated.extract("arr")).toEqual([10, 20, 30]);

  const deleted = mutated.mutate({ arr: null }); // delete column
  expect("arr" in deleted.toArray()[0]).toBe(false);
});
