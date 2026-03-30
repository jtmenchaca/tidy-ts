// Translation of survival package test: concordance2.R
// R reference JSON: concordance2-source-test.R (sibling file)
// Tests concordance with influence, leverage, weights, start-stop, stratified
//
// Coverage of concordance2.R:
// [x] Basic concordance counts (overlap with concordance.R for sanity)
// [ ] Influence-based variance estimation — needs WASM influence support
// [ ] Leverage computation — needs WASM leverage support
// [ ] Case weights — needs WASM weighted concordance
// [ ] Start-stop (counting process) concordance — needs WASM counting concordance
// [ ] Stratified concordance — needs WASM stratified concordance

import {
  concordance,
  type ConcordanceResult,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL(
  "./concordance2-source-test.R",
  import.meta.url,
).pathname;

interface Concordance2Ref {
  basic_count: number[];
  basic_concordance: number;
  inf_count: number[];
  inf_concordance: number;
  lung_count: number[];
  lung_concordance: number;
}

const ref = getReferenceFromRScript<Concordance2Ref>(R_SOURCE_TEST);

// ── Basic concordance sanity check ───────────────────────────────────────

Deno.test("concordance2: basic AML counts match concordance.R", () => {
  const tdata = {
    time: [9, 13, 13, 18, 23, 28, 31, 34, 45, 48, 161],
    status: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
    x: [1, 6, 2, 7, 3, 7, 3, 8, 4, 4, 5],
  };

  const fit: ConcordanceResult = concordance({
    time: tdata.time,
    status: tdata.status,
    x: tdata.x,
  });

  assertArrayClose(
    fit.count.slice(0, 4),
    ref.basic_count,
    TOL_EXACT,
    "basic count",
  );
});

// ── Stub: influence-based variance ───────────────────────────────────────
// concordance2.R tests that concordance with influence=1 produces
// individual-level influence values for robust variance estimation.
// Our WASM concordance returns influence but the full variance
// decomposition is not yet validated.

// ── Stub: leverage ───────────────────────────────────────────────────────
// Leverage values from concordance are used for diagnostics.
// Not yet implemented in WASM.

// ── Stub: case weights ──────────────────────────────────────────────────
// Weighted concordance (concordance(..., weights=w)) is not yet
// supported in our WASM concordance function.

// ── Stub: start-stop concordance ─────────────────────────────────────────
// Counting process concordance (Surv(start, stop, event) ~ x) requires
// a separate WASM path or extension to the existing concordance function.

// ── Stub: stratified concordance ─────────────────────────────────────────
// Stratified concordance (concordance(..., strata=s)) computes within-stratum
// concordance and pools results. Not yet supported in WASM.
