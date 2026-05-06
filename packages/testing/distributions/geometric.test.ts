import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dgeom,
  pgeom,
  qgeom,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface GeomRef {
  dgeom_p03: number[];
  pgeom_p03: number[];
  qgeom_p03: number[];
  dgeom_p08: number[];
  pgeom_p08: number[];
  qgeom_p08: number[];
  pgeom_upper: number;
  dgeom_log: number;
  cumsum_dgeom: number[];
  pgeom_0_10: number[];
  cumsum_matches: boolean;
  pgeom_extreme: number[];
  pgeom_log: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<GeomRef>(
  new URL("./geometric-ref.R", import.meta.url).pathname,
);

// --- prob=0.3: density ---

Deno.test("dgeom: prob=0.3", () => {
  const xs = [0, 1, 2, 5, 10];
  const actual = xs.map((x) =>
    dgeom({ at: x, probabilityOfSuccess: 0.3 })
  );
  assertArrayClose(actual, ref.dgeom_p03, TOL, "dgeom_p03");
});

// --- prob=0.3: CDF ---

Deno.test("pgeom: prob=0.3", () => {
  const xs = [0, 1, 2, 5, 10];
  const actual = xs.map((x) =>
    pgeom({ at: x, probabilityOfSuccess: 0.3 })
  );
  assertArrayClose(actual, ref.pgeom_p03, TOL, "pgeom_p03");
});

// --- prob=0.3: quantile ---

Deno.test("qgeom: prob=0.3", () => {
  const ps = [0.1, 0.25, 0.5, 0.75, 0.9];
  const actual = ps.map((p) =>
    qgeom({ probability: p, probabilityOfSuccess: 0.3 })
  );
  assertArrayClose(actual, ref.qgeom_p03, TOL, "qgeom_p03");
});

// --- prob=0.8: density ---

Deno.test("dgeom: prob=0.8", () => {
  const xs = [0, 1, 2, 3];
  const actual = xs.map((x) =>
    dgeom({ at: x, probabilityOfSuccess: 0.8 })
  );
  assertArrayClose(actual, ref.dgeom_p08, TOL, "dgeom_p08");
});

// --- prob=0.8: CDF ---

Deno.test("pgeom: prob=0.8", () => {
  const xs = [0, 1, 2, 3];
  const actual = xs.map((x) =>
    pgeom({ at: x, probabilityOfSuccess: 0.8 })
  );
  assertArrayClose(actual, ref.pgeom_p08, TOL, "pgeom_p08");
});

// --- prob=0.8: quantile ---

Deno.test("qgeom: prob=0.8", () => {
  const ps = [0.1, 0.5, 0.9];
  const actual = ps.map((p) =>
    qgeom({ probability: p, probabilityOfSuccess: 0.8 })
  );
  assertArrayClose(actual, ref.qgeom_p08, TOL, "qgeom_p08");
});

// --- Upper tail ---

Deno.test("pgeom: upper tail", () => {
  const actual = pgeom({
    at: 2,
    probabilityOfSuccess: 0.3,
    direction: "above",
  });
  assertClose(actual, ref.pgeom_upper, TOL, "pgeom_upper");
});

// --- Log density ---

Deno.test("dgeom: log density", () => {
  const actual = dgeom({
    at: 0,
    probabilityOfSuccess: 0.3,
    returnLog: true,
  });
  assertClose(actual, ref.dgeom_log, TOL, "dgeom_log");
});

// --- Cumsum consistency ---

Deno.test("dgeom: cumsum equals pgeom", () => {
  expect(ref.cumsum_matches).toBe(true);
  assertArrayClose(ref.cumsum_dgeom, ref.pgeom_0_10, 1e-14, "cumsum_vs_pgeom");
});

// --- Extreme probabilities ---

Deno.test("pgeom: extreme values", () => {
  const xs = [0, 10, 100, 1000];
  const actual = xs.map((x) =>
    pgeom({ at: x, probabilityOfSuccess: 0.5 })
  );
  assertArrayClose(actual, ref.pgeom_extreme, TOL, "pgeom_extreme");
});

// --- Log CDF ---

Deno.test("pgeom: log CDF", () => {
  const actual = pgeom({
    at: 2,
    probabilityOfSuccess: 0.3,
    returnLog: true,
  });
  assertClose(actual, ref.pgeom_log, TOL, "pgeom_log");
});

// --- p-q round trip ---

Deno.test("geometric: p-q round trip", () => {
  const f1 = 1 - 1e-7;
  const actual = ref.rt_x.map((x) =>
    qgeom({
      probability: pgeom({ at: x, probabilityOfSuccess: 0.3 }) * f1,
      probabilityOfSuccess: 0.3,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
