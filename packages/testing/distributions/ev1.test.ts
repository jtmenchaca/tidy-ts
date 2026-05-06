import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dev1,
  pev1,
  qev1,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface Ev1Ref {
  std_x: number[];
  std_pdf: number[];
  std_cdf: number[];
  std_p: number[];
  std_quantile: number[];
  ns_x: number[];
  ns_pdf: number[];
  ns_cdf: number[];
  ns_p: number[];
  ns_quantile: number[];
  upper_tail: number;
  log_pdf: number;
  log_cdf: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<Ev1Ref>(
  new URL("./ev1-ref.R", import.meta.url).pathname,
);

// --- loc=0, scale=1: density ---

Deno.test("ev1 loc=0 scale=1: dev1", () => {
  const actual = ref.std_x.map((x) => dev1({ at: x }));
  assertArrayClose(actual, ref.std_pdf, TOL, "std_pdf");
});

// --- loc=0, scale=1: CDF ---

Deno.test("ev1 loc=0 scale=1: pev1", () => {
  const actual = ref.std_x.map((x) => pev1({ at: x }));
  assertArrayClose(actual, ref.std_cdf, TOL, "std_cdf");
});

// --- loc=0, scale=1: quantile ---

Deno.test("ev1 loc=0 scale=1: qev1", () => {
  const actual = ref.std_p.map((p) => qev1({ probability: p }));
  assertArrayClose(actual, ref.std_quantile, TOL, "std_quantile");
});

// --- loc=2, scale=0.5: density ---

Deno.test("ev1 loc=2 scale=0.5: dev1", () => {
  const actual = ref.ns_x.map((x) =>
    dev1({ at: x, location: 2, scale: 0.5 })
  );
  assertArrayClose(actual, ref.ns_pdf, TOL, "ns_pdf");
});

// --- loc=2, scale=0.5: CDF ---

Deno.test("ev1 loc=2 scale=0.5: pev1", () => {
  const actual = ref.ns_x.map((x) =>
    pev1({ at: x, location: 2, scale: 0.5 })
  );
  assertArrayClose(actual, ref.ns_cdf, TOL, "ns_cdf");
});

// --- loc=2, scale=0.5: quantile ---

Deno.test("ev1 loc=2 scale=0.5: qev1", () => {
  const actual = ref.ns_p.map((p) =>
    qev1({ probability: p, location: 2, scale: 0.5 })
  );
  assertArrayClose(actual, ref.ns_quantile, TOL, "ns_quantile");
});

// --- Upper tail ---

Deno.test("ev1: upper tail", () => {
  const actual = pev1({ at: 2, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log density ---

Deno.test("ev1: log density", () => {
  const actual = dev1({ at: 0, returnLog: true });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

// --- Log CDF ---

Deno.test("ev1: log CDF", () => {
  const actual = pev1({ at: 0, returnLog: true });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});

// --- p-q round trip ---

Deno.test("ev1: p-q round trip", () => {
  const actual = ref.rt_x.map((x) =>
    qev1({ probability: pev1({ at: x }) })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
