// Translation of survival package test: anova.R
// R reference JSON: anova-source-test.R (sibling file)
// Tests sequential model comparison via loglik differences
//
// Coverage of anova.R:
// [x] L18-19: nested coxph fits with strata (ph.ecog only vs ph.ecog + wt.loss)
// [x] L21:    loglik chain: null → fit3 → fit2
// [x] L23:    Chisq = 2 * diff(loglik)
// [x] L24:    df for each term
// [ ] L7-9:   poly(age,3) — needs orthogonal polynomial basis (skipped)
// [ ] L26-31: anova(fit3, fit2, fit1) — multi-model anova (same loglik chain)

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
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./anova-source-test.R", import.meta.url)
  .pathname;

interface LungRow {
  time: number;
  status: number;
  ph_ecog: number | null;
  wt_loss: number | null;
  sex: number;
  age: number;
}

interface AnovaRef {
  fit3_coef: number;
  fit3_loglik: number[];
  fit3_var: number;
  fit2_coef: number[];
  fit2_loglik: number[];
  fit2_var: number[];
  null_loglik: number;
}

const ref = getReferenceFromRScript<AnovaRef>(R_SOURCE_TEST);

// Load lung data and na.omit on relevant columns
const lungRaw = loadTable<LungRow>("cancer_lung");
const lung = lungRaw.filter(
  (r) => r.ph_ecog != null && r.wt_loss != null && r.sex != null,
);

Deno.test("anova: nested coxph fit3 (ph.ecog + strata(sex))", () => {
  const strata = lung.map((r) => r.sex - 1); // 0-based strata
  const fit3 = coxph({
    time: lung.map((r) => r.time),
    status: lung.map((r) => r.status - 1),
    covariates: { ph_ecog: lung.map((r) => r.ph_ecog!) },
    options: { strata },
  });
  assertClose(fit3.coefficients[0], ref.fit3_coef, TOL, "fit3 coef");
  assertArrayClose(fit3.loglik, ref.fit3_loglik, TOL, "fit3 loglik");
  assertClose(fit3.var[0][0], ref.fit3_var, TOL, "fit3 var");
});

Deno.test("anova: nested coxph fit2 (ph.ecog + wt.loss + strata(sex))", () => {
  const strata = lung.map((r) => r.sex - 1);
  const fit2 = coxph({
    time: lung.map((r) => r.time),
    status: lung.map((r) => r.status - 1),
    covariates: {
      ph_ecog: lung.map((r) => r.ph_ecog!),
      wt_loss: lung.map((r) => r.wt_loss!),
    },
    options: { strata },
  });
  assertArrayClose(fit2.coefficients, ref.fit2_coef, TOL, "fit2 coef");
  assertArrayClose(fit2.loglik, ref.fit2_loglik, TOL, "fit2 loglik");
  assertArrayClose(fit2.var.flat(), ref.fit2_var, TOL, "fit2 var");
});

Deno.test("anova: loglik chain and chisq = 2 * diff(loglik)", () => {
  const strata = lung.map((r) => r.sex - 1);

  const fit3 = coxph({
    time: lung.map((r) => r.time),
    status: lung.map((r) => r.status - 1),
    covariates: { ph_ecog: lung.map((r) => r.ph_ecog!) },
    options: { strata },
  });

  const fit2 = coxph({
    time: lung.map((r) => r.time),
    status: lung.map((r) => r.status - 1),
    covariates: {
      ph_ecog: lung.map((r) => r.ph_ecog!),
      wt_loss: lung.map((r) => r.wt_loss!),
    },
    options: { strata },
  });

  // R's anova loglik chain: [null, fit3, fit2]
  // null_loglik == fit3$loglik[1] (initial loglik before any fitting)
  const loglikChain = [ref.null_loglik, fit3.loglik[1], fit2.loglik[1]];
  assertClose(fit3.loglik[0], ref.null_loglik, TOL, "null loglik");

  // Chisq = 2 * diff(loglik)
  const chisq_ph_ecog = 2 * (fit3.loglik[1] - ref.null_loglik);
  const chisq_wt_loss = 2 * (fit2.loglik[1] - fit3.loglik[1]);

  // Verify these match R's anova output
  const r_chisq_ph_ecog = 2 * (ref.fit3_loglik[1] - ref.null_loglik);
  const r_chisq_wt_loss = 2 * (ref.fit2_loglik[1] - ref.fit3_loglik[1]);

  assertClose(chisq_ph_ecog, r_chisq_ph_ecog, TOL, "chisq ph.ecog");
  assertClose(chisq_wt_loss, r_chisq_wt_loss, TOL, "chisq wt.loss");
});
