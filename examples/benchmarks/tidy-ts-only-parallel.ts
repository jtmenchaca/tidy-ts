#!/usr/bin/env -S deno run --allow-read

import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";
import { randomBetween, randomIntegerBetween, randomSeeded } from "@std/random";

// Configuration
const SIZES = [20000000];
const ITERATIONS = 2;
const WARMUP_RUNS = 0;

// Create a seeded PRNG for consistent results across runs
const prng = randomSeeded(42n); // Same seed as Python/R (42)

// Type definitions
interface DataRow {
  id: number;
  value: number;
  category: string;
  score: number;
  active: boolean;
}

// Boolean flags to enable/disable specific operations
const OPTIONS = {
  creation: false,
  filter: false,
  select: false,
  sort: false,
  mutate: false,
  distinct: false,
  groupBy: false,
  summarize: false,
  innerJoin: false,
  leftJoin: true,
  outerJoin: false,
  pivotLonger: false,
  pivotWider: false,
  bindRows: false,
  stats: false,
} as const;

// Generate test data
function generateData(size: number) {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1, // 1-based indexing to match Python/R
    value: randomBetween(0, 1000, { prng }),
    category: `category_${i % 20}`,
    score: randomBetween(0, 100, { prng }),
    active: i % 3 === 0,
  }));
}

function generateJoinData(size: number) {
  const leftData = Array.from({ length: size }, (_, i) => ({
    id: i + 1, // 1-based indexing to match Python/R
    value_a: randomBetween(0, 1000, { prng }),
    category: ["A", "B", "C"][i % 3],
  }));

  const rightSize = Math.floor(size * 0.8);
  const rightData = Array.from({ length: rightSize }, (_, i) => ({
    id: randomIntegerBetween(1, size + 1, { prng }), // 1-based indexing to match Python/R
    value_b: randomBetween(0, 1000, { prng }),
    status: ["active", "pending", "complete"][i % 3],
  }));

  return { leftData, rightData };
}

function generatePivotData(size: number) {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1, // 1-based indexing to match Python/R
    region: `region_${i % 5}`,
    product: `product_${i % 10}`,
    q1: randomIntegerBetween(0, 1000, { prng }), // 0-999 to match Python/R
    q2: randomIntegerBetween(0, 1000, { prng }),
    q3: randomIntegerBetween(0, 1000, { prng }),
    q4: randomIntegerBetween(0, 1000, { prng }),
  }));
}

// Measure a single operation (sync)
function measure(
  fn: () => void,
  iterations: number = ITERATIONS,
  warmupRuns: number = WARMUP_RUNS,
): number {
  // Warm up
  for (let i = 0; i < warmupRuns; i++) {
    fn();
  }

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);
  // Return median of last N-1 runs (excluding first run after warmup)
  if (times.length > 1) {
    return times[Math.floor(times.length / 2)]; // median
  } else {
    return times[0];
  }
}

// Measure an async operation
async function measureAsync<T extends object>(
  fn: () => Promise<DataFrame<T>>,
  iterations: number = ITERATIONS,
  warmupRuns: number = WARMUP_RUNS,
): Promise<number> {
  // Warm up
  for (let i = 0; i < warmupRuns; i++) {
    await fn();
  }

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);
  // Return median of last N-1 runs (excluding first run after warmup)
  if (times.length > 1) {
    return times[Math.floor(times.length / 2)]; // median
  } else {
    return times[0];
  }
}

