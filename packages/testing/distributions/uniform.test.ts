import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dunif,
  punif,
  qunif,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface UniformRef {
  pdf_std: number[];
  cdf_std: number[];
  quantile_std: number[];
  pdf_custom: number[];
  cdf_custom: number[];
  quantile_custom: number[];
  upper_tail: number;
  log_pdf: number;
  rt_x: number[];
  rt_result: number[];
  log_cdf: number;
}

const ref = getReferenceFromRScript<UniformRef>(
  new URL("./uniform-ref.R", import.meta.url).pathname,
);

// --- Standard uniform (min=0, max=1) ---

const X1 = [-0.5, 0, 0.25, 0.5, 0.75, 1, 1.5] as const;
const P1 = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] as const;

Deno.test("uniform standard: dunif", () => {
  const actual = X1.map((x) => dunif({ at: x }));
  assertArrayClose(actual, ref.pdf_std, TOL, "pdf_std");
});

Deno.test("uniform standard: punif", () => {
  const actual = X1.map((x) => punif({ at: x }));
  assertArrayClose(actual, ref.cdf_std, TOL, "cdf_std");
});

Deno.test("uniform standard: qunif", () => {
  const actual = P1.map((p) => qunif({ probability: p }));
  assertArrayClose(actual, ref.quantile_std, TOL, "quantile_std");
});

// --- Custom uniform (min=2, max=5) ---

const X2 = [1, 2, 3.5, 5, 6] as const;
const P2 = [0, 0.5, 1] as const;

Deno.test("uniform custom: dunif", () => {
  const actual = X2.map((x) => dunif({ at: x, minimum: 2, maximum: 5 }));
  assertArrayClose(actual, ref.pdf_custom, TOL, "pdf_custom");
});

Deno.test("uniform custom: punif", () => {
  const actual = X2.map((x) => punif({ at: x, minimum: 2, maximum: 5 }));
  assertArrayClose(actual, ref.cdf_custom, TOL, "cdf_custom");
});

Deno.test("uniform custom: qunif", () => {
  const actual = P2.map((p) =>
    qunif({ probability: p, minimum: 2, maximum: 5 })
  );
  assertArrayClose(actual, ref.quantile_custom, TOL, "quantile_custom");
});

// --- Upper tail ---

Deno.test("uniform: punif upper tail", () => {
  const actual = punif({ at: 0.7, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log scale ---

Deno.test("uniform: dunif log", () => {
  const actual = dunif({ at: 0.5, returnLog: true });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

// --- p-q round trip (min=0.2, max=2) ---

Deno.test("uniform: p-q round trip", () => {
  const xs = [0.3, 0.5, 0.8, 1.2, 1.8];
  const actual = xs.map((x) =>
    qunif({
      probability: punif({ at: x, minimum: 0.2, maximum: 2 }),
      minimum: 0.2,
      maximum: 2,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});

// --- Log CDF ---

Deno.test("uniform: punif log CDF", () => {
  const actual = punif({ at: 0.5, returnLog: true });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});
