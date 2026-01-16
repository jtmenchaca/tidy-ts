import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("outerJoin - basic numeric keys", () => {
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

  const result = characters.outerJoin(planets, "id");

  // OuterJoin<L,R,K> → (L\K)? ∪ (R\K)? ∪ Pick<L,K>
  // Key field remains required, non-key fields from both sides become T | undefined
  const _outerJoinTypeCheck: DataFrame<{
    id: number; // Key field (required)
    name: string | undefined; // Non-key field from L (explicit undefined)
    species: string | undefined; // Non-key field from L (explicit undefined)
    homeworld: string | undefined; // Non-key field from R (explicit undefined)
  }> = result;

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human", homeworld: "Tatooine" },
    { id: 2, name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
    { id: 3, name: "Leia", species: "Human", homeworld: undefined },
    {
      id: 4, // Key field should not be undefined - comes from right side
      name: undefined,
      species: undefined,
      homeworld: "Alderaan",
    },
  ]);
});

Deno.test("outerJoin - string keys", () => {
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

  const result = characters.outerJoin(planets, "name");

  expect(result.toArray()).toEqual([
    { name: "Luke", species: "Human", homeworld: "Tatooine" },
    { name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
    { name: "Leia", species: "Human", homeworld: undefined },
    { name: "Vader", species: undefined, homeworld: "Tatooine" },
  ]);
});

Deno.test("outerJoin - empty left dataframe", () => {
  const empty = createDataFrame([]);
  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 2, homeworld: "Kashyyyk" },
  ]);

  // @ts-expect-error - id does not exist in empty
  const result = empty.outerJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: undefined, homeworld: "Tatooine" },
    { id: 2, name: undefined, homeworld: "Kashyyyk" },
  ]);
});

Deno.test("outerJoin - empty right dataframe", () => {
  const emptyData: { fake_id: number; homeworld: string }[] = [];

  const characters = createDataFrame([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
  ]);
  const empty = createDataFrame(emptyData);

  // @ts-expect-error - "id" column does not exist on empty DataFrame
  const result = characters.outerJoin(empty, "id");

  // This should never execute due to the type error above
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
  ]);
});

Deno.test("outerJoin - both dataframes empty", () => {
  const empty1 = createDataFrame([]);
  const empty2 = createDataFrame([]);

  // @ts-expect-error - id does not exist in empty
  const result = empty1.outerJoin(empty2, "id");

  expect(result.toArray()).toEqual([]);
});

Deno.test("outerJoin - no matching keys", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 3, homeworld: "Tatooine" },
    { id: 4, homeworld: "Kashyyyk" },
  ]);

  const result = characters.outerJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: undefined },
    { id: 2, name: "Leia", homeworld: undefined },
    { id: 3, name: undefined, homeworld: "Tatooine" },
    { id: 4, name: undefined, homeworld: "Kashyyyk" },
  ]);
});

Deno.test("outerJoin - duplicate keys in both", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 1, name: "Anakin" }, // Duplicate
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 1, homeworld: "Lars Farm" }, // Duplicate
    { id: 3, homeworld: "Alderaan" },
  ]);

  const result = characters.outerJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 1, name: "Luke", homeworld: "Lars Farm" },
    { id: 1, name: "Anakin", homeworld: "Tatooine" },
    { id: 1, name: "Anakin", homeworld: "Lars Farm" },
    { id: 2, name: "Leia", homeworld: undefined },
    { id: 3, name: undefined, homeworld: "Alderaan" },
  ]);
});

Deno.test("outerJoin - all matching keys", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const planets = createDataFrame([
    { id: 1, homeworld: "Tatooine" },
    { id: 2, homeworld: "Alderaan" },
  ]);

  const result = characters.outerJoin(planets, "id");

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 2, name: "Leia", homeworld: "Alderaan" },
  ]);
});
