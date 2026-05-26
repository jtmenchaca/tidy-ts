// Test tidy-ts proportion tests against R prop.test reference values
// for Palmer Penguins.
// Q1 = one-sample proportion of males vs 0.5
// Q2 = two-sample proportion (Adelie vs Gentoo males)
import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";

const schema = z.object({
  species: z.string(),
  sex: z.string().nullable(),
});

const raw = await readCSV(CSV_PATH, schema, { naValues: ["", "NA", "."] });

// Drop rows missing sex; narrows sex to non-null
const df = raw.removeNull("sex");
console.log("rows after dropping missing sex:", df.nrows());

// Q1 — one-sample: is proportion of males != 0.5?
const isMaleAll: boolean[] = df.sex.map((v) => v === "MALE");
const q1 = s.test.proportion.oneSample({
  data: isMaleAll,
  hypothesizedProportion: 0.5,
});

console.log("\n=== Q1 tidy-ts one-sample proportion test ===");
console.log(q1);

// Q2 — two-sample: Adelie vs Gentoo proportion of males
const adelie = df.filter((r) => r.species.includes("Adelie"));
const gentoo = df.filter((r) => r.species.includes("Gentoo"));

const isMaleAdelie: boolean[] = adelie.sex.map((v) => v === "MALE");
const isMaleGentoo: boolean[] = gentoo.sex.map((v) => v === "MALE");

console.log("Adelie n =", adelie.nrows(), "Gentoo n =", gentoo.nrows());

const q2 = s.test.proportion.twoSample({
  data1: isMaleAdelie,
  data2: isMaleGentoo,
});

console.log("\n=== Q2 tidy-ts two-sample proportion test ===");
console.log(q2);

// =================================================================
// Reference values from R prop.test() (see /tmp/q1_ref.R)
// =================================================================

interface R {
  chi2: number;
  df: number;
  pValue: number;
  ciLower: number;
  ciUpper: number;
  estimate1: number;
  estimate2?: number;
}

const R_Q1_NO_CORRECTION: R = {
  chi2: 0.0270270270,
  df: 1,
  pValue: 0.8694170607,
  ciLower: 0.4510596936,
  ciUpper: 0.5578465735,
  estimate1: 0.5045045045,
};

const R_Q1_YATES: R = {
  chi2: 0.0120120120,
  df: 1,
  pValue: 0.9127271461,
  ciLower: 0.4495741256,
  ciUpper: 0.5593292851,
  estimate1: 0.5045045045,
};

const R_Q2_NO_CORRECTION: R = {
  chi2: 0.0416733288,
  df: 1,
  pValue: 0.8382437349,
  ciLower: -0.1336133187,
  ciUpper: 0.1084032347,
  estimate1: 0.5000000000,
  estimate2: 0.5126050420,
};

const R_Q2_YATES: R = {
  chi2: 0.0065013295,
  df: 1,
  pValue: 0.9357355534,
  ciLower: -0.1412396569,
  ciUpper: 0.1160295729,
  estimate1: 0.5000000000,
  estimate2: 0.5126050420,
};

const TOL = 1e-6;

type Row = {
  test: string;
  rVariant: string;
  field: string;
  tidy: number | string;
  r: number;
  absDiff: number | string;
  pass: string;
};

const results: Row[] = [];

function recordRow(
  test: string,
  rVariant: string,
  field: string,
  tidy: number | null | undefined,
  r: number,
): void {
  if (tidy === null || tidy === undefined || Number.isNaN(tidy)) {
    results.push({
      test,
      rVariant,
      field,
      tidy: String(tidy),
      r,
      absDiff: "n/a",
      pass: "FAIL (missing)",
    });
    return;
  }
  const diff = Math.abs(tidy - r);
  results.push({
    test,
    rVariant,
    field,
    tidy,
    r,
    absDiff: diff,
    pass: diff <= TOL ? "PASS" : "FAIL",
  });
}

