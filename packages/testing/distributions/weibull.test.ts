import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dweibull,
  pweibull,
  qweibull,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface WeibullRef {
  pdf_2_1: number[];
  cdf_2_1: number[];
  quantile_2_1: number[];
  pdf_05_2: number[];
  cdf_05_2: number[];
  quantile_05_2: number[];
  upper_tail: number;
  log_pdf: number;
  log_cdf: number;
  edge_shape_2: number;
  edge_shape_1: number;
  edge_shape_05: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<WeibullRef>(
  new URL("./weibull-ref.R", import.meta.url).pathname,
);

// --- shape=2, scale=1 ---

const X1 = [0.5, 1, 1.5, 2, 3] as const;
const P1 = [0.1, 0.25, 0.5, 0.75, 0.9] as const;

Deno.test("weibull (2,1): dweibull", () => {
  const actual = X1.map((x) => dweibull({ at: x, shape: 2 }));
  assertArrayClose(actual, ref.pdf_2_1, TOL, "pdf_2_1");
});

Deno.test("weibull (2,1): pweibull", () => {
  const actual = X1.map((x) => pweibull({ at: x, shape: 2 }));
  assertArrayClose(actual, ref.cdf_2_1, TOL, "cdf_2_1");
});

Deno.test("weibull (2,1): qweibull", () => {
  const actual = P1.map((p) => qweibull({ probability: p, shape: 2 }));
  assertArrayClose(actual, ref.quantile_2_1, TOL, "quantile_2_1");
});

// --- shape=0.5, scale=2 ---

const X2 = [0.1, 0.5, 1, 3, 5] as const;
const P2 = [0.1, 0.5, 0.9] as const;

Deno.test("weibull (0.5,2): dweibull", () => {
  const actual = X2.map((x) => dweibull({ at: x, shape: 0.5, scale: 2 }));
  assertArrayClose(actual, ref.pdf_05_2, TOL, "pdf_05_2");
});

Deno.test("weibull (0.5,2): pweibull", () => {
  const actual = X2.map((x) => pweibull({ at: x, shape: 0.5, scale: 2 }));
  assertArrayClose(actual, ref.cdf_05_2, TOL, "cdf_05_2");
});

Deno.test("weibull (0.5,2): qweibull", () => {
  const actual = P2.map((p) =>
    qweibull({ probability: p, shape: 0.5, scale: 2 })
  );
  assertArrayClose(actual, ref.quantile_05_2, TOL, "quantile_05_2");
});

// --- Upper tail ---

Deno.test("weibull: pweibull upper tail", () => {
  const actual = pweibull({ at: 1, shape: 2, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log scale ---

Deno.test("weibull: dweibull log", () => {
  const actual = dweibull({ at: 1, shape: 2, returnLog: true });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

Deno.test("weibull: pweibull log", () => {
  const actual = pweibull({ at: 1, shape: 2, returnLog: true });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});

// --- Edge cases ---

Deno.test("weibull edge: dweibull(0, shape=2) = 0", () => {
  const actual = dweibull({ at: 0, shape: 2 });
  assertClose(actual, ref.edge_shape_2, TOL, "edge_shape_2");
});

Deno.test("weibull edge: dweibull(0, shape=1) = 1", () => {
  const actual = dweibull({ at: 0, shape: 1 });
  assertClose(actual, ref.edge_shape_1, TOL, "edge_shape_1");
});

Deno.test("weibull edge: dweibull(0, shape=0.5) = Inf", () => {
  const actual = dweibull({ at: 0, shape: 0.5 });
  expect(actual).toBe(Infinity);
});

// --- p-q round trip (shape=3, scale=2) ---

Deno.test("weibull: p-q round trip", () => {
  const xs = [0.5, 1, 1.5, 2, 3];
  const actual = xs.map((x) =>
    qweibull({
      probability: pweibull({ at: x, shape: 3, scale: 2 }),
      shape: 3,
      scale: 2,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
