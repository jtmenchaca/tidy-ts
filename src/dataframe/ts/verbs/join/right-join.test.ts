import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("rightJoin - basic numeric keys", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
    { id: 3, name: "Leia", species: "Human" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 2, homeworld: "Kashyyyk" },
    { id: 4, homeworld: "Alderaan" }, // No matching character
  ]);

  const result = characters.rightJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human", homeworld: "Tatooine" },
    { id: 2, name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
    { id: 4, name: undefined, species: undefined, homeworld: "Alderaan" },
  ]);
});

Deno.test("rightJoin - string keys", () => {
  const characters = createDataFrame([
    { name: "Luke", species: "Human" },
    { name: "Chewbacca", species: "Wookiee" },
    { name: "Leia", species: "Human" },
  ]);

  const planets = createDataFrame([
    { name: "Luke", homeworld: "Tatooine" },
    { name: "Chewbacca", homeworld: "Kashyyyk" },
    { name: "Vader", homeworld: "Tatooine" }, // No matching character
  ]);

  const result = characters.rightJoin(planets, "name");

  expect(result.toArray()).toEqual([
    { name: "Luke", species: "Human", homeworld: "Tatooine" },
    { name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
    { name: "Vader", species: undefined, homeworld: "Tatooine" },
  ]);
});

Deno.test("rightJoin - empty left dataframe", () => {
  const empty = createDataFrame([]);
  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 2, homeworld: "Kashyyyk" },
  ]);

  const result = empty
    // @ts-expect-error - empty dataframe
    .rightJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: undefined, homeworld: "Tatooine" },
    { id: 2, name: undefined, homeworld: "Kashyyyk" },
  ]);
});

Deno.test("rightJoin - empty right dataframe", () => {
  const emptyData: { fake_id: number; homeworld: string }[] = [];

  const characters = createDataFrame([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
  ]);
  const empty = createDataFrame(emptyData);

  // When right side is empty, right join returns empty
  // @ts-expect-error - "id" column does not exist on empty DataFrame
  const result = characters.rightJoin(empty, "id");

  expect(result.toArray()).toEqual([]);
});

Deno.test("rightJoin - duplicate keys in right", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 1, homeworld: "Lars Farm" }, // Duplicate id
    { id: 3, homeworld: "Alderaan" },
  ]);

  const result = characters.rightJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Luke", homeworld: "Lars Farm" },
    { id: 3, name: undefined, homeworld: "Alderaan" },
  ]);
});

Deno.test("rightJoin - duplicate keys in left", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 1, name: "Anakin" }, // Duplicate id
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 3, homeworld: "Alderaan" },
  ]);

  const result = characters.rightJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Anakin", homeworld: "Tatooine" },
    { id: 3, name: undefined, homeworld: "Alderaan" },
  ]);
});

Deno.test("rightJoin - all rows from right with no matches", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 3, homeworld: "Tatooine" },
    { id: 4, homeworld: "Kashyyyk" },
    { id: 5, homeworld: "Alderaan" },
  ]);

  const result = characters.rightJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 3, name: undefined, homeworld: "Tatooine" },
    { id: 4, name: undefined, homeworld: "Kashyyyk" },
    { id: 5, name: undefined, homeworld: "Alderaan" },
  ]);
});

Deno.test("rightJoin - column collision handling with suffixes", () => {
  const left = createDataFrame([
    { id: 1, x: 10, y: "left_y" },
    { id: 2, x: 20, y: "left_y2" },
  ]);

  const right = createDataFrame([
    { id: 2, x: 99, y: "right_y", z: "extra" },
    { id: 3, x: 999, y: "right_y3", z: "extra3" },
  ]);

  const result = left.rightJoin(right, "id", {
    suffixes: { left: "_left", right: "_right" },
  });

  expect(result.toArray()).toEqual([
    {
      id: 2,
      x_right: 99, // right x gets suffix
      y_right: "right_y", // right y gets suffix
      x_left: 20, // left x with suffix
      y_left: "left_y2", // left y with suffix
      z: "extra", // no collision, added as-is
    },
    {
      id: 3,
      x_right: 999, // right x gets suffix
      y_right: "right_y3", // right y gets suffix
      x_left: undefined, // no left match
      y_left: undefined, // no left match
      z: "extra3", // no collision, added as-is
    },
  ]);
});

Deno.test("rightJoin - default suffixes", () => {
  const left = createDataFrame([
    { id: 1, x: 10, y: "left_y" },
  ]);

  const right = createDataFrame([
    { id: 1, x: 99, y: "right_y" },
  ]);

  const result = left.rightJoin(right, "id"); // uses default suffixes

  expect(result.toArray()).toEqual([
    {
      id: 1,
      x: 10, // left x gets no suffix
      y: "left_y", // left y gets no suffix
      x_y: 99, // right x gets default "_y" suffix
      y_y: "right_y", // right y gets default "_y" suffix
    },
  ]);
});

Deno.test("rightJoin - array alignment safety", () => {
  const left = createDataFrame([
    { id: 1, a: "l1" },
    { id: 2, a: "l2" },
  ]);

  const right = createDataFrame([
    { id: 2, b: "r2" },
    { id: 3, b: "r3" },
  ]);

  const result = left.rightJoin(right, "id");

  // Should not throw, lengths should match
  expect(result.nrows()).toBe(2);
  expect(result.filter((r) => r.id === 3).extract("b")[0]).toBe("r3");
  expect(result.filter((r) => r.id === 2).extract("a")[0]).toBe("l2");
});
