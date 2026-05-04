import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { glm } from "../../../dataframe/ts/wasm/glm-functions.ts";
import { expect } from "@std/expect";
import { TOL, assertClose } from "../glm-test-helpers.ts";

Deno.test("GLM T-Test Equivalent", () => {
  // Data from R test
  const groupA = [12.3, 15.7, 18.2, 14.8, 16.1, 13.9];
  const groupB = [22.1, 25.4, 28.6, 24.3, 26.8, 23.7];
  const y = [...groupA, ...groupB];
  const group = ["A", "A", "A", "A", "A", "A", "B", "B", "B", "B", "B", "B"];

  // R reference values
  const R_COEF = [25.15, -9.983333];
  const R_SE = [0.886269, 1.253373];
  const R_PVALUES = [6.868e-11, 1.223e-05];
  const R_DEVIANCE = 47.128333;
  const R_AIC = 56.470138;
  const R_T_STAT = -7.965172;
  const R_T_PVALUE = 1.223e-05;
  const R_MEAN_DIFF = 9.983333;

  // 1. Perform equal-variance t-test
  const ttest = stats.test.t.independent({
    x: groupA,
    y: groupB,
    alternative: "two-sided",
    equalVar: true,
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

  // -- GLM coefficients match R reference values --
  assertClose(glmResult.coefficients[0], R_COEF[0], TOL, "intercept");
  assertClose(
    glmResult.coefficients[1],
    R_COEF[1],
    TOL,
    "group coefficient",
  );

  // -- GLM standard errors match R --
  assertClose(glmResult.standard_errors[0], R_SE[0], 1e-4, "SE intercept");
  assertClose(glmResult.standard_errors[1], R_SE[1], 1e-4, "SE group");

  // -- GLM p-values match R --
  assertClose(glmResult.p_values[0], R_PVALUES[0], 1e-12, "p-value intercept");
  assertClose(glmResult.p_values[1], R_PVALUES[1], 1e-7, "p-value group");

  // -- GLM deviance and AIC match R --
  assertClose(glmResult.deviance, R_DEVIANCE, 1e-4, "deviance");
  assertClose(glmResult.aic, R_AIC, 1e-4, "AIC");

  // -- GLM group coefficient equals mean difference from t-test --
  // The GLM coefficient for the group indicator is exactly meanA - meanB
  const meanA = groupA.reduce((sum, val) => sum + val, 0) / groupA.length;
  const meanB = groupB.reduce((sum, val) => sum + val, 0) / groupB.length;
  const meanDiff = meanA - meanB;
  assertClose(
    glmResult.coefficients[1],
    meanDiff,
    TOL,
    "GLM group coef = mean difference",
  );
  assertClose(Math.abs(meanDiff), R_MEAN_DIFF, 1e-4, "mean difference vs R");

  // -- GLM p-value for group matches t-test p-value --
  // Both tests are equivalent: Gaussian GLM with binary predictor = equal-variance t-test
  assertClose(
    glmResult.p_values[1],
    ttest.pValue,
    1e-7,
    "GLM group p-value = t-test p-value",
  );
  assertClose(ttest.pValue, R_T_PVALUE, 1e-7, "t-test p-value vs R");

  // -- T-statistic from GLM matches t-test --
  const glmTStat = glmResult.coefficients[1] / glmResult.standard_errors[1];
  assertClose(glmTStat, R_T_STAT, 1e-4, "GLM t-statistic vs R");
  assertClose(
    Math.abs(glmTStat),
    Math.abs(ttest.testStatistic.value),
    1e-4,
    "GLM t-stat magnitude = t-test statistic magnitude",
  );

  // -- Basic structural checks --
  expect(glmResult.converged).toBe(true);
  expect(glmResult.family.family).toBe("gaussian");
  expect(glmResult.family.link).toBe("identity");
  expect(glmResult.rank).toBe(2);
});
