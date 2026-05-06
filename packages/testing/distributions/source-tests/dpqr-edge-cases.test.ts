// Coverage of d-p-q-r-tst-2.R:
// [x] L48-92:  Extreme tail tests (pexp, pgamma, pt, pbinom, pgeom)
// [x] L95-99:  dt with large x and log scale
// [x] L131-134: df(0, df1, df2) for various df1
// [x] L169-211: qt near zero and extreme tails
// [x] L214-233: pbeta log upper tail
// [x] L283-296: dnbinom extreme size/mu convergence to dpois
// [x] L338-356: qgamma small shape, qpois lambda=0
// [x] L449-453: Lognormal sdlog=0 boundary
// [x] L791-828: qnorm extreme tails
// [x] L552-561: Chi-squared df=0 (point mass at 0)

import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../../statistical_tests/helpers.ts";
import {
  dchisq,
  df,
  dlnorm,
  dnbinom,
  dpois,
  dt,
  pbeta,
  pbinom,
  pchisq,
  pexp,
  pgamma,
  pgeom,
  plnorm,
  pt,
  qgamma,
  qnorm,
  qpois,
  qt,
} from "../../../dataframe/ts/stats/distributions/index.ts";

const refPath = new URL(
  "./dpqr-edge-cases-source-test.R",
  import.meta.url,
).pathname;

// deno-lint-ignore no-explicit-any
const ref = getReferenceFromRScript<any>(refPath);

// -- Extreme tail tests --

Deno.test("L48-92: pexp extreme tails", () => {
  const x = [1e1, 1e5, 1e10, 1e100, 1e300];
  const p = x.map((xi) => pexp({ at: xi, rate: 1 }));
  assertArrayClose(p, ref.pexp_extreme, TOL, "pexp extreme");
});

Deno.test("L48-92: pgamma extreme tails", () => {
  const x = [1e1, 1e5, 1e10, 1e100, 1e300];
  const p = x.map((xi) => pgamma({ at: xi, shape: 2, rate: 1 }));
  assertArrayClose(p, ref.pgamma_extreme, TOL, "pgamma extreme");
});

Deno.test("L48-92: pt extreme tails", () => {
  const x = [-1e1, -1e5, -1e10, -1e100, -1e300];
  const p = x.map((xi) => pt({ at: xi, degreesOfFreedom: 5 }));
  assertArrayClose(p, ref.pt_extreme, TOL, "pt extreme");
});

Deno.test("L48-92: pbinom extreme tails", () => {
  const x = [0, 5, 10];
  const p = x.map((xi) =>
    pbinom({ at: xi, trials: 100, probabilityOfSuccess: 0.01 })
  );
  assertArrayClose(p, ref.pbinom_extreme, TOL, "pbinom extreme");
});

Deno.test("L48-92: pgeom extreme tails", () => {
  const x = [0, 10, 100, 1000];
  const p = x.map((xi) => pgeom({ at: xi, probabilityOfSuccess: 0.5 }));
  assertArrayClose(p, ref.pgeom_extreme, TOL, "pgeom extreme");
});

// -- dt with large x --

Deno.test("L95-99: dt(1e155, df=5, log=TRUE) not -Inf", () => {
  const result = dt({ at: 1e155, degreesOfFreedom: 5, returnLog: true });
  expect(result).not.toBe(-Infinity);
  assertClose(result, ref.dt_large_x, TOL, "dt large x log");
});

// -- df at zero --

Deno.test("L131-134: df(0, df1, df2) for various df1", () => {
  const d1 = df({
    at: 0,
    numeratorDegreesOfFreedom: 1,
    denominatorDegreesOfFreedom: 5,
  });
  expect(d1).toBe(Infinity);

  const d2 = df({
    at: 0,
    numeratorDegreesOfFreedom: 2,
    denominatorDegreesOfFreedom: 5,
  });
  assertClose(d2, 1, TOL, "df(0,2,5)");

  const d3 = df({
    at: 0,
    numeratorDegreesOfFreedom: 3,
    denominatorDegreesOfFreedom: 5,
  });
  assertClose(d3, 0, TOL, "df(0,3,5)");
});

// -- qt near zero --

Deno.test("L169-211: qt(0.5, df) == 0", () => {
  for (const dfv of [1, 2, 4, 10, 100]) {
    assertClose(
      qt({ probability: 0.5, degreesOfFreedom: dfv }),
      0,
      TOL,
      `qt(0.5, df=${dfv})`,
    );
  }
});

