import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("innerJoin - basic numeric keys", () => {
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

  const result = characters.innerJoin(planets, "id");

  result.print();

  console.log(result);

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human", homeworld: "Tatooine" },
    { id: 2, name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
  ]);
});

Deno.test("innerJoin - string keys", () => {
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

  const result = characters.innerJoin(planets, "name");

  expect(result.toArray()).toEqual([
    { name: "Luke", species: "Human", homeworld: "Tatooine" },
    { name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
  ]);
});

Deno.test("innerJoin - empty left dataframe", () => {
  const empty = createDataFrame([]);
  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 2, homeworld: "Kashyyyk" },
  ]);

  // @ts-expect-error - id does not exist in empty
  const result = empty.innerJoin(planets, "id");

  result.print();

  expect(result.toArray()).toEqual([]);
});

Deno.test("innerJoin - empty right dataframe", () => {
  const emptyData: { fake_id: number; homeworld: string }[] = [];

  const characters = createDataFrame([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
  ]);
  const empty = createDataFrame(emptyData);

  // When right side is empty, inner join returns empty
  // @ts-expect-error - "id" column does not exist on empty DataFrame
  const result = characters.innerJoin(empty, "id");

  expect(result.toArray()).toEqual([]);
});

Deno.test("innerJoin - no matching keys", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 3, homeworld: "Tatooine" },
    { id: 4, homeworld: "Kashyyyk" },
  ]);

  const result = characters.innerJoin(planets, "id");

  result.print();

  expect(result.toArray()).toEqual([]);
});

Deno.test("innerJoin - duplicate keys in left", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 1, name: "Anakin" }, // Duplicate id
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 3, homeworld: "Alderaan" },
  ]);

  const result = characters.innerJoin(planets, "id");

  result.print();

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Anakin", homeworld: "Tatooine" },
  ]);
});

Deno.test("innerJoin - duplicate keys in right", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 1, homeworld: "Lars Farm" }, // Duplicate id
    { id: 3, homeworld: "Alderaan" },
  ]);

  const result = characters.innerJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Luke", homeworld: "Lars Farm" },
  ]);
});

Deno.test("innerJoin - duplicate keys in both (Cartesian product)", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 1, name: "Anakin" }, // Duplicate
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 1, homeworld: "Lars Farm" }, // Duplicate
  ]);

  const result = characters.innerJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Luke", homeworld: "Lars Farm" },
    { id: 1, name: "Anakin", homeworld: "Tatooine" },
    { id: 1, name: "Anakin", homeworld: "Lars Farm" },
  ]);
});

Deno.test("innerJoin - all matching keys", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 2, homeworld: "Alderaan" },
  ]);

  const result = characters.innerJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 2, name: "Leia", homeworld: "Alderaan" },
  ]);
});

Deno.test("innerJoin - column collision handling with suffixes", () => {
  const left = createDataFrame([
    { id: 1, x: 10, y: "left_y" },
  ]);

  const right = createDataFrame([
    { id: 1, x: 99, y: "right_y", z: "extra" },
  ]);

  const result = left.innerJoin(right, "id", {
    suffixes: { left: "_left", right: "_right" },
  });

  expect(result.toArray()).toEqual([
    {
      id: 1,
      x_left: 10, // left x gets suffix
      y_left: "left_y", // left y gets suffix
      x_right: 99, // right x gets suffix
      y_right: "right_y", // right y gets suffix
      z: "extra", // no collision, added as-is
    },
  ]);
});

Deno.test("innerJoin - default suffixes", () => {
  const left = createDataFrame([
    { id: 1, x: 10, y: "left_y" },
  ]);

  const right = createDataFrame([
    { id: 1, x: 99, y: "right_y" },
  ]);

  const result = left.innerJoin(right, "id"); // uses default suffixes

  expect(result.toArray()).toEqual([
    {
      id: 1,
      x: 10, // left x preserved
      y: "left_y", // left y preserved
      x_y: 99, // right x gets default "_y" suffix
      y_y: "right_y", // right y gets default "_y" suffix
    },
  ]);
});

Deno.test("innerJoin - join key preservation", () => {
  const left = createDataFrame([
    { id: 1, x: 10 },
  ]);

  const right = createDataFrame([
    { id: 1, x: 99 },
  ]);

  const result = left.innerJoin(right, "id");

  // The left join key should be preserved, right join key dropped
  expect(result[0].id).toBe(1);
  expect(result[0].x).toBe(10); // left x preserved
});
