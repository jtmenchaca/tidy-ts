// Translation of survival package test: strata2.R
// R reference JSON: strata2-source-test.R (sibling file)
// Tests strata-by-covariate interactions in coxph
//
// Coverage of strata2.R:
// [x] R reference extraction for strata-by-covariate interaction
// [x] Simple coxph(age + sex + strata(ph.ecog)) as comparison baseline
// [ ] coxph(age + sex:strata(ph.ecog)) — needs strata-covariate interaction support
// [ ] Interaction term expansion — needs formula parsing for covariate:strata()
// [ ] Per-stratum coefficient estimation — needs WASM extension

import {
  coxph,
  type CoxphResult,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL(
  "./strata2-source-test.R",
  import.meta.url,
).pathname;

interface Strata2Ref {
  coef: number[];
  coef_names: string[];
  loglik: [number, number];
  n: number;
  nevent: number;
  simple_coef: number[];
  simple_loglik: [number, number];
  simple_n: number;
}

const ref = getReferenceFromRScript<Strata2Ref>(R_SOURCE_TEST);

interface LungRow {
  inst: number | null;
  time: number;
  status: number;
  age: number;
  sex: number;
  ph_ecog: number | null;
  ph_karno: number | null;
  pat_karno: number | null;
  meal_cal: number | null;
  wt_loss: number | null;
}

// ── Reference extraction verification ────────────────────────────────────

Deno.test("strata2: R reference values extracted", () => {
  // The interaction model should have multiple coefficients:
  // age + sex:strata(ph.ecog) produces one coef for age plus
  // one sex coefficient per stratum level
  assertClose(ref.n, ref.simple_n, TOL_EXACT, "n should match between models");
});

// ── Simple strata model (no interaction) as baseline ─────────────────────

Deno.test("strata2: simple coxph(age + sex + strata(ph.ecog))", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  const complete = lung.filter(
    (r) =>
      r.time != null &&
      r.status != null &&
      r.age != null &&
      r.sex != null &&
      r.ph_ecog != null,
  );

  const fit: CoxphResult = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      sex: complete.map((r) => r.sex),
    },
    options: {
      strata: complete.map((r) => r.ph_ecog!),
    },
  });

  assertArrayClose(fit.coefficients, ref.simple_coef, TOL, "simple coef");
  assertClose(fit.loglik[0], ref.simple_loglik[0], TOL, "simple loglik[0]");
  assertClose(fit.loglik[1], ref.simple_loglik[1], TOL, "simple loglik[1]");
});

// ── Stub: strata-by-covariate interaction ────────────────────────────────
// The formula `~ age + sex:strata(ph.ecog)` creates an interaction between
// the sex covariate and the strata variable ph.ecog. This means:
//   - age has one coefficient (shared across strata)
//   - sex has a DIFFERENT coefficient in each ph.ecog stratum
//
// This requires:
//   1. Formula parsing to detect covariate:strata() interactions
//   2. Expanding sex into per-stratum dummy variables
//   3. Passing the expanded covariate matrix to coxph with strata
//
// The interaction expansion could be done in TypeScript before calling WASM,
// since the WASM coxph already supports strata. The key is constructing
// the correct design matrix where sex becomes multiple columns
// (one per stratum level, zeroed out in other strata).
