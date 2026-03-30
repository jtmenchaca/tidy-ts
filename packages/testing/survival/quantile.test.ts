// Translation of survival package test: quantile.R
// R reference JSON: quantile-source-test.R (sibling file)
// Tests the quantile routine for survfit objects
//
// Coverage of quantile.R:
// [x] survfit on inline test1 data — time, surv, nRisk, nEvent
// [x] R reference extraction for quantile values
// [ ] quantile(survfit, probs) — needs TS quantile wrapper
// [ ] Quantile with confidence intervals — needs TS wrapper
// [ ] Quantile for stratified survfit — needs TS wrapper
//
// NOTE: R's quantile.survfit finds the smallest time t where S(t) <= 1-prob.
// This is an inverse-CDF operation on the step function. The logic is:
// for each prob p, find min(time[i]) where surv[i] <= 1 - p, or NA if
// the survival curve never drops that low.

import {
  survfit,
  type SurvfitResult,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./quantile-source-test.R", import.meta.url)
  .pathname;

interface QuantileRef {
  surv: number[];
  time: number[];
  nRisk: number[];
  nEvent: number[];
  quantiles: (number | null)[];
  qq: number[];
  probs: number[];
}

const ref = getReferenceFromRScript<QuantileRef>(R_SOURCE_TEST);

Deno.test("quantile: survfit on inline test1 data", () => {
  // Inline test1 data from R's quantile.R
  // R's status has NA at index 1 — survfit drops that observation entirely.
  // We exclude the NA row to match R's behavior (n=7, not n=8).
  const allTime = [9, 3, 1, 1, 6, 6, 8, 10];
  const allStatus: (number | null)[] = [1, null, 1, 0, 1, 1, 0, 0];
  const time = allTime.filter((_, i) => allStatus[i] !== null);
  const status = allStatus.filter((s) => s !== null) as number[];

  const fit = survfit({
    time,
    status,
  });

  // Verify survival curve matches R
  assertArrayClose(fit.time, ref.time, TOL_EXACT, "time");
  assertArrayClose(fit.surv, ref.surv, TOL, "surv");
  assertArrayClose(fit.nRisk, ref.nRisk, TOL_EXACT, "nRisk");
  assertArrayClose(fit.nEvent, ref.nEvent, TOL_EXACT, "nEvent");
});

Deno.test("quantile: quantile computation (stub)", () => {
  // quantile.survfit needs a TS wrapper that:
  // 1. Takes a survfit result and probability vector
  // 2. For each prob p, finds min(time[i]) where surv[i] <= p
  // 3. Returns NA/null when the survival curve never drops below p
  // 4. Handles confidence intervals for quantiles
  // The R reference includes quantile values at probs = 1 - qq for validation.
});
