#!/usr/bin/env -S deno run --allow-read --allow-run
// deno-lint-ignore-file no-explicit-any

import { runTypeScriptBenchmarks } from "./typescript.ts";

async function runPythonBenchmarks() {
  try {
    const command = new Deno.Command(".venv/bin/python", {
      args: ["python.py"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`Python script failed: ${errorText}`);
    }

    const output = new TextDecoder().decode(stdout);
    return JSON.parse(output);
  } catch (error: unknown) {
    console.error("❌ Python benchmark failed:", (error as Error).message);
    console.log(
      "Note: This requires Python 3 with pandas and polars installed",
    );
    return {};
  }
}

async function runRBenchmarks() {
  try {
    const command = new Deno.Command("Rscript", {
      args: ["r.R"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`R script failed: ${errorText}`);
    }

    const output = new TextDecoder().decode(stdout);
    return JSON.parse(output);
  } catch (error: unknown) {
    console.error("❌ R benchmark failed:", (error as Error).message);
    console.log(
      "Note: This requires R with dplyr, tidyr, and jsonlite packages installed",
    );
    return {};
  }
}

function formatResults(results: any) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 OPTIMIZED BENCHMARK RESULTS (milliseconds)\n");
  console.log(
    "Note: Results show median times with improved warmup (5 runs) and iterations (7 runs)",
  );
  console.log("=".repeat(80));

  const languages = Object.keys(results);
  const sizes = Object.keys(results[languages[0]]).map(Number).sort((a, b) =>
    a - b
  );

  // Create header
  const operations = Object.keys(results[languages[0]][sizes[0]]);
  const header = [
    "Language".padEnd(12),
    "Size".padEnd(8),
    ...operations.map((op) => op.padEnd(12)),
  ].join("");

  console.log(header);
  console.log("-".repeat(80));

  // Print results for each language and size
  for (const language of languages) {
    for (const size of sizes) {
      const result = results[language][size];
      const row = [
        language.padEnd(12),
        size.toLocaleString().padEnd(8),
        ...operations.map((op) => {
          const opResult = result[op];
          if (opResult && typeof opResult === "object") {
            // For TypeScript: show tidy-ts time and ratio
            if (opResult.tidy !== undefined && opResult.arquero !== undefined) {
              return `${opResult.tidy.toFixed(1)}ms (${
                opResult.ratio.toFixed(2)
              }x)`.padEnd(12);
            }
            // For Python: show pandas time and ratio
            if (
              opResult.pandas !== undefined && opResult.polars !== undefined
            ) {
              return `${opResult.pandas.toFixed(1)}ms (${
                opResult.ratio.toFixed(2)
              }x)`.padEnd(12);
            }
            // For R: show R time
            if (opResult.r !== undefined) {
              return `${opResult.r.toFixed(1)}ms`.padEnd(12);
            }
          }
          return "N/A".padEnd(12);
        }),
      ].join("");
      console.log(row);
    }
    console.log(); // Empty line between languages
  }
}

async function main() {
  console.log("🚀 Starting Optimized Comprehensive Benchmark Suite\n");
  console.log(
    "✨ Features: Prebuilt DataFrames, Improved Warmup (5 runs), Iterations (7 runs)",
  );
  console.log("✨ Python: Categorical types, Polars thread control");
  console.log("✨ R: Factor types for better performance");
  console.log("✨ TypeScript: Columnar operations, prebuilt DataFrames");
  console.log("\n" + "=".repeat(80) + "\n");

  const results: any = {};

  try {
    // Run TypeScript benchmarks (tidy-ts vs Arquero)
    console.log("1/3 Running TypeScript benchmarks...");
    results.typescript = await runTypeScriptBenchmarks();
  } catch (error: unknown) {
    console.error("❌ TypeScript benchmark failed:", (error as Error).message);
    results.typescript = {};
  }

  try {
    // Run Python benchmarks (pandas vs polars)
    console.log("2/3 Running Python benchmarks...");
    results.python = await runPythonBenchmarks();
  } catch (error: unknown) {
    console.error("❌ Python benchmark failed:", (error as Error).message);
    results.python = {};
  }

  try {
    // Run R benchmarks
    console.log("3/3 Running R benchmarks...");
    results.r = await runRBenchmarks();
  } catch (error: unknown) {
    console.error("❌ R benchmark failed:", (error as Error).message);
    results.r = {};
  }

  // Format and display results
  formatResults(results);

  // Save results
  try {
    await Deno.writeTextFile(
      "results/latest.json",
      JSON.stringify(results, null, 2),
    );
    console.log("✅ Results saved to results/latest.json");
  } catch (error: unknown) {
    console.error("❌ Failed to save results:", (error as Error).message);
  }

  // Generate CSV files
  generateCSVFiles(results);

  console.log("\n✅ All optimized benchmarks completed!");
  console.log("📈 Performance improvements applied:");
  console.log("   • Prebuilt DataFrames for consistent timing");
  console.log("   • Improved warmup (5 runs) and iterations (7 runs)");
  console.log("   • Native types (categorical/factor) for better performance");
  console.log("   • Thread control for Polars consistency");
  console.log("   • Columnar operations in TypeScript");
}

function generateCSVFiles(results: any) {
  const languages = Object.keys(results);
  const sizes = Object.keys(results[languages[0]]).map(Number).sort((a, b) =>
    a - b
  );
  const operations = Object.keys(results[languages[0]][sizes[0]]);

  // Generate ratios CSV
  const ratiosCSV = generateRatiosCSV(results, languages, sizes, operations);

  // Generate times CSV
  const timesCSV = generateTimesCSV(results, languages, sizes, operations);

  // Save CSV files
  try {
    Deno.writeTextFileSync("results/benchmark_ratios.csv", ratiosCSV);
    Deno.writeTextFileSync("results/benchmark_times.csv", timesCSV);
    console.log("✅ CSV files saved:");
    console.log("  - results/benchmark_ratios.csv");
    console.log("  - results/benchmark_times.csv");
  } catch (error: unknown) {
    console.error("❌ Failed to save CSV files:", (error as Error).message);
  }
}

function generateRatiosCSV(
  results: any,
  languages: string[],
  sizes: number[],
  operations: string[],
): string {
  const rows: string[] = [];

  // Header
  const header = [
    "Programming_Language",
    "DataFrame_Library",
    "Dataset_Size",
    "Operation_Type",
    "Performance_Ratio_vs_tidy_ts",
  ];
  rows.push(header.join(","));

  // Data rows
  for (const language of languages) {
    for (const size of sizes) {
      for (const operation of operations) {
        const result = results[language][size][operation];
        if (result && typeof result === "object") {
          // For TypeScript: show ratio (tidy-ts vs arquero)
          if (result.tidy !== undefined && result.arquero !== undefined) {
            // tidy-ts baseline
            rows.push([
              language,
              "tidy-ts",
              size.toString(),
              operation,
              "1.000",
            ].join(","));
            // arquero relative to tidy-ts
            rows.push([
              language,
              "arquero",
              size.toString(),
              operation,
              (1 / result.ratio).toFixed(3),
            ].join(","));
          } // For Python: show both pandas and polars relative to tidy-ts
          else if (result.pandas !== undefined && result.polars !== undefined) {
            // Get tidy-ts time for comparison
            const tidyResult = results.typescript?.[size]?.[operation];
            if (tidyResult && tidyResult.tidy !== undefined) {
              const tidyTime = tidyResult.tidy;
              const pandasRatio = (result.pandas / tidyTime).toFixed(3);
              const polarsRatio = (result.polars / tidyTime).toFixed(3);

              rows.push([
                language,
                "pandas",
                size.toString(),
                operation,
                pandasRatio,
              ].join(","));
              rows.push([
                language,
                "polars",
                size.toString(),
                operation,
                polarsRatio,
              ].join(","));
            } else {
              // Fallback to internal comparison if no tidy-ts data
              rows.push([
                language,
                "pandas",
                size.toString(),
                operation,
                result.ratio.toFixed(3),
              ].join(","));
              rows.push([
                language,
                "polars",
                size.toString(),
                operation,
                "1.000",
              ].join(","));
            }
          } // For R: show relative to tidy-ts
          else if (result.r !== undefined) {
            // Get tidy-ts time for comparison
            const tidyResult = results.typescript?.[size]?.[operation];
            if (tidyResult && tidyResult.tidy !== undefined) {
              const tidyTime = tidyResult.tidy;
              const rRatio = (result.r / tidyTime).toFixed(3);

              rows.push([
                language,
                "r",
                size.toString(),
                operation,
                rRatio,
              ].join(","));
            } else {
              rows.push([
                language,
                "r",
                size.toString(),
                operation,
                "1.000",
              ].join(","));
            }
          }
        }
      }
    }
  }

  return rows.join("\n");
}

function generateTimesCSV(
  results: any,
  languages: string[],
  sizes: number[],
  operations: string[],
): string {
  const rows: string[] = [];

  // Header
  const header = [
    "Programming_Language",
    "DataFrame_Library",
    "Dataset_Size",
    "Operation_Type",
    "Execution_Time_ms",
  ];
  rows.push(header.join(","));

  // Data rows
  for (const language of languages) {
    for (const size of sizes) {
      for (const operation of operations) {
        const result = results[language][size][operation];
        if (result && typeof result === "object") {
          // For TypeScript: show both tidy-ts and arquero times
          if (result.tidy !== undefined && result.arquero !== undefined) {
            rows.push(
              [
                language,
                "tidy-ts",
                size.toString(),
                operation,
                result.tidy.toFixed(3),
              ].join(","),
            );
            rows.push(
              [
                language,
                "arquero",
                size.toString(),
                operation,
                result.arquero.toFixed(3),
              ].join(","),
            );
          } // For Python: show both pandas and polars times
          else if (result.pandas !== undefined && result.polars !== undefined) {
            rows.push(
              [
                language,
                "pandas",
                size.toString(),
                operation,
                result.pandas.toFixed(3),
              ].join(","),
            );
            rows.push(
              [
                language,
                "polars",
                size.toString(),
                operation,
                result.polars.toFixed(3),
              ].join(","),
            );
          } // For R: show R time
          else if (result.r !== undefined) {
            rows.push(
              [language, "r", size.toString(), operation, result.r.toFixed(3)]
                .join(","),
            );
          }
        }
      }
    }
  }

  return rows.join("\n");
}

// Handle command line arguments
const args = Deno.args;

if (args.length === 0) {
  // Run all benchmarks
  main().catch((error) => {
    console.error("\n❌ Benchmark suite failed:", error.message);
    Deno.exit(1);
  });
} else if (args[0] === "--help" || args[0] === "-h") {
  console.log("Usage:");
  console.log("  deno run runner.ts                    # Run all benchmarks");
  console.log(
    "  deno run typescript.ts                # Run only TypeScript benchmarks",
  );
  console.log(
    "  .venv/bin/python python.py            # Run only Python benchmarks",
  );
  console.log(
    "  Rscript r.R                           # Run only R benchmarks",
  );
  console.log("");
  console.log("Requirements:");
  console.log("  - TypeScript: tidy-ts and arquero packages");
  console.log("  - Python: pandas and polars packages");
  console.log("  - R: dplyr, tidyr, and jsonlite packages");
} else {
  console.log("Unknown argument:", args[0]);
  console.log("Use --help for usage information");
  Deno.exit(1);
}
