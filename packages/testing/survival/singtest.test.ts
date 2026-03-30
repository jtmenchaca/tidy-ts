// Translation of survival package test: singtest.R
// R reference JSON: singtest-source-test.R (sibling file)
// Tests singular X matrix handling (overdetermined system with NA coefficients)
//
// Coverage of singtest.R:
// [ ] L9-22: coxph with x * factor(epoch) on counting-process data — needs factor/interaction encoding in WASM
// [ ] L24:   NA coefficient pattern check — needs factor interaction support
//
// NOTE: singtest.R tests singular X matrix handling where interactions
// between x and factor(epoch) create a collinear design matrix. This
// requires factor encoding and interaction term construction in the WASM
// layer. The R test expects coefficients 2:4 to be NA.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./singtest-source-test.R", import.meta.url)
  .pathname;

interface SingtestRef {
  coef: (number | null)[];
  na_pattern: boolean[];
  loglik: [number, number];
  n: number;
  nevent: number;
}

const ref = getReferenceFromRScript<SingtestRef>(R_SOURCE_TEST);

Deno.test("singtest: R reference has expected NA pattern", () => {
  // Verify R's expected behavior: elements 2:4 should be NA (1-indexed)
  // i.e., indices 1,2,3 in 0-indexed should be null/NaN
  const expected = [false, true, true, true, false, false, false];
  for (let i = 0; i < expected.length; i++) {
    const isNa = ref.na_pattern[i];
    if (isNa !== expected[i]) {
      throw new Error(
        `na_pattern[${i}]: expected ${expected[i]}, got ${isNa}`,
      );
    }
  }
});

Deno.test("singtest: coxph with singular X matrix", () => {
  // TODO: This test requires factor encoding + interaction terms in the WASM layer.
  // The test creates: coxph(Surv(start, stop, status) ~ x * factor(epoch), stest)
  // which generates a design matrix with columns: x, epoch2, epoch3, epoch4, x:epoch2, x:epoch3, x:epoch4
  // Columns epoch2-epoch4 are collinear with x in the first epoch, making the matrix singular.
  // When factor/interaction support is added, implement:
  //   - Build design matrix with factor(epoch) dummy variables
  //   - Add interaction terms x:factor(epoch)
  //   - Verify coefficients 2:4 are NaN
});
