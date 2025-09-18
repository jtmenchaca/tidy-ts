import { callRobustR } from "./src/dataframe/rust/stats/regression/tests/regression-interface.ts";

// Create a test case with the problematic formula
const params = {
  testType: "glm.gaussian",
  data: {
    formula: "y ~ x1 * x2 * x3 + x4 + x5",
    y: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    x1: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    x2: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0],
    x3: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0],
    x4: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0],
    x5: [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0],
  },
  options: { family: "gaussian", alpha: 0.05 },
};

console.log("Testing formula:", params.data.formula);

try {
  const rResult = await callRobustR(params);
  console.log("R coefficients:", rResult.coefficients);
  console.log("R coefficients length:", rResult.coefficients?.length);
} catch (error) {
  console.error("R error:", error);
}
