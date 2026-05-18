/**
 * Skill-driven test using the Owls.csv fixture.
 *
 * Performs three different tidy-ts operations:
 *   A) Two-way summary with reshape (pivotWider)
 *   B) One-way ANOVA + Tukey post-hoc across top 4 nests
 *   C) Welch t-test: Deprived vs Satiated
 */
import { z } from "zod";
import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { dirname, fileURLToPath, resolve } from "@tidy-ts/shims";

// Resolve fixture path relative to this file so cwd doesn't matter.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const csvPath = resolve(__dirname, "..", "fixtures", "Owls.csv");

const OwlSchema = z.object({
  Nest: z.string(),
  FoodTreatment: z.string(),
  SexParent: z.string(),
  ArrivalTime: z.number(),
  SiblingNegotiation: z.number(),
  BroodSize: z.number(),
  NegPerChick: z.number(),
  logBroodSize: z.number(),
});

const owls = await readCSV(csvPath, OwlSchema);

console.log("Loaded Owls fixture:", owls.nrows(), "rows");
console.log();

// ---------------------------------------------------------------------------
// Operation A — Two-way summary by FoodTreatment × SexParent, then pivotWider
// ---------------------------------------------------------------------------
console.log("=== Operation A: Two-way summary + pivotWider ===");

const twoWay = owls
  .groupBy("FoodTreatment", "SexParent")
  .summarize({
    mean_NegPerChick: (g) => s.round(s.mean(g.NegPerChick), 2),
    mean_ArrivalTime: (g) => s.round(s.mean(g.ArrivalTime), 2),
    n: (g) => g.nrows(),
  });

twoWay.print();

const wideByNeg = twoWay
  .select("FoodTreatment", "SexParent", "mean_NegPerChick")
  .pivotWider({
    namesFrom: "SexParent",
    valuesFrom: "mean_NegPerChick",
    expectedColumns: ["Male", "Female"],
  });

console.log();
console.log("Wide format (mean NegPerChick, Male/Female columns):");
wideByNeg.print();
console.log();

// ---------------------------------------------------------------------------
// Operation B — One-way ANOVA + post-hoc on top 4 nests by mean NegPerChick
// ---------------------------------------------------------------------------
console.log("=== Operation B: One-way ANOVA + Tukey post-hoc (top 4 nests) ===");

const nestMeans = owls
  .groupBy("Nest")
  .summarize({
    mean_NegPerChick: (g) => s.mean(g.NegPerChick),
    n: (g) => g.nrows(),
  })
  .arrange("mean_NegPerChick", "desc");

const topNests = nestMeans.sliceHead(4).Nest;
console.log("Top 4 nests by mean NegPerChick:", topNests);

// Direct column access works — stats tests accept readonly arrays.
const nestArrays = topNests.map(
  (nest) => owls.filter((r) => r.Nest === nest).NegPerChick,
);

const anova = s.test.anova.oneWay(nestArrays);
console.log("ANOVA results:");
console.log("  F           =", anova.testStatistic.value);
console.log("  p-value     =", anova.pValue);
console.log("  dfBetween   =", anova.dfBetween);
console.log("  dfWithin    =", anova.dfWithin);
console.log("  alpha       =", anova.alpha);
console.log("  significant?", anova.pValue < (anova.alpha ?? 0.05));

if (anova.pValue < (anova.alpha ?? 0.05)) {
  const tukey = s.compare.postHoc.tukey(nestArrays);
  console.log();
  console.log("Tukey HSD pairwise comparisons:");
  console.log(tukey);
}
console.log();

// ---------------------------------------------------------------------------
// Operation C — Welch t-test: Deprived vs Satiated on NegPerChick
// ---------------------------------------------------------------------------
console.log("=== Operation C: Welch t-test, Deprived vs Satiated ===");

const deprived = owls.filter((r) => r.FoodTreatment === "Deprived").NegPerChick;
const satiated = owls.filter((r) => r.FoodTreatment === "Satiated").NegPerChick;

console.log("Sample sizes:");
console.log("  Deprived n =", deprived.length);
console.log("  Satiated n =", satiated.length);

const welch = s.test.t.independent({
  x: deprived,
  y: satiated,
  equalVar: false,
});

console.log("  test statistic =", welch.testStatistic.value);
console.log("  p-value        =", welch.pValue);
console.log("  effect size    =", welch.effectSize.value);
console.log("  significant?   ", welch.pValue < (welch.alpha ?? 0.05));
