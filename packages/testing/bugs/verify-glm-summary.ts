import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  mpg: z.number(),
  cyl: z.number(),
  wt: z.number(),
  hp: z.number(),
});

const cars = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/mtcars.csv",
  schema,
);

const model = s.glm({
  formula: "mpg ~ wt + hp",
  family: "gaussian",
  link: "identity",
  data: cars,
});

const summary = model.summary();
console.log("R²:                      ", summary.r_squared);
console.log("Adj R²:                  ", summary.adjusted_r_squared);
console.log("F statistic:             ", summary.f_statistic);
console.log("F p-value:               ", summary.f_p_value);
console.log("Residual std error:      ", summary.residual_standard_error);
console.log("n observations:          ", summary.n_observations);
console.log("Null deviance / df:      ", summary.null_deviance, "/", summary.df_null);
console.log("Residual deviance / df:  ", summary.residual_deviance, "/", summary.df_residual);
console.log("AIC:                     ", summary.aic);

const carsBin = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/mtcars.csv",
  z.object({ vs: z.number(), mpg: z.number(), wt: z.number() }),
);
const logistic = s.glm({
  formula: "vs ~ mpg + wt",
  family: "binomial",
  link: "logit",
  data: carsBin,
});
const logSum = logistic.summary();
console.log("\n[binomial] R²:           ", logSum.r_squared);
console.log("[binomial] Adj R²:       ", logSum.adjusted_r_squared);
console.log("[binomial] n:            ", logSum.n_observations);
