#!/usr/bin/env -S deno run --allow-read --allow-run

// Comprehensive test runner for all distribution functions
// Usage: deno run --allow-read --allow-run run_all_tests.ts

// No need to import exec, we'll use Deno.Command directly

const distributions = [
  "beta",
  "normal",
  "gamma",
  "exponential",
  "chi_squared",
  "f_distribution",
  "poisson",
  "binomial",
  "t_distribution",
  "uniform",
  "weibull",
  "geometric",
  "hypergeometric",
  "log_normal",
  "negative_binomial",
  "students_t",
  "wilcoxon",
];

interface ComparisonResult {
  function: string;
  rResult: number;
  rustResult: number;
  difference: number;
}

interface DistributionResults {
  distribution: string;
  results: ComparisonResult[];
  errors: string[];
}

function parseComparisonOutput(output: string): ComparisonResult[] {
  const lines = output.split("\n");
  const results: ComparisonResult[] = [];

  // Find the table header and parse data lines
  let inTable = false;
  for (const line of lines) {
    if (
      line.includes("Function") && line.includes("R Result") &&
      line.includes("Rust Result")
    ) {
      inTable = true;
      continue;
    }
    if (inTable && line.includes("-".repeat(50))) {
      continue;
    }
    if (inTable && line.trim() && !line.includes("R-only tests")) {
      // Parse table row: Function, R Result, Rust Result, Difference
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        try {
          const func = parts[0];
          const rResult = parseFloat(parts[1]);
          const rustResult = parseFloat(parts[2]);
          const difference = parseFloat(parts[3]);

          if (!isNaN(rResult) && !isNaN(rustResult) && !isNaN(difference)) {
            results.push({ function: func, rResult, rustResult, difference });
          }
        } catch (_e) {
          // Skip malformed lines
        }
      }
    }
    if (inTable && line.includes("R-only tests")) {
      break;
    }
  }

  return results;
}

async function runTest(distribution: string): Promise<DistributionResults> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing ${distribution.toUpperCase()} distribution`);
  console.log(`${"=".repeat(60)}`);

  const distributionResults: DistributionResults = {
    distribution,
    results: [],
    errors: [],
  };

  try {
    // Get the directory where this script is located
    const scriptDir = new URL(".", import.meta.url).pathname;

    const command = new Deno.Command("deno", {
      args: ["run", "--allow-read", "--allow-run", `${distribution}.test.ts`],
      stdout: "piped",
      stderr: "piped",
      cwd: scriptDir, // Set working directory to where the test files are
    });

    const { code, stdout, stderr } = await command.output();

    if (code === 0) {
      const output = new TextDecoder().decode(stdout);
      console.log(output);

      // Parse comparison results from output
      const parsedResults = parseComparisonOutput(output);
      distributionResults.results = parsedResults;
    } else {
      const error = new TextDecoder().decode(stderr);
      console.error(`Error running ${distribution} test:`, error);
      distributionResults.errors.push(`Test failed: ${error}`);
    }
  } catch (error) {
    console.error(`Failed to run ${distribution} test:`, error);
    distributionResults.errors.push(
      `Execution failed: ${(error as Error).message}`,
    );
  }

  return distributionResults;
}

function printSummary(allResults: DistributionResults[]): void {
  console.log(`\n${"=".repeat(80)}`);
  console.log("COMPREHENSIVE COMPARISON SUMMARY");
  console.log(`${"=".repeat(80)}`);

  let totalComparisons = 0;
  let totalErrors = 0;
  let maxDifference = 0;
  let totalDifference = 0;

  for (const distResult of allResults) {
    console.log(`\n${distResult.distribution.toUpperCase()} Distribution:`);

    if (distResult.errors.length > 0) {
      console.log(`  ❌ Errors: ${distResult.errors.join(", ")}`);
      totalErrors += distResult.errors.length;
    }

    if (distResult.results.length > 0) {
      console.log(`  ✅ ${distResult.results.length} comparisons:`);

      for (const result of distResult.results) {
        const status = result.difference < 1e-10
          ? "✓"
          : result.difference < 1e-6
          ? "~"
          : "⚠";
        console.log(
          `    ${status} ${result.function}: diff = ${
            result.difference.toExponential(2)
          }`,
        );

        totalComparisons++;
        maxDifference = Math.max(maxDifference, result.difference);
        totalDifference += result.difference;
      }
    } else {
      console.log(`  ⚠️  No comparison results found`);
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("OVERALL STATISTICS:");
  console.log(`  Total comparisons: ${totalComparisons}`);
  console.log(`  Total errors: ${totalErrors}`);
  console.log(`  Maximum difference: ${maxDifference.toExponential(2)}`);
  console.log(
    `  Average difference: ${
      totalComparisons > 0
        ? (totalDifference / totalComparisons).toExponential(2)
        : "N/A"
    }`,
  );
  console.log(`${"=".repeat(80)}`);

  // Summary of issues
  console.log(`\n${"=".repeat(80)}`);
  console.log("ISSUES SUMMARY");
  console.log(`${"=".repeat(80)}`);

  const issues: Array<
    { distribution: string; function: string; difference: number }
  > = [];

  for (const distResult of allResults) {
    for (const result of distResult.results) {
      if (result.difference >= 1e-6) {
        issues.push({
          distribution: distResult.distribution,
          function: result.function,
          difference: result.difference,
        });
      }
    }
  }

  if (issues.length === 0) {
    console.log(
      "✅ No significant issues found - all comparisons within acceptable tolerance!",
    );
  } else {
    console.log(`⚠️  Found ${issues.length} significant issues:`);
    console.log();

    // Group by distribution
    const issuesByDistribution = issues.reduce((acc, issue) => {
      if (!acc[issue.distribution]) {
        acc[issue.distribution] = [];
      }
      acc[issue.distribution].push(issue);
      return acc;
    }, {} as Record<string, typeof issues>);

    for (
      const [distribution, distIssues] of Object.entries(issuesByDistribution)
    ) {
      console.log(`${distribution.toUpperCase()} Distribution:`);
      for (const issue of distIssues) {
        const severity = issue.difference >= 1e-1
          ? "🔴 CRITICAL"
          : issue.difference >= 1e-3
          ? "🟡 WARNING"
          : "🟠 MINOR";
        console.log(
          `  ${severity} ${issue.function}: difference = ${
            issue.difference.toExponential(2)
          }`,
        );
      }
      console.log();
    }
  }

  console.log(`${"=".repeat(80)}`);
}

async function main() {
  console.log("Running comprehensive distribution tests...");
  console.log(`Testing ${distributions.length} distributions`);

  const allResults: DistributionResults[] = [];

  for (const distribution of distributions) {
    const result = await runTest(distribution);
    allResults.push(result);
  }

  printSummary(allResults);
}

if (import.meta.main) {
  main().catch(console.error);
}
