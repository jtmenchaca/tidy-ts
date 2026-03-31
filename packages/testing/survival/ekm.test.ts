// Translation of survival package test: ekm.R
// R reference JSON: ekm-source-test.R (sibling file)
// Tests extended KM with arm switching, influence matrices, AUC residuals
//
// Coverage of ekm.R:
// [ ] L72-83: extended KM with arm switching, counting process, entry=TRUE — needs counting-process survfit
// [ ] L88-94: per-observation influence / residuals — not exposed in WASM
// [ ] L96-107: per-subject influence matrices — not exposed in WASM
// [ ] L109-117: AUC residuals — not exposed in WASM
// [ ] L120-138: multi-state factor(status) comparison — needs multi-state support
//
// NOTE: ekm.R tests the extended KM where subjects change treatment arms
// midstream. This requires counting-process survfit with id, entry, influence,
// and weights — features not yet exposed in our WASM survfit layer.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./ekm-source-test.R", import.meta.url).pathname;

interface EkmRef {
  n_id: number;
  n: number[];
  time: number[];
  n_risk: number[];
  n_enter: number[];
  n_event: number[];
  n_censor: number[];
  surv: number[];
  strata: number[];
}

const _ref = getReferenceFromRScript<EkmRef>(R_SOURCE_TEST);

Deno.test("ekm: R reference extraction works", () => {
  // Extended KM requires counting-process survfit with id, entry, influence, weights
  // These features are not yet exposed in our WASM survfit layer
  // When counting-process survfit is available, port the full test suite
});
