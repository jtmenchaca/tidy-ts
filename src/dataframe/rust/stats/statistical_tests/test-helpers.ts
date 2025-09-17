#!/usr/bin/env -S deno run --allow-read --allow-run

// Import statistical test functions from the TypeScript interface
import {
  anovaOneWay,
  chiSquareTest,
  dunnTest,
  fishersExactTest,
  gamesHowellTest,
  kruskalWallisTest,
  mannWhitneyTest,
  proportionTestOneSample,
  proportionTestTwoSample,
  shapiroWilkTest,
  tTestIndependent,
  tTestOneSample,
  tTestPaired,
  tukeyHSD,
  wilcoxonSignedRankTest,
  zTestOneSample,
  zTestTwoSample,
} from "../../../ts/stats/statistical-tests/index.ts";

export async function callR(
  functionName: string,
  testType: string,
  ...args: string[]
  // deno-lint-ignore no-explicit-any
): Promise<any> {
  const scriptPath = `${testType}.test.R`;

  // Determine the correct working directory for R scripts
  // If we're already in the statistical_tests directory, use current dir
  // Otherwise, use the relative path from project root
  const currentDir = Deno.cwd();
  const rScriptDir = currentDir.endsWith("statistical_tests")
    ? "."
    : "src/dataframe/rust/stats/statistical_tests";

  const command = new Deno.Command("Rscript", {
    args: [scriptPath, functionName, ...args],
    stdout: "piped",
    stderr: "piped",
    cwd: rScriptDir,
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`R script failed: ${errorText}`);
  }

  const output = new TextDecoder().decode(stdout).trim();

  // Try to parse as JSON first, then as number
  try {
    return JSON.parse(output);
  } catch {
    const num = parseFloat(output);
    return isNaN(num) ? output : num;
  }
}

