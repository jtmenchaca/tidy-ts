// Translation of survival package test: jasa.R
// R reference JSON: jasa-source-test.R (sibling file)
// Tests Stanford heart transplant counting-process Cox models
//
// Coverage of jasa.R:
// [x] L16-17: counting-process Cox with (age+surgery)*transplant interactions, Breslow
// [x] L36:    simple age model: coxph(Surv(futime, fustat) ~ I(age-48), jasa)
// [ ] L18-23: survfit with newdata + id — needs survfitCox newdata/id support
// [ ] L25-28: survfit comparison of counts/events — needs KM on counting process
// [ ] L30-33: expected survival with individual curves — needs individual curves
// [ ] L38-40: offset model: coxph with offset(fit1$linear.predictors) — needs offset
// [ ] L42-45: survfit offset comparison — needs survfit with offset
// [ ] L47-50: expected survival for offset model — needs expected survival

import {
  coxph,
  coxphCounting,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./jasa-source-test.R", import.meta.url)
  .pathname;

interface JasaRef {
  sfit1_coef: number[];
  sfit1_coef_names: string[];
  sfit1_loglik: [number, number];
  sfit1_n: number;
  sfit1_nevent: number;
  fit1_coef: number; // single coefficient — R emits scalar, not array
  fit1_coef_names: string;
  fit1_loglik: [number, number];
  fit1_n: number;
  fit1_nevent: number;
}

const ref = getReferenceFromRScript<JasaRef>(R_SOURCE_TEST);

interface JasaRow {
  birth_dt: string;
  accept_dt: string;
  tx_date: string | null;
  fu_date: string;
  fustat: number;
  surgery: number;
  age: number;
  futime: number;
  wait_time: number;
  transplant: number;
  mismatch: number | null;
  hla_a2: number | null;
  mscore: number | null;
  reject: number | null;
}

interface Jasa1Row {
  id: number;
  start: number;
  stop: number;
  event: number;
  transplant: number;
  age: number;
  year: number;
  surgery: number;
}

// ── Simple age model on jasa ────────────────────────────────────────────────
// coxph(Surv(futime, fustat) ~ I(age - 48), data=jasa)
// The I(age-48) centering is applied manually.

Deno.test("jasa: simple age model coxph(futime, fustat) ~ age-48", () => {
  const jasa = loadTable<JasaRow>("heart_jasa");

  const fit = coxph({
    time: jasa.map((r) => r.futime),
    status: jasa.map((r) => r.fustat),
    covariates: {
      age_centered: jasa.map((r) => r.age - 48),
    },
    method: "efron",
  });

  assertClose(fit.coefficients[0], ref.fit1_coef, TOL, "fit1 coef");
  assertClose(fit.loglik[0], ref.fit1_loglik[0], TOL, "fit1 loglik[0]");
  assertClose(fit.loglik[1], ref.fit1_loglik[1], TOL, "fit1 loglik[1]");
  assertClose(fit.n, ref.fit1_n, TOL_EXACT, "fit1 n");
  assertClose(fit.nevent, ref.fit1_nevent, TOL_EXACT, "fit1 nevent");
});

// ── Counting-process Cox with interactions ──────────────────────────────────
// coxph(Surv(start, stop, event) ~ (age + surgery)*transplant, jasa1, method='breslow')
// We manually expand the interaction: age, surgery, transplant, age:transplant, surgery:transplant

Deno.test("jasa: counting-process Cox with (age+surgery)*transplant", () => {
  const jasa1 = loadTable<Jasa1Row>("heart_jasa1");

  const fit = coxphCounting({
    start: jasa1.map((r) => r.start),
    stop: jasa1.map((r) => r.stop),
    status: jasa1.map((r) => r.event),
    covariates: {
      age: jasa1.map((r) => r.age),
      surgery: jasa1.map((r) => r.surgery),
      transplant: jasa1.map((r) => r.transplant),
      age_transplant: jasa1.map((r) => r.age * r.transplant),
      surgery_transplant: jasa1.map((r) => r.surgery * r.transplant),
    },
    options: { method: "breslow" },
  });

  assertArrayClose(fit.coefficients, ref.sfit1_coef, TOL, "sfit1 coef");
  assertClose(fit.loglik[0], ref.sfit1_loglik[0], TOL, "sfit1 loglik[0]");
  assertClose(fit.loglik[1], ref.sfit1_loglik[1], TOL, "sfit1 loglik[1]");
  assertClose(fit.n, ref.sfit1_n, TOL_EXACT, "sfit1 n");
  assertClose(fit.nevent, ref.sfit1_nevent, TOL_EXACT, "sfit1 nevent");
});
