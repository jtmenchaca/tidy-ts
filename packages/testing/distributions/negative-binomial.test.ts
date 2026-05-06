import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dnbinom,
  pnbinom,
  qnbinom,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface NbinomRef {
  dnbinom_s5p05: number[];
  pnbinom_s5p05: number[];
  qnbinom_s5p05: number[];
  dnbinom_s12p05: number[];
  pnbinom_s12p05: number[];
  qnbinom_s12p05: number[];
  pnbinom_upper: number;
  dnbinom_log: number;
  cumsum_dnbinom: number[];
  pnbinom_0_7: number[];
  cumsum_matches: boolean;
  pnbinom_pr842: number[];
  dnbinom_poisson: number[];
  dpois_lambda5: number[];
  pnbinom_log: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<NbinomRef>(
  new URL("./negative-binomial-ref.R", import.meta.url).pathname,
);

// --- size=5, prob=0.5: density ---

Deno.test("dnbinom: size=5, prob=0.5", () => {
  const xs = [0, 2, 5, 8, 12];
  const actual = xs.map((x) =>
    dnbinom({ at: x, numberOfSuccesses: 5, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.dnbinom_s5p05, TOL, "dnbinom_s5p05");
});

// --- size=5, prob=0.5: CDF ---

Deno.test("pnbinom: size=5, prob=0.5", () => {
  const xs = [0, 2, 5, 8, 12];
  const actual = xs.map((x) =>
    pnbinom({ at: x, numberOfSuccesses: 5, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.pnbinom_s5p05, TOL, "pnbinom_s5p05");
});

// --- size=5, prob=0.5: quantile ---

Deno.test("qnbinom: size=5, prob=0.5", () => {
  const ps = [0.1, 0.25, 0.5, 0.75, 0.9];
  const actual = ps.map((p) =>
    qnbinom({ probability: p, numberOfSuccesses: 5, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.qnbinom_s5p05, TOL, "qnbinom_s5p05");
});

// --- size=1.2, prob=0.5: density ---

Deno.test("dnbinom: size=1.2, prob=0.5", () => {
  const xs = [0, 1, 3, 5, 7];
  const actual = xs.map((x) =>
    dnbinom({ at: x, numberOfSuccesses: 1.2, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.dnbinom_s12p05, TOL, "dnbinom_s12p05");
});

// --- size=1.2, prob=0.5: CDF ---

Deno.test("pnbinom: size=1.2, prob=0.5", () => {
  const xs = [0, 1, 3, 5, 7];
  const actual = xs.map((x) =>
    pnbinom({ at: x, numberOfSuccesses: 1.2, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.pnbinom_s12p05, TOL, "pnbinom_s12p05");
});

// --- size=1.2, prob=0.5: quantile ---

Deno.test("qnbinom: size=1.2, prob=0.5", () => {
  const ps = [0.1, 0.5, 0.9];
  const actual = ps.map((p) =>
    qnbinom({
      probability: p,
      numberOfSuccesses: 1.2,
      probabilityOfSuccess: 0.5,
    })
  );
  assertArrayClose(actual, ref.qnbinom_s12p05, TOL, "qnbinom_s12p05");
});

// --- Upper tail ---

Deno.test("pnbinom: upper tail", () => {
  const actual = pnbinom({
    at: 5,
    numberOfSuccesses: 5,
    probabilityOfSuccess: 0.5,
    direction: "above",
  });
  assertClose(actual, ref.pnbinom_upper, TOL, "pnbinom_upper");
});

// --- Log density ---

Deno.test("dnbinom: log density", () => {
  const actual = dnbinom({
    at: 3,
    numberOfSuccesses: 5,
    probabilityOfSuccess: 0.5,
    returnLog: true,
  });
  assertClose(actual, ref.dnbinom_log, TOL, "dnbinom_log");
});

// --- Cumsum consistency ---

Deno.test("dnbinom: cumsum equals pnbinom", () => {
  expect(ref.cumsum_matches).toBe(true);
  assertArrayClose(
    ref.cumsum_dnbinom,
    ref.pnbinom_0_7,
    1e-14,
    "cumsum_vs_pnbinom",
  );
});

// --- PR#842: fractional size ---

Deno.test("pnbinom: PR#842 fractional size", () => {
  const xs = [1, 3];
  const actual = xs.map((x) =>
    pnbinom({ at: x, numberOfSuccesses: 0.9, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.pnbinom_pr842, TOL, "pnbinom_pr842");
});

// --- Convergence to Poisson ---

Deno.test("dnbinom: convergence to Poisson", () => {
  const xs = Array.from({ length: 11 }, (_, i) => i);
  const size = 1e6;
  const prob = size / (size + 5);
  const actual = xs.map((x) =>
    dnbinom({ at: x, numberOfSuccesses: size, probabilityOfSuccess: prob })
  );
  // dnbinom with large size should approximate dpois(lambda=5)
  assertArrayClose(actual, ref.dnbinom_poisson, TOL, "dnbinom_poisson");
  // Also verify R's own Poisson values are close to the nbinom values
  assertArrayClose(
    ref.dnbinom_poisson,
    ref.dpois_lambda5,
    1e-4,
    "nbinom_vs_poisson",
  );
});

// --- Log CDF ---

Deno.test("pnbinom: log CDF", () => {
  const actual = pnbinom({
    at: 5,
    numberOfSuccesses: 5,
    probabilityOfSuccess: 0.5,
    returnLog: true,
  });
  assertClose(actual, ref.pnbinom_log, TOL, "pnbinom_log");
});

// --- p-q round trip ---

Deno.test("negative-binomial: p-q round trip", () => {
  const f1 = 1 - 1e-7;
  const actual = ref.rt_x.map((x) =>
    qnbinom({
      probability: pnbinom({ at: x, numberOfSuccesses: 5, probabilityOfSuccess: 0.5 }) * f1,
      numberOfSuccesses: 5,
      probabilityOfSuccess: 0.5,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
