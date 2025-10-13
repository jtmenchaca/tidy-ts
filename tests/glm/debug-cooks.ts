import { createDataFrame } from "../../src/mod.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";

const data = createDataFrame([
  { y: 0, x: 1 },
  { y: 1, x: 2 },
  { y: 0, x: 1.5 },
  { y: 1, x: 2.5 },
  { y: 1, x: 3 },
]);

const model = glm({
  formula: "y ~ x",
  family: "binomial",
  link: "logit",
  data,
});

console.log("Fields on model:");
console.log(Object.keys(model).sort());

console.log("\nFields on model.result:");
console.log(Object.keys(model.result).sort());

console.log("\nDispersion:", model.result.dispersion_parameter);
console.log("Pearson residuals:", model.result.pearson_residuals);
console.log("Hat values:", model.result.leverage);

const influence = model.influence();
console.log("\nCook's D from influence():", influence.cooks_distance);

// Manual calculation to debug
const disp = 1.0; // binomial uses 1.0
const p = 2;
console.log("\nManual Cook's D calculation:");
for (let i = 0; i < 5; i++) {
  const pres = model.result.pearson_residuals[i];
  const h = model.result.leverage[i];
  const omh = 1 - h;
  const cook = (pres / omh) ** 2 * h / (disp * p);
  console.log(
    `  [${i}]: pres=${pres.toExponential(3)}, h=${h.toExponential(3)}, omh=${
      omh.toExponential(3)
    }, cook=${cook.toExponential(3)}`,
  );
}

// R comparison
console.log("\nR Cook's D for this data: [3.046, 0.330, 0.282, 0.149, 0.328]");
console.log("R Pearson residuals: [-1.243, 1.002, 1.248, -0.643, -0.516]");
