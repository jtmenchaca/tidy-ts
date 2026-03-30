// Translation of survival package test: residms.R
// R reference JSON: residms-source-test.R (sibling file)
// Tests residuals for multi-state Cox models (coxphms) — Tier 4
//
// Coverage of residms.R:
// [ ] residuals.coxphms martingale residuals — multi-state not implemented (Tier 4)
// [ ] residuals.coxphms score residuals — Tier 4
// [ ] residuals.coxphms Schoenfeld residuals — Tier 4
// [ ] multi-state transitions and competing risks — Tier 4
//
// NOTE: Multi-state Cox models (coxphms) require competing risks and
// transition-specific hazard support, which is Tier 4 functionality.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./residms-source-test.R", import.meta.url)
  .pathname;

interface ResidmsRef {
  note: string;
}

const ref = getReferenceFromRScript<ResidmsRef>(R_SOURCE_TEST);

Deno.test("residms: R reference extraction works (multi-state Tier 4)", () => {
  // Verify R reference extracts correctly
  // Multi-state Cox residuals require Tier 4 implementation
  if (!ref.note.includes("multi-state")) {
    throw new Error("Expected note to document multi-state dependency");
  }
});
