import { z } from "zod";
import { createDataFrame, read_csv, stats } from "@tidy-ts/dataframe";

// ============================================================================
// BENCHMARK ANALYSIS TOOL
// ============================================================================
// This tool analyzes benchmark results and generates comprehensive reports
// using tidy-ts DataFrames and Zod validation for type safety.

console.log(`
🚀 TIDY-TS BENCHMARK ANALYSIS TOOL
====================================
Analyzing performance data across TypeScript, Python, and R libraries...

`);

// ============================================================================
// 1. DATA SCHEMAS - Type-safe data validation
// ============================================================================

const BenchmarkRowSchema = z.object({
  Programming_Language: z.string(),
  DataFrame_Library: z.string(),
  Dataset_Size: z.number(),
  Operation_Type: z.string(),
  Performance_Ratio_vs_tidy_ts: z.number(),
  Execution_Time_ms: z.number(),
});

type BenchmarkRow = z.infer<typeof BenchmarkRowSchema>;

// ============================================================================
// 2. MAIN ANALYSIS FUNCTION
// ============================================================================

async function main() {
  try {
    console.log("📊 Loading benchmark data from CSV files...");

    // Load ratios data
    const ratiosData = await read_csv(
      "results/benchmark_ratios.csv",
      z.object({
        Programming_Language: z.string(),
        DataFrame_Library: z.string(),
        Dataset_Size: z.number(),
        Operation_Type: z.string(),
        Performance_Ratio_vs_tidy_ts: z.number(),
      }),
    );

    // Load times data
    const timesData = await read_csv(
      "results/benchmark_times.csv",
      z.object({
        Programming_Language: z.string(),
        DataFrame_Library: z.string(),
        Dataset_Size: z.number(),
        Operation_Type: z.string(),
        Execution_Time_ms: z.number(),
      }),
    );

    console.log(
      `✅ Loaded ${ratiosData.nrows()} ratio records and ${timesData.nrows()} time records`,
    );

    // Combine the data into a single DataFrame
    const combinedData: BenchmarkRow[] = ratiosData.toArray().map(
      (ratioRow, index) => {
        const timeRow = timesData[index];
        return {
          Programming_Language: ratioRow.Programming_Language,
          DataFrame_Library: ratioRow.DataFrame_Library,
          Dataset_Size: ratioRow.Dataset_Size,
          Operation_Type: ratioRow.Operation_Type,
          Performance_Ratio_vs_tidy_ts: ratioRow.Performance_Ratio_vs_tidy_ts,
          Execution_Time_ms: timeRow.Execution_Time_ms,
        };
      },
    );

    // Create the final metrics DataFrame with normalized column names
    const metrics = createDataFrame(combinedData).mutate({
      language: (row) => row.Programming_Language,
      library: (row) => row.DataFrame_Library,
      size: (row) => row.Dataset_Size,
      operation: (row) => row.Operation_Type,
      time_ms: (row) => row.Execution_Time_ms,
      ratio_vs_tidy: (row) => row.Performance_Ratio_vs_tidy_ts,
    }).select(
      "language",
      "library",
      "size",
      "operation",
      "time_ms",
      "ratio_vs_tidy",
    );

    console.log(`📈 Processed ${metrics.nrows()} benchmark results\n`);

    // ============================================================================
    // PERFORMANCE SUMMARY
    // ============================================================================
    console.log("=== 📊 PERFORMANCE SUMMARY ===");
    console.log();

    // Overall performance by library
    const librarySummary = metrics
      .groupBy("library")
      .summarise({
        avg_ratio: (group) => stats.round(stats.mean(group.ratio_vs_tidy), 3),
        median_ratio: (group) =>
          stats.round(stats.median(group.ratio_vs_tidy), 3),
        min_ratio: (group) => stats.round(stats.min(group.ratio_vs_tidy), 3),
        max_ratio: (group) => stats.round(stats.max(group.ratio_vs_tidy), 3),
        count: (group) => group.nrows(),
      })
      .arrange("avg_ratio");

    console.log("🏆 Performance vs tidy-ts (lower is better):");
    librarySummary.print();
    console.log();

    // Performance by operation
    const operationSummary = metrics
      .groupBy("operation")
      .summarise({
        tidy_ts_avg: (group) => {
          const tidyGroup = group.filter((row) => row.library === "tidy-ts");
          return stats.round(stats.mean(tidyGroup.time_ms), 3);
        },
        fastest_library: (group) => {
          const fastest = group.arrange("ratio_vs_tidy")[0];
          return fastest ? fastest.library : "unknown";
        },
        fastest_ratio: (group) => {
          const fastest = group.arrange("ratio_vs_tidy")[0];
          return fastest ? stats.round(fastest.ratio_vs_tidy, 3) : 0;
        },
        slowest_library: (group) => {
          const slowest = group.arrange("ratio_vs_tidy", "desc")[0];
          return slowest ? slowest.library : "unknown";
        },
        slowest_ratio: (group) => {
          const slowest = group.arrange("ratio_vs_tidy", "desc")[0];
          return slowest ? stats.round(slowest.ratio_vs_tidy, 3) : 0;
        },
      })
      .arrange("tidy_ts_avg");

    console.log("⚡ Performance by Operation:");
    operationSummary.print();
    console.log();

    // ============================================================================
    // AT-A-GLANCE PERFORMANCE TABLES
    // ============================================================================
    console.log("=== 📊 AT-A-GLANCE PERFORMANCE TABLES ===");
    console.log();

    // Get available sizes dynamically
    const availableSizes = [
      ...new Set(metrics.toArray().map((row) => row.size)),
    ].sort((a, b) => a - b);

    // Create performance tables for each dataset size
    for (const size of availableSizes) {
      const sizeData = metrics.filter((row) => row.size === size);
      if (sizeData.nrows() === 0) continue;

      console.log(`📈 Dataset Size: ${size.toLocaleString()} rows`);

      // Create performance table with operations as rows and libraries as columns
      const performanceTable = sizeData
        .groupBy("operation", "library")
        .summarise({
          time_ms: (group) => stats.round(stats.mean(group.time_ms), 3),
          ratio: (group) => {
            const tidyData = sizeData.filter((row) =>
              row.operation === group[0]?.operation && row.library === "tidy-ts"
            );
            if (tidyData.nrows() === 0) return 1.0;
            const tidyTime = stats.mean(tidyData.time_ms);
            return stats.round(stats.mean(group.time_ms) / tidyTime, 1);
          },
        })
        .mutate({
          display: (row) => `${row.time_ms}ms (${row.ratio}x)`,
        })
        .drop("time_ms", "ratio");

      performanceTable.print();

      const performanceTablePivoted = performanceTable
        .pivotWider({
          names_from: "library",
          values_from: "display",
          expected_columns: ["tidy-ts", "arquero", "pandas", "polars", "r"],
        })
        .arrange("operation");

      performanceTablePivoted.print();
      console.log();
    }

    // ============================================================================
    // EXPORT DETAILED RESULTS
    // ============================================================================
    // Export detailed CSV
    metrics.writeCSV("results/analysis_detailed.csv");

    console.log("💾 Detailed analysis saved to: results/analysis_detailed.csv");
    console.log(
      "\n🎉 Analysis complete! Check the results above for insights.",
    );
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  }
}

// Run the analysis
main();
