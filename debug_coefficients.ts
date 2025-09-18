import {
  callRobustR,
  callRobustRust,
  generateRegressionTestCase,
} from "./src/dataframe/rust/stats/regression/tests/regression-interface.ts";

// Generate a specific test case
const params = generateRegressionTestCase("glm.gaussian", 20);
console.log("Generated formula:", params.data?.formula);

// Run both R and Rust
const [rResult, rustResult] = await Promise.all([
  callRobustR(params),
  callRobustRust(params),
]);

console.log("R coefficients:", rResult.coefficients);
console.log("Rust coefficients:", rustResult.coefficients);
console.log("R coefficients length:", rResult.coefficients?.length);
console.log("Rust coefficients length:", rustResult.coefficients?.length);

// Compare coefficient by coefficient
if (rResult.coefficients && rustResult.coefficients) {
  const maxLen = Math.max(
    rResult.coefficients.length,
    rustResult.coefficients.length,
  );
  console.log("\nCoefficient comparison:");
  for (let i = 0; i < maxLen; i++) {
    const rCoef = rResult.coefficients[i] || 0;
    const rustCoef = rustResult.coefficients[i] || 0;
    const diff = Math.abs(rCoef - rustCoef);
    console.log(`Index ${i}: R=${rCoef}, Rust=${rustCoef}, Diff=${diff}`);
  }
}
