import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "../../tests/shims/test.ts";

test("Selecting and Managing Columns - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  const starWars = createDataFrame([
    {
      id: 1,
      name: "Luke",
      species: "Human",
      mass: 77,
      height: 172,
      homeworld: "Tatooine",
    },
    {
      id: 2,
      name: "Leia",
      species: "Human",
      mass: 49,
      height: 150,
      homeworld: "Alderaan",
    },
    {
      id: 3,
      name: "Han",
      species: "Human",
      mass: 80,
      height: 180,
      homeworld: "Corellia",
    },
    {
      id: 4,
      name: "Chewbacca",
      species: "Wookiee",
      mass: 112,
      height: 228,
      homeworld: "Kashyyyk",
    },
    {
      id: 5,
      name: "C-3PO",
      species: "Droid",
      mass: 75,
      height: 167,
      homeworld: "Tatooine",
    },
  ]);

  // Type check: DataFrame creation preserves exact types
  const _starWarsTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    homeworld: string;
  }> = starWars;

  console.log("Original dataset with all columns:");
  starWars.print();

  // ============================================================================
  // 2. BASIC SELECT - Choosing specific columns
  // ============================================================================
  console.log("\n=== 2. Basic Select - Choosing Specific Columns ===");

  // Select only the columns you need
  // Start with the simplest case: selecting a few columns
  const basic = starWars
    .select("name", "species", "mass");

  // Type check: select preserves only the selected columns
  const _basicTypeCheck: DataFrame<{
    name: string;
    species: string;
    mass: number;
  }> = basic;

  console.log("Selected basic columns (name, species, mass):");
  basic.print();

  // ============================================================================
  // 3. COLUMN REORDERING - Changing the sequence
  // ============================================================================
  console.log("\n=== 3. Column Reordering - Changing the Sequence ===");

  // Select columns in a specific order
  // This is useful when you want to present data in a particular sequence
  const reordered = starWars
    .select("species", "name", "height");

  // Type check: select preserves types in the specified order
  const _reorderedTypeCheck: DataFrame<{
    species: string;
    name: string;
    height: number;
  }> = reordered;

  console.log("Reordered columns (species, name, height):");
  reordered.print();

  // ============================================================================
  // 4. DROPPING COLUMNS - Removing unwanted data
  // ============================================================================
  console.log("\n=== 4. Dropping Columns - Removing Unwanted Data ===");

  // Remove columns you don't need
  // Start with dropping one column, then multiple
  const withoutIds = starWars
    .drop("id", "homeworld");

  // Type check: drop removes specified columns
  const _withoutIdsTypeCheck: DataFrame<{
    name: string;
    species: string;
    mass: number;
    height: number;
  }> = withoutIds;

  console.log("Removed id and homeworld columns:");
  withoutIds.print();

  // ============================================================================
  // 5. RENAMING COLUMNS - Making names clearer
  // ============================================================================
  console.log("\n=== 5. Renaming Columns - Making Names Clearer ===");

  // Rename columns for clarity
  // This is especially useful when working with data from different sources
  const renamed = starWars
    .select("name", "species", "mass", "height")
    .rename({
      character: "name",
      species_type: "species",
      weight_kg: "mass",
      height_cm: "height",
    });

  console.log("Renamed columns for clarity:");
  renamed.print();

  // ============================================================================
  // 6. CHAINING OPERATIONS - Combining multiple steps
  // ============================================================================
  console.log("\n=== 6. Chaining Operations - Combining Multiple Steps ===");

  // Combine select, drop, and rename in a pipeline
  // This shows how operations can be chained together for complex transformations
  const cleaned = starWars
    .drop("id") // Remove ID column
    .select("name", "species", "mass", "height") // Keep specific columns
    .rename({ character_name: "name" }); // Rename for clarity

  console.log("Chained operations (drop → select → rename):");
  cleaned.print();

  // ============================================================================
  // 7. COLUMN ACCESS AFTER TRANSFORMATIONS - Working with results
  // ============================================================================
  console.log("\n=== 7. Column Access After Transformations ===");

  // Column access still works after transformations
  // This demonstrates that the DataFrame maintains its structure
  const characterNames = cleaned.character_name;
  const masses = cleaned.mass;

  console.log("Character names:", characterNames);
  console.log("Total mass:", stats.sum(masses), "kg");

  // ============================================================================
  // 8. ADVANCED SELECTION PATTERNS - More complex scenarios
  // ============================================================================
  console.log("\n=== 8. Advanced Selection Patterns ===");

  // Show more complex selection scenarios
  const advancedSelection = starWars
    .select("name", "species", "mass", "height")
    .rename({
      character_name: "name",
      weight: "mass",
      stature: "height",
    })
    .drop("species"); // Remove species after renaming others

  console.log("Advanced selection with multiple transformations:");
  advancedSelection.print();

  // ============================================================================
  // 9. WORKING WITH NUMERIC COLUMNS - Mathematical operations
  // ============================================================================
  console.log("\n=== 9. Working with Numeric Columns ===");

  // Demonstrate how to work with numeric columns after selection
  const numericData = starWars
    .select("name", "mass", "height")
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      mass_percentile: (row, _index, df) =>
        stats.percentileRank(df.mass, row.mass),
    });

  console.log("Added calculations to numeric columns:");
  numericData.print();

  // ============================================================================
  // 10. PUTTING IT ALL TOGETHER - Complete workflow
  // ============================================================================
  console.log("\n=== 10. Putting It All Together ===");

  // Show a complete workflow that demonstrates all the concepts
  const finalResult = starWars
    .drop("id") // Remove unnecessary columns
    .select("name", "species", "mass", "height", "homeworld") // Keep relevant columns
    .rename({
      character: "name",
      origin: "homeworld",
      weight: "mass",
      stature: "height",
    }) // Rename for clarity
    .mutate({
      bmi: (row) => row.weight / Math.pow(row.stature / 100, 2),
      is_tall: (row) => row.stature > 170,
    }) // Add calculated columns
    .select(
      "character",
      "species",
      "weight",
      "stature",
      "bmi",
      "is_tall",
      "origin",
    ); // Final selection

  console.log("Complete workflow combining all concepts:");
  finalResult.print();

  // Test assertions - verify the data structure and types work correctly
  expect(basic.nrows()).toBe(5);
  expect(withoutIds.nrows()).toBe(5);
  expect(renamed.nrows()).toBe(5);
  expect(cleaned.nrows()).toBe(5);
  expect(characterNames.length).toBe(5);
  expect(advancedSelection.nrows()).toBe(5);
  expect(numericData.nrows()).toBe(5);
  expect(finalResult.nrows()).toBe(5);

  // Verify we can access the data correctly
  expect(basic[0]).toHaveProperty("name");
  expect(basic[0]).toHaveProperty("species");
  expect(basic[0]).toHaveProperty("mass");
  expect(basic[0]).not.toHaveProperty("id");
  expect(basic[0]).not.toHaveProperty("homeworld");

  // Verify the chained operations work
  expect(cleaned[0]).toHaveProperty("character_name");
  expect(cleaned[0]).toHaveProperty("species");
  expect(cleaned[0]).toHaveProperty("mass");
  expect(cleaned[0]).toHaveProperty("height");
  expect(cleaned[0]).not.toHaveProperty("name"); // Should be renamed to character_name
  expect(cleaned[0]).not.toHaveProperty("id"); // Should be dropped

  // Verify the final result has all expected columns
  expect(finalResult[0]).toHaveProperty("character");
  expect(finalResult[0]).toHaveProperty("bmi");
  expect(finalResult[0]).toHaveProperty("is_tall");
});
