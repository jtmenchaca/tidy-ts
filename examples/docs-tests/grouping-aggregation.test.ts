import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { stats } from "@tidy-ts/dataframe";

describe("Grouping and Aggregation", () => {
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

  it("should perform basic groupBy and summarise", () => {
    const speciesAnalysis = people
      .groupBy("species")
      .summarise({
        count: (group) => group.nrows(),
        avg_height: (group) => stats.round(stats.mean(group.height), 1),
        avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
        max_height: (group) => stats.max(group.height),
        min_mass: (group) => stats.min(group.mass),
      })
      .arrange("avg_mass", "desc");

    // Type check: groupBy and summarise create new DataFrame with summary columns
    const _speciesAnalysisTypeCheck: DataFrame<{
      species: string;
      count: number;
      avg_height: number;
      avg_mass: number;
      max_height: number;
      min_mass: number;
    }> = speciesAnalysis;
    void _speciesAnalysisTypeCheck; // Suppress unused variable warning

    speciesAnalysis.print("Species analysis:");

    expect(speciesAnalysis.nrows()).toBe(3); // 3 species
    expect(speciesAnalysis.columns()).toEqual([
      "species",
      "count",
      "avg_height",
      "avg_mass",
      "max_height",
      "min_mass",
    ]);

    // Check that Wookiee has highest avg_mass (should be first after arrange desc)
    const speciesData = speciesAnalysis.toArray();
    expect(speciesData[0]?.species).toBe("Wookiee");
    expect(speciesData[0]?.avg_mass).toBe(112); // Wookiee has highest mass
  });

  it("should group by multiple columns", () => {
    const multiGroupAnalysis = people
      .groupBy("species", "year")
      .summarise({
        count: (group) => group.nrows(),
        avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
        avg_height: (group) => stats.round(stats.mean(group.height), 1),
        total_mass: (group) => stats.sum(group.mass),
      })
      .arrange("species", "year");

    // Type check: result should be a DataFrame with summary columns
    const _typeCheck: DataFrame<{
      species: string;
      year: number;
      count: number;
      avg_mass: number;
      avg_height: number;
      total_mass: number;
    }> = multiGroupAnalysis;
    void _typeCheck; // Suppress unused variable warning

    multiGroupAnalysis.print("Multi-column grouping analysis:");

    expect(multiGroupAnalysis.nrows()).toBe(4); // 4 unique combinations
    expect(multiGroupAnalysis.columns()).toEqual([
      "species",
      "year",
      "count",
      "avg_mass",
      "avg_height",
      "total_mass",
    ]);

    // Check specific groups
    const human2023 = multiGroupAnalysis.filter((row) =>
      row.species === "Human" && row.year === 2023
    );
    expect(human2023.nrows()).toBe(1);
    const human2023Data = human2023.toArray();
    expect(human2023Data[0]?.count).toBe(1);
    expect(human2023Data[0]?.avg_mass).toBe(77.0);
  });

  it("should group by calculated categories", () => {
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
        avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
        avg_height: (group) => stats.round(stats.mean(group.height), 1),
      })
      .arrange("count", "desc");

    // Type check: result should be a DataFrame with summary columns
    const _typeCheck: DataFrame<{
      mass_category: "Light" | "Medium" | "Heavy";
      height_category: "Medium" | "Short" | "Tall";
      count: number;
      avg_mass: number;
      avg_height: number;
    }> = categoryAnalysis;
    void _typeCheck; // Suppress unused variable warning

    categoryAnalysis.print("Category analysis:");

    expect(categoryAnalysis.nrows()).toBeGreaterThan(0);
    expect(categoryAnalysis.columns()).toEqual([
      "mass_category",
      "height_category",
      "count",
      "avg_mass",
      "avg_height",
    ]);
  });

  it("should perform basic aggregation with conditional logic", () => {
    const basicAnalysis = people
      .groupBy("species")
      .summarise({
        total_count: (group) => group.nrows(),
        heavy_count: (group) => group.filter((row) => row.mass > 100).nrows(),
        avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
        top_performer: (group) => {
          return group.sliceMax("mass", 1).extractHead("name", 1) || "N/A";
        },
      })
      .arrange("avg_mass", "desc");

    // Type check: result should be a DataFrame with summary columns
    const _typeCheck: DataFrame<{
      species: string;
      total_count: number;
      heavy_count: number;
      avg_mass: number;
      top_performer: string;
    }> = basicAnalysis;
    void _typeCheck; // Suppress unused variable warning

    basicAnalysis.print("Basic species analysis:");

    expect(basicAnalysis.nrows()).toBe(3); // 3 species
    expect(basicAnalysis.columns()).toEqual([
      "species",
      "total_count",
      "heavy_count",
      "avg_mass",
      "top_performer",
    ]);

    // Check that Wookiee has highest avg_mass (should be first after arrange desc)
    const speciesData = basicAnalysis.toArray();
    expect(speciesData[0]?.species).toBe("Wookiee");
    expect(speciesData[0]?.avg_mass).toBe(112); // Wookiee has highest mass
  });
});
