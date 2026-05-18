import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

// Task 1: Load file. Use .optional() so NAs become `undefined` (not null),
// producing column types `(number | undefined)[]`.
const schema = z.object({
  company: z.string(),
  sales: z.number().optional(),
  patents: z.number().optional(),
  value: z.number().optional(),
  institutions: z.number().optional(),
  year: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/sandwich/InstInnovation.csv",
  schema,
);

console.log("Loaded rows:", df.nrows());

// Task 2: unique companies + year range
const uniqueCompanies = df.extractUnique("company").length;
const years = df.year;
const minYear = s.min(years);
const maxYear = s.max(years);
console.log("\nTask 2 — Unique companies:", uniqueCompanies);
console.log(`Year range: ${minYear} - ${maxYear}`);

// Task 3: total patents per company, top 10
// patents may be undefined; replace undefined with 0 before summing per group
// Actually s.sum should handle missing if we narrow. Use removeUndefined on patents
// before grouping to drop rows with missing patents, then sum.
const patentTotals = df
  .removeUndefined("patents")
  .groupBy("company")
  .summarize({
    total_patents: (g) => s.sum(g.patents),
  })
  .arrange("total_patents", "desc")
  .sliceHead(10);

patentTotals.print("Task 3 — Top 10 companies by total patents");

// Task 4: for 1995, top 5 companies by value
const top1995 = df
  .filter((r) => r.year === 1995)
  .removeUndefined("value")
  .arrange("value", "desc")
  .sliceHead(5)
  .select("company", "value");

top1995.print("Task 4 — Top 5 companies by value in 1995");

// Task 5: regression value ~ sales + patents, drop rows with any missing.
// Note: removeUndefined didn't narrow the row type when columns come from a
// readCSV `.optional()` schema (it does narrow when columns come from row
// literals via createDataFrame). Drop missings with removeUndefined for the
// runtime guarantee, then use a type-predicate filter to convince TypeScript
// the three predictors are non-undefined so s.glm's
// `DataFrame<Record<string, number>>` constraint is satisfied.
const regData = df
  .removeUndefined("value", "sales", "patents")
  .select("value", "sales", "patents")
  .filter(
    (
      r,
    ): r is { value: number; sales: number; patents: number } =>
      r.value !== undefined && r.sales !== undefined &&
      r.patents !== undefined,
  );
console.log(`\nTask 5 — Rows used for regression: ${regData.nrows()}`);

const model = s.glm({
  formula: "value ~ sales + patents",
  family: "gaussian",
  link: "identity",
  data: regData,
});

const summary = model.summary();
console.log("\nCoefficients:");
const names = summary.coefficients.names;
const ests = summary.coefficients.estimate;
const ps = summary.coefficients.p_value;
for (let i = 0; i < names.length; i++) {
  console.log(
    `  ${names[i]}: estimate=${ests[i]}, p_value=${ps[i]}`,
  );
}
console.log(`R-squared: ${summary.r_squared}`);
console.log(`N observations: ${summary.n_observations}`);
