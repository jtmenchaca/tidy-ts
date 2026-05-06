import { expect } from "@std/expect";
import {
  assertClose,
  assertArrayClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dt,
  pt,
  qt,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface TRef {
  df5_x: number[];
  df5_dt: number[];
  df5_pt: number[];
  df5_qt_p: number[];
  df5_qt: number[];
  df1_x: number[];
  df1_dt: number[];
  df1_pt: number[];
  df30_x: number[];
  df30_dt: number[];
  df30_pt: number[];
  upper_tail: number;
  log_dt: number;
  symmetry_dfs: number[];
  symmetry_qt: number[];
  extreme_qt_p: number[];
  extreme_qt: number[];
  log_dt_extreme: number;
  log_pt: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<TRef>(
  new URL("./t-ref.R", import.meta.url).pathname,
);

// --- df=5: dt ---

Deno.test("t-distribution: dt df=5", () => {
  const actual = ref.df5_x.map((x) => dt({ at: x, degreesOfFreedom: 5 }));
  assertArrayClose(actual, ref.df5_dt, TOL, "dt df=5");
});

// --- df=5: pt ---

Deno.test("t-distribution: pt df=5", () => {
  const actual = ref.df5_x.map((x) => pt({ at: x, degreesOfFreedom: 5 }));
  assertArrayClose(actual, ref.df5_pt, TOL, "pt df=5");
});

// --- df=5: qt ---

Deno.test("t-distribution: qt df=5", () => {
  const actual = ref.df5_qt_p.map((p) =>
    qt({ probability: p, degreesOfFreedom: 5 }),
  );
  assertArrayClose(actual, ref.df5_qt, TOL, "qt df=5");
});

// --- df=1 (Cauchy): dt, pt ---

Deno.test("t-distribution: dt df=1 (Cauchy)", () => {
  const actual = ref.df1_x.map((x) => dt({ at: x, degreesOfFreedom: 1 }));
  assertArrayClose(actual, ref.df1_dt, TOL, "dt df=1");
});

Deno.test("t-distribution: pt df=1 (Cauchy)", () => {
  const actual = ref.df1_x.map((x) => pt({ at: x, degreesOfFreedom: 1 }));
  assertArrayClose(actual, ref.df1_pt, TOL, "pt df=1");
});

// --- df=30: dt, pt ---

Deno.test("t-distribution: dt df=30", () => {
  const actual = ref.df30_x.map((x) => dt({ at: x, degreesOfFreedom: 30 }));
  assertArrayClose(actual, ref.df30_dt, TOL, "dt df=30");
});

Deno.test("t-distribution: pt df=30", () => {
  const actual = ref.df30_x.map((x) => pt({ at: x, degreesOfFreedom: 30 }));
  assertArrayClose(actual, ref.df30_pt, TOL, "pt df=30");
});

// --- Upper tail ---

Deno.test("t-distribution: upper tail pt(1.96, df=100)", () => {
  const actual = pt({ at: 1.96, degreesOfFreedom: 100, direction: "above" });
  assertClose(actual, ref.upper_tail, TOL, "upper tail");
});

// --- Log scale ---

Deno.test("t-distribution: log dt(0, df=5)", () => {
  const actual = dt({ at: 0, degreesOfFreedom: 5, returnLog: true });
  assertClose(actual, ref.log_dt, TOL, "log dt");
});

// --- Symmetry: qt(0.5, df=...) should all be 0 ---

Deno.test("t-distribution: qt(0.5) symmetry", () => {
  const actual = ref.symmetry_dfs.map((df) =>
    qt({ probability: 0.5, degreesOfFreedom: df }),
  );
  assertArrayClose(actual, ref.symmetry_qt, TOL, "qt(0.5) symmetry");
  for (const val of actual) {
    assertClose(val, 0, TOL, "qt(0.5) should be 0");
  }
});

// --- Extreme tails: qt at very small p with df=1 ---

Deno.test("t-distribution: extreme tail qt (df=1)", () => {
  const actual = ref.extreme_qt_p.map((p) =>
    qt({ probability: p, degreesOfFreedom: 1 }),
  );
  assertArrayClose(actual, ref.extreme_qt, TOL, "extreme qt");
});

// --- dt at extreme x (log should not be -Inf) ---

Deno.test("t-distribution: dt(1e155, df=5, log=TRUE) not -Inf", () => {
  const actual = dt({ at: 1e155, degreesOfFreedom: 5, returnLog: true });
  expect(actual).not.toBe(-Infinity);
  assertClose(actual, ref.log_dt_extreme, TOL, "log dt extreme");
});

// --- Log CDF ---

Deno.test("t-distribution: log pt(1.96, df=5)", () => {
  const actual = pt({ at: 1.96, degreesOfFreedom: 5, returnLog: true });
  assertClose(actual, ref.log_pt, TOL, "log_pt");
});

// --- p-q round trip ---

Deno.test("t-distribution: p-q round trip", () => {
  const actual = ref.rt_x.map((x) =>
    qt({
      probability: pt({ at: x, degreesOfFreedom: 5 }),
      degreesOfFreedom: 5,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
