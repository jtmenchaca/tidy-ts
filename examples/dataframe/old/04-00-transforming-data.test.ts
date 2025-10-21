import { createDataFrame, stats, str } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "@tests/shims";

test("Transforming and Mutating Data - Progressive Examples", () => {
  const characters = createDataFrame([
    { id: 1, name: "Luke", mass: 77, height: 172, birth_year: "19BBY" },
    { id: 2, name: "Leia", mass: 49, height: 150, birth_year: "19BBY" },
    { id: 3, name: "Han", mass: 80, height: 180, birth_year: "29BBY" },
    { id: 4, name: "Chewbacca", mass: 112, height: 228, birth_year: "200BBY" },
    { id: 5, name: "C-3PO", mass: 75, height: 167, birth_year: "112BBY" },
  ]);

  console.log("=== Original Data ===");
  characters.print();

  // ============================================================================
  // 1. SIMPLE MUTATE - Adding one column
  // ============================================================================
  console.log("\n=== 1. Simple Mutate - One Column ===");

  // Start with the simplest case: adding one calculated column
  const withHeightM = characters
    .mutate({
      height_m: (row) => row.height / 100,
    });

  console.log("Added height in meters:");
  withHeightM.print();

  // ============================================================================
  // 2. MULTIPLE COLUMNS - Adding several simple columns
  // ============================================================================
  console.log("\n=== 2. Multiple Columns - Simple Calculations ===");

  // Add multiple columns with simple calculations
  const withBasicColumns = characters
    .mutate({
      height_m: (row) => row.height / 100,
      is_tall: (row) => row.height > 170,
      is_heavy: (row) => row.mass > 75,
      name_length: (row) => row.name.length,
    });

  console.log("Added multiple basic columns:");
  withBasicColumns.print();

  // ============================================================================
  // 3. USING STATS FUNCTIONS - Statistical operations
  // ============================================================================
  console.log("\n=== 3. Using Stats Functions ===");

  // Use the stats module for more complex calculations
  const withStats = characters
    .mutate({
      height_m: (row) => row.height / 100,
      bmi: (row) => {
        const heightM = row.height / 100;
        return stats.round(row.mass / Math.pow(heightM, 2), 1);
      },
      mass_percentile: (row, _index, df) => {
        return stats.percentileRank(df.mass, row.mass);
      },
    });

  console.log("Added columns using stats functions:");
  withStats.print();

  // ============================================================================
  // 4. STRING OPERATIONS - Text manipulation
  // ============================================================================
  console.log("\n=== 4. String Operations ===");

  // Use string functions for text analysis
  const withStringOps = characters.mutate({
    name_uppercase: (row) => row.name.toUpperCase(),
    name_reversed: (row) => row.name.split("").reverse().join(""),
    has_vowels: (row) => str.detect(row.name, "[aeiouAEIOU]"),
    vowel_count: (row) => {
      // Use str.extractAll to find all vowels and count them
      const vowels = str.extractAll(row.name, "[aeiouAEIOU]");
      return vowels.length;
    },
    name_pattern: (row) => {
      // Check if name follows certain patterns
      if (str.detect(row.name, "^[A-Z][a-z]+$")) return "Title Case";
      if (str.detect(row.name, "\\d")) return "Contains Numbers";
      if (str.detect(row.name, "-")) return "Contains Hyphen";
      return "Standard";
    },
  });

  console.log("Added columns using string operations:");
  withStringOps.print();

  // ============================================================================
  // 5. CONDITIONAL LOGIC - Complex conditional transformations
  // ============================================================================
  console.log("\n=== 5. Conditional Logic ===");

  // Use conditional logic for categorization
  const withConditionals = characters
    .mutate({
      size_category: (row) => {
        if (row.height > 200) return "Very Tall";
        if (row.height > 170) return "Tall";
        if (row.height > 150) return "Average";
        return "Short";
      },
      weight_class: (row) => {
        if (row.mass < 50) return "Lightweight";
        if (row.mass < 80) return "Middleweight";
        if (row.mass < 110) return "Heavyweight";
        return "Super Heavyweight";
      },
      character_type: (row) => {
        if (row.name.includes("C-3PO") || row.name.includes("R2-D2")) {
          return "Droid";
        }
        if (row.mass > 100) return "Large Humanoid";
        if (row.height > 180) return "Tall Humanoid";
        return "Standard Humanoid";
      },
    });

  console.log("Added columns using conditional logic:");
  withConditionals.print();

  // ============================================================================
  // 6. COMPLEX LAMBDA FUNCTIONS - Using curly braces for complex operations
  // ============================================================================
  console.log("\n=== 6. Complex Lambda Functions with Curly Braces ===");

  // Show how to use curly braces for more complex operations that need multiple steps
  const withComplexLambdas = characters
    .mutate({
      // Simple lambda (no curly braces needed)
      height_m: (row) => row.height / 100,

      // Complex lambda with curly braces for multiple operations
      power_score: (row) => {
        // Calculate a complex power score based on multiple factors
        const heightFactor = row.height / 200; // Normalize height to 0-1 scale
        const massFactor = row.mass / 150; // Normalize mass to 0-1 scale
        const ageFactor = row.birth_year.includes("BBY")
          ? Math.min(parseInt(row.birth_year.replace("BBY", "")), 100) / 100
          : 0.5;

        // Weight the factors and calculate final score
        const weightedScore = (heightFactor * 0.4) + (massFactor * 0.4) +
          (ageFactor * 0.2);
        return stats.round(weightedScore * 100, 1);
      },

      // Another complex lambda with multiple calculations
      character_analysis: (row) => {
        // Analyze the character's name and characteristics
        const nameAnalysis = {
          length: row.name.length,
          hasNumbers: str.detect(row.name, "\\d"),
          isShort: row.name.length <= 4,
          isLong: row.name.length >= 8,
        };

        // Calculate a complexity score using stats.sum for cleaner code
        const scoreFactors = [
          nameAnalysis.hasNumbers ? 2 : 0,
          nameAnalysis.isShort ? 1 : 0,
          nameAnalysis.isLong ? 1 : 0,
          row.mass > 100 ? 1 : 0,
          row.height > 200 ? 1 : 0,
        ];

        return stats.sum(scoreFactors);
      },

      // Lambda that returns different types based on conditions
      status_summary: (row) => {
        // Create a comprehensive status summary
        const bmi = row.mass / Math.pow(row.height / 100, 2);
        const isHealthy = bmi >= 18.5 && bmi <= 25;
        const isActive = row.birth_year.includes("19BBY") ||
          row.birth_year.includes("29BBY");

        if (isHealthy && isActive) return "Prime Condition";
        if (isHealthy) return "Healthy";
        if (isActive) return "Active";
        return "Standard";
      },
    });

  console.log("Added columns using complex lambda functions:");
  withComplexLambdas.print();

  // ============================================================================
  // 7. CHAINING MUTATE WITH OTHER OPERATIONS
  // ============================================================================
  console.log("\n=== 7. Chaining Mutate with Other Operations ===");

  // Show how mutate works in a pipeline
  const finalResult = characters
    .mutate({
      height_m: (row) => row.height / 100,
      bmi: (row) => {
        const heightM = row.height / 100;
        return stats.round(row.mass / (heightM * heightM), 1);
      },
      is_healthy_weight: (row) => {
        const heightM = row.height / 100;
        const bmi = row.mass / (heightM * heightM);
        return bmi >= 18.5 && bmi <= 25;
      },
    })
    .filter((row) => row.bmi > 0) // Remove any invalid BMIs
    .select("name", "mass", "height", "bmi", "is_healthy_weight")
    .arrange("bmi", "desc"); // Sort by BMI

  console.log("Final result after chaining operations:");
  finalResult.print();

  // ============================================================================
  // 8. DEMONSTRATING LAMBDA FUNCTION VARIATIONS
  // ============================================================================
  console.log("\n=== 8. Lambda Function Variations ===");

  const lambdaExamples = characters.mutate({
    // Arrow function with implicit return
    simple_calc: (row) => row.mass * 2,

    // Arrow function with explicit return
    explicit_calc: (row) => {
      return row.mass * 2;
    },

    // Arrow function with multiple parameters
    indexed_calc: (row, index) => {
      return `Row ${index}: ${row.name}`;
    },

    // Arrow function using all three parameters
    full_context: (row, index, df) => {
      const totalRows = df.nrows();
      const rowNumber = index + 1;
      return `${rowNumber}/${totalRows}: ${row.name}`;
    },

    // Function that doesn't use row parameter
    constant_value: () => "Fixed Value",

    // Function that only uses index
    position: (_row, index) => `Position ${index + 1}`,
  });

  console.log("Examples of different lambda function styles:");
  lambdaExamples.print();

  // Test assertions
  expect(withHeightM.nrows()).toBe(5);
  expect(withHeightM.height_m).toBeDefined();
  expect(withBasicColumns.nrows()).toBe(5);
  expect(withBasicColumns.is_tall).toBeDefined();
  expect(withStats.nrows()).toBe(5);
  expect(withStats.bmi).toBeDefined();
  expect(withStringOps.nrows()).toBe(5);
  expect(withStringOps.name_uppercase).toBeDefined();
  expect(withConditionals.nrows()).toBe(5);
  expect(withConditionals.size_category).toBeDefined();
  expect(withComplexLambdas.nrows()).toBe(5);
  expect(withComplexLambdas.power_score).toBeDefined();
  expect(finalResult.nrows()).toBe(5);
  expect(finalResult.bmi).toBeDefined();
  expect(lambdaExamples.nrows()).toBe(5);
  expect(lambdaExamples.simple_calc).toBeDefined();
});
