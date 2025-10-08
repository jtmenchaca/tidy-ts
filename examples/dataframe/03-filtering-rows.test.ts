import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "../../tests/shims/test.ts";

test("Filtering Rows with Predicates and Boolean Masks - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  const characters = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
    { id: 6, name: "Leia", species: "Human", mass: 49, height: 150 },
    { id: 7, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
  ]);

  console.log("Original dataset with all characters:");
  characters.print();

  // ============================================================================
  // 2. BASIC FILTERING - Simple single conditions
  // ============================================================================
  console.log("\n=== 2. Basic Filtering - Simple Single Conditions ===");

  // Filter using a simple function predicate
  // Start with the most basic filtering: one condition
  const humans = characters
    .filter((row) => row.species === "Human");

  console.log("Human characters (single condition):");
  humans.print();

  // ============================================================================
  // 3. MULTIPLE CONDITIONS - Combining filters with AND
  // ============================================================================
  console.log("\n=== 3. Multiple Conditions - Combining Filters with AND ===");

  // Filter with multiple conditions using AND logic
  // This shows how to combine multiple criteria
  const tallHumans = characters
    .filter(
      (row) => row.species === "Human" && row.height > 170,
    );

  console.log("Tall human characters (multiple AND conditions):");
  tallHumans.print();

  // ============================================================================
  // 4. COMPLEX LOGIC - Using OR and complex conditions
  // ============================================================================
  console.log("\n=== 4. Complex Logic - Using OR and Complex Conditions ===");

  // Filter with complex logic using OR
  // This demonstrates more sophisticated filtering patterns
  const heavyOrTall = characters
    .filter((row) => {
      const isHeavy = row.mass > 100;
      const isTall = row.height > 200;
      return isHeavy || isTall;
    });

  console.log("Heavy OR tall characters (complex OR logic):");
  heavyOrTall.print();

  // ============================================================================
  // 5. BOOLEAN MASKS - Creating filter arrays
  // ============================================================================
  console.log("\n=== 5. Boolean Masks - Creating Filter Arrays ===");

  // Create boolean arrays for filtering
  // This approach is useful when you want to create reusable filters
  const isHuman = characters.species.map((s) => s === "Human");
  const isHeavy = characters.mass.map((m) => m > 100);
  const isTall = characters.height.map((h) => h > 180);

  console.log("Boolean masks created:");
  console.log("isHuman:", isHuman);
  console.log("isHeavy:", isHeavy);
  console.log("isTall:", isTall);

  // ============================================================================
  // 6. APPLYING BOOLEAN MASKS - Using arrays as filters
  // ============================================================================
  console.log("\n=== 6. Applying Boolean Masks - Using Arrays as Filters ===");

  // Apply boolean masks
  // This shows how to use pre-created boolean arrays for filtering
  const humanHeavy = characters
    .filter(isHuman, isHeavy);

  console.log("Human characters who are heavy (using boolean masks):");
  humanHeavy.print();

  // ============================================================================
  // 7. MIXING APPROACHES - Functions and boolean masks together
  // ============================================================================
  console.log(
    "\n=== 7. Mixing Approaches - Functions and Boolean Masks Together ===",
  );

  // Mix functions and boolean masks
  // This demonstrates the flexibility of the filtering system
  const tallNonHumans = characters
    .filter(
      (row) => row.species !== "Human",
      isTall,
    );

  console.log("Tall non-human characters (function + boolean mask):");
  tallNonHumans.print();

  // ============================================================================
  // 8. STATISTICAL FILTERING - Using calculated values
  // ============================================================================
  console.log("\n=== 8. Statistical Filtering - Using Calculated Values ===");

  // Filter with statistics
  // This shows how to use DataFrame-wide calculations in filters
  const aboveAverageMass = characters
    .filter((row) => row.mass > stats.mean(characters.mass));

  console.log("Characters above average mass:");
  aboveAverageMass.print();

  // ============================================================================
  // 9. STRING OPERATIONS - Text-based filtering
  // ============================================================================
  console.log("\n=== 9. String Operations - Text-Based Filtering ===");

  // Filter with string operations
  // This demonstrates text pattern matching in filters
  const droids = characters
    .filter((row) => row.name.includes("C-3PO") || row.name.includes("R2-D2"));

  console.log("Droid characters (string pattern matching):");
  droids.print();

  // ============================================================================
  // 10. DATA VALIDATION - Filtering for quality
  // ============================================================================
  console.log("\n=== 10. Data Validation - Filtering for Quality ===");

  // Filter with null/undefined handling
  // This shows how to ensure data quality through filtering
  const validData = characters
    .filter((row) => row.mass > 0 && row.height > 0);

  console.log("Characters with valid measurements (data validation):");
  validData.print();

  // ============================================================================
  // 11. ADVANCED FILTERING PATTERNS - Complex scenarios
  // ============================================================================
  console.log("\n=== 11. Advanced Filtering Patterns ===");

  // Show more advanced filtering patterns
  const advancedFilters = characters
    .filter((row) => {
      // Complex nested logic
      if (row.species === "Human") {
        return row.height > 160 && row.mass > 50;
      } else if (row.species === "Droid") {
        return row.mass > 30;
      } else {
        return row.height > 100;
      }
    });

  console.log("Advanced filtering with nested logic:");
  advancedFilters.print();

  // ============================================================================
  // 12. PUTTING IT ALL TOGETHER - Complete filtering workflow
  // ============================================================================
  console.log(
    "\n=== 12. Putting It All Together - Complete Filtering Workflow ===",
  );

  // Show a complete workflow that demonstrates all the filtering concepts
  const finalResult = characters
    .filter((row) => row.mass > 0 && row.height > 0) // Data validation
    .filter((row) => row.species !== "Unknown") // Remove unknowns
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      size_category: (row) => {
        if (row.height > 200) return "Very Tall";
        if (row.height > 170) return "Tall";
        if (row.height > 150) return "Average";
        return "Short";
      },
    })
    .filter((row) => row.bmi > 0) // Additional validation
    .select("name", "species", "mass", "height", "bmi", "size_category");

  console.log("Complete filtering workflow combining all concepts:");
  finalResult.print();

  // Test assertions
  expect(humans.nrows()).toBe(3);
  expect(tallHumans.nrows()).toBe(2);
  expect(heavyOrTall.nrows()).toBe(2);
  expect(humanHeavy.nrows()).toBe(1);
  expect(tallNonHumans.nrows()).toBe(1);
  expect(aboveAverageMass.nrows()).toBeGreaterThan(0);
  expect(droids.nrows()).toBe(2);
  expect(validData.nrows()).toBe(7);
  expect(advancedFilters.nrows()).toBeGreaterThan(0);
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.bmi).toBeDefined();
  expect(finalResult.size_category).toBeDefined();
});
