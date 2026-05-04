#!/usr/bin/env -S deno run --allow-all
/**
 * Debug: Gaussian HC2 - check if the issue is in how vcov_cl_from_input
 * handles the data vs how the test data was generated in R.
 */

import { glmFit, vcovCL } from "../../dataframe/ts/wasm/glm-functions.ts";
import ref from "../glm/gap-refs.json" with { type: "json" };

const { x1, x2, y, cluster } = ref.sandwich_gaussian;
const n = y.length;

console.log("=== Data check ===");
console.log("n:", n);
console.log("y[0:5]:", y.slice(0, 5));
console.log("x1[0:5]:", x1.slice(0, 5));
console.log("x2[0:5]:", x2.slice(0, 5));
console.log("cluster[0:5]:", cluster.slice(0, 5));
console.log("unique clusters:", [...new Set(cluster)].length);

const fit = glmFit("y ~ x1 + x2", "gaussian", "identity", { x1, x2, y });
console.log("\n=== Fit ===");
console.log("Coefficients:", fit.coefficients);
console.log("R's coef:", ref.sandwich_gaussian.coef);
console.log("Coef match?", fit.coefficients.every((c: number, i: number) =>
  Math.abs(c - ref.sandwich_gaussian.coef[i]) < 1e-6));

console.log("\nn:", fit.fittedValues.length);
console.log("rank:", fit.rank);
console.log("weights[0:5]:", fit.weights.slice(0, 5));
console.log("workingResiduals[0:5]:", fit.workingResiduals.slice(0, 5));

// Verify working residuals = y - fitted for Gaussian identity
const residuals = y.map((yi: number, i: number) => yi - fit.fittedValues[i]);
console.log("y - fitted[0:5]:", residuals.slice(0, 5));
console.log("wres matches y-fitted?", fit.workingResiduals.every((w: number, i: number) =>
  Math.abs(w - residuals[i]) < 1e-10));

// Check our dispersion computation
const wres = fit.workingResiduals.map((r: number, i: number) => r * fit.weights[i]);
const sumWres2 = wres.reduce((s: number, w: number) => s + w * w, 0);
const sumWeights = fit.weights.reduce((s: number, w: number) => s + w, 0);
console.log("\nsum(wres^2):", sumWres2);
console.log("sum(weights):", sumWeights);
console.log("sum(wres^2)/sum(w):", sumWres2 / sumWeights);
console.log("dispersionParameter:", fit.dispersionParameter);

// Now run all 4 HC types and compare
console.log("\n=== All HC types ===");
for (const type of ["HC0", "HC1", "HC2", "HC3"] as const) {
  const result = vcovCL({ result: fit, cluster, type, cadjust: true });
  const expected = ref.sandwich_gaussian[`vcov_${type.toLowerCase()}` as keyof typeof ref.sandwich_gaussian] as number[][];

  let maxRelErr = 0;
  for (let i = 0; i < result.matrix.length; i++) {
    for (let j = 0; j < result.matrix[i].length; j++) {
      const relErr = Math.abs(result.matrix[i][j] - expected[i][j]) / Math.max(Math.abs(expected[i][j]), 1e-10);
      maxRelErr = Math.max(maxRelErr, relErr);
    }
  }
  console.log(`${type}: maxRelErr = ${maxRelErr.toFixed(6)}`);
  if (maxRelErr > 0.01) {
    console.log(`  Our [0][0]: ${result.matrix[0][0]}`);
    console.log(`  R's [0][0]: ${expected[0][0]}`);
  }
}

// Check if the reference data itself was generated with a different dataset
// R script used set.seed(42), n=30. But our ref might have n=20?
console.log("\n=== Dataset dimensions ===");
console.log("ref x1 length:", ref.sandwich_gaussian.x1.length);
console.log("ref y length:", ref.sandwich_gaussian.y.length);
console.log("ref cluster length:", ref.sandwich_gaussian.cluster.length);
console.log("ref vcov_hc0 dim:", ref.sandwich_gaussian.vcov_hc0.length, "x", ref.sandwich_gaussian.vcov_hc0[0]?.length);
