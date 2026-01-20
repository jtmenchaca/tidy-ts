// deno-lint-ignore-file no-explicit-any
/**
 * Helper to convert WASM test results to plain JavaScript objects
 * that can be properly serialized with JSON.stringify
 */
export function serializeTestResult(result: any): any {
  if (!result) return null;

  // If it's a WASM object with __wbg_ptr, extract its properties
  if (result.__wbg_ptr !== undefined) {
    const serialized: any = {};

    // Common properties for all test results - ordered for user-friendly output
    if (result.testName !== undefined) {
      serialized.testName = result.testName;
    }

    if (result.pValue !== undefined) {
      serialized.pValue = result.pValue;
    }

    if (result.effectSize) {
      serialized.effectSize = {
        value: result.effectSize.value,
        name: result.effectSize.name,
      };
    }

    if (result.testStatistic) {
      serialized.testStatistic = {
        value: result.testStatistic.value,
        name: result.testStatistic.name,
      };
    }

    if (result.confidenceInterval) {
      serialized.confidenceInterval = {
        lower: result.confidenceInterval.lower,
        upper: result.confidenceInterval.upper,
        confidenceLevel: result.confidenceInterval.confidenceLevel,
      };
    }

    if (result.degreesOfFreedom !== undefined) {
      serialized.degreesOfFreedom = result.degreesOfFreedom;
    }

    // Welch ANOVA specific degrees of freedom
    if (result.df1 !== undefined) {
      serialized.df1 = result.df1;
    }

    if (result.df2 !== undefined) {
      serialized.df2 = result.df2;
    }

    if (result.alpha !== undefined) {
      serialized.alpha = result.alpha;
    }

    if (result.errorMessage !== undefined) {
      serialized.errorMessage = result.errorMessage;
    }

    // Additional properties for specific test types
    if (result.sampleSize !== undefined) {
      serialized.sampleSize = result.sampleSize;
    }

    if (result.sampleMean !== undefined) {
      serialized.sampleMean = result.sampleMean;
    }

    if (result.sampleStd !== undefined) {
      serialized.sampleStd = result.sampleStd;
    }

    if (result.hypothesizedMean !== undefined) {
      serialized.hypothesizedMean = result.hypothesizedMean;
    }

    // Normality test properties
    if (result.skewness !== undefined) {
      serialized.skewness = result.skewness;
    }

    if (result.kurtosis !== undefined) {
      serialized.kurtosis = result.kurtosis;
    }

    // Two-sample test properties
    if (result.sample1Mean !== undefined) {
      serialized.sample1Mean = result.sample1Mean;
    }

    if (result.sample2Mean !== undefined) {
      serialized.sample2Mean = result.sample2Mean;
    }

    if (result.sample1Size !== undefined) {
      serialized.sample1Size = result.sample1Size;
    }

    if (result.sample2Size !== undefined) {
      serialized.sample2Size = result.sample2Size;
    }

    if (result.sample1Std !== undefined) {
      serialized.sample1Std = result.sample1Std;
    }

    if (result.sample2Std !== undefined) {
      serialized.sample2Std = result.sample2Std;
    }

    // ANOVA properties
    if (result.fStatistic !== undefined) {
      serialized.fStatistic = result.fStatistic;
    }

    if (result.betweenGroupVariance !== undefined) {
      serialized.betweenGroupVariance = result.betweenGroupVariance;
    }

    if (result.withinGroupVariance !== undefined) {
      serialized.withinGroupVariance = result.withinGroupVariance;
    }

    if (result.dfBetween !== undefined) {
      serialized.dfBetween = result.dfBetween;
    }

    if (result.dfWithin !== undefined) {
      serialized.dfWithin = result.dfWithin;
    }

    // Proportion test properties
    if (result.observedProportion !== undefined) {
      serialized.observedProportion = result.observedProportion;
    }

    if (result.hypothesizedProportion !== undefined) {
      serialized.hypothesizedProportion = result.hypothesizedProportion;
    }

    if (result.successes !== undefined) {
      serialized.successes = result.successes;
    }

    if (result.trials !== undefined) {
      serialized.trials = result.trials;
    }

    // Chi-square properties
    if (result.chiSquare !== undefined) {
      serialized.chiSquare = result.chiSquare;
    }

    if (result.expectedFrequencies !== undefined) {
      serialized.expectedFrequencies = result.expectedFrequencies;
    }

    if (result.observedFrequencies !== undefined) {
      serialized.observedFrequencies = result.observedFrequencies;
    }

    // Correlation properties
    if (result.correlation !== undefined) {
      serialized.correlation = result.correlation;
    }

    if (result.rSquared !== undefined) {
      serialized.rSquared = result.rSquared;
    }

    // Non-parametric test properties
    if (result.uStatistic !== undefined) {
      serialized.uStatistic = result.uStatistic;
    }

    if (result.wStatistic !== undefined) {
      serialized.wStatistic = result.wStatistic;
    }

    if (result.hStatistic !== undefined) {
      serialized.hStatistic = result.hStatistic;
    }

    if (result.rankSum !== undefined) {
      serialized.rankSum = result.rankSum;
    }

    if (result.zScore !== undefined) {
      serialized.zScore = result.zScore;
    }

    // Shapiro-Wilk properties
    if (result.statistic !== undefined) {
      serialized.statistic = result.statistic;
    }

    if (result.normalityAssumptionMet !== undefined) {
      serialized.normalityAssumptionMet = result.normalityAssumptionMet;
    }

    // Two-way ANOVA properties - handle the complex structure
    if (result.factorA) {
      serialized.factorA = {
        testStatistic: result.factorA.testStatistic
          ? {
            value: result.factorA.testStatistic.value,
            name: result.factorA.testStatistic.name,
          }
          : undefined,
        pValue: result.factorA.pValue,
        degreesOfFreedom: result.factorA.degreesOfFreedom,
        effectSize: result.factorA.effectSize
          ? {
            value: result.factorA.effectSize.value,
            name: result.factorA.effectSize.name,
          }
          : undefined,
        meanSquare: result.factorA.meanSquare,
        sumOfSquares: result.factorA.sumOfSquares,
      };
    }

    if (result.factorB) {
      serialized.factorB = {
        testStatistic: result.factorB.testStatistic
          ? {
            value: result.factorB.testStatistic.value,
            name: result.factorB.testStatistic.name,
          }
          : undefined,
        pValue: result.factorB.pValue,
        degreesOfFreedom: result.factorB.degreesOfFreedom,
        effectSize: result.factorB.effectSize
          ? {
            value: result.factorB.effectSize.value,
            name: result.factorB.effectSize.name,
          }
          : undefined,
        meanSquare: result.factorB.meanSquare,
        sumOfSquares: result.factorB.sumOfSquares,
      };
    }

    if (result.interaction) {
      serialized.interaction = {
        testStatistic: result.interaction.testStatistic
          ? {
            value: result.interaction.testStatistic.value,
            name: result.interaction.testStatistic.name,
          }
          : undefined,
        pValue: result.interaction.pValue,
        degreesOfFreedom: result.interaction.degreesOfFreedom,
        effectSize: result.interaction.effectSize
          ? {
            value: result.interaction.effectSize.value,
            name: result.interaction.effectSize.name,
          }
          : undefined,
        meanSquare: result.interaction.meanSquare,
        sumOfSquares: result.interaction.sumOfSquares,
      };
    }

    // Additional two-way ANOVA specific properties
    if (result.sampleMeans !== undefined) {
      serialized.sampleMeans = result.sampleMeans;
    }

    if (result.sampleStdDevs !== undefined) {
      serialized.sampleStdDevs = result.sampleStdDevs;
    }

    if (result.sumOfSquares !== undefined) {
      serialized.sumOfSquares = result.sumOfSquares;
    }

    if (result.grandMean !== undefined) {
      serialized.grandMean = result.grandMean;
    }

    if (result.rSquared !== undefined) {
      serialized.rSquared = result.rSquared;
    }

    // Two-way ANOVA complete table information
    if (result.dfError !== undefined) {
      serialized.dfError = result.dfError;
    }

    if (result.msError !== undefined) {
      serialized.msError = result.msError;
    }

    if (result.dfTotal !== undefined) {
      serialized.dfTotal = result.dfTotal;
    }

    // ANOVA table serialization
    if (result.anovaTable) {
      serialized.anovaTable = Array.from(result.anovaTable).map((
        component: any,
      ) => ({
        component: component.component,
        ss: component.ss,
        df: component.df,
        ms: component.ms,
        fStatistic: component.fStatistic,
        pValue: component.pValue,
        etaSquared: component.etaSquared,
        partialEtaSquared: component.partialEtaSquared,
        omegaSquared: component.omegaSquared,
      }));
    }

    // Kolmogorov-Smirnov test properties
    if (result.dStatistic !== undefined) {
      serialized.dStatistic = result.dStatistic;
    }

    if (result.dPlus !== undefined) {
      serialized.dPlus = result.dPlus;
    }

    if (result.dMinus !== undefined) {
      serialized.dMinus = result.dMinus;
    }

    if (result.criticalValue !== undefined) {
      serialized.criticalValue = result.criticalValue;
    }

    if (result.sample1Size !== undefined) {
      serialized.sample1Size = result.sample1Size;
    }

    if (result.sample2Size !== undefined) {
      serialized.sample2Size = result.sample2Size;
    }

    if (result.alternative !== undefined) {
      serialized.alternative = result.alternative;
    }

    // Post-hoc test specific properties
    if (result.comparisons !== undefined) {
      serialized.comparisons = result.comparisons.map((comp: any) => {
        if (comp.__wbg_ptr !== undefined) {
          // Serialize PairwiseComparison objects
          return {
            group1: comp.group1,
            group2: comp.group2,
            meanDifference: comp.meanDifference,
            standardError: comp.standardError,
            testStatistic: comp.testStatistic
              ? {
                value: comp.testStatistic.value,
                name: comp.testStatistic.name,
              }
              : undefined,
            pValue: comp.pValue,
            adjustedPValue: comp.adjustedPValue,
            confidenceInterval: comp.confidenceInterval
              ? {
                lower: comp.confidenceInterval.lower,
                upper: comp.confidenceInterval.upper,
                confidenceLevel: comp.confidenceInterval.confidenceLevel,
              }
              : undefined,
            significant: comp.significant,
          };
        }
        return comp;
      });
    }

    if (result.correctionMethod !== undefined) {
      serialized.correctionMethod = result.correctionMethod;
    }

    if (result.nGroups !== undefined) {
      serialized.nGroups = result.nGroups;
    }

    if (result.nTotal !== undefined) {
      serialized.nTotal = result.nTotal;
    }

    return serialized;
  }

  // If it's already a plain object, return as is
  return result;
}
