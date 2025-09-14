import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

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

Deno.test("innerJoin", () => {
  const innerJoinResult = characters.innerJoin(planets, "id");
  console.log(innerJoinResult);
  expect(innerJoinResult.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human", homeworld: "Tatooine" },
    { id: 2, name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
  ]);
});

Deno.test("leftJoin", () => {
  const leftJoinResult = characters.leftJoin(planets, "id");
  console.log(leftJoinResult);
  expect(leftJoinResult.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human", homeworld: "Tatooine" },
    { id: 2, name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
    { id: 3, name: "Leia", species: "Human", homeworld: undefined },
  ]);
});

// Test with string keys
const stringCharacters = createDataFrame([
  { name: "Luke", species: "Human" },
  { name: "Chewbacca", species: "Wookiee" },
  { name: "Leia", species: "Human" },
]);

const stringPlanets = createDataFrame([
  { name: "Luke", homeworld: "Tatooine" },
  { name: "Chewbacca", homeworld: "Kashyyyk" },
  { name: "Vader", homeworld: "Tatooine" }, // No matching character
]);

Deno.test("innerJoin with string keys", () => {
  const innerJoinResult = stringCharacters.innerJoin(stringPlanets, "name");
  console.log("String inner join result:", innerJoinResult);
  expect(innerJoinResult.toArray()).toEqual([
    { name: "Luke", species: "Human", homeworld: "Tatooine" },
    { name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
  ]);
});

Deno.test("leftJoin with string keys", () => {
  const leftJoinResult = stringCharacters.leftJoin(stringPlanets, "name");
  console.log("String left join result:", leftJoinResult);
  expect(leftJoinResult.toArray()).toEqual([
    { name: "Luke", species: "Human", homeworld: "Tatooine" },
    { name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
    { name: "Leia", species: "Human", homeworld: undefined },
  ]);
});
