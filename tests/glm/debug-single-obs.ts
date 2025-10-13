import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";

const x = [1, 2, 3, 4, 5];
const y = [2.1, 4.2, 5.8, 8.1, 10.3];
const weights = [0, 0, 0, 0, 1]; // Only last observation has weight

const df = createDataFrame({ columns: { x, y } });

const result = glm({
  formula: "y ~ x",
  family: "gaussian",
  link: "identity",
  data: df,
  options: { weights },
});

console.log("Converged:", result.converged);
console.log("Coefficients:", result.coefficients);
console.log("Fitted values:", result.fitted_values);
console.log("Expected: intercept=10.3, slope=NaN");
console.log("Expected fitted values: all 10.3");
