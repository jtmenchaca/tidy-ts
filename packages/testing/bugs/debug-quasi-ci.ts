import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "@tidy-ts/dataframe";

const mtcars = {
  mpg: [21,21,22.8,21.4,18.7,18.1,14.3,24.4,22.8,19.2,17.8,16.4,17.3,15.2,10.4,10.4,14.7,32.4,30.4,33.9,21.5,15.5,15.2,13.3,19.2,27.3,26,30.4,15.8,19.7,15,21.4],
  wt: [2.62,2.875,2.32,3.215,3.44,3.46,3.57,3.19,3.15,3.44,3.44,4.07,3.73,3.78,5.25,5.424,5.345,2.2,1.615,1.835,2.465,3.52,3.435,3.84,3.845,1.935,2.14,1.513,3.17,2.77,3.57,2.78],
  vs: [0,0,1,1,0,1,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,1,0,0,0,1],
};

// Quasibinomial
const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
const fit = glm({ formula: "vs ~ mpg + wt", family: "quasibinomial", link: "logit", data: df });

// Fitted values (mu) - first 5
console.log("fitted[0..5]:", fit.fitted_values.slice(0, 5).map((v: number) => v.toPrecision(16)));
// R fitted values for quasibinomial vs ~ mpg + wt:
const R_fitted = [0.4977836116741024, 0.5348537973284620, 0.6812519990069849, 0.6335380997946853, 0.3238689048832419];
console.log("R fitted[0..5]:", R_fitted.map(v => v.toPrecision(16)));
console.log("fitted diffs:");
for (let i = 0; i < 5; i++) {
  console.log(`  [${i}] diff: ${(fit.fitted_values[i] - R_fitted[i]).toExponential(6)}`);
}

console.log("\n=== QUASIBINOMIAL ===");
console.log("coef:", fit.coefficients.map((c: number) => c.toPrecision(16)));
console.log("SE:  ", fit.std_errors.map((s: number) => s.toPrecision(16)));
console.log("disp:", fit.dispersion_parameter.toPrecision(16));

// R reference values (full precision)
const R_coef = [-12.5412218428574810, 0.5240639879304358, 0.5828597924358179];
const R_SE = [8.0745190233530076, 0.2483756400893037, 1.1296891043564453];
const R_disp = 0.9096481071;

console.log("\nCoef diffs:");
for (let i = 0; i < 3; i++) {
  console.log(`  coef[${i}] diff: ${(fit.coefficients[i] - R_coef[i]).toExponential(6)}`);
}

console.log("\nSE diffs:");
for (let i = 0; i < 3; i++) {
  console.log(`  SE[${i}] diff: ${(fit.std_errors[i] - R_SE[i]).toExponential(6)}`);
}

console.log(`\nDispersion diff: ${(fit.dispersion_parameter - R_disp).toExponential(6)}`);

// Also check binomial for comparison
const fit2 = glm({ formula: "vs ~ mpg + wt", family: "binomial", link: "logit", data: df });
console.log("\n=== BINOMIAL (for comparison) ===");
const R_SE_binom = [8.4606765601, 0.2602307183, 1.1835910513];
console.log("SE diffs:");
for (let i = 0; i < 3; i++) {
  console.log(`  SE[${i}] diff: ${(fit2.std_errors[i] - R_SE_binom[i]).toExponential(6)}`);
}
