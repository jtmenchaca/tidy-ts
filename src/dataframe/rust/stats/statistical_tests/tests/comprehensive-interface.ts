#!/usr/bin/env -S deno run --allow-all

// Comprehensive test interface for ALL statistical tests

export interface TestParameters {
  testType: string;
  data?: {
    x?: number[];
    y?: number[];
    groups?: number[][];
    contingencyTable?: number[][];
    data?: number[];
    groupSizes?: number[];
    proportions?: {
      x1?: number;
      n1?: number;
      x2?: number;
      n2?: number;
      x?: number;
      n?: number;
      p0?: number;
    };
    twoWayData?: {
      data: number[];
      aLevels: number;
      bLevels: number;
      cellSizes: number[];
    };
  };
  options?: {
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
    method?: string;
    pooled?: boolean;
    exact?: boolean;
    continuityCorrection?: boolean;
    min?: number;
    max?: number;
    mu?: number;
    sigma?: number;
    mean?: number;
    stdDev?: number;
    testType?: "factorA" | "factorB" | "interaction" | "main";
    paired?: boolean;
    assumeEqualVariances?: boolean;
  };
}

// R-compatible parameters with dot notation for alternatives
interface RTestParameters extends Omit<TestParameters, "options"> {
  options?: Omit<TestParameters["options"], "alternative"> & {
    alternative?: "two.sided" | "less" | "greater";
  };
}

export interface TestResult {
  test_statistic: number;
  p_value: number;
  method?: string;
  alternative?: string;
  alpha?: number;
  correlation?: number;
  odds_ratio?: number;
  reject_null?: boolean;
}

// Helper function to extract test statistic value
function extractStatistic(
  result: { test_statistic: { value?: number } | number },
): number {
  if (
    typeof result.test_statistic === "object" &&
    result.test_statistic.value !== undefined
  ) {
    return result.test_statistic.value;
  }
  return result.test_statistic as number;
}

// Robust R caller
export async function callRobustR(params: TestParameters): Promise<TestResult> {
  // Convert alternative parameter to R format
  const rParams = structuredClone(params) as RTestParameters;
  if (rParams.options?.alternative) {
    rParams.options.alternative = rParams.options.alternative.replace(
      "-",
      ".",
    ) as "two.sided" | "less" | "greater";
  }

  const paramJson = JSON.stringify(rParams);

  // Get the directory of the current file using import.meta.url
  const currentDir = new URL(".", import.meta.url).pathname;
  const rScriptPath = `${currentDir}test-runner.R`;

  const command = new Deno.Command("Rscript", {
    args: [rScriptPath, paramJson],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`R error: ${errorText}`);
  }

  const output = new TextDecoder().decode(stdout);
  return JSON.parse(output);
}

