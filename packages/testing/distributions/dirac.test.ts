import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  ddirac,
  pdirac,
  qdirac,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface DiracRef {
  d_x: number[];
  d_pdf: number[];
  p_x: number[];
  p_cdf: number[];
  q_p: number[];
  q_result: number[];
  d3_x: number[];
  d3_pdf: number[];
  p3_x: number[];
  p3_cdf: number[];
  q3_result: number[];
  upper_below: number;
  upper_at: number;
  upper_above: number;
}

const ref = getReferenceFromRScript<DiracRef>(
  new URL("./dirac-ref.R", import.meta.url).pathname,
);

// --- loc=0: density ---

Deno.test("dirac loc=0: density", () => {
  const actual = ref.d_x.map((x) => ddirac({ at: x }));
  // d_pdf = [0, Inf, 0] — check individually
  expect(actual[0]).toBe(0);
  expect(actual[1]).toBe(Infinity);
  expect(actual[2]).toBe(0);
});

// --- loc=0: CDF ---

Deno.test("dirac loc=0: CDF", () => {
  const actual = ref.p_x.map((x) => pdirac({ at: x }));
  assertArrayClose(actual, ref.p_cdf, TOL, "p_cdf");
});

// --- loc=0: quantile ---

Deno.test("dirac loc=0: quantile", () => {
  const actual = ref.q_p.map((p) => qdirac({ probability: p }));
  assertArrayClose(actual, ref.q_result, TOL, "q_result");
});

// --- loc=3: density ---

Deno.test("dirac loc=3: density", () => {
  const actual = ref.d3_x.map((x) => ddirac({ at: x, location: 3 }));
  expect(actual[0]).toBe(0);
  expect(actual[1]).toBe(Infinity);
  expect(actual[2]).toBe(0);
});

// --- loc=3: CDF ---

Deno.test("dirac loc=3: CDF", () => {
  const actual = ref.p3_x.map((x) => pdirac({ at: x, location: 3 }));
  assertArrayClose(actual, ref.p3_cdf, TOL, "p3_cdf");
});

// --- loc=3: quantile ---

Deno.test("dirac loc=3: quantile", () => {
  const actual = ref.q_p.map((p) => qdirac({ probability: p, location: 3 }));
  assertArrayClose(actual, ref.q3_result, TOL, "q3_result");
});

// --- Upper tail ---

Deno.test("dirac: upper tail below location", () => {
  const actual = pdirac({ at: -1, direction: "above" });
  assertClose(actual, ref.upper_below, TOL, "upper_below");
});

Deno.test("dirac: upper tail at location", () => {
  const actual = pdirac({ at: 0, direction: "above" });
  assertClose(actual, ref.upper_at, TOL, "upper_at");
});

Deno.test("dirac: upper tail above location", () => {
  const actual = pdirac({ at: 1, direction: "above" });
  assertClose(actual, ref.upper_above, TOL, "upper_above");
});
