// Translation of survival package test: difftest.R
// R reference JSON: difftest-source-test.R (sibling file)
// Tests survdiff (log-rank test) with dummy groups and stratified tests
//
// Coverage of difftest.R:
// [x] L27-28: survdiff on aml vs aml3 (dummy group gives same chisq)
// [ ] L36-54: stratified survdiff on lung + coxph comparison — needs multi-level factor group encoding

import { survdiff } from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadAml,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./difftest-source-test.R", import.meta.url)
  .pathname;

interface DifftestRef {
  aml_chisq: number;
  aml_n: number[];
  aml_obs: number[];
  aml_exp: number[];
  aml3_chisq: number;
  aml3_n: number[];
  aml3_obs: number[];
  aml3_exp: number[];
  lung_chisq: number;
  lung_n: number[];
  lung_obs: number[];
  lung_exp: number[];
  lung_pat_karno_levels: number[];
}

const ref = getReferenceFromRScript<DifftestRef>(R_SOURCE_TEST);

Deno.test("difftest: survdiff on aml (2-group log-rank)", () => {
  const aml = loadAml();
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);
  // aml$x: "Maintained" = 0, "Nonmaintained" = 1
  const group = aml.map((r) => (r.x === "Maintained" ? 0 : 1));

  const sd = survdiff({ time, status, group });

  assertClose(sd.chisq, ref.aml_chisq, TOL, "aml chisq");
  assertArrayClose(sd.obs, ref.aml_obs, TOL_EXACT, "aml obs");
  assertArrayClose(sd.exp, ref.aml_exp, TOL, "aml exp");
});

Deno.test("difftest: survdiff on aml3 (3-group with dummy)", () => {
  // aml3 has a third group "Dummy" with 7 observations, all censored
  const time = [
    9, 13, 13, 18, 23, 28, 31, 34, 45, 48, 161, 5, 5, 8, 8, 12, 16, 23, 27,
    30, 33, 43, 45, 1, 2, 2, 3, 3, 3, 4,
  ];
  const status = [
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0,
    0, 0, 0, 0, 0, 0,
  ];
  // Groups: Dummy=0, Maintained=1, Nonmaintained=2
  const group = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0,
    0, 0, 0, 0, 0, 0,
  ];

  const sd = survdiff({ time, status, group });

  // chisq should match aml's chisq (dummy group contributes nothing)
  assertClose(sd.chisq, ref.aml3_chisq, TOL, "aml3 chisq");
  // aml and aml3 should give the same chisq
  assertClose(ref.aml_chisq, ref.aml3_chisq, TOL_EXACT, "aml vs aml3 chisq");
  assertArrayClose(sd.obs, ref.aml3_obs, TOL_EXACT, "aml3 obs");
  assertArrayClose(sd.exp, ref.aml3_exp, TOL, "aml3 exp");
});