// ---- Q1 extract values from tidy-ts result ----
// Universal shape: testStatistic.value, pValue, alpha, plus per-test fields.
// One-sample proportion likely exposes degreesOfFreedom, confidenceInterval,
// and an observed/estimated proportion. We extract defensively.
// deno-lint-ignore no-explicit-any
const q1Any = q1 as any;
const q1_chi = q1Any.testStatistic?.value;
const q1_df = q1Any.degreesOfFreedom ?? q1Any.df;
const q1_p = q1Any.pValue;
const q1_ci_lo = q1Any.confidenceInterval?.lower;
const q1_ci_hi = q1Any.confidenceInterval?.upper;
const q1_est = q1Any.observedProportion ?? q1Any.proportion ??
  q1Any.sampleProportion ?? q1Any.estimate;

console.log("\nQ1 extracted:", {
  chi2: q1_chi,
  df: q1_df,
  p: q1_p,
  ci_lo: q1_ci_lo,
  ci_hi: q1_ci_hi,
  est: q1_est,
});

// Compare to BOTH R variants
for (
  const [variant, ref] of [
    ["correct=FALSE", R_Q1_NO_CORRECTION] as const,
    ["correct=TRUE", R_Q1_YATES] as const,
  ]
) {
  recordRow("Q1 one-sample", variant, "chi2", q1_chi, ref.chi2);
  recordRow("Q1 one-sample", variant, "df", q1_df, ref.df);
  recordRow("Q1 one-sample", variant, "pValue", q1_p, ref.pValue);
  recordRow("Q1 one-sample", variant, "ci_lower", q1_ci_lo, ref.ciLower);
  recordRow("Q1 one-sample", variant, "ci_upper", q1_ci_hi, ref.ciUpper);
  recordRow("Q1 one-sample", variant, "estimate", q1_est, ref.estimate1);
}

// ---- Q2 extract values ----
// deno-lint-ignore no-explicit-any
const q2Any = q2 as any;
const q2_chi = q2Any.testStatistic?.value;
const q2_df = q2Any.degreesOfFreedom ?? q2Any.df;
const q2_p = q2Any.pValue;
const q2_ci_lo = q2Any.confidenceInterval?.lower;
const q2_ci_hi = q2Any.confidenceInterval?.upper;
const q2_prop1 = q2Any.proportion1 ?? q2Any.observedProportion1 ??
  q2Any.estimate1 ?? q2Any.p1;
const q2_prop2 = q2Any.proportion2 ?? q2Any.observedProportion2 ??
  q2Any.estimate2 ?? q2Any.p2;

console.log("\nQ2 extracted:", {
  chi2: q2_chi,
  df: q2_df,
  p: q2_p,
  ci_lo: q2_ci_lo,
  ci_hi: q2_ci_hi,
  prop1: q2_prop1,
  prop2: q2_prop2,
});

for (
  const [variant, ref] of [
    ["correct=FALSE", R_Q2_NO_CORRECTION] as const,
    ["correct=TRUE", R_Q2_YATES] as const,
  ]
) {
  recordRow("Q2 two-sample", variant, "chi2", q2_chi, ref.chi2);
  recordRow("Q2 two-sample", variant, "df", q2_df, ref.df);
  recordRow("Q2 two-sample", variant, "pValue", q2_p, ref.pValue);
  recordRow("Q2 two-sample", variant, "ci_lower", q2_ci_lo, ref.ciLower);
  recordRow("Q2 two-sample", variant, "ci_upper", q2_ci_hi, ref.ciUpper);
  recordRow("Q2 two-sample", variant, "prop1", q2_prop1, ref.estimate1);
  if (ref.estimate2 !== undefined) {
    recordRow("Q2 two-sample", variant, "prop2", q2_prop2, ref.estimate2);
  }
}

// ---- print pass/fail table ----
console.log("\n=== Pass/fail table (tolerance 1e-6) ===");
console.table(results);

// Summary count by R variant
const byVariant = new Map<string, { pass: number; fail: number }>();
for (const row of results) {
  const v = `${row.test} ${row.rVariant}`;
  const cur = byVariant.get(v) ?? { pass: 0, fail: 0 };
  if (row.pass === "PASS") cur.pass++;
  else cur.fail++;
  byVariant.set(v, cur);
}
console.log("\n=== Summary by variant ===");
for (const [k, v] of byVariant) {
  console.log(`${k}: ${v.pass} pass / ${v.fail} fail`);
}
