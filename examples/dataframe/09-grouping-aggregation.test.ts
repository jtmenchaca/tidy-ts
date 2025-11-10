import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Grouping - Basic GroupBy", () => {
  const people = createDataFrame([
    {
      id: 1,
      name: "Luke",
      species: "Human",
      mass: 77,
      height: 172,
      year: 2023,
    },
    {
      id: 2,
      name: "C-3PO",
      species: "Droid",
      mass: 75,
      height: 167,
      year: 2023,
    },
    {
      id: 3,
      name: "R2-D2",
      species: "Droid",
      mass: 32,
      height: 96,
      year: 2023,
    },
    {
      id: 4,
      name: "Darth Vader",
      species: "Human",
      mass: 136,
      height: 202,
      year: 2024,
    },
    {
      id: 5,
      name: "Chewbacca",
      species: "Wookiee",
      mass: 112,
      height: 228,
      year: 2024,
    },
  ]);

  const speciesAnalysis = people
    .groupBy("species")
    .summarise({
      count: (group) => group.nrows(),
      avg_height: (group) => s.round(s.mean(group.height), 1),
      avg_mass: (group) => s.round(s.mean(group.mass), 1),
      max_height: (group) => s.max(group.height),
      min_mass: (group) => s.min(group.mass),
    })
    .arrange("avg_mass", "desc");

  speciesAnalysis.print("Species Analysis:");

  expect(speciesAnalysis.nrows()).toBe(3);
  expect(speciesAnalysis.columns()).toContain("species");
  expect(speciesAnalysis.columns()).toContain("count");
});

Deno.test("Grouping - Multiple Column Grouping", () => {
  const people = createDataFrame([
    {
      id: 1,
      name: "Luke",
      species: "Human",
      mass: 77,
      height: 172,
      year: 2023,
    },
    {
      id: 2,
      name: "C-3PO",
      species: "Droid",
      mass: 75,
      height: 167,
      year: 2023,
    },
    {
      id: 3,
      name: "R2-D2",
      species: "Droid",
      mass: 32,
      height: 96,
      year: 2023,
    },
    {
      id: 4,
      name: "Darth Vader",
      species: "Human",
      mass: 136,
      height: 202,
      year: 2024,
    },
    {
      id: 5,
      name: "Chewbacca",
      species: "Wookiee",
      mass: 112,
      height: 228,
      year: 2024,
    },
  ]);

  const multiGroupAnalysis = people
    .groupBy("species", "year")
    .summarise({
      count: (group) => group.nrows(),
      avg_mass: (group) => s.round(s.mean(group.mass), 1),
      avg_height: (group) => s.round(s.mean(group.height), 1),
      total_mass: (group) => s.sum(group.mass),
    })
    .arrange("species", "year");

  expect(multiGroupAnalysis.nrows()).toBe(4);
});

Deno.test("Grouping - Calculated Categories", () => {
  const people = createDataFrame([
    {
      id: 1,
      name: "Luke",
      species: "Human",
      mass: 77,
      height: 172,
      year: 2023,
    },
    {
      id: 2,
      name: "C-3PO",
      species: "Droid",
      mass: 75,
      height: 167,
      year: 2023,
    },
    {
      id: 3,
      name: "R2-D2",
      species: "Droid",
      mass: 32,
      height: 96,
      year: 2023,
    },
    {
      id: 4,
      name: "Darth Vader",
      species: "Human",
      mass: 136,
      height: 202,
      year: 2024,
    },
    {
      id: 5,
      name: "Chewbacca",
      species: "Wookiee",
      mass: 112,
      height: 228,
      year: 2024,
    },
  ]);

  const categoryAnalysis = people
    .mutate({
      mass_category: (row) => {
        if (row.mass < 50) return "Light";
        if (row.mass < 100) return "Medium";
        return "Heavy";
      },
      height_category: (row) => {
        if (row.height < 150) return "Short";
        if (row.height < 200) return "Medium";
        return "Tall";
      },
    })
    .groupBy(["mass_category", "height_category"])
    .summarise({
      count: (group) => group.nrows(),
      avg_mass: (group) => s.round(s.mean(group.mass), 1),
      avg_height: (group) => s.round(s.mean(group.height), 1),
    })
    .arrange("count", "desc");

  expect(categoryAnalysis.nrows()).toBeGreaterThan(0);
});

Deno.test("Grouping - Conditional Aggregation", () => {
  const people = createDataFrame([
    {
      id: 1,
      name: "Luke",
      species: "Human",
      mass: 77,
      height: 172,
      year: 2023,
    },
    {
      id: 2,
      name: "C-3PO",
      species: "Droid",
      mass: 75,
      height: 167,
      year: 2023,
    },
    {
      id: 3,
      name: "R2-D2",
      species: "Droid",
      mass: 32,
      height: 96,
      year: 2023,
    },
    {
      id: 4,
      name: "Darth Vader",
      species: "Human",
      mass: 136,
      height: 202,
      year: 2024,
    },
    {
      id: 5,
      name: "Chewbacca",
      species: "Wookiee",
      mass: 112,
      height: 228,
      year: 2024,
    },
  ]);

  const basicAnalysis = people
    .groupBy("species")
    .summarise({
      total_count: (group) => group.nrows(),
      heavy_count: (group) => group.filter((row) => row.mass > 100).nrows(),
      avg_mass: (group) => s.round(s.mean(group.mass), 1),
      top_performer: (group) => {
        return group.sliceMax("mass", 1).extractHead("name", 1) || "N/A";
      },
    })
    .arrange("avg_mass", "desc");

  expect(basicAnalysis.nrows()).toBe(3);
});

Deno.test("Grouping - Count Shorthand", () => {
  const people = createDataFrame([
    {
      id: 1,
      name: "Luke",
      species: "Human",
      mass: 77,
      height: 172,
      year: 2023,
    },
    {
      id: 2,
      name: "C-3PO",
      species: "Droid",
      mass: 75,
      height: 167,
      year: 2023,
    },
    {
      id: 3,
      name: "R2-D2",
      species: "Droid",
      mass: 32,
      height: 96,
      year: 2023,
    },
    {
      id: 4,
      name: "Darth Vader",
      species: "Human",
      mass: 136,
      height: 202,
      year: 2024,
    },
    {
      id: 5,
      name: "Chewbacca",
      species: "Wookiee",
      mass: 112,
      height: 228,
      year: 2024,
    },
  ]);

  const countBySpecies = people.count("species");
  expect(countBySpecies.nrows()).toBe(3);
  expect(countBySpecies.columns()).toContain("species");
  expect(countBySpecies.columns()).toContain("count");

  const countBySpeciesAndYear = people.count("species", "year");
  expect(countBySpeciesAndYear.nrows()).toBe(4);
});
