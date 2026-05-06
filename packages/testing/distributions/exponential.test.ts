import { expect } from "@std/expect";
import {
  assertClose,
  assertArrayClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dexp,
  pexp,
  qexp,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface ExpRef {
  rate1_x: number[];
  rate1_dexp: number[];
  rate1_pexp: number[];
  rate1_qexp_p: number[];
  rate1_qexp: number[];
  rate05_x: number[];
  rate05_dexp: number[];
  rate05_pexp: number[];
  rate05_qexp_p: number[];
  rate05_qexp: number[];
  upper_tail: number;
  log_dexp: number;
  log_pexp: number;
  edge_dexp_0: number;
  extreme_pexp_1e10: number;
  extreme_pexp_1e100: number;
  extreme_pexp_1e300: number;
}

const ref = getReferenceFromRScript<ExpRef>(
  new URL("./exponential-ref.R", import.meta.url).pathname,
);

// --- rate=1: dexp ---

Deno.test("Exponential: dexp rate=1", () => {
  const actual = ref.rate1_x.map((x) => dexp({ at: x, rate: 1 }));
  assertArrayClose(actual, ref.rate1_dexp, TOL, "dexp rate=1");
});

// --- rate=1: pexp ---

Deno.test("Exponential: pexp rate=1", () => {
  const actual = ref.rate1_x.map((x) => pexp({ at: x, rate: 1 }));
  assertArrayClose(actual, ref.rate1_pexp, TOL, "pexp rate=1");
});

// --- rate=1: qexp ---

Deno.test("Exponential: qexp rate=1", () => {
  const actual = ref.rate1_qexp_p.map((p) =>
    qexp({ probability: p, rate: 1 }),
  );
  assertArrayClose(actual, ref.rate1_qexp, TOL, "qexp rate=1");
});

// --- rate=0.5: dexp, pexp ---

Deno.test("Exponential: dexp rate=0.5", () => {
  const actual = ref.rate05_x.map((x) => dexp({ at: x, rate: 0.5 }));
  assertArrayClose(actual, ref.rate05_dexp, TOL, "dexp rate=0.5");
});

Deno.test("Exponential: pexp rate=0.5", () => {
  const actual = ref.rate05_x.map((x) => pexp({ at: x, rate: 0.5 }));
  assertArrayClose(actual, ref.rate05_pexp, TOL, "pexp rate=0.5");
});

// --- rate=0.5: qexp ---

Deno.test("Exponential: qexp rate=0.5", () => {
  const actual = ref.rate05_qexp_p.map((p) =>
    qexp({ probability: p, rate: 0.5 }),
  );
  assertArrayClose(actual, ref.rate05_qexp, TOL, "qexp rate=0.5");
});

// --- Upper tail ---

Deno.test("Exponential: upper tail pexp(1, rate=1)", () => {
  const actual = pexp({ at: 1, rate: 1, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper tail");
});

// --- Log scale ---

Deno.test("Exponential: log dexp(1, rate=1)", () => {
  const actual = dexp({ at: 1, rate: 1, returnLog: true });
  assertClose(actual, ref.log_dexp, TOL, "log dexp");
});

Deno.test("Exponential: log pexp(1, rate=1)", () => {
  const actual = pexp({ at: 1, rate: 1, returnLog: true });
  assertClose(actual, ref.log_pexp, TOL, "log pexp");
});

// --- Edge: dexp(0, rate=1) should equal 1 ---

Deno.test("Exponential: dexp(0, rate=1) equals rate", () => {
  const actual = dexp({ at: 0, rate: 1 });
  assertClose(actual, ref.edge_dexp_0, TOL, "dexp(0)");
  expect(actual).toBe(1);
});

// --- Extreme: pexp for large x ---

Deno.test("Exponential: extreme pexp values", () => {
  assertClose(
    pexp({ at: 1e10, rate: 1 }),
    ref.extreme_pexp_1e10,
    TOL,
    "pexp(1e10)",
  );
  assertClose(
    pexp({ at: 1e100, rate: 1 }),
    ref.extreme_pexp_1e100,
    TOL,
    "pexp(1e100)",
  );
  assertClose(
    pexp({ at: 1e300, rate: 1 }),
    ref.extreme_pexp_1e300,
    TOL,
    "pexp(1e300)",
  );
});
