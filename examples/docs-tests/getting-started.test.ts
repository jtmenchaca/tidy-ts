import { describe, expect, it } from "bun:test";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

describe("Getting Started", () => {
  it("should demonstrate the quick tutorial example", () => {
    // 1. Create a DataFrame from your data
    const sales = createDataFrame([
      { region: "North", product: "Widget", quantity: 10, price: 100 },
      { region: "North", product: "Gadget", quantity: 5, price: 200 },
      { region: "South", product: "Widget", quantity: 20, price: 100 },
      { region: "South", product: "Gadget", quantity: 15, price: 200 },
      { region: "East", product: "Widget", quantity: 8, price: 100 },
    ]);

    // 2. Transform your data with method chaining
    const analysis = sales
      // Add calculated columns
      .mutate({
        revenue: (r) => r.quantity * r.price,
        category: (r) => r.quantity > 10 ? "High Volume" : "Standard",
      })
      // Group by region
      .groupBy("region")
      // Calculate summary statistics
      .summarize({
        total_revenue: (group) => stats.sum(group.revenue),
        avg_quantity: (group) => stats.mean(group.quantity),
        product_count: (group) => group.nrows(),
        top_product: (group) =>
          group
            .filter((r, _i, group) => r.quantity === stats.max(group.quantity))
            .extractHead("product", 1) ?? "N/A",
      })
      // Sort by revenue (highest first)
      .arrange("total_revenue", "desc");

    // Type check: result should be a DataFrame with summary columns
    const _typeCheck: typeof analysis = analysis;
    void _typeCheck; // Suppress unused variable warning

    // 3. View your results
    analysis.print();

    expect(analysis.nrows()).toBe(3);
    expect(analysis.columns()).toEqual([
      "region",
      "total_revenue",
      "avg_quantity",
      "product_count",
      "top_product",
    ]);

    // Check that South has the highest revenue
    const southRegion = analysis.filter((r) => r.region === "South");
    expect(southRegion.nrows()).toBe(1);
    expect(southRegion.total_revenue[0]).toBe(5000);
  });

  it("should demonstrate creating DataFrames", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
      { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
      { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
    ]);

    // Type check: DataFrame should have correct structure
    const _typeCheck: typeof people = people;
    void _typeCheck; // Suppress unused variable warning

    expect(people.nrows()).toBe(5);
    expect(people.columns()).toEqual([
      "id",
      "name",
      "species",
      "mass",
      "height",
    ]);
    expect(people.name).toEqual([
      "Luke",
      "C-3PO",
      "R2-D2",
      "Darth Vader",
      "Chewbacca",
    ]);
  });

  it("should demonstrate adding columns with mutate", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
      { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
      { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
    ]);

    const example = people
      .mutate({
        // Calculate BMI using the row's mass and height values
        bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
        // Create boolean flags based on conditions
        is_heavy: (r) => r.mass > 100,
        // Use the index parameter to create row numbers (0-based, so add 1)
        row_number: (_r, idx) => idx + 1,
        // Access the entire DataFrame for calculations across all rows
        cumulative_mass: (_r, _idx, df) => {
          return stats.sum(df.mass);
        },
        // Return constant values for all rows
        constant: () => "fixed_value",
      });

    // Type check: result should have new columns
    const _typeCheck: typeof example = example;
    void _typeCheck; // Suppress unused variable warning

    expect(example.nrows()).toBe(5);
    expect(example.columns()).toEqual([
      "id",
      "name",
      "species",
      "mass",
      "height",
      "bmi",
      "is_heavy",
      "row_number",
      "cumulative_mass",
      "constant",
    ]);
    expect(example.is_heavy).toEqual([false, false, false, true, true]);
    expect(example.row_number).toEqual([1, 2, 3, 4, 5]);
    expect(example.constant).toEqual([
      "fixed_value",
      "fixed_value",
      "fixed_value",
      "fixed_value",
      "fixed_value",
    ]);
  });

  it("should demonstrate DataFrame properties", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
      { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    ]);

    // DataFrames have a length property like arrays
    console.log("Number of rows:", people.nrows());
    // Access individual rows using array indexing (0-based)
    console.log("First row:", people[0]);
    console.log("Last row:", people[people.nrows() - 1]);

    expect(people.nrows()).toBe(3);
    expect(people[0]).toEqual({
      id: 1,
      name: "Luke",
      species: "Human",
      mass: 77,
      height: 172,
    });
    expect(people[people.nrows() - 1]).toEqual({
      id: 3,
      name: "R2-D2",
      species: "Droid",
      mass: 32,
      height: 96,
    });
  });

  it("should demonstrate column access", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
      { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    ]);

    // Access entire columns as typed arrays
    const names = people.name; // string[] - all names as an array
    const masses = people.mass; // number[] - all masses as an array
    const species = people.species; // string[] - all species as an array

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

    expect(names).toEqual(["Luke", "C-3PO", "R2-D2"]);
    expect(masses).toEqual([77, 75, 32]);
    expect(species).toEqual(["Human", "Droid", "Droid"]);
    expect(stats.unique(species)).toEqual(["Human", "Droid"]);
  });

  it("should demonstrate TypeScript integration", () => {
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

    // Create a DataFrame from typed data
    const typedDf = createDataFrame(characters);
    // TypeScript knows the exact column types
    const heights: readonly number[] = typedDf.height;

    // Type check: typed DataFrame should preserve types
    const _typeCheck: typeof typedDf = typedDf;
    void _typeCheck; // Suppress unused variable warning

    console.log(
      "Average height:",
      heights.reduce((a, b) => a + b) / heights.length,
    );

    expect(typedDf.nrows()).toBe(2);
    expect(typedDf.columns()).toEqual([
      "id",
      "name",
      "species",
      "mass",
      "height",
    ]);
    expect(heights).toEqual([150, 66]);
    expect(heights.reduce((a, b) => a + b) / heights.length).toBe(108);
  });

  it("should handle empty DataFrames", () => {
    const emptyDf = createDataFrame([]);

    emptyDf.print("Empty DataFrame:");

    expect(emptyDf.nrows()).toBe(0);
    expect(emptyDf.nrows()).toBe(0);
    expect(emptyDf.columns()).toEqual([]);
  });

  it("should handle single row DataFrames", () => {
    const singleRow = createDataFrame([{ id: 1, name: "Test", value: 42 }]);

    singleRow.print("Single row DataFrame:");

    expect(singleRow.nrows()).toBe(1);
    expect(singleRow.nrows()).toBe(1);
    expect(singleRow.columns()).toEqual(["id", "name", "value"]);
    expect(singleRow[0]).toEqual({ id: 1, name: "Test", value: 42 });
  });

  it("should demonstrate chaining operations", () => {
    const data = createDataFrame([
      { id: 1, name: "A", value: 10 },
      { id: 2, name: "B", value: 20 },
      { id: 3, name: "A", value: 30 },
      { id: 4, name: "B", value: 40 },
    ]);

    const result = data
      .filter((r) => r.value > 15)
      .mutate({ doubled: (r) => r.value * 2 })
      .groupBy("name")
      .summarize({
        count: (group) => group.nrows(),
        total: (group) => stats.sum(group.doubled),
      });

    result.print("Chained operations result:");

    expect(result.nrows()).toBe(2);
    expect(result.columns()).toEqual(["name", "count", "total"]);
    expect(result.count).toEqual([2, 1]);
    expect(result.total).toEqual([120, 60]);
  });
});
