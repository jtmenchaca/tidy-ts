import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dbinom,
  pbinom,
  qbinom,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface BinomialRef {
  std_pdf: number[];
  std_cdf: number[];
  std_quantile: number[];
  ns_pdf: number[];
  ns_cdf: number[];
  ns_quantile: number[];
  upper_tail: number;
  log_pdf: number;
  edge_p0: number;
  edge_p1: number;
  cumsum_pdf: number[];
  cumsum_cdf: number[];
  log_cdf: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<BinomialRef>(
  new URL("./binomial-ref.R", import.meta.url).pathname,
);

// --- Binomial (n=10, p=0.5) ---

const STD_K = [0, 3, 5, 7, 10] as const;
const STD_P = [0.1, 0.25, 0.5, 0.75, 0.9] as const;

Deno.test("binomial n=10 p=0.5: dbinom", () => {
  const actual = STD_K.map((k) =>
    dbinom({ at: k, trials: 10, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.std_pdf, TOL, "std_pdf");
});

Deno.test("binomial n=10 p=0.5: pbinom", () => {
  const actual = STD_K.map((k) =>
    pbinom({ at: k, trials: 10, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.std_cdf, TOL, "std_cdf");
});

Deno.test("binomial n=10 p=0.5: qbinom", () => {
  const actual = STD_P.map((p) =>
    qbinom({ probability: p, trials: 10, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.std_quantile, TOL, "std_quantile");
});

// --- Binomial (n=20, p=0.3) ---

const NS_K = [0, 3, 6, 10, 15, 20] as const;
const NS_P = [0.1, 0.5, 0.9] as const;

Deno.test("binomial n=20 p=0.3: dbinom", () => {
  const actual = NS_K.map((k) =>
    dbinom({ at: k, trials: 20, probabilityOfSuccess: 0.3 })
  );
  assertArrayClose(actual, ref.ns_pdf, TOL, "ns_pdf");
});

Deno.test("binomial n=20 p=0.3: pbinom", () => {
  const actual = NS_K.map((k) =>
    pbinom({ at: k, trials: 20, probabilityOfSuccess: 0.3 })
  );
  assertArrayClose(actual, ref.ns_cdf, TOL, "ns_cdf");
});

Deno.test("binomial n=20 p=0.3: qbinom", () => {
  const actual = NS_P.map((p) =>
    qbinom({ probability: p, trials: 20, probabilityOfSuccess: 0.3 })
  );
  assertArrayClose(actual, ref.ns_quantile, TOL, "ns_quantile");
});

// --- Upper tail ---

Deno.test("binomial: pbinom upper tail", () => {
  const actual = pbinom({
    at: 5,
    trials: 10,
    probabilityOfSuccess: 0.5,
    direction: "above",
  });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log scale ---

Deno.test("binomial: dbinom log", () => {
  const actual = dbinom({
    at: 5,
    trials: 10,
    probabilityOfSuccess: 0.5,
    returnLog: true,
  });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

// --- Edge cases ---

Deno.test("binomial edge: dbinom(0, n=10, p=0) = 1", () => {
  const actual = dbinom({ at: 0, trials: 10, probabilityOfSuccess: 0 });
  expect(actual).toBe(1);
});

Deno.test("binomial edge: dbinom(10, n=10, p=1) = 1", () => {
  const actual = dbinom({ at: 10, trials: 10, probabilityOfSuccess: 1 });
  expect(actual).toBe(1);
});

// --- Cumsum consistency ---

Deno.test("binomial: cumsum(dbinom) == pbinom", () => {
  const ks = Array.from({ length: 11 }, (_, i) => i);
  const pdfValues = ks.map((k) =>
    dbinom({ at: k, trials: 10, probabilityOfSuccess: 0.5 })
  );
  const cumsum: number[] = [];
  let sum = 0;
  for (const v of pdfValues) {
    sum += v;
    cumsum.push(sum);
  }
  assertArrayClose(cumsum, ref.cumsum_cdf, TOL, "cumsum_consistency");
});

// --- Log CDF ---

Deno.test("binomial: pbinom log CDF", () => {
  const actual = pbinom({
    at: 5,
    trials: 10,
    probabilityOfSuccess: 0.5,
    returnLog: true,
  });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});

// --- p-q round trip ---

Deno.test("binomial: p-q round trip", () => {
  const f1 = 1 - 1e-7;
  const actual = ref.rt_x.map((x) =>
    qbinom({
      probability: pbinom({ at: x, trials: 10, probabilityOfSuccess: 0.5 }) * f1,
      trials: 10,
      probabilityOfSuccess: 0.5,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
