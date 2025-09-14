import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Filtering Rows", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  it("should filter by basic conditions", () => {
    // Filter by numeric conditions
    const tallPeople = people.filter((row) => row.height > 180);

    // Type check: filter preserves exact types
    const _tallPeopleTypeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      mass: number;
      height: number;
    }> = tallPeople;
    void _tallPeopleTypeCheck; // Suppress unused variable warning

    tallPeople.print("People taller than 180cm:");

    expect(tallPeople.nrows()).toBe(2);
    expect(tallPeople.toArray()).toEqual([
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
      { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
    ]);

    // Filter by string conditions
    const humans = people.filter((row) => row.species === "Human");
    humans.print("Only humans:");

    expect(humans.nrows()).toBe(2);
    expect(humans.toArray()).toEqual([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    ]);

    // Filter by multiple conditions
    const tallHumans = people.filter(
      (row) => row.height > 180 && row.species === "Human",
    );
    tallHumans.print("Tall humans (height > 180cm AND species = Human):");

    expect(tallHumans.nrows()).toBe(1);
    expect(tallHumans.toArray()).toEqual([
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    ]);
  });

  it("should use filter parameters (row, index, df)", () => {
    const withParameters = people
      .filter((row, index, df) => {
        // row: Access current row's values
        const isHeavy = row.mass > 100;

        // index: Get the current row's position (0-based)
        const isFirstHalf = index < df.nrows() / 2;

        // df: Access the entire DataFrame for relative comparisons
        const isAboveAverage = row.mass > 50;

        // Combine all three for sophisticated filtering
        return isHeavy && isFirstHalf && isAboveAverage;
      });

    // Type check: result should be a DataFrame with same structure
    const _typeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      mass: number;
      height: number;
    }> = withParameters;
    void _typeCheck; // Suppress unused variable warning

    withParameters.print("Filtered using all three parameters:");

    expect(withParameters.nrows()).toBe(0);
    expect(withParameters.toArray()).toEqual([]);
  });

  it("should filter with calculated values", () => {
    const withCalculations = people
      .mutate({
        is_heavy: (row) => row.mass > 100,
      })
      .filter((row) => row.is_heavy);

    // Type check: result should be a DataFrame with additional columns
    const _typeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      mass: number;
      height: number;
      is_heavy: boolean;
    }> = withCalculations;
    void _typeCheck; // Suppress unused variable warning

    withCalculations.print("Heavy characters (mass > 100):");

    expect(withCalculations.nrows()).toBe(2);
    expect(withCalculations.columns()).toContain("is_heavy");
  });

  it("should chain multiple filters", () => {
    // Chain multiple filters
    const chainedFilter = people
      .filter((row) => row.species === "Human")
      .filter((row) => row.height > 170);

    // Type check: result should be a DataFrame with same structure
    const _typeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      mass: number;
      height: number;
    }> = chainedFilter;
    void _typeCheck; // Suppress unused variable warning

    chainedFilter.print("Tall humans (chained filters):");

    expect(chainedFilter.nrows()).toBe(2);
    expect(chainedFilter.toArray()).toEqual([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    ]);
  });
});
