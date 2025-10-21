import {
  createDataFrame,
  type DataFrame,
  readCSV,
  stats,
} from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";
import { test } from "@tests/shims";

test("Getting Started with DataFrames - Progressive Examples", async () => {
  // ============================================================================
  // WELCOME TO TIDY-TS: A COMPREHENSIVE INTRODUCTION
  // ============================================================================
  console.log(
    `🚀 Welcome to tidy-ts - TypeScript's powerful data manipulation library!
This guide will take you from basic DataFrame creation to advanced
data analysis workflows. Each section builds on the previous one,
so you'll develop a complete understanding of the library's capabilities.

`,
  );

  // ============================================================================
  // QUICK START: A Taste of tidy-ts Power
  // ============================================================================
  console.log(`=== Quick Start: A Taste of tidy-ts Power ===
Here's what you can do with tidy-ts in just a few lines:

`);

  // Create a sample dataset for the demo
  const penguins = createDataFrame([
    {
      species: "Adelie",
      island: "Torgersen",
      bill_length: 39.1,
      bill_depth: 18.7,
      body_mass: 3750,
    },
    {
      species: "Adelie",
      island: "Torgersen",
      bill_length: 39.5,
      bill_depth: 17.4,
      body_mass: 3800,
    },
    {
      species: "Adelie",
      island: "Torgersen",
      bill_length: 40.3,
      bill_depth: 18.0,
      body_mass: 3250,
    },
    {
      species: "Chinstrap",
      island: "Dream",
      bill_length: 46.5,
      bill_depth: 17.9,
      body_mass: 3500,
    },
    {
      species: "Chinstrap",
      island: "Dream",
      bill_length: 50.0,
      bill_depth: 19.5,
      body_mass: 4050,
    },
    {
      species: "Gentoo",
      island: "Biscoe",
      bill_length: 46.1,
      bill_depth: 13.2,
      body_mass: 4375,
    },
    {
      species: "Gentoo",
      island: "Biscoe",
      bill_length: 50.0,
      bill_depth: 16.3,
      body_mass: 5700,
    },
  ]);

  // One powerful chain: analyze penguin data
  const penguinAnalysis = penguins
    .mutate({
      bill_ratio: (row) => stats.round(row.bill_length / row.bill_depth, 2),
      size_category: (row) => row.body_mass > 4000 ? "Large" : "Small",
    })
    .filter((row) => row.bill_ratio > 2.0)
    .groupBy("species")
    .summarize({
      count: (df) => df.nrows(),
      avg_bill_ratio: (df) => stats.round(stats.mean(df.bill_ratio), 2),
      avg_mass: (df) => stats.round(stats.mean(df.body_mass), 0),
    })
    .arrange("avg_mass", "desc");

  console.log("📊 Complete penguin analysis in one chain:");
  penguinAnalysis.print();

  // ============================================================================
  // ASYNC POWER PREVIEW - See the future of data analysis
  // ============================================================================
  console.log(`\n=== 🚀 Async Power Preview ===
tidy-ts seamlessly handles asynchronous operations:
API calls, database lookups, and complex computations - all type-safe!`);

  // Simulate async API enrichment
  async function enrichWithExternalData(mass: number): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate API delay
    if (mass > 4500) return "🦣 Heavy Class";
    if (mass > 3500) return "🐘 Medium Class";
    return "🐧 Light Class";
  }

  // Async transformation with mixed sync/async operations
  const enrichedPenguins = await penguins
    .mutate({
      bill_ratio: (row) => stats.round(row.bill_length / row.bill_depth, 2), // sync
      classification: async (row) =>
        await enrichWithExternalData(row.body_mass), // async
      size_category: (row) => row.body_mass > 4000 ? "Large" : "Small", // sync
    })
    .filter(async (row) => { // async filter
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.bill_ratio > 2.0;
    });

  console.log(`🌟 Async-enriched penguin data:`);
  enrichedPenguins.print();
  console.log(`

Let's learn how to build these powerful pipelines step by step!

`);

  // ============================================================================
  // 1. CREATING YOUR FIRST DATAFRAME - The basics
  // ============================================================================
  console.log(`=== 1. Creating Your First DataFrame ===
Let's start with the foundation: creating DataFrames from your data.`);

  // DataFrames are the core data structure in tidy-ts
  // They're created from arrays of objects, where each object represents a row
  // and the object keys become column names
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  // Type check: DataFrame creation preserves exact types
  const _peopleTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
  }> = people;

  console.log("Created a DataFrame with 5 characters:");
  people.print();

  // ============================================================================
  // 1.5. CREATING DATAFRAMES WITH ZOD SCHEMAS - Explicit type validation
  // ============================================================================
  console.log(`\n=== 1.5. Creating DataFrames with Zod Schemas ===
While TypeScript can infer types from your data, sometimes you need to
clarify the exact structure - especially when dealing with nullable fields
or anticipating future changes to your data structure.`);

  // You can also create DataFrames with explicit Zod schemas to clarify types
  // This is essential when you need to handle nullable values or when working with
  // external data sources where the structure might change over time
  const CharacterSchema = z.object({
    id: z.number(),
    name: z.string(),
    species: z.string(),
    mass: z.number(),
    height: z.number(),
  });

  // Create DataFrame with schema validation
  const validatedPeople = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ], CharacterSchema);

  // Type check: DataFrame creation with schema preserves exact types
  const _validatedPeopleTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
  }> = validatedPeople;

  console.log("Created a validated DataFrame with 3 characters:");
  validatedPeople.print();

  // ============================================================================
  // 1.6. READING CSV DATA - Loading data from external sources
  // ============================================================================
  console.log(
    `\n=== 1.6. Reading CSV Data - Loading Data from External Sources ===
In real-world scenarios, you'll often load data from files.
CSV files don't have type information, so Zod schemas become
essential for defining the exact structure and handling missing values.`,
  );

  // You can also create DataFrames by reading CSV data with Zod schema validation
  // This is essential for working with real-world datasets where types must be
  // explicitly defined and missing/null values need to be handled properly
  const csvData = `name,age,city,score
Alice,25,New York,85
Bob,30,Los Angeles,92
Carol,28,Chicago,78
Dave,35,Houston,88`;

  // Define a Zod schema for the CSV data
  // Notice how we can specify nullable fields or optional properties
  const PersonSchema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
    score: z.number(),
    // Example: if we expected some scores to be missing in the future:
    // score: z.number().nullable(), // or z.number().optional()
  });

  // Read CSV with schema validation
  const csvDataFrame = await readCSV(csvData, PersonSchema);

  console.log("DataFrame created from CSV data with schema validation:");
  csvDataFrame.print();

  // Type check: readCSV with schema preserves the exact types
  const _csvDataFrameTypeCheck: DataFrame<{
    name: string;
    age: number;
    city: string;
    score: number;
  }> = csvDataFrame;

  // ============================================================================
  // 1.7. ERROR HANDLING AND VALIDATION FAILURES - Graceful error handling
  // ============================================================================
  console.log(`\n=== 1.7. Error Handling and Validation Failures ===
Real-world data is messy. Let's see how tidy-ts handles validation
failures gracefully and how you can implement robust error handling.`);

  // Example 1: CSV with missing values that don't match our strict schema
  const problematicCsvData = `name,age,city,score
Alice,25,New York,85
Bob,,Los Angeles,92
Carol,28,,78
Dave,35,Houston,invalid_score`;

  // Define a schema that expects all fields to be present and valid
  const StrictPersonSchema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
    score: z.number(),
  });

  console.log("Attempting to read problematic CSV with strict schema...");

  try {
    // This will fail because of missing/invalid data
    const strictDataFrame = await readCSV(
      problematicCsvData,
      StrictPersonSchema,
    );
    console.log("Unexpectedly succeeded with strict schema!");
    strictDataFrame.print();
  } catch (error) {
    console.log(`✅ Expected validation error caught:
Error: ${error instanceof Error ? error.message : String(error)}
This is good! Our schema is protecting us from bad data.`);
  }

  // Example 2: Graceful handling with nullable schema
  console.log(
    `\nNow let's handle the same data gracefully with nullable schema:`,
  );

  const FlexiblePersonSchema = z.object({
    name: z.string().nullable(),
    age: z.number().nullable(),
    city: z.string().nullable(),
    score: z.number().nullable(),
  });

  try {
    const flexibleDataFrame = await readCSV(
      problematicCsvData,
      FlexiblePersonSchema,
      {
        naValues: ["", "invalid_score"], // Treat empty strings and "invalid_score" as null
      },
    );

    console.log("✅ Successfully read problematic data with flexible schema:");
    flexibleDataFrame.print();

    // Now we can clean the data
    const cleanedData = flexibleDataFrame.replaceNA({
      name: "Unknown",
      age: 0,
      city: "Unknown City",
      score: -1, // Use -1 to indicate missing scores
    });

    console.log("After cleaning missing values:");
    cleanedData.print();
  } catch (error) {
    console.log(
      `Unexpected error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // Example 3: Recovery from validation failures
  console.log("\nExample 3: Recovery from validation failures");

  const recoveryCsvData = `name,age,city,score
Alice,25,New York,85
Bob,thirty,Los Angeles,92
Carol,28,Chicago,78
Dave,35,Houston,88`;

  try {
    // First attempt with strict schema
    const strictResult = await readCSV(recoveryCsvData, StrictPersonSchema);
    console.log("Strict schema worked!");
    strictResult.print();
  } catch (error) {
    console.log(
      `Validation failed (expected): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    // Recovery strategy: Use string schema and convert manually
    const StringPersonSchema = z.object({
      name: z.string(),
      age: z.string(), // Accept as string first
      city: z.string(),
      score: z.string(), // Accept as string first
    });

    try {
      const stringDataFrame = await readCSV(
        recoveryCsvData,
        StringPersonSchema,
      );
      console.log("Recovery: Read as strings first:");
      stringDataFrame.print();

      // Now convert with error handling
      const recoveredData = stringDataFrame.mutate({
        age_numeric: (row) => {
          const parsed = parseInt(row.age);
          return isNaN(parsed) ? null : parsed;
        },
        score_numeric: (row) => {
          const parsed = parseFloat(row.score);
          return isNaN(parsed) ? null : parsed;
        },
      }).select("name", "age_numeric", "city", "score_numeric");

      console.log("Recovered data with proper types:");
      recoveredData.print();
    } catch (recoveryError) {
      console.log(
        `Recovery also failed: ${
          recoveryError instanceof Error
            ? recoveryError.message
            : String(recoveryError)
        }`,
      );
    }
  }

  // ============================================================================
  // 2. BASIC MUTATE - Adding one simple column
  // ============================================================================
  console.log(`\n=== 2. Basic Mutate - Adding One Column ===
Now that we can create DataFrames, let's learn to transform them.
The mutate() function is your primary tool for adding calculated columns.`);

  // The mutate() function adds new columns to your DataFrame
  // Start with the simplest case: adding one calculated column
  const withBmi = people
    .mutate({
      // Calculate BMI using the row's mass and height values
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
    });

  // Type check: mutate adds new columns while preserving existing ones
  const _withBmiTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    bmi: number;
  }> = withBmi;

  console.log("Added BMI column:");
  withBmi.print();

  // ============================================================================
  // 3. MULTIPLE COLUMNS - Adding several columns
  // ============================================================================
  console.log(`\n=== 3. Multiple Columns - Simple Calculations ===
In practice, you'll often need to add multiple calculated columns
at once. Let's see how to create several new columns in a single
mutate() operation.`);

  // Add multiple columns with simple calculations
  const withMultipleColumns = people
    .mutate({
      // Calculate BMI using the row's mass and height values
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),

      // Create boolean flags based on conditions
      is_heavy: (row) => row.mass > 100,

      // Use the index parameter to create row numbers (0-based, so add 1)
      row_number: (_row, index) => index + 1,
    });

  // Type check: multiple columns with different types
  const _withMultipleColumnsTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    bmi: number;
    is_heavy: boolean;
    row_number: number;
  }> = withMultipleColumns;

  console.log("Added multiple columns:");
  withMultipleColumns.print();

  // ============================================================================
  // 4. USING STATS FUNCTIONS - Statistical operations
  // ============================================================================
  console.log(`\n=== 4. Using Stats Functions ===
For more advanced calculations, tidy-ts includes a comprehensive
stats module. This allows you to perform statistical operations
across entire columns or DataFrames within your mutate operations.`);

  // Use the stats module for more complex calculations
  const withStats = people
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      is_heavy: (row) => row.mass > 100,
      row_number: (_row, index) => index + 1,

      // Use the stats module to calculate various statistics
      cumulative_mass: (_row, index, df) => stats.cumsum(df.mass)[index],

      // Use the dataframe parameter to access the entire DataFrame for calculations across all rows
      mean_bmi: (_row, _index, df) => {
        // Calculate the total mass of the DataFrame
        const averageMass = stats.mean(df.mass);
        // Calculate the average height of the DataFrame
        const averageHeight = stats.mean(df.height);
        // Calculate the total mass of the DataFrame
        return stats.round(averageMass / Math.pow(averageHeight / 100, 2), 2);
      },
    });

  // Type check: stats functions return appropriate types
  const _withStatsTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    bmi: number;
    is_heavy: boolean;
    row_number: number;
    cumulative_mass: number;
    mean_bmi: number;
  }> = withStats;

  console.log("Added columns using stats functions:");
  withStats.print();

  // Store this for use in later sections
  const peopleWithStats = withStats;

  // ============================================================================
  // 5. ADVANCED MUTATE PATTERNS - Complex calculations
  // ============================================================================
  console.log("\n=== 5. Advanced Mutate Patterns ===");

  // Show more advanced patterns with complex calculations
  const withAdvancedPatterns = peopleWithStats
    .mutate({
      // Return constant values for all rows
      constant: () => "fixed_value",

      // Complex conditional logic
      size_category: (row) => {
        if (row.height > 200) return "Very Tall";
        if (row.height > 170) return "Tall";
        if (row.height > 150) return "Average";
        return "Short";
      },
    });

  console.log("Added advanced pattern columns:");
  withAdvancedPatterns.print();

  // ============================================================================
  // 5.4. ASYNC MUTATE - Working with asynchronous operations
  // ============================================================================
  console.log(
    `\n=== 5.4. Async Mutate - Working with Asynchronous Operations ===
Sometimes you need to perform asynchronous operations in your data transformations.
tidy-ts supports async functions in mutate operations, automatically handling
Promise resolution and maintaining type safety.`,
  );

  // Simple async function for demonstration
  async function simulateApiCall(value: number): Promise<number> {
    // Simulate an API call or database lookup
    await new Promise((resolve) => setTimeout(resolve, 1));
    return value * 1.5; // Apply some business logic
  }

  // Async mutate example
  const withAsyncData = await peopleWithStats
    .mutate({
      // Mix sync and async operations
      name_upper: (row) => row.name.toUpperCase(), // Sync operation
      async_bonus: async (row) => await simulateApiCall(row.mass), // Async operation
      size_category: (row) => {
        if (row.height > 200) return "Very Tall";
        if (row.height > 170) return "Tall";
        if (row.height > 150) return "Average";
        return "Short";
      },
    });

  // Type check: Async mutate preserves types and adds new columns
  const _withAsyncDataTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    bmi: number;
    is_heavy: boolean;
    row_number: number;
    cumulative_mass: number;
    mean_bmi: number;
    name_upper: string;
    async_bonus: number;
    size_category: "Very Tall" | "Tall" | "Average" | "Short";
  }> = withAsyncData;

  console.log("DataFrame with async operations:");
  withAsyncData.print();

  // Verify async results are resolved (not Promises)
  const asyncData = withAsyncData.toArray();
  console.log(
    "✅ Async values are resolved:",
    typeof asyncData[0].async_bonus === "number",
  );

  // ============================================================================
  // 5.4.1. ADVANCED ASYNC OPTIONS - Concurrency control and retry mechanisms
  // ============================================================================
  console.log(
    `\n=== 5.4.1. Advanced Async Options - Concurrency Control and Retry Mechanisms ===
Production async operations need concurrency control and retry mechanisms.`,
  );

  // Example 1: Concurrency Control
  console.log("\n--- Example 1: Concurrency Control ---");

  // Mock API that takes time
  async function fetchData(id: number): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return `Data for ${id}`;
  }

  // Track concurrency
  let activeCalls = 0;
  let maxConcurrentCalls = 0;

  async function trackConcurrency<T>(fn: () => Promise<T>): Promise<T> {
    activeCalls++;
    maxConcurrentCalls = Math.max(maxConcurrentCalls, activeCalls);
    try {
      return await fn();
    } finally {
      activeCalls--;
    }
  }

  const data = createDataFrame([
    { id: 1, name: "A" },
    { id: 2, name: "B" },
    { id: 3, name: "C" },
    { id: 4, name: "D" },
    { id: 5, name: "E" },
  ]);

  // Process with concurrency limit of 2
  const result1 = await data
    .mutate({
      fetched_data: async (row) =>
        await trackConcurrency(async () => {
          console.log(`  Fetching data for ${row.name}...`);
          return await fetchData(row.id);
        }),
    }, { concurrency: 2 });

  console.log("Processed with concurrency limit of 2:");
  result1.print();
  console.log(`Max concurrent calls: ${maxConcurrentCalls} (limit was 2)`);

  // Example 2: Retry Mechanism
  console.log("\n--- Example 2: Retry Mechanism ---");

  // Track retry attempts
  const retryLog: Array<{ taskIndex: number; attempt: number; error: string }> =
    [];

  // Flaky API that fails twice then succeeds
  function createFlakeyApi() {
    const attempts = new Map<number, number>();
    return async (id: number): Promise<string> => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      const attempt = (attempts.get(id) || 0) + 1;
      attempts.set(id, attempt);

      if (attempt <= 2) {
        throw new Error(`API failed (attempt ${attempt})`);
      }
      return `Success for ${id}`;
    };
  }

  const flakeyApi = createFlakeyApi();
  const retryData = createDataFrame([
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ]);

  // Process with retry configuration
  const result2 = await retryData
    .mutate({
      api_result: async (row) => await flakeyApi(row.id),
    }, {
      concurrency: 2,
      retry: {
        maxRetries: 3,
        baseDelay: 50,
        maxDelay: 200,
        backoff: "exponential",
        onRetry: (error, attempt, taskIndex) => {
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          retryLog.push({ taskIndex, attempt, error: errorMessage });
          console.log(
            `  Retry ${attempt} for task ${taskIndex}: ${errorMessage}`,
          );
        },
      },
    });

  console.log("Processed with retry mechanism:");
  result2.print();
  console.log(`Total retry attempts: ${retryLog.length}`);

  console.log("\n=== Advanced Async Benefits ===");
  console.log("✅ Concurrency Control: Limit simultaneous operations");
  console.log("✅ Retry Mechanisms: Automatic retry with exponential backoff");
  console.log("✅ Error Handling: Custom retry logic and monitoring");

  // ============================================================================
  // 5.5. MUTATE TRADE-OFF - Understanding TypeScript constraints
  // ============================================================================
  console.log(
    "\n=== 5.5. Mutate Trade-off - Understanding TypeScript Constraints ===",
  );
  console.log(
    "There's an important constraint in mutate() that's worth understanding:",
  );
  console.log(
    "you cannot reference columns created in the same mutate() call.",
  );
  console.log(
    "This trade-off enables strong typing and type safety throughout your code.",
  );

  // IMPORTANT: You cannot reference columns created in the same mutate() call
  // This is a thoughtful trade-off that enables strong typing and type safety
  //
  // ❌ This would NOT work:
  // const brokenExample = people.mutate({
  //   doubleMass: (row) => row.mass * 2,
  //   quadrupleMass: (row) => row.doubleMass * 2, // ERROR: doubleMass doesn't exist yet
  // });
  //
  // ✅ Instead, use separate mutate() calls:
  const withDoubleMass = peopleWithStats.mutate({
    doubleMass: (row) => row.mass * 2,
  });

  const withQuadrupleMass = withDoubleMass.mutate({
    quadrupleMass: (row) => row.doubleMass * 2, // Now doubleMass exists from previous mutate
  });

  // Type check: Each mutate preserves and extends the type
  const _withDoubleMassTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    bmi: number;
    is_heavy: boolean;
    row_number: number;
    cumulative_mass: number;
    mean_bmi: number;
    doubleMass: number;
  }> = withDoubleMass;

  const _withQuadrupleMassTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    bmi: number;
    is_heavy: boolean;
    row_number: number;
    cumulative_mass: number;
    mean_bmi: number;
    doubleMass: number;
    quadrupleMass: number;
  }> = withQuadrupleMass;

  console.log("Demonstrating chained mutate operations:");
  console.log("After first mutate (doubleMass):");
  withDoubleMass.print();
  console.log("\nAfter second mutate (quadrupleMass):");
  withQuadrupleMass.print();

  // Alternative: You can also chain multiple operations in one pipeline
  const chainedExample = peopleWithStats
    .mutate({
      doubleMass: (row) => row.mass * 2,
    })
    .mutate({
      quadrupleMass: (row) => row.doubleMass * 2,
    })
    .mutate({
      massRatio: (row) => row.quadrupleMass / row.mass,
    });

  console.log("\nChained mutate operations in one pipeline:");
  chainedExample.print();

  // ============================================================================
  // 5.6. COMPREHENSIVE STATS FUNCTIONS - Exploring the stats module
  // ============================================================================
  console.log(
    "\n=== 5.6. Comprehensive Stats Functions - Exploring the stats module ===",
  );
  console.log("Now let's take a deeper dive into the stats module to see the");
  console.log("full range of statistical functions available. This will help");
  console.log("you understand the power available for your data analysis.");

  // The stats module provides a comprehensive set of statistical functions
  // Let's explore the full range of available functions
  const sampleData = createDataFrame([
    { id: 1, value: 10, category: "A", score: 85 },
    { id: 2, value: 20, category: "B", score: 92 },
    { id: 3, value: 15, category: "A", score: 78 },
    { id: 4, value: 25, category: "B", score: 88 },
    { id: 5, value: 12, category: "A", score: 95 },
    { id: 6, value: 30, category: "C", score: 82 },
    { id: 7, value: 18, category: "B", score: 90 },
    { id: 8, value: 22, category: "A", score: 87 },
  ]);

  console.log("Sample data for stats demonstration:");
  sampleData.print();

  const values = sampleData.value;
  const scores = sampleData.score;

  console.log("\n=== Basic Descriptive Statistics ===");
  console.log("Values:", values);
  console.log("Sum:", stats.sum(values));
  console.log("Mean:", stats.mean(values));
  console.log("Median:", stats.median(values));
  console.log("Mode:", stats.mode(values));
  console.log("Min:", stats.min(values));
  console.log("Max:", stats.max(values));
  console.log("Range:", stats.range(values));
  console.log("Standard Deviation:", stats.stdev(values));
  console.log("Variance:", stats.variance(values));
  console.log("Product:", stats.product(values));

  console.log("\n=== Quantiles and Percentiles ===");
  console.log("IQR (Interquartile Range):", stats.iqr(values));
  console.log("Quartiles [Q25, Q50, Q75]:", stats.quartiles(values));
  console.log("25th percentile:", stats.quantile(values, 0.25));
  console.log("75th percentile:", stats.quantile(values, 0.75));
  console.log(
    "Multiple quantiles [Q10, Q90]:",
    stats.quantile(values, [0.1, 0.9]),
  );
  console.log("Percentile rank of 15:", stats.percentileRank(values, 15));

  console.log("\n=== Ranking and Ordering ===");
  console.log("Ranks:", stats.rank(values));
  console.log("Dense ranks:", stats.denseRank(values));
  console.log("Unique values:", stats.unique(values));
  console.log("Unique count:", stats.uniqueCount(values));

  console.log("\n=== Cumulative Functions ===");
  console.log("Cumulative sum:", stats.cumsum(values));
  console.log("Cumulative product:", stats.cumprod(values));
  console.log("Cumulative min:", stats.cummin(values));
  console.log("Cumulative max:", stats.cummax(values));
  console.log("Cumulative mean:", stats.cummean(values));

  console.log("\n=== Window Functions ===");
  console.log("Lag (previous value):", stats.lag(values, 1));
  console.log("Lead (next value):", stats.lead(values, 1));
  console.log("Lag with default:", stats.lag(values, 1, 0));

  console.log(
    "Covariance between value and score:",
    stats.covariance(values, scores),
  );

  console.log("\n=== Utility Functions ===");
  console.log("Rounded mean (2 decimals):", stats.round(stats.mean(values), 2));
  console.log("Floor of mean:", stats.floor(stats.mean(values)));
  console.log("Ceiling of mean:", stats.ceiling(stats.mean(values)));
  console.log("Row count:", sampleData.nrows());
  console.log("Count of value 15:", stats.countValue(values, 15));

  console.log("\n=== Benefits of the stats module ===");
  console.log("✅ Comprehensive: 25+ statistical functions available");
  console.log("✅ Consistent API: All functions follow the same pattern");
  console.log("✅ Type-safe: Full TypeScript support with autocomplete");
  console.log("✅ Efficient: Optimized implementations for performance");
  console.log("✅ Flexible: Works with arrays and DataFrame columns");

  // ============================================================================
  // 5.7. ADVANCED STATS IN MUTATE OPERATIONS - Using stats in transformations
  // ============================================================================
  console.log("\n=== 5.7. Advanced Stats in Mutate Operations ===");
  console.log(
    "Now let's see how to use stats functions within mutate operations",
  );
  console.log("to create sophisticated derived columns and transformations.");

  const withStatsDerived = sampleData
    .mutate({
      // Use stats functions to create derived columns
      valueZScore: (row, _index, df) => {
        const mean = stats.mean(df.value);
        const std = stats.stdev(df.value);
        return stats.round((row.value - mean) / std, 3);
      },

      valueRank: (row, _index, df) => stats.rank(df.value, row.value),

      valuePercentile: (row, _index, df) =>
        stats.percentileRank(df.value, row.value),

      categoryMean: (row, _index, df) =>
        stats.round(
          stats.mean(df.filter((r) => r.category === row.category).value),
          2,
        ),
    });

  console.log("DataFrame with statistical derived columns:");
  withStatsDerived.print();

  // ============================================================================
  // 6. SELECTING AND DROPPING COLUMNS - Working with specific columns
  // ============================================================================
  console.log("\n=== 6. Selecting and Dropping Columns ===");
  console.log("Often you'll want to work with specific columns or remove");
  console.log(
    "unnecessary ones. Let's learn the essential column selection verbs.",
  );

  // Select specific columns
  const selectedColumns = peopleWithStats.select("name", "bmi", "height");
  console.log("Selected columns (name, bmi, height):");
  selectedColumns.print();

  // Drop specific columns
  const droppedColumns = peopleWithStats.drop("mass", "species");
  console.log("Dropped columns (mass, species):");
  droppedColumns.print();

  // ============================================================================
  // 7. FILTERING ROWS - Working with specific data
  // ============================================================================
  console.log("\n=== 7. Filtering Rows ===");
  console.log("Filtering lets you work with subsets of your data based on");
  console.log("specific conditions. This is essential for data analysis.");

  // Filter by numeric conditions
  const tallPeople = peopleWithStats.filter((row) => row.height > 180);
  console.log("People taller than 180cm:");
  tallPeople.print();

  // Filter by string conditions
  const humans = peopleWithStats.filter((row) => row.species === "Human");
  console.log("Only humans:");
  humans.print();

  // Filter by multiple conditions
  const tallHumans = peopleWithStats.filter(
    (row) => row.height > 180 && row.species === "Human",
  );
  console.log("Tall humans (height > 180cm AND species = Human):");
  tallHumans.print();

  // Async filter example - simulate API validation
  async function validateCharacter(species: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    console.log("Validating character:", species);
    const includesDroid = species.includes("Droid");
    console.log("Includes droid:", includesDroid);
    return !includesDroid; // Exclude droids
  }

  const validatedCharacters = await peopleWithStats.filter(
    async (row) => await validateCharacter(row.species),
  );
  console.log("Characters validated via async API (excluding droids):");
  validatedCharacters.print();

  // ============================================================================
  // 7.5. GROUPBY AND SUMMARIZE EXAMPLES - Advanced aggregation patterns
  // ============================================================================
  console.log("\n=== 7.5. GroupBy and Summarize Examples ===");
  console.log("GroupBy and summarize operations are powerful for creating");
  console.log(
    "summary statistics and aggregations. Let's explore various patterns.",
  );

  // Example 1: Basic species analysis
  const speciesAnalysis = peopleWithStats
    .groupBy("species")
    .summarise({
      count: (group) => group.nrows(),
      avg_height: (group) => stats.round(stats.mean(group.height), 1),
      avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
      avg_bmi: (group) => stats.round(stats.mean(group.bmi), 2),
      max_height: (group) => stats.max(group.height),
      min_mass: (group) => stats.min(group.mass),
    })
    .arrange("avg_bmi", "desc");

  console.log("Species analysis with multiple aggregations:");
  speciesAnalysis.print();

  // Example 2: BMI category analysis
  const bmiAnalysis = peopleWithStats
    .mutate({
      bmi_category: (row) => {
        if (row.bmi < 18.5) return "Underweight";
        if (row.bmi < 25) return "Normal";
        if (row.bmi < 30) return "Overweight";
        return "Obese";
      },
    })
    .groupBy("bmi_category")
    .summarise({
      count: (group) => group.nrows(),
      avg_height: (group) => stats.round(stats.mean(group.height), 1),
      avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
      height_range: (group) => {
        const heights = group.height;
        return `${stats.min(heights)}-${stats.max(heights)}cm`;
      },
    })
    .arrange("count", "desc");

  console.log("BMI category analysis:");
  bmiAnalysis.print();

  // Example 3: Complex grouped analysis with conditional logic
  const complexAnalysis = peopleWithStats
    .groupBy("species")
    .summarise({
      total_count: (group) => group.nrows(),
      heavy_count: (group) => group.filter((row) => row.is_heavy).nrows(),
      tall_count: (group) => group.filter((row) => row.height > 170).nrows(),
      avg_bmi: (group) => stats.round(stats.mean(group.bmi), 2),
      bmi_std: (group) => stats.round(stats.stdev(group.bmi), 2),
      height_quartiles: (group) => {
        const q = stats.quartiles(group.height);
        return `Q1:${q[0]}, Q2:${q[1]}, Q3:${q[2]}`;
      },
    })
    .mutate({
      heavy_percentage: (row) =>
        stats.round((row.heavy_count / row.total_count) * 100, 1),
      tall_percentage: (row) =>
        stats.round((row.tall_count / row.total_count) * 100, 1),
    })
    .arrange("avg_bmi", "desc");

  console.log("Complex species analysis with percentages:");
  complexAnalysis.print();

  // Async summarize example - simulate external data enrichment
  async function fetchSpeciesMetadata(species: string): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    const metadata = { "Human": 79, "Droid": 200, "Wookiee": 400 };
    return metadata[species as keyof typeof metadata] || 100;
  }

  const enrichedSpeciesAnalysis = await peopleWithStats
    .groupBy("species")
    .summarise({
      count: (group) => group.nrows(),
      avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
      expected_lifespan: async (group) => {
        const species = group.species[0]; // Get species from first row
        return await fetchSpeciesMetadata(species);
      },
    });

  console.log("Species analysis with async lifespan data:");
  enrichedSpeciesAnalysis.print();

  // ============================================================================
  // 8. SORTING DATA - Arranging rows in order
  // ============================================================================
  console.log("\n=== 8. Sorting Data ===");
  console.log("Sorting helps you understand your data better and find");
  console.log("the most interesting cases. Let's see how to arrange data.");

  // Sort by a single column (ascending)
  const sortedByHeight = peopleWithStats.arrange("height");
  console.log("Sorted by height (ascending):");
  sortedByHeight.print();

  // Sort by a single column (descending)
  const sortedByBmiDesc = peopleWithStats.arrange("bmi", "desc");
  console.log("Sorted by BMI (descending):");
  sortedByBmiDesc.print();

  // ============================================================================
  // 9. BASIC DATAFRAME PROPERTIES - Understanding your data
  // ============================================================================
  console.log("\n=== 9. Basic DataFrame Properties ===");
  console.log(
    "Now that we've learned to transform and filter data, let's explore",
  );
  console.log(
    "how to inspect and understand the structure of your DataFrames.",
  );

  // DataFrames have a length property like arrays
  // This gives you the number of rows in your dataset
  console.log("Number of rows:", people.nrows());

  // Access individual rows using array indexing (0-based)
  // This is useful for examining specific records
  console.log("First row:", people[0]);
  console.log("Last row:", people[people.nrows() - 1]);

  // ============================================================================
  // 10. COLUMN ACCESS - Working with columns
  // ============================================================================
  console.log("\n=== 10. Column Access ===");
  console.log(
    "One of tidy-ts's most powerful features is direct column access.",
  );
  console.log(
    "You can extract entire columns as typed arrays for further analysis.",
  );

  // One of the most powerful features: access entire columns as typed arrays
  // TypeScript automatically infers the correct types from your data
  const names = people.name; // string[] - all names as an array
  const masses = people.mass; // number[] - all masses as an array
  const species = people.species; // string[] - all species as an array

  console.log("All columns:", people.columns());
  console.log("All names:", names);
  console.log("All masses:", masses);
  console.log("Unique species:", stats.unique(species));

  // ============================================================================
  // 10.5. EXTRACT METHODS - Getting specific values from columns
  // ============================================================================
  console.log("\n=== 10.5. Extract Methods - Getting Specific Values ===");

  // Extract methods provide flexible ways to get specific values from columns
  // This is especially useful when you need single values or specific subsets

  // Basic extract - get all values from a column (same as column access)
  const allNames = people.extract("name");
  console.log("All names via extract:", allNames);

  // Extract head - get first n values
  const firstPerson = people.extractHead("name", 1); // Single value
  const firstThreeNames = people.extractHead("name", 3); // Array of 3 values
  console.log("First person:", firstPerson);
  console.log("First three names:", firstThreeNames);

  // Extract tail - get last n values
  const lastPerson = people.extractTail("name", 1); // Single value
  const lastTwoNames = people.extractTail("name", 2); // Array of 2 values
  console.log("Last person:", lastPerson);
  console.log("Last two names:", lastTwoNames);

  // Extract nth - get value at specific index
  const thirdPerson = people.extractNth("name", 2); // Index 2 = third person
  const firstMass = people.extractNth("mass", 0); // First mass value
  console.log("Third person:", thirdPerson);
  console.log("First mass:", firstMass);

  // Extract sample - get random n values
  const randomNames = people.extractSample("name", 2);
  console.log("Two random names:", randomNames);

  // Practical examples with extract methods
  console.log("\n--- Practical Extract Examples ---");

  // Find the heaviest character
  const heaviestCharacter = people
    .arrange("mass", "desc")
    .extractHead("name", 1);
  console.log("Heaviest character:", heaviestCharacter);

  // Get all human characters
  const humanNames = people
    .filter((row) => row.species === "Human")
    .extract("name");
  console.log("Human characters:", humanNames);

  // Get the lightest character's species
  const lightestSpecies = people
    .arrange("mass", "desc")
    .extractHead("species", 1);
  console.log("Lightest character's species:", lightestSpecies);

  // Type safety demonstration
  const _singleName: string | undefined = people.extractHead("name", 1);
  const _multipleNames: string[] = people.extractHead("name", 3);
  const _allNamesList: string[] = people.extract("name");
  const _randomName: string | undefined = people.extractNth("name", 0);

  console.log("Extract methods provide type-safe access to column values");

  // ============================================================================
  // 11. ITERATING OVER ROWS - Processing data row by row
  // ============================================================================
  console.log("\n=== 11. Iterating Over Rows ===");
  console.log("Sometimes you need to process data row by row. DataFrames are");
  console.log(
    "iterable, making it easy to loop through each record individually.",
  );

  // DataFrames are iterable, so you can use them in for...of loops
  // This is great for processing each row individually
  for (const person of people) {
    console.log(`${person.name} (${person.species}) weighs ${person.mass}kg`);
  }

  // ============================================================================
  // 12. WORKING WITH TYPESCRIPT TYPES - Type safety and IntelliSense
  // ============================================================================
  console.log("\n=== 12. Working with TypeScript Types ===");
  console.log("TypeScript integration is a key strength of tidy-ts. While the");
  console.log(
    "library can infer types from your data, sometimes you'll want to",
  );
  console.log("define explicit types for better IntelliSense and type safety.");

  // TypeScript integration is a key strength of tidy-ts
  // While createDataFrame can infer types from the data, sometimes providing explicit types can be helpful
  // You can define explicit types for better type safety and IntelliSense
  type Character = {
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    lightsaber: boolean;
    lightsaber_color?: string; // Optional property - some characters may not have a lightsaber color
  };

  // Start with characters who have lightsaber colors
  const starWarsCharacters: Character[] = [
    {
      id: 6,
      name: "Leia",
      species: "Human",
      mass: 49,
      height: 150,
      lightsaber: false,
      // Note: no lightsaber_color property
    },
    {
      id: 7,
      name: "Yoda",
      species: "Unknown",
      mass: 17,
      height: 66,
      lightsaber: true,
      lightsaber_color: "green",
    },
  ];

  const starWarsDataFrame = createDataFrame(starWarsCharacters);

  // Type check: DataFrame creation preserves exact types
  const _starWarsDataFrameTypeCheck: DataFrame<Character> = starWarsDataFrame;

  console.log("Star Wars characters with lightsaber colors:");
  starWarsDataFrame.print();

  // ============================================================================
  // 13. COMBINING DATAFRAMES - Adding rows and merging data
  // ============================================================================
  console.log(
    "\n=== 13. Combining DataFrames - Adding Rows and Merging Data ===",
  );
  console.log(
    "In real-world scenarios, you'll often need to combine data from",
  );
  console.log(
    "multiple sources. Let's explore different ways to merge DataFrames",
  );
  console.log("and handle varying column structures.");

  const Luke: Character = {
    id: 1,
    name: "Luke",
    species: "Human",
    mass: 77,
    height: 172,
    lightsaber: true,
    lightsaber_color: "blue",
  };

  const lukeDataFrame = createDataFrame([Luke]);

  // Type check: DataFrame creation preserves exact types
  const _lukeDataFrameTypeCheck: DataFrame<Character> = lukeDataFrame;

  console.log("Luke character:");
  lukeDataFrame.print();

  // Method 1: Using bindRows() - The preferred tidy-ts approach
  console.log("Method 1: Using bindRows() - The tidy-ts way");
  const method1Combined = starWarsDataFrame.bindRows(lukeDataFrame);
  // Type check: bindRows preserves types
  const _method1CombinedTypeCheck: DataFrame<Character> = method1Combined;
  console.log("Combined using bindRows():");
  method1Combined.print();

  // Method 2: Combining multiple DataFrames at once
  console.log("\nMethod 2: Combining multiple DataFrames with bindRows()");

  // Create another character DataFrame
  const obiWanDataFrame = createDataFrame<Character>([{
    id: 8,
    name: "Obi-Wan",
    species: "Human",
    mass: 70,
    height: 175,
    lightsaber: true,
    lightsaber_color: "blue",
  }]);

  // Type check: DataFrame creation preserves exact types
  const _obiWanDataFrameTypeCheck: DataFrame<Character> = obiWanDataFrame;

  const multiCombined = starWarsDataFrame.bindRows(
    lukeDataFrame,
    obiWanDataFrame,
  );
  // Type check: bindRows preserves types
  const _multiCombinedTypeCheck: DataFrame<Character> = multiCombined;
  console.log("Combined three DataFrames:");
  multiCombined.print();

  // Method 3: Using spread operator to combine arrays before creating DataFrame
  console.log("\nMethod 3: Traditional spread operator combination");
  const method3Combined = createDataFrame([
    ...starWarsCharacters,
    ...lukeDataFrame,
  ]);
  // Type check: DataFrame creation preserves exact types
  const _method3CombinedTypeCheck: DataFrame<Character> = method3Combined;
  console.log("Combined using spread operator:");
  method3Combined.print();

  // Method 4: Building up DataFrames incrementally with bindRows
  console.log("\nMethod 4: Incremental DataFrame building with bindRows");

  // Start with one DataFrame
  let incrementalDF = starWarsDataFrame;
  console.log("Starting with Jedi characters:");
  incrementalDF.print();

  // Add Leia
  incrementalDF = incrementalDF.bindRows(lukeDataFrame);
  // Type check: bindRows preserves types
  const _incrementalDFTypeCheck: DataFrame<Character> = incrementalDF;
  console.log("\nAfter adding Leia:");
  incrementalDF.print();

  // Add Obi-Wan
  incrementalDF = incrementalDF.bindRows(obiWanDataFrame);
  // Type check: bindRows preserves types
  const _incrementalDF2TypeCheck: DataFrame<Character> = incrementalDF;
  console.log("\nAfter adding Obi-Wan:");
  incrementalDF.print();

  // Method 5: Handling different column sets with bindRows
  console.log("\nMethod 5: Combining DataFrames with different columns");

  // Create a DataFrame with additional columns
  const extendedCharacter = createDataFrame([{
    id: 9,
    name: "Anakin",
    species: "Human",
    mass: 84,
    height: 188,
    lightsaber: true,
    lightsaber_color: "blue",
    midichlorian_count: 20000, // New column not in other DataFrames
    rank: "Knight", // Another new column
  }]);

  // Type check: DataFrame creation preserves exact types
  const _extendedCharacterTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    lightsaber: boolean;
    lightsaber_color: string;
    midichlorian_count: number;
    rank: string;
  }> = extendedCharacter;

  console.log("Extended character with extra columns:");
  extendedCharacter.print();

  const finalCombined = starWarsDataFrame.bindRows(
    lukeDataFrame,
    obiWanDataFrame,
    extendedCharacter,
  );

  // Type check: bindRows preserves types
  const _finalCombinedTypeCheck: DataFrame<{
    id: number;
    name: string;
    species: string;
    mass: number;
    height: number;
    lightsaber: boolean;
    lightsaber_color?: string | undefined;
    midichlorian_count?: number | undefined;
    rank?: string | undefined;
  }> = finalCombined;

  console.log(
    "\nFinal combined DataFrame (columns are alphabetically sorted):",
  );
  finalCombined.print();

  // Demonstrate that TypeScript handles the optional property correctly
  console.log("\nTypeScript handles optional properties correctly:");
  finalCombined.forEachRow((row) => {
    const color = row.lightsaber_color || "No lightsaber";
    console.log(`${row.name}: ${color}`);
  });

  // ============================================================================
  // 14. COMPREHENSIVE MISSING DATA HANDLING - Real-world data challenges
  // ============================================================================
  console.log("\n=== 14. Comprehensive Missing Data Handling ===");
  console.log("Real-world data is messy. Let's explore how tidy-ts handles");
  console.log("missing data (null, undefined, NaN) in various scenarios.");

  // Create a dataset with various types of missing data
  const messyData = createDataFrame([
    { id: 1, name: "Alice", age: 25, score: 85, active: true, notes: "Great" },
    {
      id: 2,
      name: null,
      age: 30,
      score: null,
      active: true,
      notes: "Missing score",
    },
    {
      id: 3,
      name: "Charlie",
      age: null,
      score: 92,
      active: false,
      notes: null,
    },
    {
      id: 4,
      name: "Diana",
      age: 28,
      score: NaN,
      active: null,
      notes: "NaN score",
    },
    { id: 5, name: "Eve", age: 35, score: 78, active: true, notes: undefined },
    {
      id: 6,
      name: "",
      age: 0,
      score: 88,
      active: false,
      notes: "Empty string",
    },
  ]);

  console.log("Original messy data with various missing value types:");
  messyData.print();

  // Analyze missing data patterns
  const missingAnalysis = messyData
    .summarise({
      total_rows: (df) => df.nrows(),
      name_missing: (df) =>
        df.name.filter((x) => x === null || x === undefined || x === "").length,
      age_missing: (df) =>
        df.age.filter((x) => x === null || x === undefined).length,
      score_missing: (df) =>
        df.score.filter((x) => x === null || x === undefined || isNaN(x))
          .length,
      active_missing: (df) =>
        df.active.filter((x) => x === null || x === undefined).length,
      notes_missing: (df) =>
        df.notes.filter((x) => x === null || x === undefined).length,
    })
    .mutate({
      name_missing_pct: (row) =>
        stats.round((row.name_missing / row.total_rows) * 100, 1),
      age_missing_pct: (row) =>
        stats.round((row.age_missing / row.total_rows) * 100, 1),
      score_missing_pct: (row) =>
        stats.round((row.score_missing / row.total_rows) * 100, 1),
      active_missing_pct: (row) =>
        stats.round((row.active_missing / row.total_rows) * 100, 1),
      notes_missing_pct: (row) =>
        stats.round((row.notes_missing / row.total_rows) * 100, 1),
    });

  console.log("Missing data analysis:");
  missingAnalysis.print();

  // Strategy 1: Replace with defaults
  const defaultCleaned = messyData.replaceNA({
    name: "Unknown",
    age: 0,
    score: -1,
    active: false,
    notes: "No notes",
  });

  console.log("After replaceNA with defaults:");
  defaultCleaned.print();

  // Strategy 2: Smart replacement using statistics
  const validScores = messyData.score.filter((x) =>
    x !== null && x !== undefined && !isNaN(x)
  );
  const validAges = messyData.age.filter((x) => x !== null && x !== undefined);

  const smartCleaned = messyData.replaceNA({
    name: "Participant",
    age: stats.round(stats.mean(validAges), 0),
    score: stats.round(stats.mean(validScores, true), 1), // Note we use remove_na=true
    active: false,
    notes: "Imputed",
  });

  console.log("After smart replaceNA with calculated values:");
  smartCleaned.print();

  // Strategy 3: Conditional replacement based on other columns
  const conditionalCleaned = messyData
    .mutate({
      name_filled: (row) => row.name || `Person_${row.id}`,
      age_filled: (row) => {
        if (row.age !== null && row.age !== undefined) return row.age;
        // Use different defaults based on other data
        return row.active ? 30 : 25;
      },
      score_filled: (row) => {
        if (
          row.score !== null && row.score !== undefined && !isNaN(row.score)
        ) {
          return row.score;
        }
        // Use median for missing scores
        return stats.median(validScores, true); // note,
      },
      active_filled: (row) => row.active ?? true, // Default to true
      notes_filled: (row) => row.notes || "No additional notes",
    })
    .select(
      "id",
      "name_filled",
      "age_filled",
      "score_filled",
      "active_filled",
      "notes_filled",
    );

  console.log("After conditional replacement:");
  conditionalCleaned.print();

  // Strategy 4: Remove rows with too many missing values
  const filteredData = messyData.filter((row) => {
    const missingCount = [
      row.name === null || row.name === undefined || row.name === "",
      row.age === null || row.age === undefined,
      row.score === null || row.score === undefined || isNaN(row.score),
      row.active === null || row.active === undefined,
      row.notes === null || row.notes === undefined,
    ].filter(Boolean).length;

    return missingCount <= 2; // Keep rows with 2 or fewer missing values
  });

  console.log("After filtering out rows with too many missing values:");
  filteredData.print();

  // Strategy 5: Advanced missing data imputation
  const advancedImputation = messyData
    .mutate({
      // Create missing indicators
      name_missing: (row) =>
        row.name === null || row.name === undefined || row.name === "" ? 1 : 0,
      age_missing: (row) => row.age === null || row.age === undefined ? 1 : 0,
      score_missing: (row) =>
        row.score === null || row.score === undefined || isNaN(row.score)
          ? 1
          : 0,
    })
    .replaceNA({
      name: "Unknown",
      age: stats.round(stats.mean(validAges), 0),
      score: stats.round(stats.mean(validScores, true), 1), // Note we use remove_na=true
      active: false,
      notes: "Imputed",
    })
    .mutate({
      // Add quality flags
      data_quality: (row) => {
        const missingCount = row.name_missing + row.age_missing +
          row.score_missing;
        if (missingCount === 0) return "Complete";
        if (missingCount === 1) return "Good";
        if (missingCount === 2) return "Fair";
        return "Poor";
      },
    });

  console.log("Advanced imputation with quality indicators:");
  advancedImputation.print();

  // ============================================================================
  // 15. PERFORMANCE BENCHMARKS - How tidy-ts compares to other libraries
  // ============================================================================
  console.log("\n=== 15. Performance Benchmarks ===");
  console.log("tidy-ts is designed for performance. Here's how it compares");
  console.log("to other popular data manipulation libraries.");

  // Performance comparison data (from our actual benchmark results)
  const performanceData = createDataFrame([
    {
      operation: "...",
      tidy_ts: 0.000,
      pandas: 0.000,
      polars: 0.000,
      r: 0.000,
    },
  ]);

  console.log(
    "Performance comparison (times in milliseconds, lower is better):",
  );
  performanceData.print();

  // ============================================================================
  // 16. JOINING DATAFRAMES - Combining data from multiple sources
  // ============================================================================
  console.log("\n=== 16. Joining DataFrames ===");
  console.log(
    "Joining DataFrames is essential for combining data from multiple",
  );
  console.log(
    "sources. tidy-ts supports various join types with comprehensive",
  );
  console.log("multi-key support and strong type safety.");

  // Create sample datasets for joining
  const employees = createDataFrame([
    { emp_id: 1, name: "Alice", dept_id: 10, year: 2023, salary: 50000 },
    { emp_id: 2, name: "Bob", dept_id: 20, year: 2023, salary: 60000 },
    { emp_id: 3, name: "Charlie", dept_id: 10, year: 2024, salary: 55000 },
    { emp_id: 4, name: "Diana", dept_id: 30, year: 2023, salary: 70000 },
    { emp_id: 5, name: "Eve", dept_id: 20, year: 2024, salary: 65000 },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, year: 2023, dept_name: "Engineering", manager: "John" },
    { dept_id: 20, year: 2023, dept_name: "Marketing", manager: "Jane" },
    { dept_id: 10, year: 2024, dept_name: "Engineering", manager: "Sarah" },
    { dept_id: 40, year: 2023, dept_name: "Sales", manager: "Mike" }, // Note: dept_id 40 not in employees
  ]);

  console.log("Employees DataFrame:");
  employees.print();
  console.log("\nDepartments DataFrame:");
  departments.print();

  // Single Key Joins
  console.log("\n--- Single Key Joins ---");

  // Inner Join - Only matching records from both DataFrames
  const innerJoin = employees.innerJoin(departments, "dept_id");

  // Type check: InnerJoin preserves all fields as required
  const _innerJoinTypeCheck: DataFrame<{
    emp_id: number;
    name: string;
    dept_id: number;
    year: number;
    salary: number;
    dept_name: string;
    manager: string;
  }> = innerJoin;

  console.log("Inner join (employees ⋈ departments):");
  innerJoin.print();

  // Left Join - All records from left DataFrame, matching from right
  const leftJoin = employees.leftJoin(departments, "dept_id");

  // Type check: LeftJoin makes right non-key fields optional
  const _leftJoinTypeCheck: DataFrame<{
    emp_id: number;
    name: string;
    dept_id: number;
    year: number;
    salary: number;
    dept_name: string | undefined;
    manager: string | undefined;
  }> = leftJoin;

  console.log("Left join (employees ⟕ departments):");
  leftJoin.print();

  // Multi-Key Joins
  console.log("\n--- Multi-Key Joins ---");
  console.log("Multi-key joins are essential for complex data relationships.");
  console.log("tidy-ts provides strong typing for all join scenarios.");
  console.log("");
  console.log("Join Type Rules Summary:");
  console.log(
    "┌─────────────┬─────────────────────────────────────────────────────────┐",
  );
  console.log(
    "│ Join Type   │ Result Type Pattern                                      │",
  );
  console.log(
    "├─────────────┼─────────────────────────────────────────────────────────┤",
  );
  console.log(
    "│ Inner Join  │ L ∪ (R\\K) - All fields required                         │",
  );
  console.log(
    "│ Left Join   │ L ∪ (R\\K)? - Right non-key fields: T | undefined       │",
  );
  console.log(
    "│ Right Join  │ (L\\K)? ∪ R - Left non-key fields: T | undefined        │",
  );
  console.log(
    "│ Outer Join  │ (L\\K)? ∪ (R\\K)? - Both sides: T | undefined           │",
  );
  console.log(
    "│ Cross Join  │ L ∪ R - All fields required (Cartesian product)         │",
  );
  console.log(
    "└─────────────┴─────────────────────────────────────────────────────────┘",
  );
  console.log("");
  console.log("Where: L = Left DataFrame, R = Right DataFrame, K = Join keys");
  console.log(
    "All joins use explicit undefined unions (T | undefined), never optional properties (T?)",
  );
  console.log("");

  // Multi-key inner join with array syntax
  const multiKeyInnerJoin = employees.innerJoin(departments, [
    "dept_id",
    "year",
  ]);
  console.log("Multi-key inner join (dept_id + year):");
  multiKeyInnerJoin.print();

  // Multi-key left join with object syntax
  const multiKeyLeftJoin = employees.leftJoin(departments, {
    keys: ["dept_id", "year"],
  });
  console.log("Multi-key left join (dept_id + year):");
  multiKeyLeftJoin.print();

  // Join with different column names
  console.log("\n--- Join with Different Column Names ---");
  const orders = createDataFrame([
    { order_id: 1, order_region: "North", order_product: "A", quantity: 10 },
    { order_id: 2, order_region: "South", order_product: "B", quantity: 20 },
  ]);

  const inventory = createDataFrame([
    { inv_region: "North", inv_product: "A", stock: 100 },
  ]);

  const joinDifferentColumns = orders.innerJoin(inventory, {
    keys: {
      left: ["order_region", "order_product"],
      right: ["inv_region", "inv_product"],
    },
  });

  console.log("Join with different column names:");
  joinDifferentColumns.print();

  // Comprehensive join with different column names and suffixes
  console.log("\n--- Comprehensive Join with Different Names and Suffixes ---");
  const salesData = createDataFrame([
    {
      sales_id: 1,
      sales_region: "North",
      sales_product: "Widget A",
      sales_quarter: "Q1",
      sales_value: 1000,
      sales_target: 1100,
      sales_rep: "Alice",
    },
    {
      sales_id: 2,
      sales_region: "South",
      sales_product: "Widget B",
      sales_quarter: "Q1",
      sales_value: 800,
      sales_target: 900,
      sales_rep: "Bob",
    },
  ]);

  const targetsData = createDataFrame([
    {
      target_id: 1,
      target_region: "North",
      target_product: "Widget A",
      target_quarter: "Q1",
      target_value: 1200,
      target_bonus: 100,
      target_manager: "Carol",
    },
    {
      target_id: 2,
      target_region: "North",
      target_product: "Widget A",
      target_quarter: "Q2",
      target_value: 1300,
      target_bonus: 150,
      target_manager: "Carol",
    },
  ]);

  const comprehensiveJoin = salesData.leftJoin(targetsData, {
    keys: {
      left: ["sales_region", "sales_product", "sales_quarter"],
      right: ["target_region", "target_product", "target_quarter"],
    },
    suffixes: { left: "_actual", right: "_target" },
  });

  // Type check: Comprehensive join with different names and suffixes
  const _comprehensiveJoinTypeCheck: DataFrame<{
    // Left side fields (preserved as-is)
    sales_id: number;
    sales_region: string;
    sales_product: string;
    sales_quarter: string;
    sales_value: number;
    sales_target: number;
    sales_rep: string;
    // Right side fields (with undefined unions - no suffixes since no conflicts)
    target_id: number | undefined;
    target_region: string | undefined;
    target_product: string | undefined;
    target_quarter: string | undefined;
    target_value: number | undefined;
    target_bonus: number | undefined;
    target_manager: string | undefined;
  }> = comprehensiveJoin;

  console.log(
    "typeof _comprehensiveJoinTypeCheck",
    typeof _comprehensiveJoinTypeCheck,
  );

  console.log("Comprehensive join with different names and suffixes:");
  comprehensiveJoin.print();

  // Async join enrichment example
  async function fetchRegionalBonus(region: string): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    const bonuses = { "North": 1.2, "South": 1.1 };
    return bonuses[region as keyof typeof bonuses] || 1.0;
  }

  const enrichedJoin = await salesData
    .leftJoin(targetsData, {
      keys: {
        left: ["sales_region", "sales_product", "sales_quarter"],
        right: ["target_region", "target_product", "target_quarter"],
      },
    })
    .mutate({
      regional_bonus: async (row) => await fetchRegionalBonus(row.sales_region),
    })
    .mutate({
      adjusted_value: (row) => row.sales_value * (row.regional_bonus || 1),
    });

  console.log("Join with async regional bonus calculation:");
  enrichedJoin.print();

  // ============================================================================
  // 17. PIVOTING DATA - Reshaping data for analysis
  // ============================================================================
  console.log("\n=== 17. Pivoting Data ===");
  console.log("Pivoting allows you to reshape data from long to wide format");
  console.log("or vice versa, which is essential for many types of analysis.");

  // Create sample data for pivoting
  const salesLong = createDataFrame([
    { year: 2023, quarter: "Q1", product: "Widget A", sales: 1000 },
    { year: 2023, quarter: "Q1", product: "Widget B", sales: 1500 },
    { year: 2023, quarter: "Q2", product: "Widget A", sales: 1200 },
    { year: 2023, quarter: "Q2", product: "Widget B", sales: 1800 },
    { year: 2024, quarter: "Q1", product: "Widget A", sales: 1100 },
    { year: 2024, quarter: "Q1", product: "Widget B", sales: 1600 },
    { year: 2024, quarter: "Q2", product: "Widget A", sales: 1300 },
    { year: 2024, quarter: "Q2", product: "Widget B", sales: 1900 },
  ]);

  console.log("Long format sales data:");
  salesLong.print();

  // Pivot to wide format - products as columns
  console.log("\n--- Pivot to Wide Format (Products as Columns) ---");
  const salesWide = salesLong.pivotWider({
    namesFrom: "product",
    valuesFrom: "sales",
    expectedColumns: ["Widget A", "Widget B"],
  });

  // Type check: PivotWider<T,Cat> with closed Cat (output columns typed as Cat keys, optional where sparse)
  const _salesWideTypeCheck: DataFrame<{
    year: number;
    quarter: string;
    "Widget A": number;
    "Widget B": number;
  }> = salesWide;

  console.log("Wide format (products as columns):");
  salesWide.print();

  // Pivot with aggregation
  console.log("\n--- Pivot with Aggregation ---");
  const salesWithRegions = createDataFrame([
    { year: 2023, region: "North", product: "Widget A", sales: 1000 },
    { year: 2023, region: "North", product: "Widget B", sales: 1500 },
    { year: 2023, region: "South", product: "Widget A", sales: 800 },
    { year: 2023, region: "South", product: "Widget B", sales: 1200 },
    { year: 2024, region: "North", product: "Widget A", sales: 1100 },
    { year: 2024, region: "North", product: "Widget B", sales: 1600 },
    { year: 2024, region: "South", product: "Widget A", sales: 900 },
    { year: 2024, region: "South", product: "Widget B", sales: 1300 },
  ]);

  const pivotWithAgg = salesWithRegions.pivotWider({
    namesFrom: "region",
    valuesFrom: "sales",
    expectedColumns: ["North", "South"],
  });

  // Type check: PivotWider<T,Cat> with closed Cat (output columns typed as Cat keys, optional where sparse)
  const _pivotWithAggTypeCheck: DataFrame<{
    year: number;
    product: string;
    North: number;
    South: number;
  }> = pivotWithAgg;

  console.log("Pivot with aggregation (sum by year and region):");
  pivotWithAgg.print();

  // Melt (unpivot) - convert wide to long format
  console.log("\n--- Melt (Unpivot) - Wide to Long ---");
  const wideData = createDataFrame([
    { id: 1, name: "Alice", math: 85, science: 92, english: 78 },
    { id: 2, name: "Bob", math: 90, science: 88, english: 85 },
    { id: 3, name: "Charlie", math: 78, science: 95, english: 92 },
  ]);

  console.log("Wide format data:");
  wideData.print();

  const longData = wideData.pivotLonger({
    cols: ["math", "science", "english"],
    namesTo: "subject",
    valuesTo: "score",
  });

  // Type check: PivotLonger (value column type = union/supertype of inputs; key column = literal union)
  const _longDataTypeCheck: DataFrame<{
    id: number;
    name: string;
    subject: string;
    score: number;
  }> = longData;

  console.log("Long format (melted) data:");
  longData.print();

  // Pivot with analysis
  console.log("\n--- Pivot with Analysis ---");
  const pivotAnalysis = salesLong
    .pivotWider({
      namesFrom: "product",
      valuesFrom: "sales",
      expectedColumns: ["Widget A", "Widget B"],
    })
    .mutate({
      total_sales: (row) => row["Widget A"] + row["Widget B"],
    })
    .mutate({
      widget_a_share: (row) =>
        stats.round((row["Widget A"] / row.total_sales) * 100, 1),
      widget_b_share: (row) =>
        stats.round((row["Widget B"] / row.total_sales) * 100, 1),
    });

  // Type check: PivotWider<T,Cat> with mutate operations (preserves pivot types + extends with new columns)
  const _pivotAnalysisTypeCheck: DataFrame<{
    year: number;
    quarter: string;
    "Widget A": number;
    "Widget B": number;
    total_sales: number;
    widget_a_share: number;
    widget_b_share: number;
  }> = pivotAnalysis;

  console.log("Pivot with market share analysis:");
  pivotAnalysis.print();

  // ============================================================================
  // 18. TRANSPOSING DATA - Flipping rows and columns with type safety
  // ============================================================================
  console.log("\n=== 18. Transposing Data ===");
  console.log("Transpose operations flip rows and columns, making it easy to");
  console.log("reshape data for different analysis needs. tidy-ts provides");
  console.log("reversible transposes with strong type preservation.");

  // Basic transpose without row labels
  console.log("\n--- Basic Transpose (without row labels) ---");
  const salesDataOriginal = createDataFrame([
    { product: "Widget A", q1: 100, q2: 120, q3: 110, q4: 130 },
    { product: "Widget B", q1: 80, q2: 90, q3: 95, q4: 105 },
    { product: "Widget C", q1: 60, q2: 70, q3: 75, q4: 85 },
  ]);

  console.log("Original sales data (products × quarters):");
  salesDataOriginal.print();

  const transposed = salesDataOriginal.transpose({ numberOfRows: 3 });

  // Type check: Basic transpose creates row_* columns with union types
  const _transposedTypeCheck: DataFrame<{
    "__tidy_row_label__": "product" | "q1" | "q2" | "q3" | "q4";
    "__tidy_row_types__": {
      product: string;
      q1: number;
      q2: number;
      q3: number;
      q4: number;
    };
    row_0: string | number;
    row_1: string | number;
    row_2: string | number;
  }> = transposed;

  console.log("Transposed (quarters × products):");
  transposed.print();

  // Transpose with custom row labels
  console.log("\n--- Transpose with Custom Row Labels ---");
  const studentScores = createDataFrame([
    { name: "Alice", math: 95, science: 88, english: 92 },
    { name: "Bob", math: 87, science: 94, english: 89 },
    { name: "Charlie", math: 92, science: 91, english: 95 },
  ]);

  console.log("Original student scores:");
  studentScores.print();

  // Add meaningful row labels
  const withLabels = studentScores.setRowLabels([
    "student_1",
    "student_2",
    "student_3",
  ]);
  const transposedWithLabels = withLabels.transpose({ numberOfRows: 3 });

  // Type check: Transpose with row labels uses custom column names
  const _transposedWithLabelsTypeCheck: DataFrame<{
    "__tidy_row_label__": "name" | "math" | "science" | "english";
    "__tidy_row_types__": {
      name: string;
      math: number;
      science: number;
      english: number;
    };
    student_1: string | number;
    student_2: string | number;
    student_3: string | number;
  }> = transposedWithLabels;

  console.log("Transposed with custom row labels (subjects × students):");
  transposedWithLabels.print();

  // Double transpose (round-trip)
  console.log("\n--- Double Transpose (Round-trip) ---");
  console.log(
    "Transpose operations are reversible with perfect data integrity.",
  );

  const backToOriginal = transposedWithLabels.transpose({ numberOfRows: 3 });
  console.log("Double transposed (restored original structure):");
  backToOriginal.print();

  // Real-world use case: Quarterly analysis
  console.log("\n--- Real-world Use Case: Quarterly Analysis ---");
  const quarterlyData = createDataFrame([
    { region: "North", jan: 1000, feb: 1100, mar: 1200, apr: 1300 },
    { region: "South", jan: 800, feb: 900, mar: 950, apr: 1000 },
    { region: "East", jan: 1200, feb: 1300, mar: 1400, apr: 1500 },
    { region: "West", jan: 900, feb: 1000, mar: 1100, apr: 1200 },
  ]);

  console.log("Original quarterly data (regions × months):");
  quarterlyData.print();

  // Transpose to get months as rows for time series analysis
  const monthlyView = quarterlyData.setRowLabels([
    "north",
    "south",
    "east",
    "west",
  ]).transpose({ numberOfRows: 4 });

  // Type check: Real-world transpose with meaningful row labels
  const _monthlyViewTypeCheck: DataFrame<{
    "__tidy_row_label__": "region" | "jan" | "feb" | "mar" | "apr";
    "__tidy_row_types__": {
      region: string;
      jan: number;
      feb: number;
      mar: number;
      apr: number;
    };
    north: string | number;
    south: string | number;
    east: string | number;
    west: string | number;
  }> = monthlyView;

  console.log("Transposed for time series analysis (months × regions):");
  monthlyView.print();

  // Mixed data types transpose
  console.log("\n--- Mixed Data Types Transpose ---");
  const mixedData = createDataFrame([
    {
      id: 1,
      name: "Alice",
      active: true,
      score: 95.5,
      tags: ["smart", "friendly"],
    },
    {
      id: 2,
      name: "Bob",
      active: false,
      score: 87.2,
      tags: ["creative", "funny"],
    },
  ]);

  console.log("Mixed data types:");
  mixedData.print();

  const mixedTransposed = mixedData.setRowLabels(["user1", "user2"]).transpose(
    { numberOfRows: 2 },
  );

  // Type check: Mixed data types transpose preserves all types
  const _mixedTransposedTypeCheck: DataFrame<{
    "__tidy_row_label__": "id" | "name" | "active" | "score" | "tags";
    "__tidy_row_types__": {
      id: number;
      name: string;
      active: boolean;
      score: number;
      tags: string[];
    };
    user1: number | string | boolean | string[];
    user2: number | string | boolean | string[];
  }> = mixedTransposed;

  console.log("Transposed mixed data:");
  mixedTransposed.print();

  console.log("\n=== Transpose Benefits ===");
  console.log(
    "✅ Reversible: Double transpose perfectly restores original data",
  );
  console.log(
    "✅ Type-safe: Full TypeScript support with proper type inference",
  );
  console.log(
    "✅ Flexible: Works with any data types (strings, numbers, booleans, arrays)",
  );
  console.log(
    "✅ Customizable: Use meaningful row labels instead of generic row_* names",
  );
  console.log(
    "✅ Metadata preservation: Stores original types for perfect round-trips",
  );

  // ============================================================================
  // 19. PUTTING IT ALL TOGETHER - Complete workflow combining all concepts
  // ============================================================================
  console.log("\n=== 16. Putting It All Together ===");
  console.log("Now let's combine everything we've learned into a complete");
  console.log("data analysis workflow that demonstrates the power of tidy-ts.");

  // Show how all the concepts work together in a complete pipeline
  const finalResult = people
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      is_heavy: (row) => row.mass > 100,
      size_category: (row) => {
        if (row.height > 200) return "Very Tall";
        if (row.height > 170) return "Tall";
        if (row.height > 150) return "Average";
        return "Short";
      },
    })
    .select(
      "name",
      "species",
      "mass",
      "height",
      "bmi",
      "is_heavy",
      "size_category",
    );

  // Type check: select preserves only the selected columns
  const _finalResultTypeCheck: DataFrame<{
    name: string;
    species: string;
    mass: number;
    height: number;
    bmi: number;
    is_heavy: boolean;
    size_category: "Very Tall" | "Tall" | "Average" | "Short";
  }> = finalResult;

  console.log("Final result combining all concepts:");
  finalResult.print();

  // Async version of the complete workflow
  console.log("\n--- Async Version of Complete Workflow ---");

  async function enrichBMICategory(bmi: number): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (bmi < 18.5) return "💡 Underweight";
    if (bmi < 25) return "✅ Healthy";
    if (bmi < 30) return "⚠️ Overweight";
    return "🚨 Obese";
  }

  const asyncFinalResult = await people
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      is_heavy: (row) => row.mass > 100,
      bmi_category: async (row) =>
        await enrichBMICategory(row.mass / Math.pow(row.height / 100, 2)),
    })
    .filter(async (row) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.species !== "Droid";
    })
    .select(
      "name",
      "species",
      "mass",
      "height",
      "bmi",
      "bmi_category",
      "is_heavy",
    );

  console.log("Async final result with enriched BMI categories:");
  asyncFinalResult.print();

  // ============================================================================
  // 14.5. EXTRACT METHODS IN COMPLEX WORKFLOWS - Advanced usage
  // ============================================================================
  console.log("\n=== 14.5. Extract Methods in Complex Workflows ===");

  // Extract methods are particularly powerful in complex data analysis workflows
  // Here are some advanced examples combining multiple operations

  // Find the most efficient character (highest BMI efficiency)
  const mostEfficientCharacter = people
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
    })
    .arrange("bmi", "desc")
    .extractHead("name", 1);
  console.log(
    "Most efficient character (highest BMI):",
    mostEfficientCharacter,
  );

  // Get the average mass of the top 3 heaviest characters
  const top3HeaviestMasses = people
    .arrange("mass", "desc")
    .extractHead("mass", 3);
  const avgTop3Mass = stats.round(stats.mean(top3HeaviestMasses), 2);
  console.log("Average mass of top 3 heaviest:", avgTop3Mass);

  // Find characters within a specific height range
  const mediumHeightCharacters = people
    .filter((row) => row.height >= 150 && row.height <= 200)
    .extract("name");
  console.log("Medium height characters (150-200cm):", mediumHeightCharacters);

  // Get a random sample for analysis
  const randomSample = people.extractSample("name", 2);
  console.log("Random sample for analysis:", randomSample);

  // Extract specific values after complex transformations
  const transformedData = people
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      is_tall: (row) => row.height > 170,
      weight_category: (row) => row.mass > 100 ? "Heavy" : "Light",
    })
    .filter((row) => row.is_tall && row.weight_category === "Heavy")
    .extract("name");
  console.log("Tall and heavy characters:", transformedData);

  // Test assertions
  expect(people.nrows()).toBe(5);
  expect(validatedPeople.nrows()).toBe(3);
  expect(csvDataFrame.nrows()).toBe(4);
  expect(csvDataFrame.name).toBeDefined();
  expect(withBmi.nrows()).toBe(5);
  expect(withBmi.bmi).toBeDefined();
  expect(withMultipleColumns.nrows()).toBe(5);
  expect(withMultipleColumns.is_heavy).toBeDefined();
  expect(withStats.nrows()).toBe(5);
  expect(withStats.cumulative_mass).toBeDefined();
  expect(withAdvancedPatterns.nrows()).toBe(5);
  expect(withAdvancedPatterns.size_category).toBeDefined();
  expect(withAsyncData.nrows()).toBe(5);
  expect(withAsyncData.async_bonus).toBeDefined();
  expect(withAsyncData.name_upper).toBeDefined();
  expect(withDoubleMass.nrows()).toBe(5);
  expect(withDoubleMass.doubleMass).toBeDefined();
  expect(withQuadrupleMass.nrows()).toBe(5);
  expect(withQuadrupleMass.quadrupleMass).toBeDefined();
  expect(chainedExample.nrows()).toBe(5);
  expect(chainedExample.massRatio).toBeDefined();
  expect(sampleData.nrows()).toBe(8);
  expect(withStatsDerived.nrows()).toBe(8);
  expect(withStatsDerived.valueZScore).toBeDefined();
  expect(withStatsDerived.valueRank).toBeDefined();
  expect(stats.unique(species).length).toBe(3);
  expect(finalResult.nrows()).toBe(5);
  expect(finalResult.bmi).toBeDefined();

  // Test new sections
  expect(speciesAnalysis.nrows()).toBeGreaterThan(0);
  expect(speciesAnalysis.count).toBeDefined();
  expect(bmiAnalysis.nrows()).toBeGreaterThan(0);
  expect(bmiAnalysis.bmi_category).toBeDefined();
  expect(complexAnalysis.nrows()).toBeGreaterThan(0);
  expect(complexAnalysis.heavy_percentage).toBeDefined();
  expect(messyData.nrows()).toBe(6);
  expect(missingAnalysis.total_rows[0]).toBe(6);
  expect(defaultCleaned.nrows()).toBe(6);
  expect(smartCleaned.nrows()).toBe(6);
  expect(conditionalCleaned.nrows()).toBe(6);
  expect(filteredData.nrows()).toBeLessThanOrEqual(6);
  expect(advancedImputation.nrows()).toBe(6);
  expect(performanceData.nrows()).toBe(1);
  // Test join operations
  expect(employees.nrows()).toBe(5);
  expect(departments.nrows()).toBe(4);
  expect(innerJoin.nrows()).toBe(6); // Only matching records
  expect(leftJoin.nrows()).toBe(7); // All employees, with duplicates due to multiple dept_id matches
  expect(multiKeyInnerJoin.nrows()).toBe(3); // Multi-key matches
  expect(multiKeyLeftJoin.nrows()).toBe(5); // All employees with multi-key
  expect(joinDifferentColumns.nrows()).toBe(1);
  expect(comprehensiveJoin.nrows()).toBe(2); // Comprehensive join

  // Test pivot operations
  expect(salesLong.nrows()).toBe(8);
  expect(salesWide.nrows()).toBe(4); // 2 years × 2 quarters
  expect(pivotWithAgg.nrows()).toBe(4); // 2 years × 2 products
  expect(wideData.nrows()).toBe(3);
  expect(longData.nrows()).toBe(9); // 3 students × 3 subjects
  expect(pivotAnalysis.nrows()).toBe(4); // 2 years × 2 quarters

  // Test transpose operations
  expect(quarterlyData.nrows()).toBe(4);
  expect(transposed.nrows()).toBe(5); // 5 original columns become 5 rows
  expect(studentScores.nrows()).toBe(3);
  expect(transposedWithLabels.nrows()).toBe(4); // 4 original columns become 4 rows
  expect(backToOriginal.nrows()).toBe(3); // Restored to original
  expect(monthlyView.nrows()).toBe(5); // 5 original columns become 5 rows
  expect(mixedData.nrows()).toBe(2);
  expect(mixedTransposed.nrows()).toBe(5); // 5 original columns become 5 rows

  // Test new operations (select, drop, filter, arrange)
  expect(selectedColumns.nrows()).toBe(5);
  expect(selectedColumns.columns()).toEqual(["name", "bmi", "height"]);
  expect(droppedColumns.nrows()).toBe(5);
  expect(droppedColumns.columns()).toEqual([
    "id",
    "name",
    "height",
    "bmi",
    "is_heavy",
    "row_number",
    "cumulative_mass",
    "mean_bmi",
  ]);
  expect(tallPeople.nrows()).toBe(2); // Luke and Chewbacca
  expect(humans.nrows()).toBe(2); // Luke and Leia
  expect(tallHumans.nrows()).toBe(1); // Only Darth Vader (Human with height > 180)
  expect(sortedByHeight.nrows()).toBe(5);
  expect(sortedByHeight[0].name).toBe("R2-D2"); // Shortest first
  expect(sortedByBmiDesc.nrows()).toBe(5);
  expect(sortedByBmiDesc[0].name).toBe("R2-D2"); // Highest BMI first (34.72)

  // Test extract methods
  expect(typeof firstPerson).toBe("string");
  expect(firstPerson).toBe("Luke");
  expect(Array.isArray(firstThreeNames)).toBe(true);
  expect(firstThreeNames).toHaveLength(3);
  expect(typeof lastPerson).toBe("string");
  expect(lastPerson).toBe("Chewbacca");
  expect(Array.isArray(lastTwoNames)).toBe(true);
  expect(lastTwoNames).toHaveLength(2);
  expect(thirdPerson).toBe("R2-D2");
  expect(firstMass).toBe(77);
  expect(Array.isArray(randomNames)).toBe(true);
  expect(randomNames).toHaveLength(2);
  expect(Array.isArray(humanNames)).toBe(true);
  expect(humanNames).toContain("Luke");
  expect(Array.isArray(mediumHeightCharacters)).toBe(true);
  expect(Array.isArray(transformedData)).toBe(true);

  // Test the new combining functionality
  expect(starWarsDataFrame.nrows()).toBe(2); // Yoda + Luke + Leia
  expect(lukeDataFrame.nrows()).toBe(1); // Luke
  expect(method1Combined.nrows()).toBe(3); // Luke + Yoda + Leia
  expect(multiCombined.nrows()).toBe(4); // Luke + Yoda + Leia + Obi-Wan
  expect(finalCombined.nrows()).toBe(5); // Luke + Yoda + Leia + Obi-Wan + Anakin

  // Test that optional properties work correctly with bindRows
  const leiaRow = finalCombined.filter((row) => row.name === "Leia");
  const lukeRow = finalCombined.filter((row) => row.name === "Luke");
  console.log("lukeRow", lukeRow);
  const anakinRow = finalCombined.filter((row) => row.name === "Anakin");

  expect(lukeRow[0].lightsaber_color).toBe("blue");
  expect(leiaRow[0].lightsaber_color).toBeUndefined();
  expect(anakinRow[0].midichlorian_count).toBe(20000);
  expect(lukeRow[0].midichlorian_count).toBeUndefined();

  // Test async examples
  expect(enrichedPenguins.nrows()).toBeGreaterThan(0);
  expect(enrichedPenguins.classification).toBeDefined();
  validatedCharacters.print();
  expect(validatedCharacters.nrows()).toBe(3); // Excludes droids
  expect(enrichedSpeciesAnalysis.nrows()).toBeGreaterThan(0);
  expect(enrichedSpeciesAnalysis.expected_lifespan).toBeDefined();
  expect(enrichedJoin.nrows()).toBeGreaterThan(0);
  expect(enrichedJoin.regional_bonus).toBeDefined();
  asyncFinalResult.print();
  expect(asyncFinalResult.nrows()).toBe(3); // Only non-droids
  expect(asyncFinalResult.bmi_category).toBeDefined();

  // Verify concurrency was limited
  expect(maxConcurrentCalls).toBeLessThanOrEqual(2);

  // Verify retries happened (2 failures per call * 3 calls = 6 retries)
  expect(retryLog.length).toBe(6);
});
