// Normality tests on Palmer Penguins, validated against R.
//
// Columns: flipperLengthMm, bodyMassG, culmenLengthMm (nulls dropped).
// Tests: Shapiro-Wilk, Anderson-Darling, Kolmogorov-Smirnov (vs theoretical
// normal with sample mean/sd).
//
// Reference values come from R 4.6.0:
//   - shapiro.test (base R)
//   - nortest::ad.test
//   - ks.test(x, "pnorm", mean(x), sd(x))
//
// Skill limitation: `s.test.normality.*` exposes only
// `kolmogorovSmirnovUniform` (vs uniform) and `kolmogorovSmirnovTwoSample`.
// There is no documented one-sample KS-vs-normal API. We therefore compute
// the KS D statistic manually from `s.dist.normal.probability`, and report
// that path here.

import { createDataFrame, readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
  culmenLengthMm: z.number().nullable(),
});

const path = "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";
const df = await readCSV(path, schema, { naValues: ["NA", ""] });

type ColName = "flipperLengthMm" | "bodyMassG" | "culmenLengthMm";
const cols: ColName[] = ["flipperLengthMm", "bodyMassG", "culmenLengthMm"];

// R reference values (Rscript output) — keep verbatim for diffing.
const rRef: Record<ColName, {
  n: number;
  sw: { W: number; p: number };
  ad: { A2: number; p: number };
  ks: { D: number; p: number };
}> = {
  flipperLengthMm: {
    n: 342,
    sw: { W: 0.9515450636, p: 3.540135628e-9 },
    ad: { A2: 6.4394745993, p: 7.889025688e-16 },
    ks: { D: 0.1242787840, p: 5.163139341e-5 },
  },
  bodyMassG: {
    n: 342,
    sw: { W: 0.9592111770, p: 3.679038716e-8 },
    ad: { A2: 4.5430392879, p: 2.75698516e-11 },
    ks: { D: 0.1040842423, p: 0.001210179011 },
  },
  culmenLengthMm: {
    n: 342,
    sw: { W: 0.9748548094, p: 1.119729801e-5 },
    ad: { A2: 3.0204613419, p: 1.350233644e-7 },
    ks: { D: 0.0698030845, p: 0.07138495161 },
  },
};

// One-sample KS D statistic against N(mean, sd), computed from sample-derived
// parameters. Built from `s.dist.normal.probability` (CDF) because the skill
// does not expose a one-sample KS-vs-normal test directly. p-value uses the
// asymptotic Kolmogorov distribution K(sqrt(n) * D) — same approximation R
// reports via `ks.test`.
function oneSampleKsNormal(data: readonly number[]) {
  const n = data.length;
  const mean = s.mean(data, { removeNull: true });
  const sd = s.stdev(data, { removeNull: true });
  const sorted = [...data].sort((a, b) => a - b);
  let dStat = 0;
  for (let i = 0; i < n; i++) {
    const fx = s.dist.normal.probability({
      at: sorted[i],
      mean,
      standardDeviation: sd,
    });
    const upper = (i + 1) / n;
    const lower = i / n;
    const d1 = Math.abs(upper - fx);
    const d2 = Math.abs(fx - lower);
    if (d1 > dStat) dStat = d1;
    if (d2 > dStat) dStat = d2;
  }
  // Asymptotic Kolmogorov distribution survival function at sqrt(n) * D.
  const lambda = Math.sqrt(n) * dStat;
  let p = 0;
  for (let k = 1; k <= 200; k++) {
    p += Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
  }
  p = 2 * p;
  if (p < 0) p = 0;
  if (p > 1) p = 1;
  return { D: dStat, pValue: p };
}

type Row = {
  column: string;
  test: string;
  metric: string;
  tidyTs: number;
  r: number;
  absDiff: number;
  tol: number;
  pass: boolean;
};

const rows: Row[] = [];

for (const col of cols) {
  const clean = df.removeNull(col);
  const data: readonly number[] = clean[col];

  // Shapiro-Wilk
  const sw = s.test.normality.shapiroWilk({ data });
  // Anderson-Darling
  const ad = s.test.normality.andersonDarling({ data });
  // KS vs theoretical normal (manual; skill exposes only uniform / two-sample)
  const ks = oneSampleKsNormal(data);

  const ref = rRef[col];

  // Tolerances: 1e-6 for statistics, 1e-4 for p-values per task spec.
  const checks: Array<[string, string, number, number, number]> = [
    ["Shapiro-Wilk", "W",    sw.testStatistic.value, ref.sw.W, 1e-6],
    ["Shapiro-Wilk", "p",    sw.pValue,              ref.sw.p, 1e-4],
    ["Anderson-Darling", "A2", ad.testStatistic.value, ref.ad.A2, 1e-6],
    ["Anderson-Darling", "p",  ad.pValue,              ref.ad.p,  1e-4],
    ["Kolmogorov-Smirnov", "D", ks.D,      ref.ks.D, 1e-6],
    ["Kolmogorov-Smirnov", "p", ks.pValue, ref.ks.p, 1e-4],
  ];

  for (const [test, metric, tidyTs, rVal, tol] of checks) {
    const diff = Math.abs(tidyTs - rVal);
    rows.push({
      column: col,
      test,
      metric,
      tidyTs,
      r: rVal,
      absDiff: diff,
      tol,
      pass: diff <= tol,
    });
  }
}

const table = createDataFrame(rows);

console.log("=== Normality tests: tidy-ts vs R ===\n");
table
  .mutate({
    tidyTs: (r) => Number(r.tidyTs.toPrecision(8)),
    r: (r) => Number(r.r.toPrecision(8)),
    absDiff: (r) => Number(r.absDiff.toPrecision(4)),
    pass: (r) => (r.pass ? "PASS" : "FAIL"),
  })
  .print();

const failed = rows.filter((r) => !r.pass);
console.log(`\n${rows.length - failed.length}/${rows.length} checks passed.`);

if (failed.length > 0) {
  console.log("\n--- Failures (verbatim) ---");
  for (const f of failed) {
    console.log(
      `${f.column} / ${f.test} / ${f.metric}: ` +
        `tidy-ts=${f.tidyTs}  R=${f.r}  |diff|=${f.absDiff}  tol=${f.tol}`,
    );
  }
}
