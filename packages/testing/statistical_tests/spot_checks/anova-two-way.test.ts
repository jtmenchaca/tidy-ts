import { stats } from "@tidy-ts/dataframe";

Deno.test("Two-Way ANOVA Spot Check", () => {
  // Data from R test - 2x2 factorial design
  // Factor A: Treatment (Control vs Treatment)
  // Factor B: Time (Before vs After)
  // 6 observations per cell

  // Cell A1B1: Control, Before
  const groupA1B1 = [12.3, 15.7, 18.2, 14.8, 16.1, 13.9];

  // Cell A1B2: Control, After
  const groupA1B2 = [22.1, 25.4, 28.6, 24.3, 26.8, 23.7];

  // Cell A2B1: Treatment, Before
  const groupA2B1 = [11.8, 14.2, 17.5, 13.9, 15.6, 12.4];

  // Cell A2B2: Treatment, After
  const groupA2B2 = [28.5, 31.2, 34.8, 30.1, 32.7, 29.3];

  // Create 3D data structure for two-way ANOVA
  const data = [
    [groupA1B1, groupA1B2], // Control: Before, After
    [groupA2B1, groupA2B2], // Treatment: Before, After
  ];

  // Perform two-way ANOVA
  const result = stats.test.anova.twoWay({
    data: data,
    alpha: 0.05,
  });

  // Display comprehensive results
  console.log("=== TYPESCRIPT TWO-WAY ANOVA RESULT ===");

  // Basic ANOVA table
  console.log("ANOVA Table:");
  console.log(
    `Factor A (Treatment): F(${result.factorA.degreesOfFreedom},${result.dfError}) = ${
      result.factorA.testStatistic.value.toFixed(4)
    }, p = ${result.factorA.pValue.toFixed(5)}`,
  );
  console.log(
    `Factor B (Time): F(${result.factorB.degreesOfFreedom},${result.dfError}) = ${
      result.factorB.testStatistic.value.toFixed(4)
    }, p = ${result.factorB.pValue.toFixed(5)}`,
  );
  console.log(
    `Interaction (A×B): F(${result.interaction.degreesOfFreedom},${result.dfError}) = ${
      result.interaction.testStatistic.value.toFixed(4)
    }, p = ${result.interaction.pValue.toFixed(5)}`,
  );

  // Sum of squares
  console.log(
    `Sum of Squares - Factor A: ${
      result.factorA.sumOfSquares.toFixed(4)
    }, Factor B: ${result.factorB.sumOfSquares.toFixed(4)}, Interaction: ${
      result.interaction.sumOfSquares.toFixed(4)
    }`,
  );
  console.log(
    `Residual SS: ${result.anovaTable[3].ss.toFixed(4)}, Total SS: ${
      result.anovaTable[4].ss.toFixed(4)
    }`,
  );

  // Mean squares
  console.log(
    `Mean Squares - Factor A: ${
      result.factorA.meanSquare.toFixed(4)
    }, Factor B: ${result.factorB.meanSquare.toFixed(4)}, Interaction: ${
      result.interaction.meanSquare.toFixed(4)
    }`,
  );
  console.log(`Residual MS: ${result.msError.toFixed(4)}`);

  // Effect sizes (from ANOVA table components)
  console.log(
    `Eta-squared - Factor A: ${
      result.anovaTable[0].etaSquared?.toFixed(4) || "N/A"
    }, Factor B: ${
      result.anovaTable[1].etaSquared?.toFixed(4) || "N/A"
    }, Interaction: ${result.anovaTable[2].etaSquared?.toFixed(4) || "N/A"}`,
  );
  console.log(
    `Partial Eta-squared - Factor A: ${
      result.anovaTable[0].partialEtaSquared?.toFixed(4) || "N/A"
    }, Factor B: ${
      result.anovaTable[1].partialEtaSquared?.toFixed(4) || "N/A"
    }, Interaction: ${
      result.anovaTable[2].partialEtaSquared?.toFixed(4) || "N/A"
    }`,
  );
  console.log(
    `Omega-squared - Factor A: ${
      result.anovaTable[0].omegaSquared?.toFixed(4) || "N/A"
    }, Factor B: ${
      result.anovaTable[1].omegaSquared?.toFixed(4) || "N/A"
    }, Interaction: ${result.anovaTable[2].omegaSquared?.toFixed(4) || "N/A"}`,
  );

  // Model fit
  console.log(`R-squared: ${result.rSquared.toFixed(4)}`);
  console.log(
    `Sample size: ${result.sampleSize} | Total df: ${result.dfTotal} | Error df: ${result.dfError}`,
  );
  console.log(`Grand mean: ${result.grandMean.toFixed(4)}`);

  // Cell means and standard deviations
  console.log("Cell means:");
  console.log(
    `  Control-Before: ${result.sampleMeans[0].toFixed(4)} (SD: ${
      result.sampleStdDevs[0].toFixed(4)
    })`,
  );
  console.log(
    `  Control-After: ${result.sampleMeans[1].toFixed(4)} (SD: ${
      result.sampleStdDevs[1].toFixed(4)
    })`,
  );
  console.log(
    `  Treatment-Before: ${result.sampleMeans[2].toFixed(4)} (SD: ${
      result.sampleStdDevs[2].toFixed(4)
    })`,
  );
  console.log(
    `  Treatment-After: ${result.sampleMeans[3].toFixed(4)} (SD: ${
      result.sampleStdDevs[3].toFixed(4)
    })`,
  );

  // Degrees of freedom breakdown
  console.log(
    `Degrees of freedom - Factor A: ${result.factorA.degreesOfFreedom}, Factor B: ${result.factorB.degreesOfFreedom}, Interaction: ${result.interaction.degreesOfFreedom}, Error: ${result.dfError}, Total: ${result.dfTotal}`,
  );

  // ANOVA table components
  console.log("ANOVA Table Components:");
  result.anovaTable.forEach((component) => {
    console.log(
      `  ${component.component}: SS=${
        component.ss.toFixed(4)
      }, df=${component.df}, MS=${component.ms?.toFixed(4) || "N/A"}, F=${
        component.fStatistic?.toFixed(4) || "N/A"
      }, p=${component.pValue?.toFixed(5) || "N/A"}`,
    );
  });

  // Test name and alpha
  console.log(`Test name: ${result.testName}`);
  console.log(`Alpha level: ${result.alpha}`);

  console.log("=== END TYPESCRIPT TWO-WAY ANOVA ===");
});