export async function runTypeScriptBenchmarks() {
  console.log("Running TypeScript benchmarks (tidy-ts parallel)...\n");

  const results: Record<
    number,
    Record<string, { tidy: number }>
  > = {};

  for (const size of SIZES) {
    console.log(`  Testing ${size.toLocaleString()} rows...`);

    const { leftData, rightData } = generateJoinData(size);

    results[size] = {};

    // Prebuild DataFrames based on what operations are enabled
    let tidyDf: DataFrame<DataRow>;
    let leftTidyDf: DataFrame<{
      id: number;
      value_a: number;
      category: string;
    }>;
    let rightTidyDf: DataFrame<{
      id: number;
      value_b: number;
      status: string;
    }>;
    let tidyNumericDf: DataFrame<{
      value: number;
      date: Date;
      score: number | null;
    }>;
    let tidyMixedDf: DataFrame<{
      name: string;
      category: string;
      value: number;
      active: boolean;
    }>;
    let tidyGroupedDf: DataFrame<{
      group: string;
      value: number;
      priority: number;
    }>;
    let tidyPivotDf: DataFrame<{
      id: number;
      region: string;
      product: string;
      q1: number;
      q2: number;
      q3: number;
      q4: number;
    }>;
    let df1Tidy: DataFrame<DataRow>;
    let df2Tidy: DataFrame<DataRow>;
    let data: DataRow[];

    if (
      Object.values(OPTIONS).filter(Boolean).length === 1 && OPTIONS.leftJoin
    ) {
      // Only create DataFrames needed for left join
      leftTidyDf = createDataFrame(leftData, { trace: true });
      rightTidyDf = createDataFrame(rightData, { trace: true });
    } else {
      data = generateData(size);
      // Generate specialized data for other operations
      const pivotData = generatePivotData(size);
      const numericData = Array.from({ length: size }, (_, i) => ({
        value: Math.random() * 1000,
        date: new Date(
          2020 + Math.floor(Math.random() * 4),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28),
        ),
        score: i % 10 === 0 ? null : Math.random() * 100,
      }));

      const mixedData = Array.from({ length: size }, (_, i) => ({
        name: `name_${i % 100}`,
        category: `category_${i % 20}`,
        value: Math.random() * 1000,
        active: i % 3 === 0,
      }));

      const groupedData = Array.from({ length: size }, (_, i) => ({
        group: `group_${i % 5}`,
        value: Math.random() * 1000,
        priority: Math.floor(Math.random() * 10),
      }));

      // Prebuild all DataFrames for consistent performance
      console.log("    - Prebuilding DataFrames...");
      tidyDf = createDataFrame(data, { trace: true });
      tidyNumericDf = createDataFrame(numericData, { trace: true });
      tidyMixedDf = createDataFrame(mixedData, { trace: true });
      tidyGroupedDf = createDataFrame(groupedData, { trace: true });
      tidyPivotDf = createDataFrame(pivotData, { trace: true });
      leftTidyDf = createDataFrame(leftData, { trace: true });
      rightTidyDf = createDataFrame(rightData, { trace: true });

      // Prebuild split dataframes for bindRows operations
      df1Tidy = createDataFrame(
        data.slice(0, Math.floor(data.length / 2)),
        { trace: true },
      );
      df2Tidy = createDataFrame(
        data.slice(Math.floor(data.length / 2)),
        {
          trace: true,
        },
      );
    }

    console.log("    - DataFrames prebuilt");

    // DataFrame Creation
    if (OPTIONS.creation) {
      console.log("    - Starting creation benchmark...");
      const tidyTime = measure(
        () => createDataFrame(data, { trace: true }),
        ITERATIONS,
        WARMUP_RUNS,
      );
      console.log("    - Tidy creation done");
      results[size].creation = {
        tidy: tidyTime,
      };
      console.log("    - Creation benchmark complete");
    }

    // Filter Operations (3 tests with weighted averaging)
    if (OPTIONS.filter) {
      console.log("    - Starting filter benchmark...");
      // Test 1: Simple numeric filtering
      const tidyNumeric = measure(
        () => {
          const result = tidyDf.filter((row) => row.value > 500);
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 2: String filtering
      const tidyString = measure(
        () => {
          const result = tidyDf.filter((row) => row.category === "category_5");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 3: Complex filtering
      const tidyComplex = measure(
        () => {
          const result = tidyDf.filter((row) =>
            row.value > 300 && row.score > 50 && row.active
          );
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Weighted average (emphasizing common use cases)
      const avgTidy = (tidyNumeric * 2 + tidyString + tidyComplex) / 4;

      results[size].filter = {
        tidy: avgTidy,
      };
    }

    // Select Columns
    if (OPTIONS.select) {
      const tidyTime = measure(
        () => {
          const result = tidyDf.select("id", "value", "category");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].select = {
        tidy: tidyTime,
      };
    }

    // Sort Operations (5 tests with weighted averaging)
    if (OPTIONS.sort) {
      // Test 1: Numeric Fast Path
      const tidyNumeric = measure(
        () => {
          const result = tidyNumericDf.arrange("value", "asc");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 2: Multi-column Numeric Fast Path
      const tidyMultiNumeric = measure(
        () => {
          tidyNumericDf.arrange(["value", "score"], ["asc", "desc"]);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 3: String Stable Path
      const tidyString = measure(
        () => {
          const result = tidyMixedDf.arrange("name", "asc");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 4: Mixed Types Stable Path
      const tidyMixed = measure(
        () => {
          const result = tidyMixedDf.arrange(["category", "value"], [
            "asc",
            "desc",
          ]);
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 5: Grouped Data Stable Path
      const tidyGrouped = measure(
        () => {
          const result = tidyGroupedDf.groupBy("group").arrange(
            "value",
            "desc",
          );
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Weighted average (emphasizing numeric sorting)
      const avgTidy =
        (tidyNumeric * 2 + tidyMultiNumeric * 2 + tidyString + tidyMixed +
          tidyGrouped) / 7;

      results[size].sort = {
        tidy: avgTidy,
      };
    }

    // Mutate Operations
    if (OPTIONS.mutate) {
      const tidyTime = measure(
        () => {
          const result = tidyDf.mutate({ score_pct: (row) => row.score / 100 });
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].mutate = {
        tidy: tidyTime,
      };
    }

    // Distinct Operations
    if (OPTIONS.distinct) {
      const tidyTime = measure(
        () => {
          const result = tidyDf.distinct();
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].distinct = {
        tidy: tidyTime,
      };
    }

    // Group By Operations (3 tests with weighted averaging)
    if (OPTIONS.groupBy) {
      // Test 1: Single column grouping
      const tidySingle = measure(
        () => {
          const result = tidyDf.groupBy("category");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 2: Multiple column grouping
      const tidyMulti = measure(
        () => {
          const result = tidyDf.groupBy("category", "active");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 3: High cardinality grouping
      const tidyHighCard = measure(
        () => {
          const result = tidyDf.groupBy("id");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Weighted average (emphasizing common use cases)
      const avgTidy = (tidySingle * 2 + tidyMulti * 2 + tidyHighCard) / 5;

      results[size].groupBy = {
        tidy: avgTidy,
      };
    }

    // Summarize Operations (3 tests with weighted averaging)
    if (OPTIONS.summarize) {
      // Test 1: Ungrouped summarization
      const tidyUngrouped = measure(
        () => {
          const result = tidyDf.summarise({
            count: (df) => df.nrows(),
            avg_value: (df) => stats.mean(df.value),
            total_value: (df) => stats.sum(df.value),
          });
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 2: Grouped summarization
      const tidyGrouped = measure(
        () => {
          const result = tidyDf.groupBy("category").summarise({
            count: (group) => group.nrows(),
            avg_value: (group) => stats.mean(group.value),
            total_value: (group) => stats.sum(group.value),
          });
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 3: Complex grouped summarization
      const tidyComplex = measure(
        () => {
          const result = tidyDf.groupBy("category", "active").summarise({
            count: (group) => group.nrows(),
            avg_value: (group) => stats.mean(group.value),
            avg_score: (group) => stats.mean(group.score),
          });
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Weighted average (emphasizing common use cases)
      const avgTidy = (tidyUngrouped + tidyGrouped * 2 + tidyComplex) / 4;

      results[size].summarize = {
        tidy: avgTidy,
      };
    }

    // Inner Join Operations
    if (OPTIONS.innerJoin) {
      const tidyTime = measure(
        () => {
          const result = leftTidyDf.innerJoin(rightTidyDf, "id");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].innerJoin = {
        tidy: tidyTime,
      };
    }

    // Left Join Operations (Parallel)
    if (OPTIONS.leftJoin) {
      const tidyTime = await measureAsync(
        async (): Promise<
          DataFrame<{
            id: number;
            value_a: number;
            category: string;
            value_b?: number | undefined;
            status?: string | undefined;
          }>
        > => {
          const result = await leftTidyDf.leftJoinParallel(rightTidyDf, "id");
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].leftJoin = {
        tidy: tidyTime,
      };
    }

    // Outer Join Operations
    if (OPTIONS.outerJoin) {
      const tidyTime = measure(
        () => {
          leftTidyDf.outerJoin(rightTidyDf, "id");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].outerJoin = {
        tidy: tidyTime,
      };
    }

    // Pivot Longer Operations (wide to long)
    if (OPTIONS.pivotLonger) {
      const tidyTime = measure(
        () => {
          const result = tidyPivotDf.pivotLonger({
            cols: ["q1", "q2", "q3", "q4"],
            names_to: "quarter",
            values_to: "sales",
          });
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].pivotLonger = {
        tidy: tidyTime,
      };
    }

    // Pivot Wider Operations (long to wide)
    if (OPTIONS.pivotWider) {
      // Create long format data for pivot wider test
      const longData = Array.from(
        { length: Math.min(size, 10000) },
        (_, i) => ({
          id: Math.floor(i / 4),
          region: `region_${Math.floor(i / 4) % 5}`,
          quarter: ["q1", "q2", "q3", "q4"][i % 4],
          sales: Math.floor(Math.random() * 1000),
        }),
      );

      const tidyLongDf = createDataFrame(longData, { trace: true });

      const tidyTime = measure(
        () => {
          const result = tidyLongDf.pivotWider({
            names_from: "quarter",
            values_from: "sales",
            expected_columns: ["q1", "q2", "q3", "q4"],
          });
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].pivotWider = {
        tidy: tidyTime,
      };
    }

    // Bind Rows Operations
    if (OPTIONS.bindRows) {
      const tidyTime = measure(
        () => {
          const result = df1Tidy.bindRows(df2Tidy);
          result.printTrace();
          return result;
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].bindRows = {
        tidy: tidyTime,
      };
    }

    // Statistical Functions
    if (OPTIONS.stats) {
      const tidyTime = measure(
        () => {
          const values = tidyDf.value as number[];
          // Run multiple statistical functions
          stats.sum(values);
          stats.mean(values);
          stats.median(values);
          stats.variance(values);
          stats.stdev(values);
          stats.unique(values);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].stats = {
        tidy: tidyTime,
      };
    }
  }

  console.log("TypeScript benchmarks completed!\n");
  return results;
}

// Allow running this benchmark individually
if (import.meta.main) {
  try {
    const results = await runTypeScriptBenchmarks();
    console.log(JSON.stringify(results, null, 2));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ TypeScript benchmark failed:", errorMessage);
    Deno.exit(1);
  }
}
