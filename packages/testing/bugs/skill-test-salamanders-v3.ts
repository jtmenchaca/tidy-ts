// Skill test: Salamanders dataset analysis using tidy-ts.
// Loads site-level counts, fits a Poisson GLM, computes per-(mined, spp)
// means, runs a two-sample test for the species with the most data,
// and writes the top 20 rows by count.

import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

// 1. Define schema matching CSV headers exactly.
const schema = z.object({
  site: z.string(),
  mined: z.string(), // "yes" / "no"
  cover: z.number(),
  sample: z.number(),
  DOP: z.number(),
  Wtemp: z.number(),
  DOY: z.number(),
  spp: z.string(),
  count: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/Salamanders.csv",
  schema,
);

console.log("Loaded rows:", df.nrows());
df.sliceHead(3).print("First 3 rows:");

// ----------------------------------------------------------------------
// Task 1 & 2: Poisson GLM count ~ cover + DOP + Wtemp + DOY
// Counts are non-negative integers -> poisson with log link.
// GLM requires numeric columns, so we don't include mined/spp here.
// ----------------------------------------------------------------------

// Note: `count` collides with DataFrame's `count()` verb when accessed via
// proxy column lookup. Rename to `y` before fitting.
const numericDf = df
  .select("count", "cover", "DOP", "Wtemp", "DOY")
  .rename({ count: "y" });

const model = s.glm({
  formula: "y ~ cover + DOP + Wtemp + DOY",
  family: "poisson",
  link: "log",
  data: numericDf,
});

const summary = model.summary();

console.log("\n=== GLM SUMMARY (Poisson, log link) ===");
console.log("n_observations:", summary.n_observations);
console.log(
  "r_squared (deviance pseudo-R^2):",
  summary.r_squared,
);
console.log("adjusted_r_squared:", summary.adjusted_r_squared);
console.log("f_statistic:", summary.f_statistic);
console.log("f_p_value:", summary.f_p_value);
console.log("null_deviance:", summary.null_deviance);
console.log("residual_deviance:", summary.residual_deviance);
console.log("aic:", summary.aic);

console.log("\nCoefficients:");
const coef = summary.coefficients;
for (let i = 0; i < coef.names.length; i++) {
  console.log(
    `  ${coef.names[i].padEnd(12)} estimate=${
      coef.estimate[i].toFixed(5)
    }  se=${coef.std_error[i].toFixed(5)}  z=${
      coef.statistic[i].toFixed(3)
    }  p=${coef.p_value[i].toExponential(3)}`,
  );
}

// ----------------------------------------------------------------------
// Task 3: average count per (mined, spp)
// ----------------------------------------------------------------------

const meanByGroup = df
  .groupBy("mined", "spp")
  .summarize({
    n: (g) => g.nrows(),
    mean_count: (g) => s.round(s.mean(g.count), 4),
  })
  .arrange("spp");

meanByGroup.print("\nAverage count by mined + species:");

// ----------------------------------------------------------------------
// Task 4: for the species with the most observations, two-sample test
// comparing mined yes vs no.
// ----------------------------------------------------------------------

const perSpecies = df
  .groupBy("spp")
  .summarize({ count: (g) => g.nrows() })
  .arrange("count", "desc");

perSpecies.print("\nObservations per species:");

const topSpp = perSpecies.extractHead("spp", 1);
console.log("Top species (most data):", topSpp);

const sppDf = df.filter((r) => r.spp === topSpp);
// Note: direct `df.count` would resolve to the `count()` verb (collision),
// so use `.extract("count")` for the top-level column access.
const mined = sppDf.filter((r) => r.mined === "yes").extract("count");
const unmined = sppDf.filter((r) => r.mined === "no").extract("count");

console.log(`n mined=${mined.length}, n unmined=${unmined.length}`);

// Counts are integer / overdispersed -> nonparametric Mann-Whitney is
// the safer two-sample test. Report it.
const mw = s.test.nonparametric.mannWhitney({ x: mined, y: unmined });
console.log("\nMann-Whitney U test (mined vs unmined) for top species:");
console.log("  testStatistic:", mw.testStatistic);
console.log("  pValue:", mw.pValue);
console.log("  alpha:", mw.alpha);
console.log(
  "  significant?",
  mw.pValue < (mw.alpha ?? 0.05),
);

// Also a Welch's t-test for comparison (since the user asked for "a"
// two-sample test).
const tt = s.test.t.independent({ x: mined, y: unmined, equalVar: false });
console.log("\nWelch's t-test (mined vs unmined) for top species:");
console.log("  testStatistic:", tt.testStatistic);
console.log("  pValue:", tt.pValue);
console.log("  alpha:", tt.alpha);
console.log(
  "  significant?",
  tt.pValue < (tt.alpha ?? 0.05),
);

// ----------------------------------------------------------------------
// Task 5: top 20 rows by count, descending, to CSV.
// ----------------------------------------------------------------------

const top20 = df.arrange("count", "desc").sliceHead(20);
top20.print("\nTop 20 rows by count:");

await writeCSV(
  top20,
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/top20-counts.csv",
);
console.log("\nWrote top20-counts.csv");
