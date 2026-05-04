import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "@tidy-ts/dataframe";

const mtcars = {
  mpg: [21,21,22.8,21.4,18.7,18.1,14.3,24.4,22.8,19.2,17.8,16.4,17.3,15.2,10.4,10.4,14.7,32.4,30.4,33.9,21.5,15.5,15.2,13.3,19.2,27.3,26,30.4,15.8,19.7,15,21.4],
  wt: [2.62,2.875,2.32,3.215,3.44,3.46,3.57,3.19,3.15,3.44,3.44,4.07,3.73,3.78,5.25,5.424,5.345,2.2,1.615,1.835,2.465,3.52,3.435,3.84,3.845,1.935,2.14,1.513,3.17,2.77,3.57,2.78],
  hp: [110,110,93,110,175,105,245,62,95,123,123,180,180,180,205,215,230,66,52,65,97,150,150,245,175,66,91,113,264,175,335,109],
  carb: [4,4,1,1,2,1,4,2,2,4,4,3,3,3,4,4,4,1,2,1,1,2,2,4,2,1,2,2,4,6,8,2],
  vs: [0,0,1,1,0,1,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,1,0,0,0,1],
};

console.log("=== POISSON: carb ~ wt + hp ===");
{
  const df = createDataFrame({ columns: { carb: mtcars.carb, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "carb ~ wt + hp", family: "poisson", link: "log", data: df });

  console.log("\nTS coefficients (full precision):");
  fit.coefficients.forEach((c: number, i: number) => console.log(`  coef[${i}] = ${c}`));
  console.log("\nTS std_errors (full precision):");
  fit.std_errors.forEach((s: number, i: number) => console.log(`  SE[${i}]   = ${s}`));

  const z = 1.959963984540054;

  // R reference (full precision from confint.default)
  const R_lower = [-0.642582532548310, -0.252218203732839, 0.002264773541931];
  const R_upper = [0.920159114961649, 0.261182075253633, 0.008709706955451];

  console.log("\nImplied R coefficients and SE (from CI midpoint and half-width):");
  for (let i = 0; i < 3; i++) {
    const impliedCoef = (R_upper[i] + R_lower[i]) / 2;
    const impliedSE = (R_upper[i] - R_lower[i]) / (2 * z);
    const tsLower = fit.coefficients[i] - z * fit.std_errors[i];
    const tsUpper = fit.coefficients[i] + z * fit.std_errors[i];
    console.log(`  [${i}] implied R coef = ${impliedCoef.toPrecision(16)}`);
    console.log(`  [${i}] TS coef        = ${fit.coefficients[i].toPrecision(16)}`);
    console.log(`  [${i}] coef diff      = ${(fit.coefficients[i] - impliedCoef).toExponential(6)}`);
    console.log(`  [${i}] implied R SE   = ${impliedSE.toPrecision(16)}`);
    console.log(`  [${i}] TS SE          = ${fit.std_errors[i].toPrecision(16)}`);
    console.log(`  [${i}] SE diff        = ${(fit.std_errors[i] - impliedSE).toExponential(6)}`);
    console.log(`  [${i}] TS lower       = ${tsLower.toPrecision(16)}`);
    console.log(`  [${i}] R lower        = ${R_lower[i].toPrecision(16)}`);
    console.log(`  [${i}] lower diff     = ${(tsLower - R_lower[i]).toExponential(6)}`);
    console.log(`  [${i}] TS upper       = ${tsUpper.toPrecision(16)}`);
    console.log(`  [${i}] R upper        = ${R_upper[i].toPrecision(16)}`);
    console.log(`  [${i}] upper diff     = ${(tsUpper - R_upper[i]).toExponential(6)}`);
    console.log();
  }
}

console.log("\n\n=== QUASIBINOMIAL: vs ~ mpg + wt ===");
{
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "quasibinomial", link: "logit", data: df });

  console.log("\nTS coefficients (full precision):");
  fit.coefficients.forEach((c: number, i: number) => console.log(`  coef[${i}] = ${c}`));
  console.log("\nTS std_errors (full precision):");
  fit.std_errors.forEach((s: number, i: number) => console.log(`  SE[${i}]   = ${s}`));
  console.log(`\nTS dispersion: ${fit.dispersion_parameter}`);

  const z = 1.959963984540054;

  const R_lower = [-28.366988308351949, 0.037256674138801, -1.631290163785222];
  const R_upper = [3.284544622636441, 1.010871301722072, 2.797009748656858];

  console.log("\nImplied R coefficients and SE (from CI midpoint and half-width):");
  for (let i = 0; i < 3; i++) {
    const impliedCoef = (R_upper[i] + R_lower[i]) / 2;
    const impliedSE = (R_upper[i] - R_lower[i]) / (2 * z);
    const tsLower = fit.coefficients[i] - z * fit.std_errors[i];
    const tsUpper = fit.coefficients[i] + z * fit.std_errors[i];
    console.log(`  [${i}] implied R coef = ${impliedCoef.toPrecision(16)}`);
    console.log(`  [${i}] TS coef        = ${fit.coefficients[i].toPrecision(16)}`);
    console.log(`  [${i}] coef diff      = ${(fit.coefficients[i] - impliedCoef).toExponential(6)}`);
    console.log(`  [${i}] implied R SE   = ${impliedSE.toPrecision(16)}`);
    console.log(`  [${i}] TS SE          = ${fit.std_errors[i].toPrecision(16)}`);
    console.log(`  [${i}] SE diff        = ${(fit.std_errors[i] - impliedSE).toExponential(6)}`);
    console.log(`  [${i}] TS lower       = ${tsLower.toPrecision(16)}`);
    console.log(`  [${i}] R lower        = ${R_lower[i].toPrecision(16)}`);
    console.log(`  [${i}] lower diff     = ${(tsLower - R_lower[i]).toExponential(6)}`);
    console.log(`  [${i}] TS upper       = ${tsUpper.toPrecision(16)}`);
    console.log(`  [${i}] R upper        = ${R_upper[i].toPrecision(16)}`);
    console.log(`  [${i}] upper diff     = ${(tsUpper - R_upper[i]).toExponential(6)}`);
    console.log();
  }
}
