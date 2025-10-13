import { twoWayAnova } from "../../../src/dataframe/ts/stats/statistical-tests/anova.ts";

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
  const result = twoWayAnova({
    data: data,
    alpha: 0.05,
  });

  // Display comprehensive results
  console.log("=== TYPESCRIPT TWO-WAY ANOVA RESULT ===");

  // Basic ANOVA table
  console.log("ANOVA Table:");
  console.log(
    `Factor A (Treatment): F(${result.factor_a.degrees_of_freedom},${result.df_error}) = ${
      result.factor_a.test_statistic.value.toFixed(4)
    }, p = ${result.factor_a.p_value.toFixed(5)}`,
  );
  console.log(
    `Factor B (Time): F(${result.factor_b.degrees_of_freedom},${result.df_error}) = ${
      result.factor_b.test_statistic.value.toFixed(4)
    }, p = ${result.factor_b.p_value.toFixed(5)}`,
  );
  console.log(
    `Interaction (A×B): F(${result.interaction.degrees_of_freedom},${result.df_error}) = ${
      result.interaction.test_statistic.value.toFixed(4)
    }, p = ${result.interaction.p_value.toFixed(5)}`,
  );

  // Sum of squares
  console.log(
    `Sum of Squares - Factor A: ${
      result.factor_a.sum_of_squares.toFixed(4)
    }, Factor B: ${result.factor_b.sum_of_squares.toFixed(4)}, Interaction: ${
      result.interaction.sum_of_squares.toFixed(4)
    }`,
  );
  console.log(
    `Residual SS: ${result.anova_table[3].ss.toFixed(4)}, Total SS: ${
      result.anova_table[4].ss.toFixed(4)
    }`,
  );

  // Mean squares
  console.log(
    `Mean Squares - Factor A: ${
      result.factor_a.mean_square.toFixed(4)
    }, Factor B: ${result.factor_b.mean_square.toFixed(4)}, Interaction: ${
      result.interaction.mean_square.toFixed(4)
    }`,
  );
  console.log(`Residual MS: ${result.ms_error.toFixed(4)}`);

  // Effect sizes (from ANOVA table components)
  console.log(
    `Eta-squared - Factor A: ${
      result.anova_table[0].eta_squared?.toFixed(4) || "N/A"
    }, Factor B: ${
      result.anova_table[1].eta_squared?.toFixed(4) || "N/A"
    }, Interaction: ${result.anova_table[2].eta_squared?.toFixed(4) || "N/A"}`,
  );
  console.log(
    `Partial Eta-squared - Factor A: ${
      result.anova_table[0].partial_eta_squared?.toFixed(4) || "N/A"
    }, Factor B: ${
      result.anova_table[1].partial_eta_squared?.toFixed(4) || "N/A"
    }, Interaction: ${
      result.anova_table[2].partial_eta_squared?.toFixed(4) || "N/A"
    }`,
  );
  console.log(
    `Omega-squared - Factor A: ${
      result.anova_table[0].omega_squared?.toFixed(4) || "N/A"
    }, Factor B: ${
      result.anova_table[1].omega_squared?.toFixed(4) || "N/A"
    }, Interaction: ${
      result.anova_table[2].omega_squared?.toFixed(4) || "N/A"
    }`,
  );

  // Model fit
  console.log(`R-squared: ${result.r_squared.toFixed(4)}`);
  console.log(
    `Sample size: ${result.sample_size} | Total df: ${result.df_total} | Error df: ${result.df_error}`,
  );
  console.log(`Grand mean: ${result.grand_mean.toFixed(4)}`);

  // Cell means and standard deviations
  console.log("Cell means:");
  console.log(
    `  Control-Before: ${result.sample_means[0].toFixed(4)} (SD: ${
      result.sample_std_devs[0].toFixed(4)
    })`,
  );
  console.log(
    `  Control-After: ${result.sample_means[1].toFixed(4)} (SD: ${
      result.sample_std_devs[1].toFixed(4)
    })`,
  );
  console.log(
    `  Treatment-Before: ${result.sample_means[2].toFixed(4)} (SD: ${
      result.sample_std_devs[2].toFixed(4)
    })`,
  );
  console.log(
    `  Treatment-After: ${result.sample_means[3].toFixed(4)} (SD: ${
      result.sample_std_devs[3].toFixed(4)
    })`,
  );

  // Degrees of freedom breakdown
  console.log(
    `Degrees of freedom - Factor A: ${result.factor_a.degrees_of_freedom}, Factor B: ${result.factor_b.degrees_of_freedom}, Interaction: ${result.interaction.degrees_of_freedom}, Error: ${result.df_error}, Total: ${result.df_total}`,
  );

  // ANOVA table components
  console.log("ANOVA Table Components:");
  result.anova_table.forEach((component) => {
    console.log(
      `  ${component.component}: SS=${
        component.ss.toFixed(4)
      }, df=${component.df}, MS=${component.ms?.toFixed(4) || "N/A"}, F=${
        component.f_statistic?.toFixed(4) || "N/A"
      }, p=${component.p_value?.toFixed(5) || "N/A"}`,
    );
  });

  // Test name and alpha
  console.log(`Test name: ${result.test_name}`);
  console.log(`Alpha level: ${result.alpha}`);

  console.log("=== END TYPESCRIPT TWO-WAY ANOVA ===");
});
