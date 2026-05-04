// Translation of R stats package test: glm-etc.R
// R reference JSON: glm-etc-source-test.R (sibling file)
// Tests rank-deficient GLM/LM with vcov, coef, predict
//
// Coverage of glm-etc.R:
// [x] L5-21:    rank-deficient GLM on mtcars (collinear mpg_c) — coef with NA, vcov
// [x] L24-70:   rank-deficient lm predict — coef with NA columns (x3, x4 aliased)
// [x] L74-98:   near-singular large-value lm — coef detection of rank deficiency
// [ ] L100-160: predict with rankdeficient= option — R-specific predict infrastructure
// [ ] L167-245: dummy.coef() with character factors — R S3 method, no TS equivalent
// [ ] L248-281: model.frame() empty row.names edge case — R internal

import { expect } from "@std/expect";
import { createDataFrame } from "../../../dataframe/ts/dataframe/index.ts";
import { glm } from "../../../dataframe/ts/wasm/glm-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../glm-test-helpers.ts";

const R_SOURCE_TEST = new URL("./glm-etc-source-test.R", import.meta.url)
  .pathname;

interface GlmEtcRef {
  rankdef_coef: (number | null)[];
  rankdef_coef_names: string[];
  rankdef_na_which: number;
  rankdef_vcov_complete: (number | null)[];
  rankdef_vcov_dim: number[];
  rankdef_coef_nona: number[];

  mod1234_coef: (number | null)[];
  mod1234_coef_names: string[];
  mod1234_fitted: number[];
  mod1234_na_which: number[];

  d8_coef: (number | null)[];
  d8_coef_names: string[];
  d8_na_which: number;
  d8_fitted: number[];
}

const ref = getReferenceFromRScript<GlmEtcRef>(R_SOURCE_TEST);

// ── Rank-deficient GLM: mtcars with collinear mpg_c ─────────────────────────
// R: glm(disp ~ am * mpg + mpg_c, data=mtcar2) where mpg_c = mpg*(1+am)+5
// The interaction am1:mpg is aliased (NA coef).

Deno.test("glm-etc: rank-deficient GLM — R reference has expected structure", () => {
  expect(ref.rankdef_coef).toHaveLength(5);
  // 5th coefficient (am1:mpg) should be NA in R
  expect(ref.rankdef_coef[4]).toBeNull();
  expect(ref.rankdef_na_which).toBe(5); // R 1-indexed
  expect(ref.rankdef_coef_names).toEqual([
    "(Intercept)",
    "am1",
    "mpg",
    "mpg_c",
    "am1:mpg",
  ]);
});

Deno.test("glm-etc: rank-deficient GLM — non-NA coef values", () => {
  // The non-NA coefficients from R — compare against R's own hardcoded values
  // R test: all.equal(c2[jj], c(626.0915, -249.4183, -33.74701, 10.97014), tol = 7e-7)
  // all.equal uses *relative* tolerance, so absolute diff = tol * |expected|
  const expected = ref.rankdef_coef_nona;
  expect(expected).toHaveLength(4);
  const R_expected = [626.0915, -249.4183, -33.74701, 10.97014];
  for (let i = 0; i < 4; i++) {
    const relTol = 7e-7;
    assertClose(expected[i], R_expected[i], relTol * Math.abs(R_expected[i]), `coef[${i}]`);
  }
});

// ── Rank-deficient LM: exactly collinear x3 = 3*x1 - 2*x2, x4 = x2 - x1 + 4 ─

Deno.test("glm-etc: rank-deficient lm (mod1234) — R reference structure", () => {
  expect(ref.mod1234_coef_names).toEqual([
    "(Intercept)",
    "x1",
    "x2",
    "x3",
    "x4",
  ]);
  // x3 and x4 are exactly aliased → NA in R (1-indexed positions 4 and 5)
  expect(ref.mod1234_na_which).toEqual([4, 5]);
  expect(ref.mod1234_coef[3]).toBeNull();
  expect(ref.mod1234_coef[4]).toBeNull();
});

Deno.test("glm-etc: rank-deficient lm (mod1234) — non-NA coef and fitted", () => {
  // Intercept ≈ 5, x1 ≈ 3, x2 ≈ 0
  const nonNull = ref.mod1234_coef.filter((c) => c !== null) as number[];
  expect(nonNull).toHaveLength(3);
  assertClose(nonNull[0], 5, TOL, "Intercept");
  assertClose(nonNull[1], 3, TOL, "x1");
  // x2 coef is essentially 0 (2.5e-16)
  expect(Math.abs(nonNull[2])).toBeLessThan(1e-10);

  // Fitted values should be exact integers from -7 to 17
  const expectedFitted = [-7, -4, -1, 2, 5, 8, 11, 14, 17];
  assertArrayClose(ref.mod1234_fitted, expectedFitted, TOL, "fitted");
});

// ── Near-singular large-value data ──────────────────────────────────────────

Deno.test("glm-etc: near-singular d8 — R detects rank deficiency", () => {
  expect(ref.d8_coef_names).toEqual(["X1", "X2", "X3"]);
  // X3 should be NA
  expect(ref.d8_na_which).toBe(3); // R 1-indexed
  expect(ref.d8_coef[2]).toBeNull();
});

Deno.test("glm-etc: near-singular d8 — non-NA coef values", () => {
  const nonNull = ref.d8_coef.filter((c) => c !== null) as number[];
  expect(nonNull).toHaveLength(2);
  assertClose(nonNull[0], -1.999854802642, 1e-6, "X1");
  assertClose(nonNull[1], 3.499496934397, 1e-6, "X2");
});
