import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Filtering Rows - Basic Filtering by Numeric", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  const tallPeople = people.filter((row) => row.height > 180);

  expect(tallPeople.nrows()).toBe(2);
  expect(tallPeople.name).toEqual(["Darth Vader", "Chewbacca"]);
});

Deno.test("Filtering Rows - Basic Filtering by String", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  const humans = people.filter((row) => row.species === "Human");

  expect(humans.nrows()).toBe(2);
  expect(humans.name).toEqual(["Luke", "Darth Vader"]);
});

Deno.test("Filtering Rows - Multiple Conditions", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  const tallHumans = people.filter(
    (row) => row.height > 180 && row.species === "Human",
  );

  expect(tallHumans.nrows()).toBe(1);
  expect(tallHumans.name).toEqual(["Darth Vader"]);
});

Deno.test("Filtering Rows - With Parameters", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  const avgMass = s.mean(people.mass);
  const withParameters = people.filter((row, index, df) => {
    const isHeavy = row.mass > 100;
    const isFirstHalf = index < df.nrows() / 2;
    const isAboveAverage = row.mass > avgMass;
    return isHeavy && isFirstHalf && isAboveAverage;
  });

  expect(withParameters.nrows()).toBe(0);
});

Deno.test("Filtering Rows - With Calculations", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  const withCalculations = people
    .mutate({
      is_heavy: (row) => row.mass > 100,
    })
    .filter((row) => row.is_heavy);

  expect(withCalculations.nrows()).toBe(2);
  expect(withCalculations.name).toEqual(["Darth Vader", "Chewbacca"]);
});

Deno.test("Filtering Rows - Chained Filtering", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  const chainedFilter = people
    .filter((row) => row.species === "Human")
    .filter((row) => row.height > 170);

  expect(chainedFilter.nrows()).toBe(2);
  expect(chainedFilter.name).toEqual(["Luke", "Darth Vader"]);
});
