import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dgamma,
  pgamma,
  qgamma,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface GammaRef {
  dgamma_s2r1: number[];
  pgamma_s2r1: number[];
  qgamma_s2r1: number[];
  dgamma_s05r2: number[];
  pgamma_s05r2: number[];
  qgamma_s05r2: number[];
  pgamma_upper: number;
  dgamma_log: number;
  pgamma_log: number;
  dgamma_zero_shape05: number;
  dgamma_zero_shape1: number;
  dgamma_zero_shape2: number;
  qgamma_small_shape: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<GammaRef>(
  new URL("./gamma-ref.R", import.meta.url).pathname,
);

// --- shape=2, rate=1: density ---

Deno.test("dgamma: shape=2, rate=1", () => {
  const xs = [0.5, 1, 2, 3, 5];
  const actual = xs.map((x) => dgamma({ at: x, shape: 2, rate: 1 }));
  assertArrayClose(actual, ref.dgamma_s2r1, TOL, "dgamma_s2r1");
});

// --- shape=2, rate=1: CDF ---

Deno.test("pgamma: shape=2, rate=1", () => {
  const xs = [0.5, 1, 2, 3, 5];
  const actual = xs.map((x) => pgamma({ at: x, shape: 2, rate: 1 }));
  assertArrayClose(actual, ref.pgamma_s2r1, TOL, "pgamma_s2r1");
});

// --- shape=2, rate=1: quantile ---

Deno.test("qgamma: shape=2, rate=1", () => {
  const ps = [0.1, 0.25, 0.5, 0.75, 0.9];
  const actual = ps.map((p) => qgamma({ probability: p, shape: 2, rate: 1 }));
  assertArrayClose(actual, ref.qgamma_s2r1, TOL, "qgamma_s2r1");
});

// --- shape=0.5, rate=2: density ---

Deno.test("dgamma: shape=0.5, rate=2", () => {
  const xs = [0.1, 0.5, 1, 2];
  const actual = xs.map((x) => dgamma({ at: x, shape: 0.5, rate: 2 }));
  assertArrayClose(actual, ref.dgamma_s05r2, TOL, "dgamma_s05r2");
});

// --- shape=0.5, rate=2: CDF ---

Deno.test("pgamma: shape=0.5, rate=2", () => {
  const xs = [0.1, 0.5, 1, 2];
  const actual = xs.map((x) => pgamma({ at: x, shape: 0.5, rate: 2 }));
  assertArrayClose(actual, ref.pgamma_s05r2, TOL, "pgamma_s05r2");
});

// --- shape=0.5, rate=2: quantile ---

Deno.test("qgamma: shape=0.5, rate=2", () => {
  const ps = [0.1, 0.5, 0.9];
  const actual = ps.map((p) =>
    qgamma({ probability: p, shape: 0.5, rate: 2 })
  );
  assertArrayClose(actual, ref.qgamma_s05r2, TOL, "qgamma_s05r2");
});

// --- Upper tail ---

Deno.test("pgamma: upper tail", () => {
  const actual = pgamma({ at: 2, shape: 2, rate: 1, direction: "above" });
  assertClose(actual, ref.pgamma_upper, TOL, "pgamma_upper");
});

// --- Log density and log probability ---

Deno.test("dgamma: log density", () => {
  const actual = dgamma({ at: 1, shape: 2, rate: 1, returnLog: true });
  assertClose(actual, ref.dgamma_log, TOL, "dgamma_log");
});

Deno.test("pgamma: log probability", () => {
  const actual = pgamma({ at: 1, shape: 2, rate: 1, returnLog: true });
  assertClose(actual, ref.pgamma_log, TOL, "pgamma_log");
});

// --- Edge cases at x=0 ---

Deno.test("dgamma: x=0 edge cases", () => {
  // shape < 1: density at 0 is Inf
  const d05 = dgamma({ at: 0, shape: 0.5, rate: 1 });
  expect(d05).toBe(Infinity);

  // shape = 1: density at 0 equals rate
  const d1 = dgamma({ at: 0, shape: 1, rate: 1 });
  assertClose(d1, ref.dgamma_zero_shape1, TOL, "dgamma_zero_shape1");

  // shape > 1: density at 0 is 0
  const d2 = dgamma({ at: 0, shape: 2, rate: 1 });
  assertClose(d2, ref.dgamma_zero_shape2, TOL, "dgamma_zero_shape2");
});

// --- Small shape ---

Deno.test("qgamma: small shape parameter", () => {
  const actual = qgamma({ probability: 0.5, shape: 1e-10, rate: 1 });
  assertClose(actual, ref.qgamma_small_shape, TOL, "qgamma_small_shape");
});

// --- p-q round trip (scale=5 means rate=0.2) ---

Deno.test("qgamma(pgamma(x)) round trip", () => {
  const rate = 1 / 5; // scale=5 => rate=0.2
  const xs = ref.rt_x;
  const actual = xs.map((x) =>
    qgamma({
      probability: pgamma({ at: x, shape: 2, rate }),
      shape: 2,
      rate,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
