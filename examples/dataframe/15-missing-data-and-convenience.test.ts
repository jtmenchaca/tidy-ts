import { createDataFrame, readCSV, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";
import { test } from "../../tests/shims/test.ts";

test("Missing Data and Convenience Functions - Progressive Examples", async () => {
  // ============================================================================
  // 1. SETTING UP DATA WITH MISSING VALUES - Common patterns
  // ============================================================================
  console.log("=== 1. Setting Up Data with Missing Values ===");

  // Define a schema that explicitly handles nullable fields
  const ResearchDataSchema = z.object({
    participant_id: z.number(),
    name: z.string().nullable(),
    age: z.number().nullable(),
    score: z.number().nullable(),
    completed: z.boolean().nullable(),
    notes: z.string().nullable(),
  });

  // Create sample data with missing values (common in real-world datasets)
  const researchData = createDataFrame([
    {
      participant_id: 1,
      name: "Alice",
      age: 25,
      score: 85,
      completed: true,
      notes: "Great performance",
    },
    {
      participant_id: 2,
      name: null,
      age: 30,
      score: null,
      completed: true,
      notes: "Missing score data",
    },
    {
      participant_id: 3,
      name: "Charlie",
      age: null,
      score: 92,
      completed: false,
      notes: null,
    },
    {
      participant_id: 4,
      name: "Diana",
      age: 28,
      score: null,
      completed: null,
      notes: "Incomplete session",
    },
    {
      participant_id: 5,
      name: "Eve",
      age: 35,
      score: 78,
      completed: true,
      notes: null,
    },
  ], ResearchDataSchema);

  console.log("Research data with missing values:");
  researchData.print();

  // Type check: Schema ensures proper nullable typing
  const _researchTypeCheck: typeof researchData = researchData;

  // ============================================================================
  // 2. ANALYZING MISSING DATA PATTERNS - Understanding your data quality
  // ============================================================================
  console.log("\n=== 2. Analyzing Missing Data Patterns ===");

  // Create a summary of missing data across columns
  const missingDataSummary = researchData
    .summarise({
      total_rows: (df) => df.nrows(),
      name_missing: (df) => df.name.filter((x) => x === null).length,
      age_missing: (df) => df.age.filter((x) => x === null).length,
      score_missing: (df) => df.score.filter((x) => x === null).length,
      completed_missing: (df) => df.completed.filter((x) => x === null).length,
      notes_missing: (df) => df.notes.filter((x) => x === null).length,
    })
    .mutate({
      name_missing_pct: (row) =>
        stats.round((row.name_missing / row.total_rows) * 100, 1),
      age_missing_pct: (row) =>
        stats.round((row.age_missing / row.total_rows) * 100, 1),
      score_missing_pct: (row) =>
        stats.round((row.score_missing / row.total_rows) * 100, 1),
      completed_missing_pct: (row) =>
        stats.round((row.completed_missing / row.total_rows) * 100, 1),
      notes_missing_pct: (row) =>
        stats.round((row.notes_missing / row.total_rows) * 100, 1),
    });

  console.log("Missing data analysis:");
  missingDataSummary.print();

  // ============================================================================
  // 3. BASIC MISSING DATA REPLACEMENT - Using replace_na
  // ============================================================================
  console.log("\n=== 3. Basic Missing Data Replacement - Using replace_na ===");

  // Replace missing values with appropriate defaults
  const basicCleaned = researchData.replaceNA({
    name: "Unknown Participant",
    age: 0,
    score: -1, // Use -1 to indicate missing scores
    completed: false,
    notes: "No notes available",
  });

  console.log("After basic replace_na with defaults:");
  basicCleaned.print();

  // Type check: replace_na transforms nullable types to non-nullable
  const _basicCleanedTypeCheck: typeof basicCleaned = basicCleaned;
  const _testName: string = basicCleaned[0].name; // Now guaranteed to be string, not null
  const _testAge: number = basicCleaned[0].age; // Now guaranteed to be number, not null

  // ============================================================================
  // 4. SMART MISSING DATA REPLACEMENT - Using statistics
  // ============================================================================
  console.log("\n=== 4. Smart Missing Data Replacement - Using Statistics ===");

  // Calculate statistics from non-missing values for intelligent replacement
  const validAges = researchData.age.filter((x) => x !== null);
  const validScores = researchData.score.filter((x) => x !== null);

  const smartCleaned = researchData
    .replaceNA({
      name: "Participant_Unknown",
      age: stats.round(stats.mean(validAges), 0), // Use mean age
      score: stats.round(stats.mean(validScores), 1), // Use mean score
      completed: false, // Conservative default
      notes: "Data imputed",
    });

  console.log("After smart replace_na with calculated values:");
  smartCleaned.print();
  console.log(`Mean age used: ${stats.round(stats.mean(validAges), 1)}`);
  console.log(`Mean score used: ${stats.round(stats.mean(validScores), 1)}`);

  // ============================================================================
  // 5. CONDITIONAL MISSING DATA REPLACEMENT - Context-aware replacement
  // ============================================================================
  console.log("\n=== 5. Conditional Missing Data Replacement ===");

  // Replace missing values based on other column values
  const conditionalCleaned = researchData
    .mutate({
      // Replace missing scores based on completion status
      score_filled: (row) => {
        if (row.score !== null) return row.score;
        if (row.completed === false) return 0; // Incomplete gets 0
        return stats.mean(validScores); // Others get mean
      },
      // Replace missing names with participant ID
      name_filled: (row) => row.name || `Participant_${row.participant_id}`,
      // Replace missing age with category-appropriate default
      age_filled: (row) => {
        if (row.age !== null) return row.age;
        // Use different defaults based on completion status
        return row.completed ? 30 : 25; // Completers might be older
      },
    });

  console.log("After conditional missing data replacement:");
  conditionalCleaned.select(
    "participant_id",
    "name_filled",
    "age_filled",
    "score_filled",
    "completed",
  ).print();

  // ============================================================================
  // 6. CONVENIENCE VERBS - Data manipulation shortcuts
  // ============================================================================
  console.log("\n=== 6. Convenience Verbs - Data Manipulation Shortcuts ===");

  // Create a larger dataset to demonstrate convenience functions
  const expandedData = smartCleaned
    .append(
      {
        participant_id: 6,
        name: "Frank",
        age: 22,
        score: 95,
        completed: true,
        notes: "Excellent",
      },
      {
        participant_id: 7,
        name: "Grace",
        age: 27,
        score: 88,
        completed: true,
        notes: "Good work",
      },
    )
    .prepend(
      {
        participant_id: 0,
        name: "Pilot",
        age: 40,
        score: 75,
        completed: true,
        notes: "Test participant",
      },
    );

  console.log("Expanded dataset (prepend + append):");
  expandedData.print();

  // Shuffle the data for demonstration
  const shuffledData = expandedData.shuffle();
  console.log("After shuffle (random order):");
  shuffledData.print();

  // ============================================================================
  // 7. WINDOW FUNCTIONS - Lag and Lead operations
  // ============================================================================
  console.log("\n=== 7. Window Functions - Lag and Lead Operations ===");

  // First arrange by participant_id for meaningful lag/lead
  const arrangedData = shuffledData.arrange("participant_id");

  const withWindowFunctions = arrangedData
    .mutate({
      // Add lag and lead values for scores
      previous_score: (_row, index, df) =>
        stats.lag(df.score, 1)[index] || -999,
      next_score: (_row, index, df) => stats.lead(df.score, 1)[index] || -999,
      // Add cumulative statistics
      cumulative_score: (_row, index, df) => stats.cumsum(df.score)[index],
      running_max: (_row, index, df) => stats.cummax(df.score)[index],
      running_min: (_row, index, df) => stats.cummin(df.score)[index],
      // Add ranking
      score_rank: (_row, index, df) => stats.rank(df.score, "average")[index],
      score_dense_rank: (_row, index, df) => stats.denseRank(df.score)[index],
    });

  console.log("With window functions (lag, lead, cumulative, ranking):");
  withWindowFunctions
    .select(
      "participant_id",
      "score",
      "previous_score",
      "next_score",
      "cumulative_score",
      "score_rank",
    )
    .print();

  // ============================================================================
  // 8. READING CSV WITH MISSING DATA - Real-world data loading
  // ============================================================================
  console.log(
    "\n=== 8. Reading CSV with Missing Data - Real-world Data Loading ===",
  );

  // Define schema for CSV with potential missing values
  const CSVSchema = z.object({
    score: z.number().nullable(),
    rating: z.number().nullable(),
  });

  // Read CSV content with missing data patterns (simulating file reading)
  const csvContent = `score,rating
85,4.2
NA,3.8
90,NA
78,`;

  const csvData = await readCSV(csvContent, CSVSchema, {
    skipEmptyLines: true,
    naValues: ["", "NA", "NULL", "null", "N/A"],
  });

  console.log("CSV data with missing values:");
  csvData.print();

  // Clean the CSV data
  const cleanedCsvData = csvData.replaceNA({
    score: stats.mean(csvData.score.filter((x) => x !== null)),
    rating: stats.mean(csvData.rating.filter((x) => x !== null)),
  });

  console.log("Cleaned CSV data:");
  cleanedCsvData.print();

  // ============================================================================
  // 9. ADVANCED PATTERNS - Combining multiple techniques
  // ============================================================================
  console.log("\n=== 9. Advanced Patterns - Combining Multiple Techniques ===");

  // Create a comprehensive cleaning and analysis pipeline
  const comprehensiveAnalysis = researchData
    // Step 1: Replace missing values intelligently
    .replaceNA({
      name: "Unknown",
      age: stats.round(stats.mean(validAges), 0),
      score: stats.round(stats.mean(validScores), 1),
      completed: false,
      notes: "Data imputed",
    })
    // Step 2: Add analytical columns
    .mutate({
      age_category: (row) => {
        if (row.age < 25) return "Young";
        if (row.age < 35) return "Middle";
        return "Mature";
      },
      performance_level: (row) => {
        if (row.score >= 90) return "Excellent";
        if (row.score >= 80) return "Good";
        if (row.score >= 70) return "Fair";
        return "Needs Improvement";
      },
      completion_rate: (_row, _index, df) => {
        const completed = df.filter((r) => r.completed === true).nrows();
        return stats.round((completed / df.nrows()) * 100, 1);
      },
    })
    // Step 3: Add rankings and cumulative statistics
    .mutate({
      score_percentile: (_row, index, df) => {
        const rank = stats.rank(df.score, "average")[index];
        return stats.round(((rank || 0) / df.nrows()) * 100, 1);
      },
      running_average: (_row, index, df) => {
        const scores = df.score.slice(0, index + 1);
        return stats.round(stats.mean(scores), 2);
      },
    })
    // Step 4: Shuffle and select relevant columns
    .shuffle()
    .select(
      "participant_id",
      "name",
      "age",
      "age_category",
      "score",
      "performance_level",
      "score_percentile",
      "running_average",
      "completed",
    );

  console.log("Comprehensive analysis with all techniques:");
  comprehensiveAnalysis.print();

  // ============================================================================
  // 10. PERFORMANCE WITH MISSING DATA - Efficiency considerations
  // ============================================================================
  console.log(
    "\n=== 10. Performance with Missing Data - Efficiency Considerations ===",
  );

  // Show efficient patterns for working with missing data
  const efficiencyTips = createDataFrame([
    {
      tip: "Early Filtering",
      description: "Filter out rows with too many missing values early",
      example: "df.filter(row => nonNullCount(row) >= threshold)",
    },
    {
      tip: "Batch Replacement",
      description: "Replace all missing values in one operation",
      example: "df.replaceNA({ col1: default1, col2: default2 })",
    },
    {
      tip: "Statistical Caching",
      description: "Calculate replacement statistics once and reuse",
      example:
        "const mean = stats.mean(validValues); df.replaceNA({ col: mean })",
    },
    {
      tip: "Conditional Logic",
      description: "Use mutate for complex conditional replacements",
      example: "df.mutate({ col: row => row.col ?? computeDefault(row) })",
    },
  ]);

  console.log("Efficiency tips for missing data:");
  efficiencyTips.print();

  // Test assertions
  expect(researchData.nrows()).toBe(5);
  expect(missingDataSummary.name_missing).toBeDefined();
  expect(basicCleaned.nrows()).toBe(5);
  expect(typeof basicCleaned[0].name === "string").toBe(true); // No more nulls
  expect(smartCleaned.nrows()).toBe(5);
  expect(typeof smartCleaned[0].age === "number").toBe(true); // No more nulls
  expect(conditionalCleaned.score_filled).toBeDefined();
  expect(expandedData.nrows()).toBe(8); // 5 + 2 + 1
  expect(shuffledData.nrows()).toBe(8);
  expect(withWindowFunctions.previous_score).toBeDefined();
  expect(withWindowFunctions.cumulative_score).toBeDefined();
  expect(withWindowFunctions.score_rank).toBeDefined();
  expect(csvData.nrows()).toBeGreaterThan(0);
  expect(cleanedCsvData.nrows()).toBe(csvData.nrows());
  expect(comprehensiveAnalysis.nrows()).toBe(5);
  expect(comprehensiveAnalysis.age_category).toBeDefined();
  expect(comprehensiveAnalysis.performance_level).toBeDefined();
  expect(efficiencyTips.nrows()).toBe(4);

  console.log(
    "\n✅ All missing data and convenience function examples completed!",
  );
});
