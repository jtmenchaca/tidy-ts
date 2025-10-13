import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";

const data = createDataFrame([
  { y: 5, x: 1 },
  { y: 7, x: 2 },
  { y: 9, x: 3 },
  { y: 11, x: 4 },
  { y: 13, x: 5 },
]);

const model = glm({
  formula: "y ~ x",
  family: "gaussian",
  link: "identity",
  data,
});
const result = model.getRawResult();
console.log("Deviance residuals:", result.deviance_residuals);
console.log(
  "Sum of squared deviance residuals:",
  result.deviance_residuals.reduce((sum: number, r: number) => sum + r * r, 0),
);
console.log("DF residual:", result.df_residual);
console.log("Residual deviance (from result.deviance):", result.deviance);
console.log("Dispersion (calculated):", result.deviance / result.df_residual);
console.log("Dispersion (stored):", result.dispersion_parameter);
