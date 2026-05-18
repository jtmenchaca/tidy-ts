import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const path =
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/sandwich/PetersenCL.csv";

const schema = z.object({
  firm: z.number(),
  year: z.number(),
  x: z.number(),
  y: z.number(),
});

const df = await readCSV(path, schema);

// 1. Counts
const nRows = df.nrows();
const nFirms = s.uniqueCount(df.firm);
const nYears = s.uniqueCount(df.year);
const yearsCovered = s.unique(df.year);
console.log("Task 1 — counts");
console.log(`  rows:   ${nRows}`);
console.log(`  firms:  ${nFirms}`);
console.log(`  years:  ${nYears}`);
console.log(`  year range: ${s.min(yearsCovered)} – ${s.max(yearsCovered)}`);

// 2. Per-firm sorted by year, add y_lag1 (first row per firm undefined)
const withLag = df
  .arrange("firm")
  .groupBy("firm")
  .mutateOverGroup({
    y_lag1: (g) => s.lag(g.extract("y")),
  })
  .ungroup();

console.log("\nTask 2 — y_lag1 for firm 1 (all 10 years)");
withLag.filter((r) => r.firm === 1).arrange("year").print();

// 3. Year-over-year change in y, excluding first observation per firm
const changes = withLag
  .mutate({
    dy: (r) => r.y_lag1 === undefined ? null : r.y - r.y_lag1,
  })
  .removeNull("dy");

const meanChange = s.mean(changes.dy);
const sdChange = s.stdev(changes.dy);
console.log("\nTask 3 — year-over-year change in y");
console.log(`  n changes:    ${changes.nrows()}`);
console.log(`  mean:         ${s.round(meanChange, 6)}`);
console.log(`  sd:           ${s.round(sdChange, 6)}`);

// 4. Regression y ~ x
const model = s.glm({
  formula: "y ~ x",
  family: "gaussian",
  link: "identity",
  data: df,
});
const summary = model.summary();
console.log("\nTask 4 — OLS regression y ~ x");
console.log("  coefficients:");
for (let i = 0; i < summary.coefficients.names.length; i++) {
  const name = summary.coefficients.names[i];
  const est = summary.coefficients.estimate[i];
  const se = summary.coefficients.std_error[i];
  const t = summary.coefficients.statistic[i];
  const p = summary.coefficients.p_value[i];
  console.log(
    `    ${name.padEnd(12)} estimate=${s.round(est, 6)}  se=${
      s.round(se, 6)
    }  t=${s.round(t, 4)}  p=${s.round(p, 6)}`,
  );
}
console.log(`  R-squared:        ${s.round(summary.r_squared, 6)}`);
console.log(`  F-statistic:      ${s.round(summary.f_statistic, 4)}`);
console.log(`  F p-value:        ${s.round(summary.f_p_value, 6)}`);

// 5. Top 5 most-observed years
// Note: skill documents `df.count("year")` but that method does not exist on
// DataFrame (TS2339). Falling back to the documented equivalent.
const yearCounts = df
  .groupBy("year")
  .summarize({ count: (g) => g.nrows() })
  .arrange("count", "desc")
  .sliceHead(5);
console.log("\nTask 5 — top 5 most-observed years");
yearCounts.print();