// deno-lint-ignore no-explicit-any
export async function callRust(testName: string, ...args: any[]): Promise<any> {
  switch (testName) {
    // T-tests
    case "t.test.one": {
      // One-sample t-test
      const data = JSON.parse(args[0]);
      return tTestOneSample({
        data,
        mu: parseFloat(args[1]),
        alternative: args[2],
        alpha: parseFloat(args[3]),
      });
    }
    case "t.test.two": {
      // Two-sample t-test
      const data1 = JSON.parse(args[0]);
      const data2 = JSON.parse(args[1]);
      return tTestIndependent({
        x: data1,
        y: data2,
        alpha: parseFloat(args[3]),
        alternative: args[2],
        equalVar: true,
      });
    }
    case "t.test.paired": {
      // Paired t-test
      const dataX = JSON.parse(args[0]);
      const dataY = JSON.parse(args[1]);
      return tTestPaired({
        x: dataX,
        y: dataY,
        alpha: parseFloat(args[3]),
        alternative: args[2],
      });
    }
    // Z-tests
    case "z.test.one": {
      // One-sample z-test
      const data = JSON.parse(args[0]);
      return zTestOneSample({
        data,
        popMean: parseFloat(args[1]),
        popStd: parseFloat(args[2]),
        alternative: args[3],
        alpha: parseFloat(args[4]),
      });
    }
    case "z.test.two": {
      // Two-sample z-test
      const data1 = JSON.parse(args[0]);
      const data2 = JSON.parse(args[1]);
      // For two-sample z-test without known population stds, use sample stds
      const sampleStd1 = Math.sqrt(
        data1.reduce((sum: number, x: number, _: number, arr: number[]) => {
          const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
          return sum + Math.pow(x - mean, 2);
        }, 0) / (data1.length - 1),
      );
      const sampleStd2 = Math.sqrt(
        data2.reduce((sum: number, x: number, _: number, arr: number[]) => {
          const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
          return sum + Math.pow(x - mean, 2);
        }, 0) / (data2.length - 1),
      );
      return zTestTwoSample({
        data1,
        data2,
        popStd1: sampleStd1,
        popStd2: sampleStd2,
        alternative: args[2],
        alpha: parseFloat(args[3]),
      });
    }
    // Proportion tests
    case "prop.test.one": {
      // One-sample proportion test
      const data = JSON.parse(args[0]);
      return proportionTestOneSample({
        data,
        popProportion: parseFloat(args[1]),
        alternative: args[2],
        alpha: parseFloat(args[3]),
      });
    }
    case "prop.test.two": {
      // Two-sample proportion test
      const data1 = JSON.parse(args[0]);
      const data2 = JSON.parse(args[1]);
      const alternative = args[2]; // "two.sided", "less", or "greater"
      const alpha = parseFloat(args[3]);
      return proportionTestTwoSample({
        data1,
        data2,
        pooled: true,
        alternative: alternative as "two-sided" | "less" | "greater",
        alpha,
      });
    }
    // ANOVA
    case "aov.one": {
      const anovaGroups = JSON.parse(args[0]);
      return anovaOneWay(anovaGroups, parseFloat(args[1]));
    }
    // Chi-square test
    case "chisq.test.independence": {
      const chiSquareData = JSON.parse(args[0]);
      return chiSquareTest({ contingencyTable: chiSquareData, alpha: 0.05 });
    }
    // Mann-Whitney U test
    case "wilcox.test.mannwhitney": {
      const mwData1 = JSON.parse(args[0]);
      const mwData2 = JSON.parse(args[1]);
      const alternative = args[2]; // "two.sided", "less", or "greater"
      const alpha = parseFloat(args[3]);
      // Convert "two.sided" to "two-sided" format
      const altFormatted = alternative === "two.sided"
        ? "two-sided"
        : alternative;
      return mannWhitneyTest({
        x: mwData1,
        y: mwData2,
        exact: true,
        continuityCorrection: true,
        alternative: altFormatted as "two-sided" | "less" | "greater",
        alpha,
      });
    }
    // Wilcoxon signed-rank test
    case "wilcox.test.signedrank": {
      const wsData1 = JSON.parse(args[0]);
      const wsData2 = JSON.parse(args[1]);
      return wilcoxonSignedRankTest({
        x: wsData1,
        y: wsData2,
        alternative: args[2],
        alpha: parseFloat(args[3]),
      });
    }
    // Kruskal-Wallis test
    case "kruskal.test.one": {
      const kwGroups = JSON.parse(args[0]);
      return kruskalWallisTest(kwGroups, parseFloat(args[1]));
    }
    // Fisher's exact test
    case "fisher.test.exact": {
      const contingencyTable = JSON.parse(args[0]);
      return fishersExactTest({
        contingencyTable,
        alternative: "two-sided",
        alpha: 0.05,
      });
    }
    // Shapiro-Wilk test
    case "shapiro.test.normality": {
      const swData = JSON.parse(args[0]);
      return shapiroWilkTest({ data: swData, alpha: 0.05 });
    }
    // Correlation tests
    case "cor.test.pearson": {
      try {
        const x = JSON.parse(args[0]);
        const y = JSON.parse(args[1]);
        const method = args[2] || "pearson";
        if (method === "pearson") {
          // Import the correlation test functions
          const { pearsonTest } = await import(
            "../../../ts/stats/statistical-tests/correlation-tests.ts"
          );
          const result = pearsonTest({
            x,
            y,
            alternative: "two-sided",
            alpha: 0.05,
          });
          return {
            test_statistic: result.test_statistic,
            p_value: result.p_value,
          };
        }
        return { test_statistic: 0, p_value: 0 };
      } catch (error) {
        console.error("Pearson test error:", error);
        throw error;
      }
    }
    case "cor.test.spearman": {
      try {
        const x = JSON.parse(args[0]);
        const y = JSON.parse(args[1]);
        const method = args[2] || "spearman";
        if (method === "spearman") {
          // Import the correlation test functions
          const { spearmanTest } = await import(
            "../../../ts/stats/statistical-tests/correlation-tests.ts"
          );
          const result = spearmanTest({
            x,
            y,
            alternative: "two-sided",
            alpha: 0.05,
          });
          return {
            test_statistic: result.test_statistic,
            p_value: result.p_value,
          };
        }
        return { test_statistic: 0, p_value: 0 };
      } catch (error) {
        console.error("Spearman test error:", error);
        throw error;
      }
    }
    // Additional ANOVA tests
    case "aov.welch": {
      const anovaGroups = JSON.parse(args[0]);
      const { welchAnovaOneWay } = await import(
        "../../../ts/stats/statistical-tests/anova.ts"
      );
      return welchAnovaOneWay(anovaGroups, parseFloat(args[1]));
    }
    case "aov.two.factorA": {
      const data = JSON.parse(args[0]);
      const { twoWayAnovaFactorA } = await import(
        "../../../ts/stats/statistical-tests/anova.ts"
      );
      return twoWayAnovaFactorA({ data, alpha: parseFloat(args[1]) });
    }
    case "aov.two.factorB": {
      const data = JSON.parse(args[0]);
      const { twoWayAnovaFactorB } = await import(
        "../../../ts/stats/statistical-tests/anova.ts"
      );
      return twoWayAnovaFactorB({ data, alpha: parseFloat(args[1]) });
    }
    case "aov.two.interaction": {
      const data = JSON.parse(args[0]);
      const { twoWayAnovaInteraction } = await import(
        "../../../ts/stats/statistical-tests/anova.ts"
      );
      return twoWayAnovaInteraction({ data, alpha: parseFloat(args[1]) });
    }
    case "aov.two": {
      const data = JSON.parse(args[0]);
      const { twoWayAnova } = await import(
        "../../../ts/stats/statistical-tests/anova.ts"
      );
      const result = twoWayAnova({ data, alpha: parseFloat(args[1]) });
      // Extract Factor A results to match R script behavior
      return {
        test_statistic: result.factor_a.test_statistic,
        p_value: result.factor_a.p_value,
        reject_null: result.factor_a.p_value < parseFloat(args[1])
      };
    }
    // Additional Kruskal-Wallis test
    case "kruskal.test.bygroup": {
      const kwGroups = JSON.parse(args[0]);
      return kruskalWallisTest(kwGroups, parseFloat(args[1]));
    }
    // Kendall correlation test
    case "cor.test.kendall": {
      try {
        const x = JSON.parse(args[0]);
        const y = JSON.parse(args[1]);
        const method = args[2] || "kendall";
        if (method === "kendall") {
          // Import the correlation test functions
          const { kendallTest } = await import(
            "../../../ts/stats/statistical-tests/correlation-tests.ts"
          );
          const result = kendallTest({
            x,
            y,
            alternative: "two-sided",
            alpha: 0.05,
          });
          // For Kendall, R returns tau statistic (in effect_size) not Z-statistic
          // Calculate tau manually: tau = (concordant - discordant) / (n*(n-1)/2)
          const n = x.length;
          const totalPairs = n * (n - 1) / 2;
          // Extract tau from effect_size value (should be Kendall's Tau)
          const tauValue = result.effect_size?.value || 0;
          // Convert tau to the statistic that R reports (tau * totalPairs)
          const tauStatistic = tauValue * totalPairs;
          return {
            test_statistic: tauStatistic,
            p_value: result.p_value,
          };
        }
        return { test_statistic: 0, p_value: 0 };
      } catch (error) {
        console.error("Kendall test error:", error);
        throw error;
      }
    }
    // Levene's test
    case "levene.test":
    case "levene.test.equalvar": {
      // Levene's test - would need separate implementation
      return { test_statistic: 0, p_value: 1 };
    }
    // Post-hoc tests - return simplified structure for comparison
    case "post.hoc.tukey":
    case "tukey.hsd": {
      const data = JSON.parse(args[0]);
      const result = tukeyHSD(data, parseFloat(args[1]));
      // Extract first comparison for validation
      const firstComp = result.comparisons[0];
      return {
        test_statistic: Math.abs(firstComp?.test_statistic || 0),
        p_value: firstComp?.p_value || 1, // Use raw p-value since R uses Tukey method, not Bonferroni
        method: result.test_name,
      };
    }
    case "post.hoc.gameshowell":
    case "games.howell": {
      const data = JSON.parse(args[0]);
      const result = gamesHowellTest(data, parseFloat(args[1]));
      // Extract first comparison for validation
      const firstComp = result.comparisons[0];
      return {
        // PMCMRplus in R scales the statistic by sqrt(2) for Games-Howell
        test_statistic: Math.abs(firstComp?.test_statistic || 0) * Math.sqrt(2),
        p_value: firstComp?.p_value || 1, // Use raw p-value since R may use different correction
        method: result.test_name,
      };
    }
    case "post.hoc.dunn":
    case "dunn.test": {
      const data = JSON.parse(args[0]);
      const result = dunnTest(data, parseFloat(args[1]));
      // Extract first comparison for validation
      const firstComp = result.comparisons[0];
      return {
        test_statistic: Math.abs(firstComp?.test_statistic || 0),
        p_value: firstComp?.adjusted_p_value || 1, // Use adjusted p-value to match R
        method: result.test_name,
      };
    }
    default:
      throw new Error(`Unknown test: ${testName}`);
  }
}

