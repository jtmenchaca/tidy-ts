#!/usr/bin/env -S deno run --allow-read --allow-run --allow-write

/**
 * Comprehensive Random Test Generator
 *
 * Generates random test cases for all supported statistical tests
 * with appropriate data types and parameters.
 */

export interface RandomTestConfig {
  testCount: number;
  minSampleSize?: number;
  maxSampleSize?: number;
  includeAllTests?: boolean;
  testTypes?: string[];
}

export interface TestCase {
  testName: string;
  func: string;
  distribution: string;
  args: string[];
}

// Random data generators for different test types
export function generateNormalData(n: number, mean = 0, std = 1): number[] {
  const data: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    data.push(mean + std * z0);
  }
  return data;
}

export function generateUniformData(n: number, min = 0, max = 1): number[] {
  const data: number[] = [];
  for (let i = 0; i < n; i++) {
    data.push(min + Math.random() * (max - min));
  }
  return data;
}

export function generateCategoricalData(
  n: number,
  categories: string[],
): string[] {
  const data: string[] = [];
  for (let i = 0; i < n; i++) {
    data.push(categories[Math.floor(Math.random() * categories.length)]);
  }
  return data;
}

export function generateBinaryData(n: number, successProb = 0.5): number[] {
  const data: number[] = [];
  for (let i = 0; i < n; i++) {
    data.push(Math.random() < successProb ? 1 : 0);
  }
  return data;
}

export function generateContingencyTable(
  rows: number,
  cols: number,
  totalN: number,
): number[][] {
  const table: number[][] = [];
  let remaining = totalN;

  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      if (i === rows - 1 && j === cols - 1) {
        // Last cell gets remaining count
        row.push(remaining);
      } else {
        const maxForCell = Math.min(
          remaining - (rows - i - 1) * (cols - j - 1),
          remaining,
        );
        const cellValue = Math.floor(Math.random() * Math.max(1, maxForCell));
        row.push(cellValue);
        remaining -= cellValue;
      }
    }
    table.push(row);
  }
  return table;
}

export function generateGroupedData(
  groups: number,
  samplesPerGroup: number,
): number[][] {
  const groupedData: number[][] = [];
  for (let i = 0; i < groups; i++) {
    const groupMean = (Math.random() - 0.5) * 4; // Random mean between -2 and 2
    const groupStd = 0.5 + Math.random() * 1.5; // Random std between 0.5 and 2
    groupedData.push(generateNormalData(samplesPerGroup, groupMean, groupStd));
  }
  return groupedData;
}

export function generateTwoWayAnovaData(
  factorA: number,
  factorB: number,
  samplesPerGroup: number,
): any[] {
  const data: any[] = [];
  for (let a = 0; a < factorA; a++) {
    for (let b = 0; b < factorB; b++) {
      const groupMean = (Math.random() - 0.5) * 4;
      const groupStd = 0.5 + Math.random() * 1.5;
      const groupData = generateNormalData(
        samplesPerGroup,
        groupMean,
        groupStd,
      );

      for (const value of groupData) {
        data.push({
          value,
          factorA: `A${a + 1}`,
          factorB: `B${b + 1}`,
        });
      }
    }
  }
  return data;
}

// Test case generators for each test type
export function generateTTestOneSample(sampleSize: number): TestCase {
  const data = generateNormalData(sampleSize);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];
  const mu = (Math.random() - 0.5) * 2; // Random mu between -1 and 1

  return {
    testName: `Random One-sample t-test (μ=${
      mu.toFixed(2)
    }, ${alt}, α=${alpha})`,
    func: "t.test.one",
    distribution: "t_test",
    args: [JSON.stringify(data), mu.toString(), alt, alpha],
  };
}

export function generateTTestTwoSample(sampleSize: number): TestCase {
  const data1 = generateNormalData(sampleSize);
  const data2 = generateNormalData(sampleSize);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Two-sample t-test (${alt}, α=${alpha})`,
    func: "t.test.two",
    distribution: "t_test",
    args: [JSON.stringify(data1), JSON.stringify(data2), alt, alpha],
  };
}

export function generateTTestPaired(sampleSize: number): TestCase {
  const data1 = generateNormalData(sampleSize);
  const data2 = generateNormalData(sampleSize);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Paired t-test (${alt}, α=${alpha})`,
    func: "t.test.paired",
    distribution: "t_test",
    args: [JSON.stringify(data1), JSON.stringify(data2), alt, alpha],
  };
}

export function generateZTestOneSample(sampleSize: number): TestCase {
  const data = generateNormalData(sampleSize);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];
  const popMean = (Math.random() - 0.5) * 2;
  const popStd = 0.5 + Math.random() * 1.5;

  return {
    testName: `Random One-sample z-test (μ=${popMean.toFixed(2)}, σ=${
      popStd.toFixed(2)
    }, ${alt}, α=${alpha})`,
    func: "z.test.one",
    distribution: "z_test",
    args: [
      JSON.stringify(data),
      popMean.toString(),
      popStd.toString(),
      alt,
      alpha,
    ],
  };
}

