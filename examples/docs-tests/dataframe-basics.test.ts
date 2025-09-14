import { describe, expect, it } from "bun:test";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

describe("DataFrame Basics", () => {
  const jediKnights = createDataFrame([
    { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
    { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
  ]);

  it("should provide basic DataFrame properties", () => {
    // Get basic properties
    const numberOfRows = jediKnights.nrows();
    const numberOfColumns = jediKnights.ncols();
    const columnNames = jediKnights.columns();
    const isEmpty = jediKnights.isEmpty();

    // Type check: properties should have correct types
    const _rowsTypeCheck: number = numberOfRows;
    const _colsTypeCheck: number = numberOfColumns;
    const _namesTypeCheck: string[] = columnNames;
    const _isEmptyTypeCheck: boolean = isEmpty;
    void _rowsTypeCheck; // Suppress unused variable warning
    void _colsTypeCheck;
    void _namesTypeCheck;
    void _isEmptyTypeCheck;

    jediKnights.print("Jedi Knights DataFrame:");

    expect(numberOfRows).toBe(3);
    expect(numberOfColumns).toBe(5);
    expect(columnNames).toEqual(["id", "name", "species", "mass", "height"]);
    expect(isEmpty).toBe(false);
  });

  it("should support chained print operations", () => {
    const result = jediKnights
      .print("Jedi Knights DataFrame before mutation:")
      .mutate({
        doubleMass: (r) => r.mass * 2,
      })
      .print("Jedi Knights DataFrame after mutation:");

    // Type check: result should be a DataFrame
    const _resultTypeCheck: typeof jediKnights = jediKnights;
    void _resultTypeCheck; // Suppress unused variable warning

    expect(result.nrows()).toBe(3);
    expect(result.columns()).toEqual([
      "id",
      "name",
      "species",
      "mass",
      "height",
      "doubleMass",
    ]);
    expect(result.doubleMass).toEqual([154, 34, 154]);
  });

  it("should provide basic column access with dot notation", () => {
    // Get all values from a column - TypeScript knows the exact types
    const names = jediKnights.name; // readonly string[] - all names
    const masses = jediKnights.mass; // readonly number[] - all masses
    const species = jediKnights.species; // readonly string[] - all species

    // Type check: columns should have correct types
    const _namesTypeCheck: readonly string[] = names;
    const _massesTypeCheck: readonly number[] = masses;
    const _speciesTypeCheck: readonly string[] = species;
    void _namesTypeCheck; // Suppress unused variable warning
    void _massesTypeCheck;
    void _speciesTypeCheck;

    console.log("All names:", names);
    console.log("All masses:", masses);
    console.log("Unique species:", stats.unique(species));

    expect(names).toEqual(["Luke Skywalker", "Yoda", "Obi-Wan Kenobi"]);
    expect(masses).toEqual([77, 17, 77]);
    expect(species).toEqual(["Human", "Unknown", "Human"]);
    expect(stats.unique(species)).toEqual(["Human", "Unknown"]);
  });

  it("should work with array functions for analysis", () => {
    const masses = jediKnights.mass;
    const heights = jediKnights.height;

    // Use with any array function for quick analysis
    const avgMass = masses.reduce((sum, mass) => sum + mass, 0) / masses.length;
    const maxHeight = Math.max(...heights);

    // or use the stats module
    const avgMassTidy = stats.mean(masses);
    const maxHeightTidy = stats.max(heights);

    console.log("Average mass:", avgMass);
    console.log("Max height:", maxHeight);
    console.log("Tidy Average mass:", avgMassTidy);
    console.log("Tidy Max height:", maxHeightTidy);

    expect(avgMass).toBe(57);
    expect(maxHeight).toBe(182);
    expect(avgMassTidy).toBe(57);
    expect(maxHeightTidy).toBe(182);
  });

  it("should support extract methods for getting mutable data", () => {
    // Basic extract - get all values (mutable copy)
    const allNames = jediKnights.extract("name");
    console.log("All names:", allNames);

    // Type check: extract should return mutable array
    const _allNamesTypeCheck: string[] = allNames;
    void _allNamesTypeCheck; // Suppress unused variable warning

    expect(allNames).toEqual(["Luke Skywalker", "Yoda", "Obi-Wan Kenobi"]);
    expect(Array.isArray(allNames)).toBe(true);
  });

  it("should support extractHead method", () => {
    const firstJedi = jediKnights.extractHead("name", 1); // Single value
    const firstTwo = jediKnights.extractHead("name", 2); // Array of 2 values

    // Type check: extractHead should return correct types
    const _firstJediTypeCheck: string | undefined = firstJedi;
    const _firstTwoTypeCheck: string[] = firstTwo;
    void _firstJediTypeCheck; // Suppress unused variable warning
    void _firstTwoTypeCheck;

    console.log("First Jedi:", firstJedi);
    console.log("First two:", firstTwo);

    expect(firstJedi).toBe("Luke Skywalker");
    expect(firstTwo).toEqual(["Luke Skywalker", "Yoda"]);
  });

  it("should support extractTail method", () => {
    const lastJedi = jediKnights.extractTail("name", 1); // Single value
    const lastTwo = jediKnights.extractTail("name", 2); // Array of 2 values

    // Type check: extractTail should return correct types
    const _lastJediTypeCheck: string | undefined = lastJedi;
    const _lastTwoTypeCheck: string[] = lastTwo;
    void _lastJediTypeCheck; // Suppress unused variable warning
    void _lastTwoTypeCheck;

    console.log("Last Jedi:", lastJedi);
    console.log("Last two:", lastTwo);

    expect(lastJedi).toBe("Obi-Wan Kenobi");
    expect(lastTwo).toEqual(["Yoda", "Obi-Wan Kenobi"]);
  });

  it("should support extractNth method", () => {
    const thirdJedi = jediKnights.extractNth("name", 2); // Value at index 2

    // Type check: extractNth should return correct type
    const _thirdJediTypeCheck: string | undefined = thirdJedi;
    void _thirdJediTypeCheck; // Suppress unused variable warning

    console.log("Third Jedi:", thirdJedi);

    expect(thirdJedi).toBe("Obi-Wan Kenobi");
  });

  it("should support extractSample method", () => {
    const randomJedi = jediKnights.extractSample("name", 2);

    // Type check: extractSample should return array
    const _randomJediTypeCheck: string[] = randomJedi;
    void _randomJediTypeCheck; // Suppress unused variable warning

    console.log("Random sample:", randomJedi);

    expect(Array.isArray(randomJedi)).toBe(true);
    expect(randomJedi.length).toBe(2);
    expect(randomJedi.every((name) => typeof name === "string")).toBe(true);
  });

  it("should handle empty DataFrames", () => {
    const emptyDf = createDataFrame([]);

    emptyDf.print("Empty DataFrame:");

    expect(emptyDf.nrows()).toBe(0);
    expect(emptyDf.ncols()).toBe(0);
    expect(emptyDf.columns()).toEqual([]);
    expect(emptyDf.isEmpty()).toBe(true);
  });

  it("should handle single row DataFrames", () => {
    const singleRow = createDataFrame([{ id: 1, name: "Test", value: 42 }]);

    singleRow.print("Single row DataFrame:");

    expect(singleRow.nrows()).toBe(1);
    expect(singleRow.ncols()).toBe(3);
    expect(singleRow.columns()).toEqual(["id", "name", "value"]);
    expect(singleRow.isEmpty()).toBe(false);
    expect(singleRow.name).toEqual(["Test"]);
  });
});
