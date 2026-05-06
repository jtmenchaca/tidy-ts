// Coverage of d-p-q-r-tests.R:
// [x] L71-74:  Geometric: dgeom == p*(1-p)^x, cumsum(dgeom) == pgeom
// [x] L53-68:  Binomial: cumsum(dbinom) == pbinom
// [x] L104-116: Poisson: dpois(0:5,0) edge case, cumsum(dpois)==ppois
// [x] L95-100: Negative binomial: cumsum(dnbinom)==pnbinom, PR#842 values
// [x] L77-91:  Hypergeometric: cumsum(dhyper)==phyper
// [x] L220-243: Normal: qnorm boundary values, Wichura test data, sd=0/Inf edge
// [x] L346-368: p-q inversion for 15 distributions (continuous + discrete)

import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../../statistical_tests/helpers.ts";
import {
  dbinom,
  dgeom,
  dhyper,
  dnbinom,
  dnorm,
  dpois,
  pbeta,
  pbinom,
  pchisq,
  pexp,
  pf,
  pgamma,
  pgeom,
  phyper,
  plnorm,
  pnbinom,
  pnorm,
  ppois,
  pt,
  punif,
  pweibull,
  qbeta,
  qbinom,
  qchisq,
  qexp,
  qf,
  qgamma,
  qgeom,
  qhyper,
  qlnorm,
  qnbinom,
  qnorm,
  qpois,
  qt,
  qunif,
  qweibull,
} from "../../../dataframe/ts/stats/distributions/index.ts";

const refPath = new URL(
  "./dpqr-consistency-source-test.R",
  import.meta.url,
).pathname;

// deno-lint-ignore no-explicit-any
const ref = getReferenceFromRScript<any>(refPath);

// -- Discrete distribution consistency: cumsum(d) == p --

Deno.test("L71-74: Geometric cumsum(dgeom) == pgeom", () => {
  const x: number[] = ref.geom_x;
  const pr: number = ref.geom_pr;
  const d = x.map((xi) => dgeom({ at: xi, probabilityOfSuccess: pr }));
  const p = x.map((xi) => pgeom({ at: xi, probabilityOfSuccess: pr }));
  assertArrayClose(d, ref.geom_d, TOL, "dgeom");
  assertArrayClose(p, ref.geom_p, TOL, "pgeom");
  // cumsum(d) == p
  const cumD: number[] = [];
  let sum = 0;
  for (const v of d) {
    sum += v;
    cumD.push(sum);
  }
  assertArrayClose(cumD, p, TOL, "cumsum(dgeom)==pgeom");
});

Deno.test("L53-68: Binomial cumsum(dbinom) == pbinom", () => {
  const x: number[] = ref.binom_x;
  const d = x.map((xi) =>
    dbinom({ at: xi, trials: ref.binom_n, probabilityOfSuccess: ref.binom_p })
  );
  const p = x.map((xi) =>
    pbinom({ at: xi, trials: ref.binom_n, probabilityOfSuccess: ref.binom_p })
  );
  assertArrayClose(d, ref.binom_d, TOL, "dbinom");
  assertArrayClose(p, ref.binom_P, TOL, "pbinom");
  const cumD: number[] = [];
  let sum = 0;
  for (const v of d) {
    sum += v;
    cumD.push(sum);
  }
  assertArrayClose(cumD, p, TOL, "cumsum(dbinom)==pbinom");
});

Deno.test("L104-105: Poisson dpois(0:5, 0) edge case", () => {
  const d = [0, 1, 2, 3, 4, 5].map((xi) =>
    dpois({ at: xi, rateLambda: 0 })
  );
  assertArrayClose(d, ref.pois_zero, TOL, "dpois(0:5,0)");
});

Deno.test("L107-116: Poisson cumsum(dpois) == ppois", () => {
  const x: number[] = ref.pois_x;
  const d = x.map((xi) => dpois({ at: xi, rateLambda: ref.pois_lam }));
  const p = x.map((xi) => ppois({ at: xi, rateLambda: ref.pois_lam }));
  assertArrayClose(d, ref.pois_d, TOL, "dpois");
  assertArrayClose(p, ref.pois_P, TOL, "ppois");
  const cumD: number[] = [];
  let sum = 0;
  for (const v of d) {
    sum += v;
    cumD.push(sum);
  }
  assertArrayClose(cumD, p, TOL, "cumsum(dpois)==ppois");
});

