import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";

const data = createDataFrame([
  { y: 0, x1: 1.2, x2: 3 },
  { y: 1, x1: 2.5, x2: 5 },
  { y: 0, x1: 1.8, x2: 2 },
  { y: 1, x1: 3.2, x2: 7 },
  { y: 1, x1: 2.9, x2: 6 },
  { y: 0, x1: 1.5, x2: 3 },
]);

console.log(
  "=== Logistic Regression Detailed Analysis (TypeScript/Rust) ===\n",
);

// Enable trace mode by setting control options
const model = glm({
  formula: "y ~ x1 + x2",
  family: "binomial",
  link: "logit",
  data,
  options: {
    max_iter: 25,
    epsilon: 1e-8,
    trace: true,
  },
});

const result = model.getRawResult();

console.log("\n=== Final Results ===");
console.log("Converged:", result.converged);
console.log("Iterations:", result.iter);
console.log("Deviance:", result.deviance);
console.log("AIC:", result.aic);

console.log("\nCoefficients (full precision):");
result.coefficients.forEach((coef: number, i: number) => {
  console.log(`  ${result.model_matrix_column_names[i]}: ${coef}`);
});

console.log("\nStandard errors:");
result.standard_errors.forEach((se: number, i: number) => {
  console.log(`  ${result.model_matrix_column_names[i]}: ${se}`);
});

console.log("\nFitted values:");
console.log(result.fitted_values);

console.log("\nLinear predictors:");
console.log(result.linear_predictors);