// Comprehensive Rust caller
export async function callRobustRust(
  params: TestParameters,
): Promise<TestResult> {
  const alternative = params.options?.alternative || "two-sided";
  const alpha = params.options?.alpha || 0.05;

  switch (params.testType) {
    // Correlation Tests
    case "cor.test.pearson": {
      const { pearsonTest } = await import(
        "../../../../ts/stats/statistical-tests/correlation/pearson.ts"
      );
      const result = pearsonTest({
        x: params.data!.x!,
        y: params.data!.y!,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "pearson",
        alternative,
        alpha,
      };
    }

    case "cor.test.spearman": {
      const { spearmanTest } = await import(
        "../../../../ts/stats/statistical-tests/correlation/spearman.ts"
      );
      const result = spearmanTest({
        x: params.data!.x!,
        y: params.data!.y!,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "spearman",
        alternative,
        alpha,
      };
    }

    case "cor.test.kendall": {
      const { kendallTest } = await import(
        "../../../../ts/stats/statistical-tests/correlation/kendall.ts"
      );
      const result = kendallTest({
        x: params.data!.x!,
        y: params.data!.y!,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "kendall",
        alternative,
        alpha,
      };
    }

    // T-Tests
    case "t.test.one": {
      const { tTestOneSample } = await import(
        "../../../../ts/stats/statistical-tests/t-tests.ts"
      );
      const result = tTestOneSample({
        data: params.data!.x!,
        mu: params.options?.mu || 0,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "t.test.one",
        alternative,
        alpha,
      };
    }

    case "t.test.two": {
      const { tTestIndependent } = await import(
        "../../../../ts/stats/statistical-tests/t-tests.ts"
      );
      const result = tTestIndependent({
        x: params.data!.x!,
        y: params.data!.y!,
        alternative,
        alpha,
        equalVar: params.options?.assumeEqualVariances ?? true,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "t.test.two",
        alternative,
        alpha,
      };
    }

    case "t.test.paired": {
      const { tTestPaired } = await import(
        "../../../../ts/stats/statistical-tests/t-tests.ts"
      );
      const result = tTestPaired({
        x: params.data!.x!,
        y: params.data!.y!,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "t.test.paired",
        alternative,
        alpha,
      };
    }

    // Z-Tests
    case "z.test.one": {
      const { zTestOneSample } = await import(
        "../../../../ts/stats/statistical-tests/z-tests.ts"
      );
      const result = zTestOneSample({
        data: params.data!.x!,
        popMean: params.options?.mu || 0,
        popStd: params.options?.sigma || 1,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "z.test.one",
        alternative,
        alpha,
      };
    }

    case "z.test.two": {
      const { zTestTwoSample } = await import(
        "../../../../ts/stats/statistical-tests/z-tests.ts"
      );
      const result = zTestTwoSample({
        data1: params.data!.x!,
        data2: params.data!.y!,
        popStd1: params.options?.sigma || 1,
        popStd2: params.options?.sigma || 1,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "z.test.two",
        alternative,
        alpha,
      };
    }

    // Proportion Tests
    case "prop.test.one": {
      const { proportionTestOneSample } = await import(
        "../../../../ts/stats/statistical-tests/proportion-tests.ts"
      );
      // Convert count data to boolean array for proportion test
      const successCount = params.data!.proportions!.x!;
      const totalCount = params.data!.proportions!.n!;
      const data = Array.from(
        { length: totalCount },
        (_, i) => i < successCount,
      );
      const result = proportionTestOneSample({
        data,
        popProportion: params.data!.proportions!.p0 || 0.5,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "prop.test.one",
        alternative,
        alpha,
      };
    }

    case "prop.test.two": {
      const { proportionTestTwoSample } = await import(
        "../../../../ts/stats/statistical-tests/proportion-tests.ts"
      );
      // Convert count data to boolean arrays for proportion test
      const x1Count = params.data!.proportions!.x1!;
      const n1Count = params.data!.proportions!.n1!;
      const x2Count = params.data!.proportions!.x2!;
      const n2Count = params.data!.proportions!.n2!;
      const data1 = Array.from({ length: n1Count }, (_, i) => i < x1Count);
      const data2 = Array.from({ length: n2Count }, (_, i) => i < x2Count);
      const result = proportionTestTwoSample({
        data1,
        data2,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "prop.test.two",
        alternative,
        alpha,
      };
    }

    // ANOVA Tests
    case "aov.one": {
      const { anovaOneWay } = await import(
        "../../../../ts/stats/statistical-tests/anova.ts"
      );
      const result = anovaOneWay(params.data!.groups!, alpha);
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "aov.one",
        alternative: "two-sided",
        alpha,
      };
    }

    case "aov.welch": {
      const { welchAnovaOneWay } = await import(
        "../../../../ts/stats/statistical-tests/anova.ts"
      );
      const result = welchAnovaOneWay(params.data!.groups!, alpha);
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "aov.welch",
        alternative: "two-sided",
        alpha,
      };
    }

    // Non-parametric Tests
    case "wilcox.test.mannwhitney": {
      const { mannWhitneyTest } = await import(
        "../../../../ts/stats/statistical-tests/mann-whitney.ts"
      );
      const result = mannWhitneyTest({
        x: params.data!.x!,
        y: params.data!.y!,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "wilcox.mannwhitney",
        alternative,
        alpha,
      };
    }

    case "wilcox.test.signedrank": {
      const { wilcoxonSignedRankTest } = await import(
        "../../../../ts/stats/statistical-tests/wilcoxon.ts"
      );
      const result = wilcoxonSignedRankTest({
        x: params.data!.x!,
        y: params.data!.y!,
        alternative,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "wilcox.signedrank",
        alternative,
        alpha,
      };
    }

    case "kruskal.test": {
      const { kruskalWallisTest } = await import(
        "../../../../ts/stats/statistical-tests/kruskal-wallis.ts"
      );
      const result = kruskalWallisTest(params.data!.groups!, alpha);
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "kruskal.test",
        alternative: "two-sided",
        alpha,
      };
    }

    // Distribution Tests
    case "ks.test.uniform": {
      const { ksTestUniform } = await import(
        "../../../../ts/stats/statistical-tests/kolmogorov-smirnov.ts"
      );
      const result = ksTestUniform({
        x: params.data!.x!,
        min: params.options?.min || 0,
        max: params.options?.max || 1,
        alternative,
        alpha,
      });
      return {
        test_statistic: result.d_statistic,
        p_value: result.p_value,
        method: "ks.uniform",
        alternative,
        alpha,
      };
    }

    case "ks.test.two.sample": {
      const { kolmogorovSmirnovTest } = await import(
        "../../../../ts/stats/statistical-tests/kolmogorov-smirnov.ts"
      );
      const result = kolmogorovSmirnovTest({
        x: params.data!.x!,
        y: params.data!.y!,
        alternative,
        alpha,
      });
      return {
        test_statistic: result.d_statistic,
        p_value: result.p_value,
        method: "ks.two.sample",
        alternative,
        alpha,
      };
    }

    case "shapiro.test": {
      const { shapiroWilkTest } = await import(
        "../../../../ts/stats/statistical-tests/shapiro-wilk.ts"
      );
      const result = shapiroWilkTest({
        data: params.data!.x!,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "shapiro.test",
        alternative: "two-sided",
        alpha,
      };
    }

    case "ad.test": {
      const { andersonDarlingTest } = await import(
        "../../../../ts/stats/statistical-tests/anderson-darling.ts"
      );
      const result = andersonDarlingTest({
        data: params.data!.x!,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "ad.test",
        alternative: "two-sided",
        alpha,
      };
    }

    case "dagostino.test": {
      const { dagostinoPearsonTest } = await import(
        "../../../../ts/stats/statistical-tests/dagostino-pearson.ts"
      );
      const result = dagostinoPearsonTest({
        data: params.data!.x!,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "dagostino.test",
        alternative: "two-sided",
        alpha,
      };
    }

    // Chi-Square Tests
    case "chisq.test": {
      const { chiSquareTest } = await import(
        "../../../../ts/stats/statistical-tests/chi-square.ts"
      );
      const result = chiSquareTest({
        contingencyTable: params.data!.contingencyTable!,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "chisq.test",
        alternative: "two-sided",
        alpha,
      };
    }

    case "fisher.test": {
      const { fishersExactTest } = await import(
        "../../../../ts/stats/statistical-tests/fishers-exact.ts"
      );
      const result = fishersExactTest({
        contingencyTable: params.data!.contingencyTable!,
        alternative,
        alpha,
      });
      return {
        test_statistic: result.effect_size?.value || extractStatistic(result), // Use effect_size.value for odds ratio
        p_value: result.p_value,
        method: "fisher.test",
        alternative,
        alpha,
      };
    }

    // Two-way ANOVA Tests
    case "aov.two.factorA": {
      const { twoWayAnovaFactorA } = await import(
        "../../../../ts/stats/statistical-tests/anova.ts"
      );
      const twoWayData = params.data!.twoWayData!;
      // Convert flat data to 3D array structure for two-way ANOVA
      const data3D: number[][][] = [];
      let dataIndex = 0;
      for (let a = 0; a < twoWayData.aLevels; a++) {
        data3D[a] = [];
        for (let b = 0; b < twoWayData.bLevels; b++) {
          const cellSize = twoWayData.cellSizes[a * twoWayData.bLevels + b];
          data3D[a][b] = twoWayData.data.slice(dataIndex, dataIndex + cellSize);
          dataIndex += cellSize;
        }
      }
      const result = twoWayAnovaFactorA({
        data: data3D,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "aov.two.factorA",
        alternative: "two-sided",
        alpha,
      };
    }

    case "aov.two.factorB": {
      const { twoWayAnovaFactorB } = await import(
        "../../../../ts/stats/statistical-tests/anova.ts"
      );
      const twoWayData = params.data!.twoWayData!;
      // Convert flat data to 3D array structure for two-way ANOVA
      const data3D: number[][][] = [];
      let dataIndex = 0;
      for (let a = 0; a < twoWayData.aLevels; a++) {
        data3D[a] = [];
        for (let b = 0; b < twoWayData.bLevels; b++) {
          const cellSize = twoWayData.cellSizes[a * twoWayData.bLevels + b];
          data3D[a][b] = twoWayData.data.slice(dataIndex, dataIndex + cellSize);
          dataIndex += cellSize;
        }
      }
      const result = twoWayAnovaFactorB({
        data: data3D,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "aov.two.factorB",
        alternative: "two-sided",
        alpha,
      };
    }

    case "aov.two.interaction": {
      const { twoWayAnovaInteraction } = await import(
        "../../../../ts/stats/statistical-tests/anova.ts"
      );
      const twoWayData = params.data!.twoWayData!;
      // Convert flat data to 3D array structure for two-way ANOVA
      const data3D: number[][][] = [];
      let dataIndex = 0;
      for (let a = 0; a < twoWayData.aLevels; a++) {
        data3D[a] = [];
        for (let b = 0; b < twoWayData.bLevels; b++) {
          const cellSize = twoWayData.cellSizes[a * twoWayData.bLevels + b];
          data3D[a][b] = twoWayData.data.slice(dataIndex, dataIndex + cellSize);
          dataIndex += cellSize;
        }
      }
      const result = twoWayAnovaInteraction({
        data: data3D,
        alpha,
      });
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "aov.two.interaction",
        alternative: "two-sided",
        alpha,
      };
    }

    // Levene's Test
    case "levene.test": {
      const { leveneTest } = await import(
        "../../../../ts/stats/statistical-tests/levene.ts"
      );
      const result = leveneTest(params.data!.groups!, alpha);
      return {
        test_statistic: extractStatistic(result),
        p_value: result.p_value,
        method: "levene.test",
        alternative: "two-sided",
        alpha,
      };
    }

    default:
      throw new Error(`Unknown test type: ${params.testType}`);
  }
}

// Test case generator for comprehensive interface
export function generateComprehensiveTestCase(
  testType: string,
  sampleSize: number,
): TestParameters {
  const alternatives: Array<"two-sided" | "less" | "greater"> = [
    "two-sided",
    "less",
    "greater",
  ];
  const alphas = [0.05, 0.01, 0.10];

  const alternative =
    alternatives[Math.floor(Math.random() * alternatives.length)];
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  // Helper to generate normal data
  function generateNormalData(n: number, mean = 0, stdDev = 1): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      data.push(mean + stdDev * z);
    }
    return data;
  }

  switch (testType) {
    // Correlation tests
    case "cor.test.pearson":
    case "cor.test.spearman":
    case "cor.test.kendall":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
          y: generateNormalData(sampleSize),
        },
        options: { alternative, alpha },
      };

    // T-tests
    case "t.test.one":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
        },
        options: {
          mu: Math.random() * 2 - 1, // Random mu between -1 and 1
          alternative,
          alpha,
        },
      };

    case "t.test.two":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
          y: generateNormalData(sampleSize),
        },
        options: {
          alternative,
          alpha,
          assumeEqualVariances: Math.random() > 0.5,
        },
      };

    case "t.test.paired":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
          y: generateNormalData(sampleSize),
        },
        options: { alternative, alpha },
      };

    // Distribution tests
    case "ks.test.uniform":
      return {
        testType,
        data: {
          x: Array.from({ length: sampleSize }, () => Math.random()),
        },
        options: {
          min: 0,
          max: 1,
          alternative,
          alpha,
        },
      };

    case "shapiro.test":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
        },
        options: { alpha },
      };

    case "ad.test":
      return {
        testType,
        data: {
          x: generateNormalData(Math.max(sampleSize, 7)), // Anderson-Darling requires n >= 7
        },
        options: { alpha },
      };

    case "dagostino.test":
      return {
        testType,
        data: {
          x: generateNormalData(Math.max(sampleSize, 20)), // D'Agostino-Pearson requires n >= 20
        },
        options: { alpha },
      };

    // Non-parametric tests
    case "wilcox.test.signedrank":
    case "wilcox.test.mannwhitney":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
          y: generateNormalData(sampleSize),
        },
        options: { alternative, alpha },
      };

    case "ks.test.two.sample":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
          y: generateNormalData(sampleSize),
        },
        options: { alternative, alpha },
      };

    // ANOVA Tests
    case "aov.one":
    case "aov.welch":
    case "kruskal.test":
    case "levene.test":
      return {
        testType,
        data: {
          groups: [
            generateNormalData(Math.floor(sampleSize / 3)),
            generateNormalData(Math.floor(sampleSize / 3)),
            generateNormalData(Math.floor(sampleSize / 3)),
          ],
        },
        options: { alpha },
      };

    // Two-way ANOVA Tests
    case "aov.two.factorA":
    case "aov.two.factorB":
    case "aov.two.interaction":
      return {
        testType,
        data: {
          twoWayData: {
            data: [
              // Group A1B1
              ...generateNormalData(Math.floor(sampleSize / 4), 5, 1),
              // Group A1B2
              ...generateNormalData(Math.floor(sampleSize / 4), 6, 1),
              // Group A2B1
              ...generateNormalData(Math.floor(sampleSize / 4), 7, 1),
              // Group A2B2
              ...generateNormalData(Math.floor(sampleSize / 4), 8, 1),
            ],
            aLevels: 2,
            bLevels: 2,
            cellSizes: [
              Math.floor(sampleSize / 4),
              Math.floor(sampleSize / 4),
              Math.floor(sampleSize / 4),
              Math.floor(sampleSize / 4),
            ],
          },
        },
        options: { alpha },
      };

    // Proportion Tests
    case "prop.test.one":
      return {
        testType,
        data: {
          proportions: {
            x: Math.floor(sampleSize * 0.4), // 40% success rate
            n: sampleSize,
            p0: 0.5,
          },
        },
        options: { alternative, alpha },
      };

    case "prop.test.two":
      return {
        testType,
        data: {
          proportions: {
            x1: Math.floor(sampleSize * 0.4),
            n1: sampleSize,
            x2: Math.floor(sampleSize * 0.6),
            n2: sampleSize,
          },
        },
        options: { alternative, alpha },
      };

    // Chi-square and Fisher's exact tests
    case "chisq.test":
    case "fisher.test":
      return {
        testType,
        data: {
          contingencyTable: [
            [20, 30],
            [25, 35],
          ],
        },
        options: { alpha },
      };

    // Z-tests
    case "z.test.one":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
        },
        options: {
          mu: Math.random() * 2 - 1,
          sigma: 1 + Math.random(),
          alternative,
          alpha,
        },
      };

    case "z.test.two":
      return {
        testType,
        data: {
          x: generateNormalData(sampleSize),
          y: generateNormalData(sampleSize),
        },
        options: {
          sigma: 1 + Math.random(),
          alternative,
          alpha,
        },
      };

    default:
      throw new Error(`Test case generation not implemented for: ${testType}`);
  }
}
