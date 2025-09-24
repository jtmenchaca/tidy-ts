import { read_csv, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("Example Test", async () => {
  //studyname,sampleNumber,species,region,island,stage,individualId,clutchCompletion,dateEgg,culmenLengthMm,culmenDepthMm,flipperLengthMm,bodyMassG,sex,delta15NOoo,delta13COoo,comments
  // PAL0708,1,Adelie Penguin (Pygoscelis adeliae),Anvers,Torgersen,"Adult, 1 Egg Stage",N1A1,Yes,2007-11-11,39.1,18.7,181,3750,MALE,NA,NA,Not enough blood for isotopes.
  // PAL0708,2,Adelie Penguin (Pygoscelis adeliae),Anvers,Torgersen,"Adult, 1 Egg Stage",N1A2,Yes,2007-11-11,39.5,17.4,186,3800,FEMALE,8.94956,-24.69454,NA

  const PenguinsSchema = z.object({
    studyname: z.string(),
    sampleNumber: z.number(),
    species: z.string(),
    region: z.string(),
    island: z.string(),
    stage: z.string(),
    individualId: z.string(),
    clutchCompletion: z.string(),
    dateEgg: z.string(),
    culmenLengthMm: z.number().nullable(),
    culmenDepthMm: z.number().nullable(),
    flipperLengthMm: z.number().nullable(),
    bodyMassG: z.number().nullable(),
    sex: z.string().nullable(),
    delta15NOoo: z.number().nullable(),
    delta13COoo: z.number().nullable(),
    comments: z.string().nullable(),
  });
  const csvPath = new URL("../fixtures/penguins.csv", import.meta.url).pathname;
  const df = await read_csv(csvPath, PenguinsSchema);

  const testing = df
    .summarize({
      avg_culmen_length: (row) => s.mean(row.culmenLengthMm, true),
      avg_culmen_depth: (row) => s.mean(row.culmenDepthMm, true),
      avg_flipper_length: (row) => s.mean(row.flipperLengthMm, true),
      avg_body_mass: (row) => s.mean(row.bodyMassG, true),
    });

  testing.print("Penguins Data:");

  // Now with some statistical comparisons
  const comparisonResult = df
    .groupBy("species")
    .summarize({
      comparison_result: (df) =>
        s.compare.oneGroup.centralTendency.toValue({
          data: df.culmenLengthMm.filter((x): x is number => x !== null),
          hypothesizedValue: 0,
          parametric: "parametric",
          alternative: "two-sided",
          alpha: 0.05,
        }),
    });

  comparisonResult.print("Comparison Result:");
  console.log(comparisonResult.extract("comparison_result"));

  // ===== BETWEEN-GROUP COMPARISONS =====
  console.log("\n" + "=".repeat(50));
  console.log("BETWEEN-GROUP COMPARISONS");
  console.log("=".repeat(50));

  // 1. Compare central tendencies between species
  const speciesComparison = df
    .groupBy("species")
    .summarize({
      mean_culmen_length: (row) => s.mean(row.culmenLengthMm, true),
      mean_culmen_depth: (row) => s.mean(row.culmenDepthMm, true),
      mean_flipper_length: (row) => s.mean(row.flipperLengthMm, true),
      mean_body_mass: (row) => s.mean(row.bodyMassG, true),
      count: (row) => row.nrows(),
    });

  speciesComparison.print("Species Summary Statistics:");

  // 2. Compare culmen length between Adelie and Chinstrap penguins
  const adelieData = df
    .filter((row) => row.species === "Adelie Penguin (Pygoscelis adeliae)")
    .culmenLengthMm.filter((x): x is number => x !== null);

  const chinstrapData = df
    .filter((row) =>
      row.species === "Chinstrap penguin (Pygoscelis antarctica)"
    )
    .culmenLengthMm.filter((x): x is number => x !== null);

  const culmenLengthComparison = s.compare.twoGroups.centralTendency
    .toEachOther({
      x: adelieData,
      y: chinstrapData,
      parametric: "parametric", // Use t-test
      assumeEqualVariances: true, // Assume equal variances
      alternative: "two-sided",
      alpha: 0.05,
    });

  console.log("\nCulmen Length Comparison (Adelie vs Chinstrap):");
  console.log(`Test: ${culmenLengthComparison.test_name}`);
  console.log(
    `Test Statistic: ${
      culmenLengthComparison.test_statistic?.value?.toFixed(4)
    }`,
  );
  console.log(`P-value: ${culmenLengthComparison.p_value?.toFixed(4)}`);
  console.log(
    `Effect Size (Cohen's d): ${
      culmenLengthComparison.effect_size?.value?.toFixed(4)
    }`,
  );
  console.log(
    `Mean Difference: ${culmenLengthComparison.mean_difference?.toFixed(4)}`,
  );
  console.log(
    `95% CI: [${
      culmenLengthComparison.confidence_interval?.lower?.toFixed(4)
    }, ${culmenLengthComparison.confidence_interval?.upper?.toFixed(4)}]`,
  );

  // 3. Compare body mass between male and female penguins (non-parametric)
  const maleData = df
    .filter((row) => row.sex === "MALE")
    .bodyMassG.filter((x): x is number => x !== null);

  const femaleData = df
    .filter((row) => row.sex === "FEMALE")
    .bodyMassG.filter((x): x is number => x !== null);

  const bodyMassComparison = s.compare.twoGroups.centralTendency.toEachOther({
    x: maleData,
    y: femaleData,
    parametric: "nonparametric", // Use Mann-Whitney U test
    alternative: "two-sided",
    alpha: 0.05,
  });

  console.log("\nBody Mass Comparison (Male vs Female):");
  console.log(`Test: ${bodyMassComparison.test_name}`);
  console.log(
    `Test Statistic: ${bodyMassComparison.test_statistic?.value?.toFixed(4)}`,
  );
  console.log(`P-value: ${bodyMassComparison.p_value?.toFixed(4)}`);
  console.log(
    `Effect Size: ${bodyMassComparison.effect_size?.value?.toFixed(4)}`,
  );

  // 4. Test correlation between culmen length and flipper length
  const culmenFlipperCorrelation = s.compare.twoGroups.association.toEachOther({
    x: df.culmenLengthMm.filter((x): x is number => x !== null),
    y: df.flipperLengthMm.filter((x): x is number => x !== null),
    method: "pearson", // Use Pearson correlation
    alternative: "two-sided",
    alpha: 0.05,
  });

  console.log("\nCulmen Length vs Flipper Length Correlation:");
  console.log(`Test: ${culmenFlipperCorrelation.test_name}`);
  console.log(
    `Correlation: ${culmenFlipperCorrelation.effect_size?.value?.toFixed(4)}`,
  );
  console.log(
    `Test Statistic: ${
      culmenFlipperCorrelation.test_statistic?.value?.toFixed(4)
    }`,
  );
  console.log(`P-value: ${culmenFlipperCorrelation.p_value?.toFixed(4)}`);
  console.log(
    `95% CI: [${
      culmenFlipperCorrelation.confidence_interval?.lower?.toFixed(4)
    }, ${culmenFlipperCorrelation.confidence_interval?.upper?.toFixed(4)}]`,
  );

  // 5. Compare proportions (e.g., clutch completion rates between species)
  const adelieClutchData = df
    .filter((row) => row.species === "Adelie Penguin (Pygoscelis adeliae)")
    .clutchCompletion.map((x) => x === "Yes");

  const gentooClutchData = df
    .filter((row) => row.species === "Gentoo penguin (Pygoscelis papua)")
    .clutchCompletion.map((x) => x === "Yes");

  const clutchCompletionComparison = s.compare.twoGroups.proportions
    .toEachOther({
      data1: adelieClutchData,
      data2: gentooClutchData,
      alternative: "two-sided",
      alpha: 0.05,
      useChiSquare: false, // Use two-proportion z-test
    });

  console.log("\nClutch Completion Rate Comparison (Adelie vs Gentoo):");
  console.log(`Test: ${clutchCompletionComparison.test_name}`);
  console.log(
    `Test Statistic: ${
      clutchCompletionComparison.test_statistic.value.toFixed(4)
    }`,
  );
  console.log(`P-value: ${clutchCompletionComparison.p_value.toFixed(4)}`);
  console.log(
    `Proportion Difference: ${
      clutchCompletionComparison.proportion_difference?.toFixed(4)
    }`,
  );

  // 6. Compare distributions between islands
  const torgersenData = df
    .filter((row) => row.island === "Torgersen")
    .culmenDepthMm.filter((x): x is number => x !== null);

  const biscoeData = df
    .filter((row) => row.island === "Biscoe")
    .culmenDepthMm.filter((x): x is number => x !== null);

  const distributionComparison = s.compare.twoGroups.distributions.toEachOther({
    x: torgersenData,
    y: biscoeData,
    method: "ks", // Explicitly use KS test for distribution equality
    alternative: "two-sided",
    alpha: 0.05,
  });

  console.log("\nCulmen Depth Distribution Comparison (Torgersen vs Biscoe):");
  console.log(`Test: ${distributionComparison.test_name}`);
  console.log(
    `Test Statistic: ${distributionComparison.test_statistic.value.toFixed(4)}`,
  );
  console.log(`P-value: ${distributionComparison.p_value.toFixed(4)}`);
  console.log(
    `D Statistic: ${distributionComparison.test_statistic.value.toFixed(4)}`,
  );

  // 7. Multiple group comparison using groupBy and summarize
  const multiGroupComparison = df
    .groupBy("species")
    .summarize({
      culmen_length_test: (group) => {
        const data = group.culmenLengthMm.filter((x): x is number =>
          x !== null
        );
        return s.compare.oneGroup.centralTendency.toValue({
          data,
          hypothesizedValue: 40, // Test if mean culmen length differs from 40mm
          parametric: "parametric",
          alternative: "two-sided",
          alpha: 0.05,
        });
      },
      flipper_length_test: (group) => {
        const data = group.flipperLengthMm.filter((x): x is number =>
          x !== null
        );
        return s.compare.oneGroup.centralTendency.toValue({
          data,
          hypothesizedValue: 200, // Test if mean flipper length differs from 200mm
          parametric: "parametric",
          alternative: "two-sided",
          alpha: 0.05,
        });
      },
    });

  multiGroupComparison.print("Multi-Group Comparison Results:");
});
