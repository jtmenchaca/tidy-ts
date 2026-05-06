import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dlnorm,
  plnorm,
  qlnorm,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface LogNormalRef {
  std_pdf: number[];
  std_cdf: number[];
  std_quantile: number[];
  ns_pdf: number[];
  ns_cdf: number[];
  ns_quantile: number[];
  upper_tail: number;
  log_pdf: number;
  log_cdf: number;
  edge_dlnorm_zero: number;
  edge_sd0_pdf: number[];
  edge_sd0_cdf: number[];
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<LogNormalRef>(
  new URL("./log-normal-ref.R", import.meta.url).pathname,
);

// --- Standard log-normal (meanlog=0, sdlog=1) ---

const STD_X = [0.5, 1, 2, 3, 5] as const;
const STD_P = [0.1, 0.25, 0.5, 0.75, 0.9] as const;

Deno.test("log-normal standard: dlnorm", () => {
  const actual = STD_X.map((x) => dlnorm({ at: x }));
  assertArrayClose(actual, ref.std_pdf, TOL, "std_pdf");
});

Deno.test("log-normal standard: plnorm", () => {
  const actual = STD_X.map((x) => plnorm({ at: x }));
  assertArrayClose(actual, ref.std_cdf, TOL, "std_cdf");
});

Deno.test("log-normal standard: qlnorm", () => {
  const actual = STD_P.map((p) => qlnorm({ probability: p }));
  assertArrayClose(actual, ref.std_quantile, TOL, "std_quantile");
});

// --- Non-standard (meanlog=1, sdlog=0.5) ---

const NS_X = [1, 2, 3, 5] as const;
const NS_P = [0.1, 0.5, 0.9] as const;

Deno.test("log-normal non-standard: dlnorm (meanlog=1, sdlog=0.5)", () => {
  const actual = NS_X.map((x) =>
    dlnorm({ at: x, meanLog: 1, standardDeviationLog: 0.5 })
  );
  assertArrayClose(actual, ref.ns_pdf, TOL, "ns_pdf");
});

Deno.test("log-normal non-standard: plnorm (meanlog=1, sdlog=0.5)", () => {
  const actual = NS_X.map((x) =>
    plnorm({ at: x, meanLog: 1, standardDeviationLog: 0.5 })
  );
  assertArrayClose(actual, ref.ns_cdf, TOL, "ns_cdf");
});

Deno.test("log-normal non-standard: qlnorm (meanlog=1, sdlog=0.5)", () => {
  const actual = NS_P.map((p) =>
    qlnorm({ probability: p, meanLog: 1, standardDeviationLog: 0.5 })
  );
  assertArrayClose(actual, ref.ns_quantile, TOL, "ns_quantile");
});

// --- Upper tail ---

Deno.test("log-normal: plnorm upper tail", () => {
  const actual = plnorm({ at: 2, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log scale ---

Deno.test("log-normal: dlnorm log", () => {
  const actual = dlnorm({ at: 1, returnLog: true });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

Deno.test("log-normal: plnorm log", () => {
  const actual = plnorm({ at: 1, returnLog: true });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});

// --- Edge cases ---

Deno.test("log-normal edge: dlnorm(0) = 0", () => {
  const actual = dlnorm({ at: 0 });
  expect(actual).toBe(0);
});

Deno.test("log-normal edge: dlnorm with sdlog=0 (degenerate)", () => {
  const xs = [0.5, 1, 2];
  const actual = xs.map((x) =>
    dlnorm({ at: x, meanLog: 0, standardDeviationLog: 0 })
  );
  assertArrayClose(actual, ref.edge_sd0_pdf, TOL, "edge_sd0_pdf");
});

Deno.test("log-normal edge: plnorm with sdlog=0 (degenerate)", () => {
  const xs = [0.5, 1, 2];
  const actual = xs.map((x) =>
    plnorm({ at: x, meanLog: 0, standardDeviationLog: 0 })
  );
  assertArrayClose(actual, ref.edge_sd0_cdf, TOL, "edge_sd0_cdf");
});

// --- p-q round trip (meanlog=-1, sdlog=3) ---

Deno.test("log-normal: p-q round trip", () => {
  const xs = [0.1, 0.5, 1, 2, 5];
  const actual = xs.map((x) =>
    qlnorm({
      probability: plnorm({
        at: x,
        meanLog: -1,
        standardDeviationLog: 3,
      }),
      meanLog: -1,
      standardDeviationLog: 3,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
