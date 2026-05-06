import { expect } from "@std/expect";
import {
  assertClose,
  assertArrayClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dchisq,
  pchisq,
  qchisq,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface ChiSqRef {
  df5_x: number[];
  df5_dchisq: number[];
  df5_pchisq: number[];
  df5_qchisq_p: number[];
  df5_qchisq: number[];
  df1_x: number[];
  df1_dchisq: number[];
  df1_pchisq: number[];
  df1_qchisq_p: number[];
  df1_qchisq: number[];
  upper_tail: number;
  log_dchisq: number;
  edge_dchisq_0_df1: number;
  edge_dchisq_0_df2: number;
  edge_dchisq_0_df3: number;
  pchisq_df0_x: number[];
  pchisq_df0: number[];
  dchisq_df0_x: number[];
  dchisq_df0: number[];
  log_pchisq: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<ChiSqRef>(
  new URL("./chi-squared-ref.R", import.meta.url).pathname,
);

// --- df=5: dchisq ---

Deno.test("Chi-squared: dchisq df=5", () => {
  const actual = ref.df5_x.map((x) => dchisq({ at: x, degreesOfFreedom: 5 }));
  assertArrayClose(actual, ref.df5_dchisq, TOL, "dchisq df=5");
});

// --- df=5: pchisq ---

Deno.test("Chi-squared: pchisq df=5", () => {
  const actual = ref.df5_x.map((x) => pchisq({ at: x, degreesOfFreedom: 5 }));
  assertArrayClose(actual, ref.df5_pchisq, TOL, "pchisq df=5");
});

// --- df=5: qchisq ---

Deno.test("Chi-squared: qchisq df=5", () => {
  const actual = ref.df5_qchisq_p.map((p) =>
    qchisq({ probability: p, degreesOfFreedom: 5 }),
  );
  assertArrayClose(actual, ref.df5_qchisq, TOL, "qchisq df=5");
});

// --- df=1: dchisq, pchisq ---

Deno.test("Chi-squared: dchisq df=1", () => {
  const actual = ref.df1_x.map((x) => dchisq({ at: x, degreesOfFreedom: 1 }));
  assertArrayClose(actual, ref.df1_dchisq, TOL, "dchisq df=1");
});

Deno.test("Chi-squared: pchisq df=1", () => {
  const actual = ref.df1_x.map((x) => pchisq({ at: x, degreesOfFreedom: 1 }));
  assertArrayClose(actual, ref.df1_pchisq, TOL, "pchisq df=1");
});

// --- df=1: qchisq ---

Deno.test("Chi-squared: qchisq df=1", () => {
  const actual = ref.df1_qchisq_p.map((p) =>
    qchisq({ probability: p, degreesOfFreedom: 1 }),
  );
  assertArrayClose(actual, ref.df1_qchisq, TOL, "qchisq df=1");
});

// --- Upper tail ---

Deno.test("Chi-squared: upper tail pchisq(3.84, df=1)", () => {
  const actual = pchisq({ at: 3.84, degreesOfFreedom: 1, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper tail");
});

// --- Log scale ---

Deno.test("Chi-squared: log dchisq(1, df=5)", () => {
  const actual = dchisq({ at: 1, degreesOfFreedom: 5, returnLog: true });
  assertClose(actual, ref.log_dchisq, TOL, "log dchisq");
});

// --- Edge: dchisq(0, df=...) ---

Deno.test("Chi-squared: dchisq(0, df=1) is Inf", () => {
  const actual = dchisq({ at: 0, degreesOfFreedom: 1 });
  expect(actual).toBe(Infinity);
});

Deno.test("Chi-squared: dchisq(0, df=2) is 0.5", () => {
  const actual = dchisq({ at: 0, degreesOfFreedom: 2 });
  assertClose(actual, ref.edge_dchisq_0_df2, TOL, "dchisq(0,df=2)");
});

Deno.test("Chi-squared: dchisq(0, df=3) is 0", () => {
  const actual = dchisq({ at: 0, degreesOfFreedom: 3 });
  assertClose(actual, ref.edge_dchisq_0_df3, TOL, "dchisq(0,df=3)");
});

// --- Edge: pchisq(x, df=0) — point mass at 0 ---

Deno.test("Chi-squared: pchisq with df=0 (point mass at 0)", () => {
  const actual = ref.pchisq_df0_x.map((x) =>
    pchisq({ at: x, degreesOfFreedom: 0 }),
  );
  assertArrayClose(actual, ref.pchisq_df0, TOL, "pchisq df=0");
});

// --- Edge: dchisq(x, df=0) ---

Deno.test("Chi-squared: dchisq with df=0", () => {
  const actual = ref.dchisq_df0_x.map((x) =>
    dchisq({ at: x, degreesOfFreedom: 0 }),
  );
  // dchisq(0, df=0) = Inf, others = 0 (except negative = 0)
  for (let i = 0; i < actual.length; i++) {
    if (ref.dchisq_df0[i] === Infinity) {
      expect(actual[i]).toBe(Infinity);
    } else {
      assertClose(actual[i], ref.dchisq_df0[i], TOL, `dchisq_df0[${i}]`);
    }
  }
});

// --- Log CDF ---

Deno.test("Chi-squared: log pchisq(3, df=5)", () => {
  const actual = pchisq({ at: 3, degreesOfFreedom: 5, returnLog: true });
  assertClose(actual, ref.log_pchisq, TOL, "log_pchisq");
});

// --- p-q round trip ---

Deno.test("Chi-squared: p-q round trip", () => {
  const actual = ref.rt_x.map((x) =>
    qchisq({
      probability: pchisq({ at: x, degreesOfFreedom: 5 }),
      degreesOfFreedom: 5,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