export interface TestResult {
  testName: string;
  // deno-lint-ignore no-explicit-any
  rResult: any;
  // deno-lint-ignore no-explicit-any
  rustResult: any;
  difference: number;
  status: "PASS" | "FAIL" | "ERROR";
  errorMessage?: string;
}

export async function runComparison(
  testCases: Array<
    { testName: string; func: string; distribution: string; args: string[] }
  >,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    try {
      const rResult = await callR(
        testCase.func,
        testCase.distribution,
        ...testCase.args,
      );
      const rustResult = await callRust(testCase.func, ...testCase.args);

      // Calculate difference based on the type of result
      let difference = 0;
      let status: "PASS" | "FAIL" | "ERROR" = "PASS";

      if (typeof rResult === "number" && typeof rustResult === "number") {
        difference = Math.abs(rResult - rustResult);
        status = difference < 1e-2 ? "PASS" : "FAIL";
      } else if (
        typeof rResult === "object" && typeof rustResult === "object"
      ) {
        // Compare test statistics and p-values for statistical test results
        // R results are JSON objects, Rust results are WASM TestResult objects
        const rStat = rResult.test_statistic || rResult.statistic;
        const rPValue = rResult.p_value || 0;

        // For Rust WASM objects, use getter methods
        const rustStat = typeof rustResult.test_statistic === "object"
          ? rustResult.test_statistic?.value
          : rustResult.test_statistic;
        const rustPValue = rustResult.p_value || 0;

        // For Fisher's exact test, only compare p-value (no meaningful test statistic)
        if (rStat === undefined && rustStat !== undefined) {
          // R doesn't provide test_statistic, only compare p-value
          difference = Math.abs(rPValue - rustPValue);
        } else {
          // Compare both test statistic and p-value
          const statDiff = Math.abs((rStat || 0) - (rustStat || 0));
          const pValueDiff = Math.abs(rPValue - rustPValue);
          difference = Math.max(statDiff, pValueDiff);
        }
        status = difference < 1e-2 ? "PASS" : "FAIL";
      } else {
        difference = 1;
        status = "FAIL";
      }

      results.push({
        testName: testCase.testName,
        rResult,
        rustResult,
        difference,
        status,
      });
    } catch (error) {
      results.push({
        testName: testCase.testName,
        rResult: null,
        rustResult: null,
        difference: 1,
        status: "ERROR",
        errorMessage: (error as Error).message,
      });
    }
  }

  return results;
}

