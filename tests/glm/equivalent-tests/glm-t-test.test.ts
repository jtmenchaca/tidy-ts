import { createDataFrame, stats } from "../../../src/dataframe/mod.ts";
import { glm } from "../../../src/dataframe/ts/wasm/glm-functions.ts";

Deno.test("GLM T-Test Equivalent", () => {
  // Data from R test
  const groupA = [12.3, 15.7, 18.2, 14.8, 16.1, 13.9];
  const groupB = [22.1, 25.4, 28.6, 24.3, 26.8, 23.7];
  const y = [...groupA, ...groupB];
  const group = ["A", "A", "A", "A", "A", "A", "B", "B", "B", "B", "B", "B"];

  // Calculate means manually since mean_difference is not exposed
  const meanA = groupA.reduce((sum, val) => sum + val, 0) / groupA.length;
  const meanB = groupB.reduce((sum, val) => sum + val, 0) / groupB.length;
  const _meanDifference = meanA - meanB;

  // 1. Perform independent t-test (Welch's t-test)
  const _ttest = stats.test.t.independent({
    x: groupA,
    y: groupB,
    alternative: "two-sided",
    equalVar: false, // Welch's t-test
  });

  // 2. Perform GLM with Gaussian family
  // Use B as reference level (like R: relevel(group, ref = "B"))
  const df = createDataFrame({
    columns: {
      y: y,
      group: group.map((g) => g === "A" ? 1 : 0), // A=1, B=0 (reference)
    },
  });

  const glmResult = glm({
    formula: "y ~ group",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Display GLM result comparison
  console.log("=== TYPESCRIPT GLM RESULT ===");
  console.log(
    `Coefficients: [${
      glmResult.coefficients.map((c) => c.toFixed(4)).join(", ")
    }]`,
  );
  console.log(
    `Standard errors: [${
      glmResult.standard_errors.map((se) => se.toFixed(4)).join(", ")
    }]`,
  );
  console.log(
    `T-statistics: [${
      glmResult.coefficients.map((c, i) =>
        (c / glmResult.standard_errors[i]).toFixed(4)
      ).join(", ")
    }]`,
  );
  console.log(
    `P-values: [${glmResult.p_values.map((p) => p.toFixed(5)).join(", ")}]`,
  );
  console.log(
    `Deviance: ${glmResult.deviance.toFixed(4)} | AIC: ${
      glmResult.aic.toFixed(4)
    }`,
  );
  console.log(
    `Null deviance: ${
      glmResult.null_deviance.toFixed(4)
    } | Residual df: ${glmResult.df_residual}`,
  );
  console.log(
    `Rank: ${glmResult.rank} | Iterations: ${glmResult.iter} | Converged: ${glmResult.converged}`,
  );
  console.log(
    `R-squared: ${glmResult.r_squared.toFixed(4)} | Adj R-squared: ${
      glmResult.adjusted_r_squared.toFixed(4)
    }`,
  );
  console.log(
    `Residual SE: ${
      glmResult.residual_standard_error.toFixed(4)
    } | Dispersion: ${glmResult.dispersion_parameter.toFixed(4)}`,
  );
  console.log(
    `Family: ${glmResult.family.family} | Link: ${glmResult.family.link}`,
  );
  console.log("Covariance matrix:");
  glmResult.covariance_matrix.forEach((row) => {
    console.log(`  [${row.map((val) => val.toFixed(4)).join(", ")}]`);
  });
  console.log("R matrix:");
  glmResult.r.forEach((row) => {
    console.log(`  [${row.map((val) => val.toFixed(4)).join(", ")}]`);
  });
  console.log(
    `Model matrix: ${glmResult.model_matrix_dimensions[0]}x${
      glmResult.model_matrix_dimensions[1]
    }, cols: [${glmResult.model_matrix_column_names.join(", ")}]`,
  );
  console.log("=== END TYPESCRIPT GLM ===");
});
