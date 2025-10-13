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
console.log("\n=== Debug Info ===");
console.log("Dispersion parameter:", result.dispersion_parameter);
console.log("Residual deviance:", result.deviance);
console.log("DF residual:", result.df_residual);
console.log("Residual std error:", result.residual_standard_error);
console.log("\nDeviance residuals:", result.deviance_residuals);
console.log("Leverage values:", result.leverage);

const residuals = model.residuals({ type: "deviance" });
const rstandard = model.rstandard({ type: "deviance" });
const rstudent = model.rstudent();

console.log("\n=== Results ===");
console.log("Residuals:", residuals);
console.log("Rstandard:", rstandard);
console.log("Rstudent:", rstudent);
