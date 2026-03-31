// Translation of survival package test: cancer.R
// R reference JSON: cancer-source-test.R (sibling file)
// Tests coxph on lung dataset with multiple covariates and strata
//
// Coverage of cancer.R:
// [x] L25-30: coxph with 6 covariates + strata(inst) — loglik, coef
// [x] Extra:  simple coxph(age + sex) on lung for basic validation
// [ ] L10-11: survfit with strata(ph.ecog) — needs KM by strata on lung
// [ ] L14-16: Fleming-Harrington survfit — needs FH type
// [ ] L18-19: survdiff with rho=0.5 — needs rho support verified
// [ ] L23-30: survSplit counting-process comparison — needs data splitting
// [ ] L33-37: cox.zph — needs TS wrapper for cox_zph_wasm
// [ ] L39-51: score test per variable via cox.zph — needs cox.zph
// [ ] L56-59: formula "." expansion and update() — R-specific

import {
  coxph,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./cancer-source-test.R", import.meta.url)
  .pathname;

interface CancerRef {
  coef: number[];
  loglik: [number, number];
  var_diag: number[];
  n: number;
  nevent: number;
  coef_names: string[];
  simple_coef: number[];
  simple_loglik: [number, number];
  simple_var: number[][];
  simple_n: number;
  simple_nevent: number;
  simple_score: number;
  sd_inst_chisq: number;
}

const ref = getReferenceFromRScript<CancerRef>(R_SOURCE_TEST);

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

Deno.test("cancer: simple coxph(age + sex) on lung", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  // Filter complete cases for age, sex (no NAs in these columns)
  const complete = lung.filter(
    (r) => r.time != null && r.status != null && r.age != null && r.sex != null,
  );

  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      sex: complete.map((r) => r.sex),
    },
    method: "efron",
  });

  assertArrayClose(fit.coefficients, ref.simple_coef, TOL, "simple coef");
  assertClose(fit.loglik[0], ref.simple_loglik[0], TOL, "simple loglik[0]");
  assertClose(fit.loglik[1], ref.simple_loglik[1], TOL, "simple loglik[1]");
  assertClose(fit.n, ref.simple_n, TOL_EXACT, "simple n");
  assertClose(fit.nevent, ref.simple_nevent, TOL_EXACT, "simple nevent");
});

Deno.test("cancer: coxph with 6 covariates + strata(inst) on lung", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  // Filter complete cases for all 6 covariates + strata column
  const complete = lung.filter(
    (r) =>
      r.time != null &&
      r.status != null &&
      r.ph_ecog != null &&
      r.ph_karno != null &&
      r.pat_karno != null &&
      r.wt_loss != null &&
      r.sex != null &&
      r.age != null &&
      r.inst != null,
  );

  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      ph_ecog: complete.map((r) => r.ph_ecog!),
      ph_karno: complete.map((r) => r.ph_karno!),
      pat_karno: complete.map((r) => r.pat_karno!),
      wt_loss: complete.map((r) => r.wt_loss!),
      sex: complete.map((r) => r.sex),
      age: complete.map((r) => r.age),
  },
    method: "efron",
    strata: complete.map((r) => r.inst!),
  });

  assertArrayClose(fit.coefficients, ref.coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.loglik[1], TOL, "loglik[1]");
  assertClose(fit.n, ref.n, TOL_EXACT, "n");
  assertClose(fit.nevent, ref.nevent, TOL_EXACT, "nevent");
});
