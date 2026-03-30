// Translation of survival package test: brier.R
// R reference JSON: brier-source-test.R (sibling file)
// Tests Brier scores — requires pspline, rttright, multi-subject prediction (Tier 4)
//
// Coverage of brier.R:
// [ ] Brier score computation with IPCW weights — requires rttright (Tier 4)
// [ ] pspline terms in coxph model — Tier 4
// [ ] rttright reverse censoring weights — Tier 4
// [ ] survfit prediction for individual subjects — Tier 4
// [ ] rotterdam dataset — not yet in fixture DB
//
// NOTE: Brier scores require pspline (penalized splines), rttright (reverse KM
// censoring weights), and multi-subject survfit prediction. All are Tier 4.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./brier-source-test.R", import.meta.url)
  .pathname;

interface BrierRef {
  note: string;
}

const ref = getReferenceFromRScript<BrierRef>(R_SOURCE_TEST);

Deno.test("brier: R reference extraction works (Brier score Tier 4)", () => {
  // Verify R reference extracts correctly
  // Brier score functionality requires Tier 4 implementation
  if (!ref.note.includes("pspline")) {
    throw new Error("Expected note to document pspline dependency");
  }
});
