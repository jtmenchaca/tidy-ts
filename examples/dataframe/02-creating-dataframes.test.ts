import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Creating DataFrames - Basic DataFrame", () => {
  const jediKnights = createDataFrame([
    {
      id: 1,
      name: "Luke Skywalker",
      species: "Human",
      homeworld: "Tatooine",
      lightsaber_color: "blue",
      rank: "Jedi Knight",
    },
    {
      id: 2,
      name: "Obi-Wan Kenobi",
      species: "Human",
      homeworld: "Stewjon",
      lightsaber_color: "blue",
      rank: "Jedi Master",
    },
    {
      id: 3,
      name: "Yoda",
      species: "Unknown",
      homeworld: "Unknown",
      lightsaber_color: "green",
      rank: "Grand Master",
    },
  ]);

  jediKnights.print("Jedi Knights DataFrame:");

  expect(jediKnights.nrows()).toBe(3);
  expect(jediKnights.ncols()).toBe(6);
  expect(jediKnights.columns()).toEqual([
    "id",
    "name",
    "species",
    "homeworld",
    "lightsaber_color",
    "rank",
  ]);
});

Deno.test("Creating DataFrames - TypeScript Type Safety", () => {
  type Character = {
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
  };

  const characters: Character[] = [
    { id: 6, name: "Leia", species: "Human", mass: 49, height: 150 },
    { id: 7, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
  ];

  const typedDf = createDataFrame(characters);
  const _typeCheck: DataFrame<Character> = typedDf;

  const heights1: number[] = typedDf.extract("height");
  const heights2: readonly number[] = typedDf.height;

  expect(heights1).toEqual([150, 66]);
  expect(Array.from(heights2)).toEqual([150, 66]);
});
