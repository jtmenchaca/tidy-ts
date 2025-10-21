import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Selecting Columns - Select Specific Columns", () => {
  const jedi = createDataFrame([
    {
      id: 1,
      name: "Luke Skywalker",
      age: 19,
      planet: "Tatooine",
      midichlorianCount: 15000,
    },
    {
      id: 2,
      name: "Obi-Wan Kenobi",
      age: 57,
      planet: "Stewjon",
      midichlorianCount: 13000,
    },
    {
      id: 3,
      name: "Yoda",
      age: 900,
      planet: "Unknown",
      midichlorianCount: 17000,
    },
  ]);

  const selected = jedi.select("name", "age");

  expect(selected.ncols()).toBe(2);
  expect(selected.columns()).toEqual(["name", "age"]);
  expect(selected.nrows()).toBe(3);
});

Deno.test("Selecting Columns - Drop Specific Columns", () => {
  const jedi = createDataFrame([
    {
      id: 1,
      name: "Luke Skywalker",
      age: 19,
      planet: "Tatooine",
      midichlorianCount: 15000,
    },
    {
      id: 2,
      name: "Obi-Wan Kenobi",
      age: 57,
      planet: "Stewjon",
      midichlorianCount: 13000,
    },
    {
      id: 3,
      name: "Yoda",
      age: 900,
      planet: "Unknown",
      midichlorianCount: 17000,
    },
  ]);

  const dropped = jedi.drop("id", "planet");

  expect(dropped.ncols()).toBe(3);
  expect(dropped.columns()).toEqual(["name", "age", "midichlorianCount"]);
});

Deno.test("Selecting Columns - Access Individual Columns", () => {
  const jedi = createDataFrame([
    {
      id: 1,
      name: "Luke Skywalker",
      age: 19,
      planet: "Tatooine",
      midichlorianCount: 15000,
    },
    {
      id: 2,
      name: "Obi-Wan Kenobi",
      age: 57,
      planet: "Stewjon",
      midichlorianCount: 13000,
    },
  ]);

  const names = jedi.name;
  const ages = jedi.age;

  expect(Array.from(names)).toEqual(["Luke Skywalker", "Obi-Wan Kenobi"]);
  expect(Array.from(ages)).toEqual([19, 57]);
});

Deno.test("Selecting Columns - Extract Specific Values", () => {
  const jedi = createDataFrame([
    {
      id: 1,
      name: "Luke Skywalker",
      age: 19,
      planet: "Tatooine",
      midichlorianCount: 15000,
    },
    {
      id: 2,
      name: "Obi-Wan Kenobi",
      age: 57,
      planet: "Stewjon",
      midichlorianCount: 13000,
    },
    {
      id: 3,
      name: "Yoda",
      age: 900,
      planet: "Unknown",
      midichlorianCount: 17000,
    },
  ]);

  const firstJedi = jedi.extractHead("name", 1);
  expect(firstJedi).toBe("Luke Skywalker");

  const lastJedi = jedi.extractTail("name", 1);
  expect(lastJedi).toBe("Yoda");

  const allNames = jedi.extract("name");
  expect(allNames).toEqual(["Luke Skywalker", "Obi-Wan Kenobi", "Yoda"]);
});
