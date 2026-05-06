import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dhyper,
  phyper,
  qhyper,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface HyperRef {
  dhyper_m10n7k8: number[];
  phyper_m10n7k8: number[];
  qhyper_m10n7k8: number[];
  dhyper_m20n30k15: number[];
  phyper_m20n30k15: number[];
  qhyper_m20n30k15: number[];
  phyper_upper: number;
  dhyper_log: number;
  cumsum_dhyper: number[];
  phyper_0_8: number[];
  cumsum_matches: boolean;
  phyper_log: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<HyperRef>(
  new URL("./hypergeometric-ref.R", import.meta.url).pathname,
);

// --- m=10, n=7, k=8: density ---

Deno.test("dhyper: m=10, n=7, k=8", () => {
  const xs = [0, 1, 3, 5, 8];
  const actual = xs.map((x) =>
    dhyper({
      at: x,
      populationSuccesses: 10,
      populationFailures: 7,
      drawSize: 8,
    })
  );
  assertArrayClose(actual, ref.dhyper_m10n7k8, TOL, "dhyper_m10n7k8");
});

// --- m=10, n=7, k=8: CDF ---

Deno.test("phyper: m=10, n=7, k=8", () => {
  const xs = [0, 1, 3, 5, 8];
  const actual = xs.map((x) =>
    phyper({
      at: x,
      populationSuccesses: 10,
      populationFailures: 7,
      drawSize: 8,
    })
  );
  assertArrayClose(actual, ref.phyper_m10n7k8, TOL, "phyper_m10n7k8");
});

// --- m=10, n=7, k=8: quantile ---

Deno.test("qhyper: m=10, n=7, k=8", () => {
  const ps = [0.1, 0.25, 0.5, 0.75, 0.9];
  const actual = ps.map((p) =>
    qhyper({
      probability: p,
      populationSuccesses: 10,
      populationFailures: 7,
      drawSize: 8,
    })
  );
  assertArrayClose(actual, ref.qhyper_m10n7k8, TOL, "qhyper_m10n7k8");
});

// --- m=20, n=30, k=15: density ---

Deno.test("dhyper: m=20, n=30, k=15", () => {
  const xs = [0, 3, 6, 9, 12];
  const actual = xs.map((x) =>
    dhyper({
      at: x,
      populationSuccesses: 20,
      populationFailures: 30,
      drawSize: 15,
    })
  );
  assertArrayClose(actual, ref.dhyper_m20n30k15, TOL, "dhyper_m20n30k15");
});

// --- m=20, n=30, k=15: CDF ---

Deno.test("phyper: m=20, n=30, k=15", () => {
  const xs = [0, 3, 6, 9, 12];
  const actual = xs.map((x) =>
    phyper({
      at: x,
      populationSuccesses: 20,
      populationFailures: 30,
      drawSize: 15,
    })
  );
  assertArrayClose(actual, ref.phyper_m20n30k15, TOL, "phyper_m20n30k15");
});

// --- m=20, n=30, k=15: quantile ---

Deno.test("qhyper: m=20, n=30, k=15", () => {
  const ps = [0.1, 0.5, 0.9];
  const actual = ps.map((p) =>
    qhyper({
      probability: p,
      populationSuccesses: 20,
      populationFailures: 30,
      drawSize: 15,
    })
  );
  assertArrayClose(actual, ref.qhyper_m20n30k15, TOL, "qhyper_m20n30k15");
});

// --- Upper tail ---

Deno.test("phyper: upper tail", () => {
  const actual = phyper({
    at: 3,
    populationSuccesses: 10,
    populationFailures: 7,
    drawSize: 8,
    direction: "above",
  });
  assertClose(actual, ref.phyper_upper, TOL, "phyper_upper");
});

// --- Log density ---

Deno.test("dhyper: log density", () => {
  const actual = dhyper({
    at: 3,
    populationSuccesses: 10,
    populationFailures: 7,
    drawSize: 8,
    returnLog: true,
  });
  assertClose(actual, ref.dhyper_log, TOL, "dhyper_log");
});

// --- Cumsum consistency ---

Deno.test("dhyper: cumsum equals phyper", () => {
  expect(ref.cumsum_matches).toBe(true);
  assertArrayClose(
    ref.cumsum_dhyper,
    ref.phyper_0_8,
    1e-14,
    "cumsum_vs_phyper",
  );
});

// --- Log CDF ---

Deno.test("phyper: log CDF", () => {
  const actual = phyper({
    at: 3,
    populationSuccesses: 10,
    populationFailures: 7,
    drawSize: 8,
    returnLog: true,
  });
  assertClose(actual, ref.phyper_log, TOL, "phyper_log");
});

// --- p-q round trip ---

Deno.test("hypergeometric: p-q round trip", () => {
  const f1 = 1 - 1e-7;
  const actual = ref.rt_x.map((x) =>
    qhyper({
      probability: phyper({
        at: x,
        populationSuccesses: 10,
        populationFailures: 7,
        drawSize: 8,
      }) * f1,
      populationSuccesses: 10,
      populationFailures: 7,
      drawSize: 8,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
