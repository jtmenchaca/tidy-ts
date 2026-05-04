import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "@tidy-ts/dataframe";

const mtcars = {
  mpg: [21,21,22.8,21.4,18.7,18.1,14.3,24.4,22.8,19.2,17.8,16.4,17.3,15.2,10.4,10.4,14.7,32.4,30.4,33.9,21.5,15.5,15.2,13.3,19.2,27.3,26,30.4,15.8,19.7,15,21.4],
  wt: [2.62,2.875,2.32,3.215,3.44,3.46,3.57,3.19,3.15,3.44,3.44,4.07,3.73,3.78,5.25,5.424,5.345,2.2,1.615,1.835,2.465,3.52,3.435,3.84,3.845,1.935,2.14,1.513,3.17,2.77,3.57,2.78],
  hp: [110,110,93,110,175,105,245,62,95,123,123,180,180,180,205,215,230,66,52,65,97,150,150,245,175,66,91,113,264,175,335,109],
  carb: [4,4,1,1,2,1,4,2,2,4,4,3,3,3,4,4,4,1,2,1,1,2,2,4,2,1,2,2,4,6,8,2],
  vs: [0,0,1,1,0,1,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,1,0,0,0,1],
};

console.log("=== POISSON: carb ~ wt + hp — vcov analysis ===\n");
{
  const df = createDataFrame({ columns: { carb: mtcars.carb, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "carb ~ wt + hp", family: "poisson", link: "log", data: df });

  const vcov = fit.vcov();
  console.log("TS vcov matrix:");
  for (let i = 0; i < 3; i++) {
    console.log(`  [${i}]: [${vcov[i].map((v: number) => v.toPrecision(16)).join(", ")}]`);
  }

  console.log("\nTS SE (from sqrt(diag(vcov))):");
  for (let i = 0; i < 3; i++) {
    const se_from_vcov = Math.sqrt(vcov[i][i]);
    console.log(`  SE[${i}] from vcov   = ${se_from_vcov.toPrecision(16)}`);
    console.log(`  SE[${i}] from result = ${fit.std_errors[i].toPrecision(16)}`);
    console.log(`  match? ${Math.abs(se_from_vcov - fit.std_errors[i]) < 1e-15}`);
  }

  console.log("\nTS dispersion:", fit.dispersion_parameter);
  console.log("(For Poisson, dispersion should be fixed at 1.0)");

  // Check: is the SE coming from the Rust side or JS side?
  // The vcov() method likely calls into Rust. Let's see if the SE stored on fit
  // matches sqrt(diag(vcov)).
  console.log("\n--- Compare TS vcov diagonal vs R vcov diagonal ---");
  // Get R vcov from R
  // R: vcov(fit) for poisson carb ~ wt + hp
}

console.log("\n\n=== QUASIBINOMIAL: vs ~ mpg + wt — vcov analysis ===\n");
{
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "quasibinomial", link: "logit", data: df });

  const vcov = fit.vcov();
  console.log("TS vcov matrix:");
  for (let i = 0; i < 3; i++) {
    console.log(`  [${i}]: [${vcov[i].map((v: number) => v.toPrecision(16)).join(", ")}]`);
  }

  console.log("\nTS SE (from sqrt(diag(vcov))):");
  for (let i = 0; i < 3; i++) {
    const se_from_vcov = Math.sqrt(vcov[i][i]);
    console.log(`  SE[${i}] from vcov   = ${se_from_vcov.toPrecision(16)}`);
    console.log(`  SE[${i}] from result = ${fit.std_errors[i].toPrecision(16)}`);
    console.log(`  match? ${Math.abs(se_from_vcov - fit.std_errors[i]) < 1e-15}`);
  }

  console.log("\nTS dispersion:", fit.dispersion_parameter);
}
