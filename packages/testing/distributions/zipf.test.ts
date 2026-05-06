import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dzipf,
  pzipf,
  qzipf,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface ZipfRef {
  std_k: number[];
  std_pdf: number[];
  std_cdf: number[];
  std_p: number[];
  std_quantile: number[];
  ns_k: number[];
  ns_pdf: number[];
  ns_cdf: number[];
  ns_p: number[];
  ns_quantile: number[];
  log_pdf: number;
  log_cdf: number;
  edge_below: number;
  edge_above: number;
  cumsum_pdf: number[];
  cumsum_cdf: number[];
  rt_k: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<ZipfRef>(
  new URL("./zipf-ref.R", import.meta.url).pathname,
);

// --- N=10, s=1.5: density ---

Deno.test("zipf N=10 s=1.5: dzipf", () => {
  const actual = ref.std_k.map((k) =>
    dzipf({ at: k, numberOfElements: 10, exponent: 1.5 })
  );
  assertArrayClose(actual, ref.std_pdf, TOL, "std_pdf");
});

// --- N=10, s=1.5: CDF ---

Deno.test("zipf N=10 s=1.5: pzipf", () => {
  const actual = ref.std_k.map((k) =>
    pzipf({ at: k, numberOfElements: 10, exponent: 1.5 })
  );
  assertArrayClose(actual, ref.std_cdf, TOL, "std_cdf");
});

// --- N=10, s=1.5: quantile ---

Deno.test("zipf N=10 s=1.5: qzipf", () => {
  const actual = ref.std_p.map((p) =>
    qzipf({ probability: p, numberOfElements: 10, exponent: 1.5 })
  );
  assertArrayClose(actual, ref.std_quantile, TOL, "std_quantile");
});

// --- N=100, s=2: density ---

Deno.test("zipf N=100 s=2: dzipf", () => {
  const actual = ref.ns_k.map((k) =>
    dzipf({ at: k, numberOfElements: 100, exponent: 2 })
  );
  assertArrayClose(actual, ref.ns_pdf, TOL, "ns_pdf");
});

// --- N=100, s=2: CDF ---

Deno.test("zipf N=100 s=2: pzipf", () => {
  const actual = ref.ns_k.map((k) =>
    pzipf({ at: k, numberOfElements: 100, exponent: 2 })
  );
  assertArrayClose(actual, ref.ns_cdf, TOL, "ns_cdf");
});

// --- N=100, s=2: quantile ---

Deno.test("zipf N=100 s=2: qzipf", () => {
  const actual = ref.ns_p.map((p) =>
    qzipf({ probability: p, numberOfElements: 100, exponent: 2 })
  );
  assertArrayClose(actual, ref.ns_quantile, TOL, "ns_quantile");
});

// --- Log density ---

Deno.test("zipf: log density", () => {
  const actual = dzipf({
    at: 1,
    numberOfElements: 10,
    exponent: 1.5,
    returnLog: true,
  });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

// --- Log CDF ---

Deno.test("zipf: log CDF", () => {
  const actual = pzipf({
    at: 3,
    numberOfElements: 10,
    exponent: 1.5,
    returnLog: true,
  });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});

// --- Edge: k outside support ---

Deno.test("zipf edge: k=0 (below support)", () => {
  const actual = dzipf({ at: 0, numberOfElements: 10, exponent: 1.5 });
  expect(actual).toBe(0);
});

Deno.test("zipf edge: k=11 (above support)", () => {
  const actual = dzipf({ at: 11, numberOfElements: 10, exponent: 1.5 });
  expect(actual).toBe(0);
});

// --- Cumsum consistency ---

Deno.test("zipf: cumsum(dzipf) == pzipf", () => {
  const ks = Array.from({ length: 10 }, (_, i) => i + 1);
  const pdfValues = ks.map((k) =>
    dzipf({ at: k, numberOfElements: 10, exponent: 1.5 })
  );
  const cumsum: number[] = [];
  let sum = 0;
  for (const v of pdfValues) {
    sum += v;
    cumsum.push(sum);
  }
  assertArrayClose(cumsum, ref.cumsum_cdf, TOL, "cumsum_consistency");
});

// --- p-q round trip ---

Deno.test("zipf: p-q round trip", () => {
  const f1 = 1 - 1e-7;
  const actual = ref.rt_k.map((k) =>
    qzipf({
      probability: pzipf({ at: k, numberOfElements: 10, exponent: 1.5 }) * f1,
      numberOfElements: 10,
      exponent: 1.5,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
