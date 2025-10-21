import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("DataFrame Basics - Properties", () => {
  const jediKnights = createDataFrame([
    { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
    { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
  ]);

  expect(jediKnights.nrows()).toBe(3);
  expect(jediKnights.ncols()).toBe(5);
  expect(jediKnights.columns()).toEqual([
    "id",
    "name",
    "species",
    "mass",
    "height",
  ]);
  expect(jediKnights.isEmpty()).toBe(false);
});

Deno.test("DataFrame Basics - Column Access", () => {
  const jediKnights = createDataFrame([
    { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
    { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
  ]);

  const names = jediKnights.name;
  const masses = jediKnights.mass;
  const species = jediKnights.species;

  expect(Array.from(names)).toEqual([
    "Luke Skywalker",
    "Yoda",
    "Obi-Wan Kenobi",
  ]);
  expect(Array.from(masses)).toEqual([77, 17, 77]);
  expect(s.unique(species)).toEqual(["Human", "Unknown"]);
});

Deno.test("DataFrame Basics - Extract Methods", () => {
  const jediKnights = createDataFrame([
    { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
    { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
  ]);

  const allNames = jediKnights.extract("name");
  expect(allNames).toEqual(["Luke Skywalker", "Yoda", "Obi-Wan Kenobi"]);

  const firstJedi = jediKnights.extractHead("name", 1);
  expect(firstJedi).toBe("Luke Skywalker");

  const firstTwo = jediKnights.extractHead("name", 2);
  expect(firstTwo).toEqual(["Luke Skywalker", "Yoda"]);

  const lastJedi = jediKnights.extractTail("name", 1);
  expect(lastJedi).toBe("Obi-Wan Kenobi");

  const thirdJedi = jediKnights.extractNth("name", 2);
  expect(thirdJedi).toBe("Obi-Wan Kenobi");

  const randomJedi = jediKnights.extractSample("name", 2);
  expect(randomJedi.length).toBe(2);
});
