import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dpois,
  ppois,
  qpois,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface PoissonRef {
  std_pdf: number[];
  std_cdf: number[];
  std_quantile: number[];
  ns_pdf: number[];
  ns_cdf: number[];
  ns_quantile: number[];
  upper_tail: number;
  log_pdf: number;
  edge_lambda0_pdf: number[];
  edge_lambda0_quantile: number[];
  cumsum_pdf: number[];
  cumsum_cdf: number[];
  log_cdf: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<PoissonRef>(
  new URL("./poisson-ref.R", import.meta.url).pathname,
);

// --- Poisson (lambda=5) ---

const STD_K = [0, 1, 3, 5, 8, 12] as const;
const STD_P = [0.1, 0.25, 0.5, 0.75, 0.9] as const;

Deno.test("poisson lambda=5: dpois", () => {
  const actual = STD_K.map((k) => dpois({ at: k, rateLambda: 5 }));
  assertArrayClose(actual, ref.std_pdf, TOL, "std_pdf");
});

Deno.test("poisson lambda=5: ppois", () => {
  const actual = STD_K.map((k) => ppois({ at: k, rateLambda: 5 }));
  assertArrayClose(actual, ref.std_cdf, TOL, "std_cdf");
});

Deno.test("poisson lambda=5: qpois", () => {
  const actual = STD_P.map((p) =>
    qpois({ probability: p, rateLambda: 5 })
  );
  assertArrayClose(actual, ref.std_quantile, TOL, "std_quantile");
});

// --- Poisson (lambda=0.5) ---

const NS_K = [0, 1, 2, 3, 5] as const;
const NS_P = [0.1, 0.5, 0.9] as const;

Deno.test("poisson lambda=0.5: dpois", () => {
  const actual = NS_K.map((k) => dpois({ at: k, rateLambda: 0.5 }));
  assertArrayClose(actual, ref.ns_pdf, TOL, "ns_pdf");
});

Deno.test("poisson lambda=0.5: ppois", () => {
  const actual = NS_K.map((k) => ppois({ at: k, rateLambda: 0.5 }));
  assertArrayClose(actual, ref.ns_cdf, TOL, "ns_cdf");
});

Deno.test("poisson lambda=0.5: qpois", () => {
  const actual = NS_P.map((p) =>
    qpois({ probability: p, rateLambda: 0.5 })
  );
  assertArrayClose(actual, ref.ns_quantile, TOL, "ns_quantile");
});

// --- Upper tail ---

Deno.test("poisson: ppois upper tail", () => {
  const actual = ppois({ at: 5, rateLambda: 5, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log scale ---

Deno.test("poisson: dpois log", () => {
  const actual = dpois({ at: 5, rateLambda: 5, returnLog: true });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

// --- Edge cases ---

Deno.test("poisson edge: dpois with lambda=0", () => {
  const ks = [0, 1, 2, 3, 4, 5];
  const actual = ks.map((k) => dpois({ at: k, rateLambda: 0 }));
  assertArrayClose(actual, ref.edge_lambda0_pdf, TOL, "edge_lambda0_pdf");
});

Deno.test("poisson edge: qpois with lambda=0", () => {
  const ps = [0, 0.5, 1 - 1e-7];
  const actual = ps.map((p) => qpois({ probability: p, rateLambda: 0 }));
  assertArrayClose(
    actual,
    ref.edge_lambda0_quantile,
    TOL,
    "edge_lambda0_quantile",
  );
});

// --- Cumsum consistency ---

Deno.test("poisson: cumsum(dpois) == ppois", () => {
  const ks = Array.from({ length: 16 }, (_, i) => i);
  const pdfValues = ks.map((k) => dpois({ at: k, rateLambda: 5 }));
  const cumsum: number[] = [];
  let sum = 0;
  for (const v of pdfValues) {
    sum += v;
    cumsum.push(sum);
  }
  assertArrayClose(cumsum, ref.cumsum_cdf, TOL, "cumsum_consistency");
});

// --- Log CDF ---

Deno.test("poisson: ppois log CDF", () => {
  const actual = ppois({ at: 5, rateLambda: 5, returnLog: true });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});

// --- p-q round trip ---

Deno.test("poisson: p-q round trip", () => {
  const f1 = 1 - 1e-7;
  const actual = ref.rt_x.map((x) =>
    qpois({
      probability: ppois({ at: x, rateLambda: 5 }) * f1,
      rateLambda: 5,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
