import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  df,
  pf,
  qf,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface FRef {
  pdf_5_10: number[];
  cdf_5_10: number[];
  quantile_5_10: number[];
  pdf_1_5: number[];
  cdf_1_5: number[];
  quantile_1_5: number[];
  upper_tail: number;
  log_pdf: number;
  edge_df1_1: number;
  edge_df1_2: number;
  edge_df1_3: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<FRef>(
  new URL("./f-ref.R", import.meta.url).pathname,
);

// --- df1=5, df2=10 ---

const X1 = [0.5, 1, 2, 3, 5] as const;
const P1 = [0.05, 0.1, 0.5, 0.9, 0.95] as const;

Deno.test("f (5,10): df", () => {
  const actual = X1.map((x) =>
    df({ at: x, numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 10 })
  );
  assertArrayClose(actual, ref.pdf_5_10, TOL, "pdf_5_10");
});

Deno.test("f (5,10): pf", () => {
  const actual = X1.map((x) =>
    pf({ at: x, numeratorDegreesOfFreedom: 5, denominatorDegreesOfFreedom: 10 })
  );
  assertArrayClose(actual, ref.cdf_5_10, TOL, "cdf_5_10");
});

Deno.test("f (5,10): qf", () => {
  const actual = P1.map((p) =>
    qf({
      probability: p,
      numeratorDegreesOfFreedom: 5,
      denominatorDegreesOfFreedom: 10,
    })
  );
  assertArrayClose(actual, ref.quantile_5_10, TOL, "quantile_5_10");
});

// --- df1=1, df2=5 ---

const X2 = [0.1, 1, 5] as const;
const P2 = [0.5, 0.9, 0.95] as const;

Deno.test("f (1,5): df", () => {
  const actual = X2.map((x) =>
    df({ at: x, numeratorDegreesOfFreedom: 1, denominatorDegreesOfFreedom: 5 })
  );
  assertArrayClose(actual, ref.pdf_1_5, TOL, "pdf_1_5");
});

Deno.test("f (1,5): pf", () => {
  const actual = X2.map((x) =>
    pf({ at: x, numeratorDegreesOfFreedom: 1, denominatorDegreesOfFreedom: 5 })
  );
  assertArrayClose(actual, ref.cdf_1_5, TOL, "cdf_1_5");
});

Deno.test("f (1,5): qf", () => {
  const actual = P2.map((p) =>
    qf({
      probability: p,
      numeratorDegreesOfFreedom: 1,
      denominatorDegreesOfFreedom: 5,
    })
  );
  assertArrayClose(actual, ref.quantile_1_5, TOL, "quantile_1_5");
});

// --- Upper tail ---

Deno.test("f: pf upper tail", () => {
  const actual = pf({
    at: 4.0,
    numeratorDegreesOfFreedom: 2,
    denominatorDegreesOfFreedom: 20,
    direction: "above",
  });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log scale ---

Deno.test("f: df log", () => {
  const actual = df({
    at: 1,
    numeratorDegreesOfFreedom: 5,
    denominatorDegreesOfFreedom: 10,
    returnLog: true,
  });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

// --- Edge cases ---

Deno.test("f edge: df(0, df1=1, df2=5) = Inf", () => {
  const actual = df({
    at: 0,
    numeratorDegreesOfFreedom: 1,
    denominatorDegreesOfFreedom: 5,
  });
  expect(actual).toBe(Infinity);
});

Deno.test("f edge: df(0, df1=2, df2=5) = 1", () => {
  const actual = df({
    at: 0,
    numeratorDegreesOfFreedom: 2,
    denominatorDegreesOfFreedom: 5,
  });
  assertClose(actual, ref.edge_df1_2, TOL, "edge_df1_2");
});

Deno.test("f edge: df(0, df1=3, df2=5) = 0", () => {
  const actual = df({
    at: 0,
    numeratorDegreesOfFreedom: 3,
    denominatorDegreesOfFreedom: 5,
  });
  assertClose(actual, ref.edge_df1_3, TOL, "edge_df1_3");
});

// --- p-q round trip (df1=12, df2=6) ---

Deno.test("f: p-q round trip", () => {
  const xs = [0.5, 1, 2, 5];
  const actual = xs.map((x) =>
    qf({
      probability: pf({
        at: x,
        numeratorDegreesOfFreedom: 12,
        denominatorDegreesOfFreedom: 6,
      }),
      numeratorDegreesOfFreedom: 12,
      denominatorDegreesOfFreedom: 6,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
