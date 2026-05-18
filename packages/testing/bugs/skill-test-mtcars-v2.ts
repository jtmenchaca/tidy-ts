import {
  createDataFrame,
  readCSV,
  stats as s,
  writeCSV,
} from "@tidy-ts/dataframe";
import { z } from "zod";

const mtcarsSchema = z.object({
  model: z.string(),
  mpg: z.number(),
  cyl: z.number(),
  disp: z.number(),
  hp: z.number(),
  drat: z.number(),
  wt: z.number(),
  qsec: z.number(),
  vs: z.number(),
  am: z.number(),
  gear: z.number(),
  carb: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/mtcars.csv",
  mtcarsSchema,
);

df.print("mtcars head");

// --- Task 1: Linear regression mpg ~ wt + hp -------------------------------
const numericDf = df.select("mpg", "wt", "hp");
const model = s.glm({
  formula: "mpg ~ wt + hp",
  family: "gaussian",
  link: "identity",
  data: numericDf,
});

const fit = model.summary();
// For gaussian/identity GLM, R^2 = 1 - residual_deviance / null_deviance.
// (The skill doesn't document an `rSquared` field on summary(); deriving it
// from the documented `null_deviance` / `residual_deviance` keys.)
const rSquared = 1 - fit.residual_deviance / fit.null_deviance;
const n = numericDf.nrows();
const p = fit.coefficients.names.length - 1; // exclude intercept
const adjRSquared = 1 - (1 - rSquared) * (n - 1) / (n - p - 1);

console.log("\n=== Task 1: Linear regression mpg ~ wt + hp ===");
for (let i = 0; i < fit.coefficients.names.length; i++) {
  console.log(
    `  ${fit.coefficients.names[i].padEnd(12)} estimate=${
      s.round(fit.coefficients.estimate[i], 5)
    }  se=${s.round(fit.coefficients.std_error[i], 5)}  t=${
      s.round(fit.coefficients.statistic[i], 4)
    }  p=${fit.coefficients.p_value[i].toExponential(3)}`,
  );
}
console.log(`  R-squared      = ${s.round(rSquared, 4)}`);
console.log(`  Adj R-squared  = ${s.round(adjRSquared, 4)}`);

// --- Task 2: Group by cyl, mean/median/count of mpg ------------------------
const byCyl = df
  .groupBy("cyl")
  .summarize({
    mean_mpg: (g) => s.round(s.mean(g.mpg), 3),
    median_mpg: (g) => s.median(g.mpg),
    n: (g) => g.nrows(),
  })
  .arrange("cyl");

byCyl.print("\nTask 2: mpg by cylinder");

// --- Task 3: Two-sample comparison 4-cyl vs 8-cyl mpg ----------------------
const mpg4 = df.filter((r) => r.cyl === 4).mpg;
const mpg8 = df.filter((r) => r.cyl === 8).mpg;

const cmp = s.compare.twoGroups.centralTendency.toEachOther({
  x: [...mpg4],
  y: [...mpg8],
  parametric: "auto",
});

console.log("\n=== Task 3: 4-cyl vs 8-cyl mpg ===");
console.log("n4 =", mpg4.length, " n8 =", mpg8.length);
console.log("mean4 =", s.round(s.mean(mpg4), 3));
console.log("mean8 =", s.round(s.mean(mpg8), 3));
console.log("comparison result:", JSON.stringify(cmp, null, 2));

// --- Task 4: Top 5 most fuel-efficient cars -> top5-mpg.csv ----------------
const top5 = df.arrange("mpg", "desc").sliceHead(5);
top5.print("\nTask 4: Top 5 by mpg");
await writeCSV(top5, "/Users/jtmenchaca/tidy-ts/top5-mpg.csv");
console.log("Wrote top5-mpg.csv");