export function generateZTestTwoSample(sampleSize: number): TestCase {
  const data1 = generateNormalData(sampleSize);
  const data2 = generateNormalData(sampleSize);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Two-sample z-test (${alt}, α=${alpha})`,
    func: "z.test.two",
    distribution: "z_test",
    args: [JSON.stringify(data1), JSON.stringify(data2), alt, alpha],
  };
}

export function generateProportionTestOneSample(sampleSize: number): TestCase {
  const successProb = 0.3 + Math.random() * 0.4; // Between 0.3 and 0.7
  const data = generateBinaryData(sampleSize, successProb);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];
  const popProportion = 0.2 + Math.random() * 0.6; // Between 0.2 and 0.8

  return {
    testName: `Random One-sample proportion test (p₀=${
      popProportion.toFixed(2)
    }, ${alt}, α=${alpha})`,
    func: "prop.test.one",
    distribution: "proportion_test",
    args: [JSON.stringify(data), popProportion.toString(), alt, alpha],
  };
}

export function generateProportionTestTwoSample(sampleSize: number): TestCase {
  const successProb1 = 0.3 + Math.random() * 0.4;
  const successProb2 = 0.3 + Math.random() * 0.4;
  const data1 = generateBinaryData(sampleSize, successProb1);
  const data2 = generateBinaryData(sampleSize, successProb2);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Two-sample proportion test (${alt}, α=${alpha})`,
    func: "prop.test.two",
    distribution: "proportion_test",
    args: [JSON.stringify(data1), JSON.stringify(data2), alt, alpha],
  };
}

export function generateAnovaOneWay(sampleSize: number): TestCase {
  const groups = 3 + Math.floor(Math.random() * 3); // 3-5 groups
  const groupedData = generateGroupedData(groups, sampleSize);
  const alphas = ["0.05", "0.01", "0.10"];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random One-way ANOVA (${groups} groups, α=${alpha})`,
    func: "aov.one",
    distribution: "anova",
    args: [JSON.stringify(groupedData), alpha],
  };
}

export function generateWelchAnovaOneWay(sampleSize: number): TestCase {
  const groups = 3 + Math.floor(Math.random() * 3);
  const groupedData = generateGroupedData(groups, sampleSize);
  const alphas = ["0.05", "0.01", "0.10"];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Welch's ANOVA (${groups} groups, α=${alpha})`,
    func: "aov.welch",
    distribution: "anova",
    args: [JSON.stringify(groupedData), alpha],
  };
}

export function generateTwoWayAnova(sampleSize: number): TestCase {
  const factorA = 2 + Math.floor(Math.random() * 2); // 2-3 levels
  const factorB = 2 + Math.floor(Math.random() * 2); // 2-3 levels
  const data = generateTwoWayAnovaData(factorA, factorB, sampleSize);
  const alphas = ["0.05", "0.01", "0.10"];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Two-way ANOVA (${factorA}×${factorB}, α=${alpha})`,
    func: "aov.two",
    distribution: "anova",
    args: [JSON.stringify(data), alpha],
  };
}

export function generateChiSquareTest(sampleSize: number): TestCase {
  const rows = 2 + Math.floor(Math.random() * 2); // 2-3 rows
  const cols = 2 + Math.floor(Math.random() * 2); // 2-3 cols
  const totalN = sampleSize * 2; // Ensure sufficient sample size
  const contingencyTable = generateContingencyTable(rows, cols, totalN);

  return {
    testName: `Random Chi-square test (${rows}×${cols} table)`,
    func: "chisq.test.independence",
    distribution: "chi_square",
    args: [JSON.stringify(contingencyTable)],
  };
}

export function generateMannWhitneyTest(sampleSize: number): TestCase {
  const data1 = generateNormalData(sampleSize);
  const data2 = generateNormalData(sampleSize);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Mann-Whitney U test (${alt}, α=${alpha})`,
    func: "wilcox.test.mannwhitney",
    distribution: "mann_whitney",
    args: [JSON.stringify(data1), JSON.stringify(data2), alt, alpha],
  };
}

