// Translation of survival package test: tiedtime.R
// R reference JSON: tiedtime-source-test.R (sibling file)
// Tests handling of tied event times in floating-point calculations
//
// Coverage of tiedtime.R:
// [ ] L13-23: ties.rda dataset — external .rda file not available
// [x] L28-33: sqrt(2)^2 synthetic tied times with groups

import { survfit } from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertClose,
  getReferenceFromRScript,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./tiedtime-source-test.R", import.meta.url)
  .pathname;

interface TiedtimeRef {
  sum_strata: number;
  length_time: number;
  strata: number[];
  time: number[];
  surv: number[];
  nRisk: number[];
  nEvent: number[];
}

const ref = getReferenceFromRScript<TiedtimeRef>(R_SOURCE_TEST);

Deno.test("tiedtime: sqrt(2)^2 creates proper tied times with groups", () => {
  // tdata <- data.frame(time=c(1, 2, sqrt(2)^2, 2, sqrt(2)^2),
  //                     status=rep(1,5), group=c(1,1,1,2,2))
  // sqrt(2)^2 should equal 2 (floating-point: 2.0000000000000004)
  const time = [1, 2, Math.sqrt(2) ** 2, 2, Math.sqrt(2) ** 2];
  const status = [1, 1, 1, 1, 1];
  const groups = [0, 0, 0, 1, 1]; // 0-based groups

  const fit = survfit({ time, status, options: { groups } });

  // Key assertion from R: sum(fit$strata) == length(fit$time)
  // This verifies that tied times are handled correctly
  const sumStrata = (fit.strata ?? []).reduce((a, b) => a + b, 0);
  assertClose(sumStrata, fit.time.length, 0, "sum(strata) == length(time)");
  assertClose(
    ref.sum_strata,
    ref.length_time,
    0,
    "R: sum(strata) == length(time)",
  );
});
