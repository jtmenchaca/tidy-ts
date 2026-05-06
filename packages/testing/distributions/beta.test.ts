import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dbeta,
  pbeta,
  qbeta,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface BetaRef {
  sym_pdf: number[];
  sym_cdf: number[];
  sym_quantile: number[];
  asym_pdf: number[];
  asym_cdf: number[];
  asym_quantile: number[];
  upper_tail: number;
  log_pdf: number;
  log_cdf: number;
  edge_zero_alpha_half: number;
  edge_one_beta_half: number;
  edge_zero_alpha_two: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<BetaRef>(
  new URL("./beta-ref.R", import.meta.url).pathname,
);

// --- Symmetric beta (alpha=2, beta=2) ---

const SYM_X = [0.1, 0.25, 0.5, 0.75, 0.9] as const;
const SYM_P = [0.1, 0.25, 0.5, 0.75, 0.9] as const;

Deno.test("beta symmetric: dbeta", () => {
  const actual = SYM_X.map((x) => dbeta({ at: x, alpha: 2, beta: 2 }));
  assertArrayClose(actual, ref.sym_pdf, TOL, "sym_pdf");
});

Deno.test("beta symmetric: pbeta", () => {
  const actual = SYM_X.map((x) => pbeta({ at: x, alpha: 2, beta: 2 }));
  assertArrayClose(actual, ref.sym_cdf, TOL, "sym_cdf");
});

Deno.test("beta symmetric: qbeta", () => {
  const actual = SYM_P.map((p) =>
    qbeta({ probability: p, alpha: 2, beta: 2 })
  );
  assertArrayClose(actual, ref.sym_quantile, TOL, "sym_quantile");
});

// --- Asymmetric beta (alpha=0.5, beta=5) ---

const ASYM_X = [0.01, 0.05, 0.1, 0.3, 0.5] as const;
const ASYM_P = [0.1, 0.5, 0.9] as const;

Deno.test("beta asymmetric: dbeta", () => {
  const actual = ASYM_X.map((x) => dbeta({ at: x, alpha: 0.5, beta: 5 }));
  assertArrayClose(actual, ref.asym_pdf, TOL, "asym_pdf");
});

Deno.test("beta asymmetric: pbeta", () => {
  const actual = ASYM_X.map((x) => pbeta({ at: x, alpha: 0.5, beta: 5 }));
  assertArrayClose(actual, ref.asym_cdf, TOL, "asym_cdf");
});

Deno.test("beta asymmetric: qbeta", () => {
  const actual = ASYM_P.map((p) =>
    qbeta({ probability: p, alpha: 0.5, beta: 5 })
  );
  assertArrayClose(actual, ref.asym_quantile, TOL, "asym_quantile");
});

// --- Upper tail ---

Deno.test("beta: pbeta upper tail", () => {
  const actual = pbeta({ at: 0.3, alpha: 2, beta: 5, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log scale ---

Deno.test("beta: dbeta log", () => {
  const actual = dbeta({ at: 0.5, alpha: 2, beta: 2, returnLog: true });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

Deno.test("beta: pbeta log", () => {
  const actual = pbeta({ at: 0.5, alpha: 2, beta: 2, returnLog: true });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});

// --- Edge cases ---

Deno.test("beta edge: dbeta(0, 0.5, 2) = Inf", () => {
  const actual = dbeta({ at: 0, alpha: 0.5, beta: 2 });
  expect(actual).toBe(Infinity);
});

Deno.test("beta edge: dbeta(1, 2, 0.5) = Inf", () => {
  const actual = dbeta({ at: 1, alpha: 2, beta: 0.5 });
  expect(actual).toBe(Infinity);
});

Deno.test("beta edge: dbeta(0, 2, 2) = 0", () => {
  const actual = dbeta({ at: 0, alpha: 2, beta: 2 });
  expect(actual).toBe(0);
});

// --- p-q round trip (alpha=0.8, beta=2) ---

Deno.test("beta: p-q round trip", () => {
  const xs = [0.1, 0.3, 0.5, 0.7, 0.9];
  const actual = xs.map((x) =>
    qbeta({
      probability: pbeta({ at: x, alpha: 0.8, beta: 2 }),
      alpha: 0.8,
      beta: 2,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