export function generateWilcoxonSignedRankTest(sampleSize: number): TestCase {
  const data1 = generateNormalData(sampleSize);
  const data2 = generateNormalData(sampleSize);
  const alternatives = ["two.sided", "less", "greater"];
  const alphas = ["0.05", "0.01", "0.10"];
  const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Wilcoxon signed-rank test (${alt}, α=${alpha})`,
    func: "wilcox.test.signedrank",
    distribution: "wilcoxon",
    args: [JSON.stringify(data1), JSON.stringify(data2), alt, alpha],
  };
}

export function generateKruskalWallisTest(sampleSize: number): TestCase {
  const groups = 3 + Math.floor(Math.random() * 3);
  const groupedData = generateGroupedData(groups, sampleSize);
  const alphas = ["0.05", "0.01", "0.10"];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Kruskal-Wallis test (${groups} groups, α=${alpha})`,
    func: "kruskal.test.one",
    distribution: "kruskal_wallis",
    args: [JSON.stringify(groupedData), alpha],
  };
}

export function generateFishersExactTest(sampleSize: number): TestCase {
  const contingencyTable = generateContingencyTable(2, 2, sampleSize);

  return {
    testName: `Random Fisher's exact test (2×2 table)`,
    func: "fisher.test.exact",
    distribution: "fishers_exact",
    args: [JSON.stringify(contingencyTable)],
  };
}

export function generatePearsonTest(sampleSize: number): TestCase {
  const x = generateNormalData(sampleSize);
  const y = generateNormalData(sampleSize);

  return {
    testName: `Random Pearson correlation test`,
    func: "cor.test.pearson",
    distribution: "correlation",
    args: [JSON.stringify(x), JSON.stringify(y), "pearson"],
  };
}

export function generateSpearmanTest(sampleSize: number): TestCase {
  const x = generateNormalData(sampleSize);
  const y = generateNormalData(sampleSize);

  return {
    testName: `Random Spearman correlation test`,
    func: "cor.test.spearman",
    distribution: "correlation",
    args: [JSON.stringify(x), JSON.stringify(y), "spearman"],
  };
}

export function generateKendallTest(sampleSize: number): TestCase {
  const x = generateNormalData(sampleSize);
  const y = generateNormalData(sampleSize);

  return {
    testName: `Random Kendall correlation test`,
    func: "cor.test.kendall",
    distribution: "correlation",
    args: [JSON.stringify(x), JSON.stringify(y), "kendall"],
  };
}

export function generateShapiroWilkTest(sampleSize: number): TestCase {
  const data = generateNormalData(sampleSize);

  return {
    testName: `Random Shapiro-Wilk normality test`,
    func: "shapiro.test.normality",
    distribution: "shapiro_wilk",
    args: [JSON.stringify(data)],
  };
}

export function generateTukeyHSDTest(sampleSize: number): TestCase {
  const groups = 3 + Math.floor(Math.random() * 3);
  const groupedData = generateGroupedData(groups, sampleSize);
  const alphas = ["0.05", "0.01", "0.10"];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Tukey HSD test (${groups} groups, α=${alpha})`,
    func: "tukey.hsd",
    distribution: "post_hoc",
    args: [JSON.stringify(groupedData), alpha],
  };
}

export function generateGamesHowellTest(sampleSize: number): TestCase {
  const groups = 3 + Math.floor(Math.random() * 3);
  const groupedData = generateGroupedData(groups, sampleSize);
  const alphas = ["0.05", "0.01", "0.10"];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Games-Howell test (${groups} groups, α=${alpha})`,
    func: "games.howell",
    distribution: "post_hoc",
    args: [JSON.stringify(groupedData), alpha],
  };
}

export function generateDunnTest(sampleSize: number): TestCase {
  const groups = 3 + Math.floor(Math.random() * 3);
  const groupedData = generateGroupedData(groups, sampleSize);
  const alphas = ["0.05", "0.01", "0.10"];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  return {
    testName: `Random Dunn's test (${groups} groups, α=${alpha})`,
    func: "dunn.test",
    distribution: "post_hoc",
    args: [JSON.stringify(groupedData), alpha],
  };
}

// Registry of all test generators
export const TEST_GENERATORS = {
  "t.test.one": generateTTestOneSample,
  "t.test.two": generateTTestTwoSample,
  "t.test.paired": generateTTestPaired,
  "z.test.one": generateZTestOneSample,
  "z.test.two": generateZTestTwoSample,
  "prop.test.one": generateProportionTestOneSample,
  "prop.test.two": generateProportionTestTwoSample,
  "aov.one": generateAnovaOneWay,
  "aov.welch": generateWelchAnovaOneWay,
  "aov.two": generateTwoWayAnova,
  "aov.two.factorA": generateTwoWayAnova,
  "aov.two.factorB": generateTwoWayAnova,
  "aov.two.interaction": generateTwoWayAnova,
  "chisq.test.independence": generateChiSquareTest,
  "wilcox.test.mannwhitney": generateMannWhitneyTest,
  "wilcox.test.signedrank": generateWilcoxonSignedRankTest,
  "kruskal.test.one": generateKruskalWallisTest,
  "kruskal.test.bygroup": generateKruskalWallisTest,
  "fisher.test.exact": generateFishersExactTest,
  "cor.test.pearson": generatePearsonTest,
  "cor.test.spearman": generateSpearmanTest,
  "cor.test.kendall": generateKendallTest,
  "shapiro.test.normality": generateShapiroWilkTest,
  "levene.test": generateShapiroWilkTest, // Placeholder - needs proper implementation
  "levene.test.equalvar": generateShapiroWilkTest, // Placeholder - needs proper implementation
  "tukey.hsd": generateTukeyHSDTest,
  "games.howell": generateGamesHowellTest,
  "dunn.test": generateDunnTest,
};