Deno.test("L95-100: Negative binomial cumsum(dnbinom) == pnbinom + PR#842", () => {
  const x: number[] = ref.nb_x;
  const d = x.map((xi) =>
    dnbinom({
      at: xi,
      numberOfSuccesses: ref.nb_size,
      probabilityOfSuccess: ref.nb_prob,
    })
  );
  const p = x.map((xi) =>
    pnbinom({
      at: xi,
      numberOfSuccesses: ref.nb_size,
      probabilityOfSuccess: ref.nb_prob,
    })
  );
  assertArrayClose(d, ref.nb_d, TOL, "dnbinom");
  assertArrayClose(p, ref.nb_P, TOL, "pnbinom");
  const cumD: number[] = [];
  let sum = 0;
  for (const v of d) {
    sum += v;
    cumD.push(sum);
  }
  assertArrayClose(cumD, p, TOL, "cumsum(dnbinom)==pnbinom");

  // PR#842 specific values
  const pr842 = [1, 3].map((xi) =>
    pnbinom({ at: xi, numberOfSuccesses: 0.9, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(pr842, ref.nb_pr842_p, TOL, "PR#842");
});

Deno.test("L77-91: Hypergeometric cumsum(dhyper) == phyper", () => {
  const x: number[] = ref.hyper_x;
  const d = x.map((xi) =>
    dhyper({
      at: xi,
      populationSuccesses: ref.hyper_m,
      populationFailures: ref.hyper_n,
      drawSize: ref.hyper_k,
    })
  );
  const p = x.map((xi) =>
    phyper({
      at: xi,
      populationSuccesses: ref.hyper_m,
      populationFailures: ref.hyper_n,
      drawSize: ref.hyper_k,
    })
  );
  assertArrayClose(d, ref.hyper_d, TOL, "dhyper");
  assertArrayClose(p, ref.hyper_P, TOL, "phyper");
  const cumD: number[] = [];
  let sum = 0;
  for (const v of d) {
    sum += v;
    cumD.push(sum);
  }
  assertArrayClose(cumD, p, TOL, "cumsum(dhyper)==phyper");
});

// -- Normal boundary values --

Deno.test("L220-222: Normal qnorm boundary values", () => {
  expect(qnorm({ probability: 0 })).toBe(-Infinity);
  expect(qnorm({ probability: 1 })).toBe(Infinity);
});

Deno.test("L236-239: Normal Wichura test values", () => {
  const probs = [0.25, 0.001, 1e-20];
  const expected: number[] = ref.norm_wichura;
  for (let i = 0; i < probs.length; i++) {
    assertClose(
      qnorm({ probability: probs[i] }),
      expected[i],
      TOL,
      `qnorm(${probs[i]})`,
    );
  }
});

Deno.test("L228-233: Normal sd=0 edge cases", () => {
  const x: number[] = ref.norm_x;
  // dnorm(x, 3, sd=0): Inf at x=3, 0 elsewhere
  for (let i = 0; i < x.length; i++) {
    const d = dnorm({ at: x[i], mean: 3, standardDeviation: 0 });
    const expected = ref.norm_d_sd0[i];
    if (expected === Infinity) {
      expect(d).toBe(Infinity);
    } else {
      assertClose(d, expected, TOL, `dnorm(${x[i]},3,0)`);
    }
  }
  // pnorm(x, 3, sd=0): 0 for x<3, 1 for x>=3
  for (let i = 0; i < x.length; i++) {
    assertClose(
      pnorm({ at: x[i], mean: 3, standardDeviation: 0 }),
      ref.norm_p_sd0[i],
      TOL,
      `pnorm(${x[i]},3,0)`,
    );
  }
});

// -- p-q inversion: continuous distributions --

Deno.test("L346-368: p-q inversion -- beta", () => {
  const x: number[] = ref.pq_beta_x;
  const p = x.map((xi) => pbeta({ at: xi, alpha: 0.8, beta: 2 }));
  const q = p.map((pi) => qbeta({ probability: pi, alpha: 0.8, beta: 2 }));
  assertArrayClose(q, ref.pq_beta_q, TOL, "q(p(beta))");
});

Deno.test("L346-368: p-q inversion -- normal", () => {
  const x: number[] = ref.pq_norm_x;
  const p = x.map((xi) =>
    pnorm({ at: xi, mean: -1, standardDeviation: 3 })
  );
  const q = p.map((pi) =>
    qnorm({ probability: pi, mean: -1, standardDeviation: 3 })
  );
  assertArrayClose(q, ref.pq_norm_q, TOL, "q(p(norm))");
});

Deno.test("L346-368: p-q inversion -- gamma", () => {
  const x: number[] = ref.pq_gamma_x;
  // Our gamma uses rate, R uses scale=5 => rate=1/5=0.2
  const p = x.map((xi) => pgamma({ at: xi, shape: 2, rate: 0.2 }));
  const q = p.map((pi) => qgamma({ probability: pi, shape: 2, rate: 0.2 }));
  assertArrayClose(q, ref.pq_gamma_q, TOL, "q(p(gamma))");
});

Deno.test("L346-368: p-q inversion -- exponential", () => {
  const x: number[] = ref.pq_exp_x;
  const p = x.map((xi) => pexp({ at: xi, rate: 2 }));
  const q = p.map((pi) => qexp({ probability: pi, rate: 2 }));
  assertArrayClose(q, ref.pq_exp_q, TOL, "q(p(exp))");
});

Deno.test("L346-368: p-q inversion -- chi-squared", () => {
  const x: number[] = ref.pq_chisq_x;
  const p = x.map((xi) => pchisq({ at: xi, degreesOfFreedom: 3 }));
  const q = p.map((pi) => qchisq({ probability: pi, degreesOfFreedom: 3 }));
  assertArrayClose(q, ref.pq_chisq_q, TOL, "q(p(chisq))");
});

Deno.test("L346-368: p-q inversion -- t", () => {
  const x: number[] = ref.pq_t_x;
  const p = x.map((xi) => pt({ at: xi, degreesOfFreedom: 11 }));
  const q = p.map((pi) => qt({ probability: pi, degreesOfFreedom: 11 }));
  assertArrayClose(q, ref.pq_t_q, TOL, "q(p(t))");
});

Deno.test("L346-368: p-q inversion -- F", () => {
  const x: number[] = ref.pq_f_x;
  const p = x.map((xi) =>
    pf({ at: xi, numeratorDegreesOfFreedom: 12, denominatorDegreesOfFreedom: 6 })
  );
  const q = p.map((pi) =>
    qf({
      probability: pi,
      numeratorDegreesOfFreedom: 12,
      denominatorDegreesOfFreedom: 6,
    })
  );
  assertArrayClose(q, ref.pq_f_q, TOL, "q(p(f))");
});

Deno.test("L346-368: p-q inversion -- uniform", () => {
  const x: number[] = ref.pq_unif_x;
  const p = x.map((xi) => punif({ at: xi, minimum: 0.2, maximum: 2 }));
  const q = p.map((pi) =>
    qunif({ probability: pi, minimum: 0.2, maximum: 2 })
  );
  assertArrayClose(q, ref.pq_unif_q, TOL, "q(p(unif))");
});

Deno.test("L346-368: p-q inversion -- Weibull", () => {
  const x: number[] = ref.pq_weibull_x;
  const p = x.map((xi) => pweibull({ at: xi, shape: 3, scale: 2 }));
  const q = p.map((pi) => qweibull({ probability: pi, shape: 3, scale: 2 }));
  assertArrayClose(q, ref.pq_weibull_q, TOL, "q(p(weibull))");
});

Deno.test("L346-368: p-q inversion -- log-normal", () => {
  const x: number[] = ref.pq_lnorm_x;
  const p = x.map((xi) =>
    plnorm({ at: xi, meanLog: -1, standardDeviationLog: 3 })
  );
  const q = p.map((pi) =>
    qlnorm({ probability: pi, meanLog: -1, standardDeviationLog: 3 })
  );
  assertArrayClose(q, ref.pq_lnorm_q, TOL, "q(p(lnorm))");
});

// -- p-q inversion: discrete distributions (with f1 = 1-1e-7 fudge) --

Deno.test("L346-368: p-q inversion -- binomial", () => {
  const x: number[] = ref.pq_binom_x;
  const f1 = 1 - 1e-7;
  const p = x.map((xi) =>
    pbinom({ at: xi, trials: 20, probabilityOfSuccess: 0.3 })
  );
  const q = p.map((pi) =>
    qbinom({ probability: pi * f1, trials: 20, probabilityOfSuccess: 0.3 })
  );
  assertArrayClose(q, ref.pq_binom_q, TOL, "q(p(binom))");
});

Deno.test({ name: "L346-368: p-q inversion -- Poisson", fn() {
  const x: number[] = ref.pq_pois_x;
  const f1 = 1 - 1e-7;
  const p = x.map((xi) => ppois({ at: xi, rateLambda: 5 }));
  const q = p.map((pi) => qpois({ probability: pi * f1, rateLambda: 5 }));
  assertArrayClose(q, ref.pq_pois_q, TOL, "q(p(pois))");
}});

Deno.test("L346-368: p-q inversion -- geometric", () => {
  const x: number[] = ref.pq_geom_x;
  const f1 = 1 - 1e-7;
  const p = x.map((xi) => pgeom({ at: xi, probabilityOfSuccess: 0.3 }));
  const q = p.map((pi) =>
    qgeom({ probability: pi * f1, probabilityOfSuccess: 0.3 })
  );
  assertArrayClose(q, ref.pq_geom_q, TOL, "q(p(geom))");
});

Deno.test("L346-368: p-q inversion -- negative binomial", () => {
  const x: number[] = ref.pq_nbinom_x;
  const f1 = 1 - 1e-7;
  const p = x.map((xi) =>
    pnbinom({ at: xi, numberOfSuccesses: 7, probabilityOfSuccess: 0.5 })
  );
  const q = p.map((pi) =>
    qnbinom({
      probability: pi * f1,
      numberOfSuccesses: 7,
      probabilityOfSuccess: 0.5,
    })
  );
  assertArrayClose(q, ref.pq_nbinom_q, TOL, "q(p(nbinom))");
});

Deno.test({ name: "L346-368: p-q inversion -- hypergeometric", fn() {
  const x: number[] = ref.pq_hyper_x;
  const f1 = 1 - 1e-7;
  const p = x.map((xi) =>
    phyper({
      at: xi,
      populationSuccesses: 40,
      populationFailures: 30,
      drawSize: 20,
    })
  );
  const q = p.map((pi) =>
    qhyper({
      probability: pi * f1,
      populationSuccesses: 40,
      populationFailures: 30,
      drawSize: 20,
    })
  );
  assertArrayClose(q, ref.pq_hyper_q, TOL, "q(p(hyper))");
}});
