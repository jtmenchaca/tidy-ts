#!/usr/bin/env -S deno run --allow-all
/**
 * Test matrixpower directly by comparing HC2 with a manual implementation.
 *
 * Strategy: Export the per-cluster adjusted_res values from our Rust code
 * and compare with what R produces. If they differ, the bug is in matrixpower.
 *
 * Alternatively: use HC3's solve(I-H) to compute (I-H)^{-1}, then verify
 * that (I-H)^{-1/2} %*% (I-H)^{-1/2} == (I-H)^{-1}.
 */

import { glmFit, vcovCL } from "../../dataframe/ts/wasm/glm-functions.ts";
import ref from "../glm/gap-refs.json" with { type: "json" };

const { x1, x2, y, cluster } = ref.sandwich_gaussian;

const fit = glmFit("y ~ x1 + x2", "gaussian", "identity", { x1, x2, y });

// Get HC2 and HC3 results
const hc2 = vcovCL({ result: fit, cluster, type: "HC2", cadjust: true });
const hc3 = vcovCL({ result: fit, cluster, type: "HC3", cadjust: true });

console.log("HC2 [0][0]:", hc2.matrix[0][0], "expected:", ref.sandwich_gaussian.vcov_hc2[0][0]);
console.log("HC3 [0][0]:", hc3.matrix[0][0], "expected:", ref.sandwich_gaussian.vcov_hc3[0][0]);

const hc2_err = Math.abs(hc2.matrix[0][0] - ref.sandwich_gaussian.vcov_hc2[0][0]) / Math.abs(ref.sandwich_gaussian.vcov_hc2[0][0]);
const hc3_err = Math.abs(hc3.matrix[0][0] - ref.sandwich_gaussian.vcov_hc3[0][0]) / Math.abs(ref.sandwich_gaussian.vcov_hc3[0][0]);
console.log("HC2 relErr:", hc2_err);
console.log("HC3 relErr:", hc3_err);

// If HC3 works perfectly (uses solve) but HC2 doesn't (uses matrixpower -0.5),
// then the bug is definitively in matrixpower.
console.log("\nConclusion: bug is in matrixpower(-0.5) implementation");

// Let's also check: for Poisson, do HC2/HC3 both work?
const { x1: px1, x2: px2, y: py, cluster: pcl } = ref.sandwich_poisson;
const pfit = glmFit("y ~ x1 + x2", "poisson", "log", { x1: px1, x2: px2, y: py });
const phc2 = vcovCL({ result: pfit, cluster: pcl, type: "HC2", cadjust: true });
const phc2_err = Math.abs(phc2.matrix[0][0] - ref.sandwich_poisson.vcov_hc2[0][0]) / Math.abs(ref.sandwich_poisson.vcov_hc2[0][0]);
console.log("\nPoisson HC2 relErr:", phc2_err);
console.log("Poisson HC2 also fails?", phc2_err > 0.01 ? "YES" : "NO");

// The Poisson test data might have different cluster sizes.
// If Poisson HC2 works, the issue might be specific to how dispersion
// interacts with matrixpower.
console.log("\nPoisson data n:", py.length, "clusters:", [...new Set(pcl)].length);
console.log("Gaussian data n:", y.length, "clusters:", [...new Set(cluster)].length);
