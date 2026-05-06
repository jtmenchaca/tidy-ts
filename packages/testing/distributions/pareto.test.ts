import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dpareto,
  ppareto,
  qpareto,
} from "../../dataframe/ts/stats/distributions/pareto.ts";

interface ParetoRef {
  s1a2_pdf: number[];
  s1a2_cdf: number[];
  s1a2_quantile: number[];
  s2a05_pdf: number[];
  s2a05_cdf: number[];
  s2a05_quantile: number[];
  edge_below_pdf: number;
  edge_below_cdf: number;
  edge_at_scale: number;
  rt_x: number[];
  rt_result: number[];
  upper_tail: number;
  log_pdf: number;
  log_cdf: number;
}

const ref = getReferenceFromRScript<ParetoRef>(
  new URL("./pareto-ref.R", import.meta.url).pathname,
);

// --- scale=1, shape=2: density ---

const S1A2_X = [0.5, 1, 2, 3, 5] as const;
const S1A2_P = [0.1, 0.25, 0.5, 0.75, 0.9] as const;

Deno.test("pareto scale=1 shape=2: dpareto", () => {
  const actual = S1A2_X.map((x) => dpareto({ at: x, scale: 1, shape: 2 }));
  assertArrayClose(actual, ref.s1a2_pdf, TOL, "s1a2_pdf");
});

// --- scale=1, shape=2: CDF ---

Deno.test("pareto scale=1 shape=2: ppareto", () => {
  const actual = S1A2_X.map((x) => ppareto({ at: x, scale: 1, shape: 2 }));
  assertArrayClose(actual, ref.s1a2_cdf, TOL, "s1a2_cdf");
});

// --- scale=1, shape=2: quantile ---

Deno.test("pareto scale=1 shape=2: qpareto", () => {
  const actual = S1A2_P.map((p) =>
    qpareto({ probability: p, scale: 1, shape: 2 })
  );
  assertArrayClose(actual, ref.s1a2_quantile, TOL, "s1a2_quantile");
});

// --- scale=2, shape=0.5 ---

const S2A05_X = [1, 2, 3, 5, 10] as const;

Deno.test("pareto scale=2 shape=0.5: dpareto", () => {
  const actual = S2A05_X.map((x) => dpareto({ at: x, scale: 2, shape: 0.5 }));
  assertArrayClose(actual, ref.s2a05_pdf, TOL, "s2a05_pdf");
});

Deno.test("pareto scale=2 shape=0.5: ppareto", () => {
  const actual = S2A05_X.map((x) => ppareto({ at: x, scale: 2, shape: 0.5 }));
  assertArrayClose(actual, ref.s2a05_cdf, TOL, "s2a05_cdf");
});

Deno.test("pareto scale=2 shape=0.5: qpareto", () => {
  const actual = ([0.1, 0.5, 0.9] as const).map((p) =>
    qpareto({ probability: p, scale: 2, shape: 0.5 })
  );
  assertArrayClose(actual, ref.s2a05_quantile, TOL, "s2a05_quantile");
});

// --- Edge cases ---

Deno.test("pareto edge: dpareto(0.5, scale=1, shape=2) = 0", () => {
  const actual = dpareto({ at: 0.5, scale: 1, shape: 2 });
  assertClose(actual, ref.edge_below_pdf, TOL, "edge_below_pdf");
  expect(actual).toBe(0);
});

Deno.test("pareto edge: ppareto(0.5, scale=1, shape=2) = 0", () => {
  const actual = ppareto({ at: 0.5, scale: 1, shape: 2 });
  assertClose(actual, ref.edge_below_cdf, TOL, "edge_below_cdf");
  expect(actual).toBe(0);
});

Deno.test("pareto edge: dpareto(1, scale=1, shape=2) = 2", () => {
  const actual = dpareto({ at: 1, scale: 1, shape: 2 });
  assertClose(actual, ref.edge_at_scale, TOL, "edge_at_scale");
});

// --- p-q round trip (scale=1, shape=2) ---

Deno.test("pareto: p-q round trip", () => {
  const xs = [1.5, 2, 3, 5];
  const actual = xs.map((x) =>
    qpareto({
      probability: ppareto({ at: x, scale: 1, shape: 2 }),
      scale: 1,
      shape: 2,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});

// --- Upper tail ---

Deno.test("pareto: ppareto upper tail", () => {
  const actual = ppareto({ at: 3, scale: 1, shape: 2, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log density ---

Deno.test("pareto: dpareto log", () => {
  const actual = dpareto({ at: 2, scale: 1, shape: 2, returnLog: true });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

// --- Log CDF ---

Deno.test("pareto: ppareto log CDF", () => {
  const actual = ppareto({ at: 2, scale: 1, shape: 2, returnLog: true });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});
