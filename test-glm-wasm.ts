import { glmFit } from "./src/dataframe/ts/wasm/glm-functions.ts";

const data = {
  y: [2, 4, 6, 8, 10],
  x: [1, 2, 3, 4, 5],
};

const result = glmFit("y ~ x", "gaussian", "identity", data);
console.log("AIC:", result.aic);
console.log("Deviance:", result.deviance);
console.log("Full result:", JSON.stringify(result, null, 2));
