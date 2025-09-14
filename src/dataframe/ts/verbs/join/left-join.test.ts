import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("leftJoin - basic numeric keys", () => {
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

  const result = characters.leftJoin(planets, "id");

  // LeftJoin<L,R,K> → L ∪ (R\K)?
  // Effect: Non-key fields from R become T | undefined (not optional T?)
  // TODO: Fix type system to return homeworld: string | undefined instead of homeworld?: string | undefined
  // const _leftJoinTypeCheck: DataFrame<{
  //   id: number;          // Key field (from L)
  //   name: string;        // Non-key field from L (required)
  //   species: string;     // Non-key field from L (required)
  //   homeworld: string | undefined; // Non-key field from R (explicit undefined)
  // }> = result;

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human", homeworld: "Tatooine" },
    { id: 2, name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
    { id: 3, name: "Leia", species: "Human", homeworld: undefined },
  ]);
});

Deno.test("leftJoin - string keys", () => {
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

  const result = characters.leftJoin(planets, "name");

  // LeftJoin with string keys
  // TODO: Fix type system
  // const _leftJoinStringTypeCheck: DataFrame<{
  //   name: string;        // Key field (from L)
  //   species: string;     // Non-key field from L (required)
  //   homeworld: string | undefined; // Non-key field from R (explicit undefined)
  // }> = result;

  expect(result.toArray()).toEqual([
    { name: "Luke", species: "Human", homeworld: "Tatooine" },
    { name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
    { name: "Leia", species: "Human", homeworld: undefined },
  ]);
});

Deno.test("leftJoin - empty left dataframe", () => {
  const empty = createDataFrame([]);
  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 2, homeworld: "Kashyyyk" },
  ]);

  // @ts-expect-error - id does not exist in empty
  const result = empty.leftJoin(planets, "id");

  expect(result.toArray()).toEqual([]);
});

Deno.test("leftJoin - empty right dataframe", () => {
  const emptyData: { fake_id: number; homeworld: string }[] = [];

  const characters = createDataFrame([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
  ]);
  const empty = createDataFrame(emptyData);

  // @ts-expect-error - id does not exist in empty
  const result = characters.leftJoin(empty, "id");

  // When right DataFrame is empty, LEFT JOIN keeps all left rows
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
  ]);
});

Deno.test("leftJoin - no matching keys", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 3, homeworld: "Tatooine" },
    { id: 4, homeworld: "Kashyyyk" },
  ]);

  const result = characters.leftJoin(planets, "id");

  // LeftJoin no matches - all R fields should be undefined
  const _leftJoinNoMatchTypeCheck: DataFrame<{
    id: number; // Key field (from L)
    name: string; // Non-key field from L (required)
    homeworld: string | undefined; // Non-key field from R (explicit undefined)
  }> = result;

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: undefined },
    { id: 2, name: "Leia", homeworld: undefined },
  ]);
});

Deno.test("leftJoin - duplicate keys in left", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 1, name: "Anakin" }, // Duplicate id
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 3, homeworld: "Alderaan" },
  ]);

  const result = characters.leftJoin(planets, "id");

  // LeftJoin with duplicate keys in left
  const _leftJoinDuplicateLeftTypeCheck: DataFrame<{
    id: number; // Key field (from L)
    name: string; // Non-key field from L (required)
    homeworld: string | undefined; // Non-key field from R (explicit undefined)
  }> = result;

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Anakin", homeworld: "Tatooine" },
    { id: 2, name: "Leia", homeworld: undefined },
  ]);
});

Deno.test("leftJoin - duplicate keys in right", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 1, homeworld: "Lars Farm" }, // Duplicate id
    { id: 3, homeworld: "Alderaan" },
  ]);

  const result = characters.leftJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Luke", homeworld: "Lars Farm" },
    { id: 2, name: "Leia", homeworld: undefined },
  ]);
});

Deno.test("leftJoin - duplicate keys in both (Cartesian product)", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 1, name: "Anakin" }, // Duplicate
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 1, homeworld: "Lars Farm" }, // Duplicate
  ]);

  const result = characters.leftJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Luke", homeworld: "Lars Farm" },
    { id: 1, name: "Anakin", homeworld: "Tatooine" },
    { id: 1, name: "Anakin", homeworld: "Lars Farm" },
    { id: 2, name: "Leia", homeworld: undefined },
  ]);
});

Deno.test("leftJoin - all rows from left with matches", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
    { id: 3, name: "Han" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 2, homeworld: "Alderaan" },
    { id: 3, homeworld: "Corellia" },
  ]);

  const result = characters.leftJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 2, name: "Leia", homeworld: "Alderaan" },
    { id: 3, name: "Han", homeworld: "Corellia" },
  ]);
});
