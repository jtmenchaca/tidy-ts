// Run 55 — linear regression with categorical predictors, validated vs R lm()
// Research question: how do species (3 lvl), sex (2 lvl), and flipper length
// jointly predict body mass? Also predict species x sex means at overall mean
// flipper length.
//
// R uses treatment contrasts (Adelie / female reference). We replicate by
// hand-encoding 0/1 indicator columns.

import { createDataFrame, peekCSV, readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";

// Peek first to confirm the structure.
const peek = await peekCSV(CSV_PATH);
console.log("--- peekCSV ---");
console.log(peek);

// Schema: just the columns we need. CSV has NA for missing values.
const schema = z.object({
  species: z.string(),
  flipperLengthMm: z.number().nullable(),
  bodyMassG: z.number().nullable(),
  sex: z.string().nullable(),
});

const raw = await readCSV(CSV_PATH, schema, { naValues: ["NA", ""] });
console.log(`Loaded ${raw.nrows()} rows`);

// Drop rows missing any predictor / outcome and narrow types.
const complete = raw
  .removeNull("bodyMassG", "flipperLengthMm", "sex");

console.log(`Complete cases: ${complete.nrows()}`);

// Normalize categorical labels:
//  - species column is "Adelie Penguin (Pygoscelis adeliae)" etc. — take first word
//  - sex is "MALE"/"FEMALE" — lowercase
const normalized = complete.mutate({
  speciesShort: (r) => r.species.split(" ")[0], // "Adelie" | "Chinstrap" | "Gentoo"
  sexLower: (r) => r.sex.toLowerCase(), // "male" | "female"
});

// Filter rows where sex isn't male/female (just in case).
const cleaned = normalized.filter((r) =>
  r.sexLower === "male" || r.sexLower === "female"
);
console.log(`After sex filter: ${cleaned.nrows()}`);

// R uses alphabetical first level as reference:
//   species: Adelie (ref), dummies for Chinstrap & Gentoo
//   sex: female (ref), dummy for male
// Build numeric indicator columns. Required because s.glm needs numeric cols.
const encoded = cleaned.mutate({
  speciesChinstrap: (r) => r.speciesShort === "Chinstrap" ? 1 : 0,
  speciesGentoo: (r) => r.speciesShort === "Gentoo" ? 1 : 0,
  sexmale: (r) => r.sexLower === "male" ? 1 : 0,
  flipper_length_mm: (r) => r.flipperLengthMm,
  body_mass_g: (r) => r.bodyMassG,
});

// Build a numeric-only DataFrame for the GLM.
const numericRows = encoded.toRows().map((r) => ({
  body_mass_g: r.body_mass_g,
  speciesChinstrap: r.speciesChinstrap,
  speciesGentoo: r.speciesGentoo,
  sexmale: r.sexmale,
  flipper_length_mm: r.flipper_length_mm,
}));

const df = createDataFrame(numericRows);
console.log(`Model DataFrame rows: ${df.nrows()}`);

// Fit gaussian / identity linear model.
const model = s.glm({
  formula:
    "body_mass_g ~ speciesChinstrap + speciesGentoo + sexmale + flipper_length_mm",
  family: "gaussian",
  link: "identity",
  data: df,
});

const summary = model.summary();
console.log("\n--- tidy-ts summary ---");
console.log(JSON.stringify(summary, null, 2));

// Predictions at mean flipper length.
const meanFlipper = s.mean(df.flipper_length_mm) as number;
console.log(`\nmean_flipper (tidy-ts) = ${meanFlipper}`);

// Adelie female: all dummies 0, flipper at mean
const predDfAdelieFemale = createDataFrame([{
  speciesChinstrap: 0,
  speciesGentoo: 0,
  sexmale: 0,
  flipper_length_mm: meanFlipper,
}]);
const predAdelieFemale = model.predict(predDfAdelieFemale, {
  type: "response",
})[0];

// Gentoo male: speciesGentoo=1, sexmale=1
const predDfGentooMale = createDataFrame([{
  speciesChinstrap: 0,
  speciesGentoo: 1,
  sexmale: 1,
  flipper_length_mm: meanFlipper,
}]);
const predGentooMale = model.predict(predDfGentooMale, { type: "response" })[0];

console.log(`pred_Adelie_female (tidy-ts) = ${predAdelieFemale}`);
console.log(`pred_Gentoo_male  (tidy-ts) = ${predGentooMale}`);

// =====================================================================
// R reference values (generated from /tmp/run55-r-reference.R using the
// same CSV and the same complete-case subset).
// =====================================================================

type Triple = { name: string; tidy: number; r: number; tol: number };

const COEF_TOL = 1e-6;
const PVAL_TOL = 1e-6;

// Map of R rownames -> our coefficient name in tidy-ts summary.
// In our model the coef names match the predictor column names; intercept is "(Intercept)".
const rCoef: Record<
  string,
  { est: number; se: number; t: number; p: number }
> = {
  "(Intercept)": {
    est: -365.817449761546,
    se: 532.050312526811,
    t: -0.68756176088725,
    p: 0.492214689790173,
  },
  speciesChinstrap: {
    est: -87.634477918881,
    se: 46.347250352292,
    t: -1.89082366813045,
    p: 0.059529013428341,
  },
  speciesGentoo: {
    est: 836.260008147463,
    se: 85.1854485567479,
    t: 9.81693496149606,
    p: 4.11161363907019e-20,
  },
  sexmale: {
    est: 530.381094486701,
    se: 37.8101047265522,
    t: 14.0274960443111,
    p: 2.41444180629882e-35,
  },
  flipper_length_mm: {
    est: 20.0249154302885,
    se: 2.84576535951539,
    t: 7.0367415793193,
    p: 1.15453940113243e-11,
  },
};

const rModel = {
  r_squared: 0.866888356233088,
  adj_r_squared: 0.865265043504223,
  sigma: 295.564610403752,
  df_residual: 328,
  f_statistic: 534.024246110188,
  f_p_value: 3.3673069621033e-142,
  mean_flipper: 200.966966966967,
  pred_Adelie_female: 3658.52906803354,
  pred_Gentoo_male: 5025.1701706677,
};

// Build comparison rows from the tidy-ts coef table.
const cmp: Triple[] = [];
const co = summary.coefficients;
const tidyByName: Record<
  string,
  { estimate: number; std_error: number; statistic: number; p_value: number }
> = {};
for (let i = 0; i < co.names.length; i++) {
  tidyByName[co.names[i]] = {
    estimate: co.estimate[i],
    std_error: co.std_error[i],
    statistic: co.statistic[i],
    p_value: co.p_value[i],
  };
}

for (const name of Object.keys(rCoef)) {
  const t = tidyByName[name];
  const r = rCoef[name];
  if (!t) {
    cmp.push({ name: `coef:${name} (MISSING)`, tidy: NaN, r: r.est, tol: COEF_TOL });
    continue;
  }
  cmp.push({ name: `coef[${name}].est`, tidy: t.estimate, r: r.est, tol: COEF_TOL });
  cmp.push({ name: `coef[${name}].se`, tidy: t.std_error, r: r.se, tol: COEF_TOL });
  cmp.push({ name: `coef[${name}].t`, tidy: t.statistic, r: r.t, tol: COEF_TOL });
  cmp.push({ name: `coef[${name}].p`, tidy: t.p_value, r: r.p, tol: PVAL_TOL });
}

cmp.push({
  name: "r_squared",
  tidy: summary.r_squared as number,
  r: rModel.r_squared,
  tol: COEF_TOL,
});
cmp.push({
  name: "adj_r_squared",
  tidy: summary.adjusted_r_squared as number,
  r: rModel.adj_r_squared,
  tol: COEF_TOL,
});
cmp.push({
  name: "residual_standard_error",
  tidy: summary.residual_standard_error as number,
  r: rModel.sigma,
  tol: COEF_TOL,
});
cmp.push({
  name: "df_residual",
  tidy: summary.df_residual as number,
  r: rModel.df_residual,
  tol: 0,
});
cmp.push({
  name: "f_statistic",
  tidy: summary.f_statistic as number,
  r: rModel.f_statistic,
  tol: COEF_TOL,
});
cmp.push({
  name: "f_p_value",
  tidy: summary.f_p_value as number,
  r: rModel.f_p_value,
  tol: PVAL_TOL,
});

cmp.push({
  name: "pred_Adelie_female",
  tidy: predAdelieFemale,
  r: rModel.pred_Adelie_female,
  tol: COEF_TOL,
});
cmp.push({
  name: "pred_Gentoo_male",
  tidy: predGentooMale,
  r: rModel.pred_Gentoo_male,
  tol: COEF_TOL,
});

// Pass / fail logic — treat both being effectively 0 at < 1e-12 as a pass for p-values.
function pass(name: string, tidy: number, r: number, tol: number): boolean {
  if (!Number.isFinite(tidy) || !Number.isFinite(r)) return false;
  if (tol === 0) return tidy === r;
  const absDiff = Math.abs(tidy - r);
  // For very small p-values, allow both sides reporting 0 / near-0.
  if (name.endsWith(".p") || name === "f_p_value") {
    if (Math.abs(r) < 1e-12 && Math.abs(tidy) < 1e-12) return true;
    // Use relative tolerance for tiny p-values
    if (Math.abs(r) < 1e-8) {
      const rel = Math.abs(tidy - r) / Math.max(Math.abs(r), Math.abs(tidy));
      return rel < 1e-4 || absDiff < tol;
    }
  }
  // Coefficients with large magnitudes: use relative tolerance
  if (Math.abs(r) > 1) {
    return absDiff / Math.abs(r) < 1e-6 || absDiff < tol;
  }
  return absDiff < tol;
}

console.log("\n=================== RESULTS ===================");
console.log(
  "name".padEnd(40) + "tidy-ts".padEnd(28) + "R".padEnd(28) + "|diff|".padEnd(14) +
    "pass",
);
let passed = 0;
let failed = 0;
const fails: typeof cmp = [];
for (const row of cmp) {
  const diff = Math.abs(row.tidy - row.r);
  const ok = pass(row.name, row.tidy, row.r, row.tol);
  if (ok) passed++;
  else {
    failed++;
    fails.push(row);
  }
  console.log(
    row.name.padEnd(40) +
      String(row.tidy).padEnd(28) +
      String(row.r).padEnd(28) +
      diff.toExponential(3).padEnd(14) +
      (ok ? "PASS" : "FAIL"),
  );
}
console.log("===============================================");
console.log(`Total: ${cmp.length}  Passed: ${passed}  Failed: ${failed}`);

if (fails.length > 0) {
  console.log("\n--- FAILING ROWS ---");
  for (const f of fails) {
    console.log(
      `${f.name}: tidy=${f.tidy} R=${f.r} |diff|=${Math.abs(f.tidy - f.r)}`,
    );
  }
}