// Main function to generate random test cases
export function generateRandomTestCases(config: RandomTestConfig): TestCase[] {
  const {
    testCount,
    minSampleSize = 10,
    maxSampleSize = 30,
    includeAllTests = true,
    testTypes = Object.keys(TEST_GENERATORS),
  } = config;

  const testCases: TestCase[] = [];
  const availableTests = includeAllTests
    ? testTypes
    : testTypes.filter((t) => testTypes.includes(t));

  for (let i = 0; i < testCount; i++) {
    const sampleSize = minSampleSize +
      Math.floor(Math.random() * (maxSampleSize - minSampleSize + 1));
    const testType =
      availableTests[Math.floor(Math.random() * availableTests.length)];
    const generator = TEST_GENERATORS[testType as keyof typeof TEST_GENERATORS];

    if (generator) {
      try {
        const testCase = generator(sampleSize);
        testCases.push(testCase);
      } catch (error) {
        console.warn(`Failed to generate test case for ${testType}:`, error);
      }
    }
  }

  return testCases;
}

// Create a random test file
export async function createRandomTestFile(
  testCases: TestCase[],
  testName: string = "comprehensive_random",
): Promise<string> {
  const testFileContent = `#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust ${testName} with random data...\\n");

  const testCases = ${JSON.stringify(testCases, null, 2)};

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}`;

  const fileName = `temp_${testName}_random_${Date.now()}.test.ts`;
  await Deno.writeTextFile(fileName, testFileContent);
  return fileName;
}

// Main function for CLI usage
async function main() {
  const args = Deno.args;

  if (args.length === 0 || args[0] === "--help") {
    console.log(`
🎲 Comprehensive Random Test Generator

Usage:
  deno run --allow-read --allow-run --allow-write random-test-generator.ts <testCount> [options]

Options:
  --test-count <number>     Number of random tests to generate (default: 10)
  --min-sample <number>     Minimum sample size (default: 10)
  --max-sample <number>     Maximum sample size (default: 30)
  --test-types <types>      Comma-separated list of test types to include
  --exclude-types <types>   Comma-separated list of test types to exclude
  --help                    Show this help message

Available test types:
  ${Object.keys(TEST_GENERATORS).join(", ")}

Examples:
  deno run --allow-read --allow-run --allow-write random-test-generator.ts 20
  deno run --allow-read --allow-run --allow-write random-test-generator.ts 50 --min-sample 15 --max-sample 50
  deno run --allow-read --allow-run --allow-write random-test-generator.ts 30 --test-types "t.test.one,t.test.two,shapiro.test.normality"
`);
    return;
  }

  const testCount = parseInt(args[0]) || 10;
  let minSample = 10;
  let maxSample = 30;
  let testTypes: string[] = Object.keys(TEST_GENERATORS);
  let excludeTypes: string[] = [];

  // Parse additional arguments
  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case "--min-sample":
        minSample = parseInt(value) || 10;
        break;
      case "--max-sample":
        maxSample = parseInt(value) || 30;
        break;
      case "--test-types":
        testTypes = value.split(",").map((t) => t.trim());
        break;
      case "--exclude-types":
        excludeTypes = value.split(",").map((t) => t.trim());
        break;
    }
  }

  // Filter out excluded test types
  testTypes = testTypes.filter((t) => !excludeTypes.includes(t));

  console.log(`🎲 Generating ${testCount} random tests...`);
  console.log(`📊 Sample size range: ${minSample}-${maxSample}`);
  console.log(`🧪 Test types: ${testTypes.length} available`);

  const config: RandomTestConfig = {
    testCount,
    minSampleSize: minSample,
    maxSampleSize: maxSample,
    includeAllTests: true,
    testTypes,
  };

  const testCases = generateRandomTestCases(config);
  const fileName = await createRandomTestFile(testCases, "comprehensive");

  console.log(`✅ Generated test file: ${fileName}`);
  console.log(`📋 Test cases created: ${testCases.length}`);
  console.log(`\nTo run the tests:`);
  console.log(`deno run --allow-read --allow-run ${fileName}`);
}

if (import.meta.main) {
  main().catch(console.error);
}
