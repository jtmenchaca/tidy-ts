import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Async Operations", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  // Simulate async API enrichment - more realistic example
  async function enrichWithExternalData(mass: number): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate API delay
    if (mass > 100) return "🦣 Heavy Class";
    if (mass > 50) return "🐘 Medium Class";
    return "🐧 Light Class";
  }

  it("should handle async mutate operations", async () => {
    // Mix sync and async operations
    const withAsyncData = await people
      .mutate({
        name_upper: (row) => row.name.toUpperCase(), // Sync operation
        classification: async (row) => await enrichWithExternalData(row.mass), // Async operation
      });

    // Type check: result should be a DataFrame with new columns
    const _typeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      mass: number;
      height: number;
      name_upper: string;
      classification: string;
    }> = withAsyncData;
    void _typeCheck; // Suppress unused variable warning

    withAsyncData.print("DataFrame with async operations:");

    expect(withAsyncData.nrows()).toBe(5);
    expect(withAsyncData.columns()).toEqual([
      "id",
      "name",
      "species",
      "mass",
      "height",
      "name_upper",
      "classification",
    ]);
    expect(withAsyncData.name_upper).toEqual([
      "LUKE",
      "C-3PO",
      "R2-D2",
      "DARTH VADER",
      "CHEWBACCA",
    ]);
    expect(withAsyncData.classification).toEqual([
      "🐘 Medium Class",
      "🐘 Medium Class",
      "🐧 Light Class",
      "🦣 Heavy Class",
      "🦣 Heavy Class",
    ]);
  });

  it("should handle async filtering", async () => {
    // Async validation function - more realistic example
    async function validateCharacter(species: string): Promise<boolean> {
      await new Promise((resolve) => setTimeout(resolve, 1));
      // Simulate API validation - exclude droids
      return !species.includes("Droid");
    }

    // Async filter with external validation
    const validatedCharacters = await people
      .filter(async (row) => await validateCharacter(row.species));

    // Type check: result should be a DataFrame with same structure
    const _typeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      mass: number;
      height: number;
    }> = validatedCharacters;
    void _typeCheck; // Suppress unused variable warning

    validatedCharacters.print("Validated characters (excluding droids):");

    expect(validatedCharacters.nrows()).toBe(3);
    expect(validatedCharacters.toArray().map((r) => r.name)).toEqual([
      "Luke",
      "Darth Vader",
      "Chewbacca",
    ]);
    expect(validatedCharacters.species).toEqual(["Human", "Human", "Wookiee"]);
  });

  it("should handle async aggregation", async () => {
    // Async function to fetch species metadata - more realistic example
    async function fetchSpeciesMetadata(species: string): Promise<number> {
      await new Promise((resolve) => setTimeout(resolve, 1));
      const metadata = { "Human": 79, "Droid": 200, "Wookiee": 400 };
      return metadata[species as keyof typeof metadata] || 100;
    }

    // Async aggregation
    const speciesAnalysis = await people
      .groupBy("species")
      .summarise({
        count: (group) => group.nrows(),
        expected_lifespan: async (group) => {
          const species = group.extractHead("species", 1) || "";
          return await fetchSpeciesMetadata(species);
        },
      });

    // Type check: result should be a DataFrame with summary columns
    const _typeCheck: DataFrame<{
      species: string;
      count: number;
      expected_lifespan: number;
    }> = speciesAnalysis;
    void _typeCheck; // Suppress unused variable warning

    speciesAnalysis.print("Species analysis with lifespan metadata:");

    expect(speciesAnalysis.nrows()).toBe(3);
    expect(speciesAnalysis.columns()).toEqual([
      "species",
      "count",
      "expected_lifespan",
    ]);

    // Check specific values
    const humanGroup = speciesAnalysis.filter((r) => r.species === "Human");
    expect(humanGroup.nrows()).toBe(1);
    expect(humanGroup.count).toEqual([2]);
    expect(humanGroup.expected_lifespan).toEqual([79]);
  });

  it("should handle basic async operations with concurrency", async () => {
    // Simple async operation with concurrency control
    const result = await people
      .mutate({
        fetched_data: async (row) => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return `Data for ${row.name}`;
        },
      }, {
        retry: { backoff: "exponential" },
        concurrency: 2,
      });

    // Type check: result should be a DataFrame with new columns
    const _typeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      mass: number;
      height: number;
      fetched_data: string;
    }> = result;
    void _typeCheck; // Suppress unused variable warning

    result.print("DataFrame with async fetched data:");

    expect(result.nrows()).toBe(5);
    expect(result.columns()).toContain("fetched_data");
  });
});
