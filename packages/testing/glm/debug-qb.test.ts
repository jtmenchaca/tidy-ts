#!/usr/bin/env -S deno test --allow-all
import {
  callRobustR,
  callRobustRust,
  generateRegressionTestCase,
  setTestSeed,
} from "./regression-interface.ts";

Deno.test("debug quasibinomial", async () => {
  setTestSeed(42);
  const params = generateRegressionTestCase("glm.quasibinomial", 30);
  console.log("Formula:", params.data?.formula);

  let rResult, rustResult;
  try {
    rResult = await callRobustR(params);
    console.log("R coefficients:", rResult.coefficients);
    console.log("R conf_lower:", rResult.conf_lower);
    console.log("R conf_upper:", rResult.conf_upper);
    console.log("R deviance:", rResult.deviance);
    console.log("R aic:", rResult.aic);
  } catch (e) {
    console.error("R error:", e);
  }

  try {
    rustResult = await callRobustRust(params);
    console.log("Rust coefficients:", rustResult.coefficients);
    console.log("Rust conf_lower:", rustResult.conf_lower);
    console.log("Rust conf_upper:", rustResult.conf_upper);
    console.log("Rust deviance:", rustResult.deviance);
    console.log("Rust aic:", rustResult.aic);
  } catch (e) {
    console.error("Rust error:", e);
  }
});