Deno.test("L169-211: qt extreme tails df=1", () => {
  const p: number[] = ref.qt_extreme_p;
  const q = p.map((pi) => qt({ probability: pi, degreesOfFreedom: 1 }));
  assertArrayClose(q, ref.qt_extreme_df1, TOL, "qt extreme df=1");
});

Deno.test("L169-211: qt extreme tails df=4", () => {
  const p: number[] = ref.qt_extreme_p;
  const q = p.map((pi) => qt({ probability: pi, degreesOfFreedom: 4 }));
  assertArrayClose(q, ref.qt_extreme_df4, TOL, "qt extreme df=4");
});

// -- pbeta log --

Deno.test("L214-233: pbeta log upper tail", () => {
  const result = pbeta({
    at: 0.01,
    alpha: 2,
    beta: 5,
    direction: "above",
    returnLog: true,
  });
  assertClose(result, ref.pbeta_log, TOL, "pbeta log upper");
});

// -- dnbinom -> dpois convergence --

Deno.test("L283-296: dnbinom(size=1e6, mu=5) -> dpois(5)", () => {
  // When size -> Inf, negative binomial converges to Poisson
  // size=1e6, mu=5 => prob = size/(size+mu) = 1e6/(1e6+5)
  const prob = 1e6 / (1e6 + 5);
  const nb = Array.from({ length: 11 }, (_, i) =>
    dnbinom({ at: i, numberOfSuccesses: 1e6, probabilityOfSuccess: prob })
  );
  const po = Array.from({ length: 11 }, (_, i) =>
    dpois({ at: i, rateLambda: 5 })
  );
  assertArrayClose(po, ref.pois_target, TOL, "dpois target");
  // Compare our dnbinom against R's dnbinom at TOL
  assertArrayClose(nb, ref.nb_large_size, TOL, "dnbinom large size vs R");
  // Convergence check: nbinom(size=1e6) should be close to pois
  assertArrayClose(nb, po, 1e-3, "nbinom->pois convergence");
});

// -- qgamma small shape, qpois lambda=0 --

Deno.test("L338-356: qgamma(0.5, shape=1e-10) == 0", () => {
  const result = qgamma({ probability: 0.5, shape: 1e-10, rate: 1 });
  assertClose(result, ref.qgamma_small, TOL, "qgamma small shape");
});

Deno.test("L338-356: qpois(p, lambda=0) == 0", () => {
  const probs = [0, 0.5, 1 - 1e-7];
  const q = probs.map((pi) => qpois({ probability: pi, rateLambda: 0 }));
  assertArrayClose(q, ref.qpois_zero, TOL, "qpois lambda=0");
});

// -- Lognormal sdlog=0 --

Deno.test("L449-453: dlnorm(x, sdlog=0) point mass at exp(meanlog)", () => {
  const x = [0.5, 1, 2];
  const d = x.map((xi) =>
    dlnorm({ at: xi, meanLog: 0, standardDeviationLog: 0 })
  );
  // At x=1 (=exp(0)), should be Inf; elsewhere 0
  expect(d[0]).toBe(0);
  expect(d[1]).toBe(Infinity);
  expect(d[2]).toBe(0);
});

Deno.test("L449-453: plnorm(x, sdlog=0) step at exp(meanlog)", () => {
  const x = [0.5, 1, 2];
  const p = x.map((xi) =>
    plnorm({ at: xi, meanLog: 0, standardDeviationLog: 0 })
  );
  assertArrayClose(p, ref.plnorm_sd0, TOL, "plnorm sdlog=0");
});

// -- qnorm extreme tails --

Deno.test("L791-828: qnorm extreme tails", () => {
  const probs = [1e-20, 1e-50, 1e-100, 1e-200, 1e-300];
  const q = probs.map((pi) => qnorm({ probability: pi }));
  assertArrayClose(q, ref.qnorm_extreme, TOL, "qnorm extreme");
});

// -- Chi-squared df=0 --

Deno.test("L552-561: pchisq(x, df=0) point mass at 0", () => {
  const x = [-1, 0, 0.5, 1];
  const p = x.map((xi) => pchisq({ at: xi, degreesOfFreedom: 0 }));
  assertArrayClose(p, ref.pchisq_df0, TOL, "pchisq df=0");
});

Deno.test("L552-561: dchisq(x, df=0) point mass at 0", () => {
  const x = [-1, 0, 0.5, 1];
  const d = x.map((xi) => dchisq({ at: xi, degreesOfFreedom: 0 }));
  // At x=0, should be Inf; elsewhere 0
  expect(d[0]).toBe(0);
  expect(d[1]).toBe(Infinity);
  expect(d[2]).toBe(0);
  expect(d[3]).toBe(0);
});
