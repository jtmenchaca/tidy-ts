#!/usr/bin/env -S deno run --allow-read

import { createDataFrame, stats } from "@tidy-ts/dataframe";
import * as aq from "arquero";
import { randomBetween, randomIntegerBetween, randomSeeded } from "@std/random";

// Configuration
const SIZES = [500_000];
const ITERATIONS = 5;
const WARMUP_RUNS = 3;

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
  creation: true,
  filter: true,
  select: true,
  sort: true,
  mutate: true,
  distinct: true,
  groupBy: true,
  summarize: true,
  innerJoin: true,
  leftJoin: true,
  outerJoin: true,
  pivotLonger: true,
  pivotWider: true,
  bindRows: true,
  stats: true,
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

// Measure a single operation
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

export function runTypeScriptBenchmarks() {
  console.log("Running TypeScript benchmarks (tidy-ts vs Arquero)...\n");

  const results: Record<
    number,
    Record<string, { tidy: number; arquero: number; ratio: number }>
  > = {};

  for (const size of SIZES) {
    console.log(`  Testing ${size.toLocaleString()} rows...`);
    const data = generateData(size);
    const { leftData, rightData } = generateJoinData(size);
    const pivotData = generatePivotData(size);

    results[size] = {};

    // Prebuild DataFrames for consistent performance
    console.log("    - Prebuilding DataFrames...");
    const tidyDf = createDataFrame(data);    const arqueroDf = aq.from(data);

    // Prebuild specialized dataframes for specific operations
    const numericData = Array.from({ length: size }, (_, i) => ({
      value: randomBetween(0, 1000, { prng }),
      date: new Date(
        2020 + Math.floor(randomBetween(0, 4, { prng })),
        Math.floor(randomBetween(0, 12, { prng })),
        Math.floor(randomBetween(0, 28, { prng })),
      ),
      score: i % 10 === 0 ? null : randomBetween(0, 100, { prng }),
    }));

    const mixedData = Array.from({ length: size }, (_, i) => ({
      name: `name_${i % 100}`,
      category: `category_${i % 20}`,
      value: randomBetween(0, 1000, { prng }),
      active: i % 3 === 0,
    }));

    const groupedData = Array.from({ length: size }, (_, i) => ({
      group: `group_${i % 5}`,
      value: randomBetween(0, 1000, { prng }),
      priority: Math.floor(randomBetween(0, 10, { prng })),
    }));

    // Prebuild all DataFrames for consistent performance
    const tidyNumericDf = createDataFrame(numericData);    const arqueroNumericDf = aq.from(numericData);
    const tidyMixedDf = createDataFrame(mixedData);    const arqueroMixedDf = aq.from(mixedData);
    const tidyGroupedDf = createDataFrame(groupedData);    const arqueroGroupedDf = aq.from(groupedData);
    const tidyPivotDf = createDataFrame(pivotData);    const arqueroPivotDf = aq.from(pivotData);
    const leftTidyDf = createDataFrame(leftData);    const rightTidyDf = createDataFrame(rightData);    const leftArqueroDf = aq.from(leftData);
    const rightArqueroDf = aq.from(rightData);

    // Prebuild split dataframes for bindRows operations
    const df1Tidy = createDataFrame(
      data.slice(0, Math.floor(data.length / 2)),
    );
    const df2Tidy = createDataFrame(data.slice(Math.floor(data.length / 2)));
    const df1Arquero = aq.from(data.slice(0, Math.floor(data.length / 2)));
    const df2Arquero = aq.from(data.slice(Math.floor(data.length / 2)));

    console.log("    - DataFrames prebuilt");

    // DataFrame Creation
    if (OPTIONS.creation) {
      console.log("    - Starting creation benchmark...");
      const tidyTime = measure(
        () => createDataFrame(data),        ITERATIONS,
        WARMUP_RUNS,
      );
      console.log("    - Tidy creation done");
      const arqueroTime = measure(() => aq.from(data), ITERATIONS, WARMUP_RUNS);
      console.log("    - Arquero creation done");
      results[size].creation = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
      };
      console.log("    - Creation benchmark complete");
    }

    // Filter Operations (3 tests with weighted averaging)
    if (OPTIONS.filter) {
      console.log("    - Starting filter benchmark...");
      // Test 1: Simple numeric filtering
      const tidyNumeric = measure(
        () => {
          tidyDf.filter((row) => row.value > 500);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroNumeric = measure(
        () => {
          // deno-lint-ignore no-explicit-any
          arqueroDf.filter(aq.escape((d: any) => d.value > 500)).indices();
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 2: String filtering
      const tidyString = measure(
        () => {
          tidyDf.filter((row) => row.category === "category_5");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroString = measure(
        () => {
          // deno-lint-ignore no-explicit-any
          arqueroDf.filter(aq.escape((d: any) => d.category === "category_5"))
            .indices();
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 3: Complex filtering
      const tidyComplex = measure(
        () => {
          tidyDf.filter((row) =>
            row.value > 300 && row.score > 50 && row.active
          );
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroComplex = measure(
        () => {
          arqueroDf.filter(
            aq.escape((d: DataRow) =>
              d.value > 300 && d.score > 50 && d.active
            ),
          ).indices();
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Weighted average (emphasizing common use cases)
      const avgTidy = (tidyNumeric * 2 + tidyString + tidyComplex) / 4;
      const avgArquero = (arqueroNumeric * 2 + arqueroString + arqueroComplex) /
        4;

      results[size].filter = {
        tidy: avgTidy,
        arquero: avgArquero,
        ratio: avgTidy / avgArquero,
      };
    }

    // Select Columns
    if (OPTIONS.select) {
      const tidyTime = measure(
        () => {
          tidyDf.select("id", "value", "category");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          arqueroDf.select("id", "value", "category");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].select = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
      };
    }

    // Sort Operations (5 tests with weighted averaging)
    if (OPTIONS.sort) {
      // Test 1: Numeric Fast Path
      const tidyNumeric = measure(
        () => {
          tidyNumericDf.arrange("value", "asc");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroNumeric = measure(
        () => {
          arqueroNumericDf.orderby("value").indices();
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

      const arqueroMultiNumeric = measure(
        () => {
          arqueroNumericDf.orderby("value").orderby(aq.desc("score")).indices();
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 3: String Stable Path
      const tidyString = measure(
        () => {
          tidyMixedDf.arrange("name", "asc");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroString = measure(
        () => {
          arqueroMixedDf.orderby("name").indices();
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 4: Mixed Types Stable Path
      const tidyMixed = measure(
        () => {
          tidyMixedDf.arrange(["category", "value"], [
            "asc",
            "desc",
          ]);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroMixed = measure(
        () => {
          arqueroMixedDf.orderby("category", aq.desc("value")).indices();
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 5: Grouped Data Stable Path
      const tidyGrouped = measure(
        () => {
          tidyGroupedDf.groupBy("group").arrange(
            "value",
            "desc",
          );
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroGrouped = measure(
        () => {
          arqueroGroupedDf.groupby("group").orderby(aq.desc("value")).indices();
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Weighted average (emphasizing numeric sorting)
      const avgTidy =
        (tidyNumeric * 2 + tidyMultiNumeric * 2 + tidyString + tidyMixed +
          tidyGrouped) / 7;
      const avgArquero =
        (arqueroNumeric * 2 + arqueroMultiNumeric * 2 + arqueroString +
          arqueroMixed + arqueroGrouped) / 7;

      results[size].sort = {
        tidy: avgTidy,
        arquero: avgArquero,
        ratio: avgTidy / avgArquero,
      };
    }

    // Mutate Operations
    if (OPTIONS.mutate) {
      const tidyTime = measure(
        () => {
          tidyDf.mutate({ score_pct: (row) => row.score / 100 });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          arqueroDf.derive({
            score_pct: aq.escape((d: DataRow) => d.score / 100),
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].mutate = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
      };
    }

    // Distinct Operations
    if (OPTIONS.distinct) {
      const tidyTime = measure(
        () => {
          tidyDf.distinct("id", "value", "category");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          arqueroDf.dedupe();
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].distinct = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
      };
    }

    // Group By Operations (3 tests with weighted averaging)
    if (OPTIONS.groupBy) {
      // Test 1: Single column grouping
      const tidySingle = measure(
        () => {
          tidyDf.groupBy("category");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroSingle = measure(
        () => {
          arqueroDf.groupby("category");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 2: Multiple column grouping
      const tidyMulti = measure(
        () => {
          tidyDf.groupBy("category", "active");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroMulti = measure(
        () => {
          arqueroDf.groupby("category", "active");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 3: High cardinality grouping
      const tidyHighCard = measure(
        () => {
          tidyDf.groupBy("id");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroHighCard = measure(
        () => {
          arqueroDf.groupby("id");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Weighted average (emphasizing common use cases)
      const avgTidy = (tidySingle * 2 + tidyMulti * 2 + tidyHighCard) / 5;
      const avgArquero =
        (arqueroSingle * 2 + arqueroMulti * 2 + arqueroHighCard) / 5;

      results[size].groupBy = {
        tidy: avgTidy,
        arquero: avgArquero,
        ratio: avgTidy / avgArquero,
      };
    }

    // Summarize Operations (3 tests with weighted averaging)
    if (OPTIONS.summarize) {
      // Test 1: Ungrouped summarization
      const tidyUngrouped = measure(
        () => {
          tidyDf.summarise({
            count: (df) => df.nrows(),
            avg_value: (df) => stats.mean(df.value),
            total_value: (df) => stats.sum(df.value),
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroUngrouped = measure(
        () => {
          arqueroDf.rollup({
            count: aq.op.count(),
            avg_value: aq.op.average("value"),
            total_value: aq.op.sum("value"),
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 2: Grouped summarization
      const tidyGrouped = measure(
        () => {
          tidyDf.groupBy("category").summarise({
            count: (group) => group.nrows(),
            avg_value: (group) => stats.mean(group.value),
            total_value: (group) => stats.sum(group.value),
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroGrouped = measure(
        () => {
          arqueroDf.groupby("category").rollup({
            count: aq.op.count(),
            avg_value: aq.op.average("value"),
            total_value: aq.op.sum("value"),
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Test 3: Complex grouped summarization
      const tidyComplex = measure(
        () => {
          tidyDf.groupBy("category", "active").summarise({
            count: (group) => group.nrows(),
            avg_value: (group) => stats.mean(group.value),
            avg_score: (group) => stats.mean(group.score),
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroComplex = measure(
        () => {
          arqueroDf.groupby("category", "active").rollup({
            count: aq.op.count(),
            avg_value: aq.op.average("value"),
            avg_score: aq.op.average("score"),
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      // Weighted average (emphasizing common use cases)
      const avgTidy = (tidyUngrouped + tidyGrouped * 2 + tidyComplex) / 4;
      const avgArquero =
        (arqueroUngrouped + arqueroGrouped * 2 + arqueroComplex) / 4;

      results[size].summarize = {
        tidy: avgTidy,
        arquero: avgArquero,
        ratio: avgTidy / avgArquero,
      };
    }

    // Inner Join Operations
    if (OPTIONS.innerJoin) {
      const tidyTime = measure(
        () => {
          leftTidyDf.innerJoin(rightTidyDf, "id");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          leftArqueroDf.join(rightArqueroDf, ["id", "id"]);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].innerJoin = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
      };
    }

    // Left Join Operations
    if (OPTIONS.leftJoin) {
      const tidyTime = measure(
        () => {
          leftTidyDf.leftJoin(rightTidyDf, "id");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          const matching = leftArqueroDf.semijoin(rightArqueroDf, ["id", "id"]);
          matching.join(rightArqueroDf, ["id", "id"]);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].leftJoin = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
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

      const arqueroTime = measure(
        () => {
          const leftOnly = leftArqueroDf.antijoin(rightArqueroDf, ["id", "id"]);
          const rightOnly = rightArqueroDf.antijoin(leftArqueroDf, [
            "id",
            "id",
          ]);
          const inner = leftArqueroDf.join(rightArqueroDf, ["id", "id"]);
          leftOnly.union(rightOnly).union(inner);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].outerJoin = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
      };
    }

    // Pivot Longer Operations (wide to long)
    if (OPTIONS.pivotLonger) {
      const tidyTime = measure(
        () => {
          tidyPivotDf.pivotLonger({
            cols: ["q1", "q2", "q3", "q4"],
            namesTo: "quarter",
            valuesTo: "sales",
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          arqueroPivotDf.fold(["q1", "q2", "q3", "q4"], {
            as: ["quarter", "sales"],
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].pivotLonger = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
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

      const tidyLongDf = createDataFrame(longData);
      const arqueroLongDf = aq.from(longData);

      const tidyTime = measure(
        () => {
          tidyLongDf.pivotWider({
            namesFrom: "quarter",
            valuesFrom: "sales",
            expectedColumns: ["q1", "q2", "q3", "q4"],
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          arqueroLongDf.pivot("quarter", "sales");
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].pivotWider = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
      };
    }

    // Bind Rows Operations
    if (OPTIONS.bindRows) {
      const tidyTime = measure(
        () => {
          df1Tidy.bindRows(df2Tidy);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          df1Arquero.concat(df2Arquero);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].bindRows = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
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
          stats.uniqueCount(values);
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      const arqueroTime = measure(
        () => {
          arqueroDf.rollup({
            sum_value: aq.op.sum("value"),
            mean_value: aq.op.average("value"),
            median_value: aq.op.median("value"),
            variance_value: aq.op.variance("value"),
            stdev_value: aq.op.stdev("value"),
            unique_value: aq.op.distinct("value"),
          });
        },
        ITERATIONS,
        WARMUP_RUNS,
      );

      results[size].stats = {
        tidy: tidyTime,
        arquero: arqueroTime,
        ratio: tidyTime / arqueroTime,
      };
    }
  }

  console.log("TypeScript benchmarks completed!\n");
  return results;
}

// Allow running this benchmark individually
if (import.meta.main) {
  try {
    const results = runTypeScriptBenchmarks();
    console.log(JSON.stringify(results, null, 2));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ TypeScript benchmark failed:", errorMessage);
    Deno.exit(1);
  }
}