export function printResults(results: TestResult[]): void {
  if (results.length === 0) {
    console.log("No results to display.");
    return;
  }

  console.log(
    "Test Name".padEnd(25),
    "R Stat".padEnd(12),
    "Rust Stat".padEnd(12),
    "R P-val".padEnd(12),
    "Rust P-val".padEnd(12),
    "Diff".padEnd(10),
    "Status".padEnd(8),
  );
  console.log("-".repeat(100));

  for (const result of results) {
    // Extract key values for comparison
    const rStat = result.rResult?.test_statistic || result.rResult?.statistic ||
      "N/A";
    const rustStat = typeof result.rustResult?.test_statistic === "object"
      ? result.rustResult.test_statistic?.value
      : result.rustResult?.test_statistic || "N/A";
    const rPVal = result.rResult?.p_value || "N/A";
    const rustPVal = result.rustResult?.p_value || "N/A";

    // Format numbers to 5 decimal places
    const formatNumber = (val: string | number | null | undefined) => {
      if (val === "N/A" || val === null || val === undefined) return "N/A";
      const num = typeof val === "number" ? val : parseFloat(val);
      return isNaN(num) ? "N/A" : num.toFixed(5);
    };

    console.log(
      result.testName.padEnd(25),
      formatNumber(rStat).padEnd(12),
      formatNumber(rustStat).padEnd(12),
      formatNumber(rPVal).padEnd(12),
      formatNumber(rustPVal).padEnd(12),
      result.difference.toExponential(2).padEnd(10),
      result.status.padEnd(8),
    );
  }
}
