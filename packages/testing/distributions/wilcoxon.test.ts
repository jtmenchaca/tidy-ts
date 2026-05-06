import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dwilcox,
  pwilcox,
  qwilcox,
} from "../../dataframe/ts/stats/distributions/wilcoxon.ts";

interface WilcoxonRef {
  m4n6_pdf: number[];
  m4n6_cdf: number[];
  m4n6_quantile: number[];
  sym_46: number[];
  sym_64: number[];
  cumsum_pdf: number[];
  cumsum_cdf: number[];
  m3n3_pdf: number[];
  m3n3_cdf: number[];
  upper_tail: number;
  log_pdf: number;
  log_cdf: number;
  rt_x: number[];
  rt_result: number[];
}

const ref = getReferenceFromRScript<WilcoxonRef>(
  new URL("./wilcoxon-ref.R", import.meta.url).pathname,
);

// --- m=4, n=6: density ---

const M4N6_X = [0, 5, 10, 15, 20, 24] as const;
const M4N6_P = [0.1, 0.25, 0.5, 0.75, 0.9] as const;

Deno.test("wilcoxon m=4 n=6: dwilcox", () => {
  const actual = M4N6_X.map((x) =>
    dwilcox({ at: x, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  assertArrayClose(actual, ref.m4n6_pdf, TOL, "m4n6_pdf");
});

// --- m=4, n=6: CDF ---

Deno.test("wilcoxon m=4 n=6: pwilcox", () => {
  const actual = M4N6_X.map((x) =>
    pwilcox({ at: x, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  assertArrayClose(actual, ref.m4n6_cdf, TOL, "m4n6_cdf");
});

// --- m=4, n=6: quantile ---

Deno.test("wilcoxon m=4 n=6: qwilcox", () => {
  const actual = M4N6_P.map((p) =>
    qwilcox({ probability: p, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  assertArrayClose(actual, ref.m4n6_quantile, TOL, "m4n6_quantile");
});

// --- Symmetry: dwilcox(0:24, 4, 6) vs dwilcox(0:24, 6, 4) ---

Deno.test("wilcoxon symmetry: dwilcox(x, 4, 6) vs dwilcox(x, 6, 4)", () => {
  const xs = Array.from({ length: 25 }, (_, i) => i);
  const actual_46 = xs.map((x) =>
    dwilcox({ at: x, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  const actual_64 = xs.map((x) =>
    dwilcox({ at: x, sizeFirstSample: 6, sizeSecondSample: 4 })
  );
  assertArrayClose(actual_46, ref.sym_46, TOL, "sym_46");
  assertArrayClose(actual_64, ref.sym_64, TOL, "sym_64");
});

// --- Cumsum consistency: cumsum(dwilcox) vs pwilcox ---

Deno.test("wilcoxon cumsum consistency: cumsum(dwilcox) vs pwilcox", () => {
  const xs = Array.from({ length: 25 }, (_, i) => i);
  const pdf = xs.map((x) =>
    dwilcox({ at: x, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  const cumsum: number[] = [];
  let running = 0;
  for (const v of pdf) {
    running += v;
    cumsum.push(running);
  }
  assertArrayClose(cumsum, ref.cumsum_pdf, TOL, "cumsum_pdf");

  const cdf = xs.map((x) =>
    pwilcox({ at: x, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  assertArrayClose(cdf, ref.cumsum_cdf, TOL, "cumsum_cdf");
});

// --- m=3, n=3 ---

const M3N3_X = [0, 2, 4, 6, 9] as const;

Deno.test("wilcoxon m=3 n=3: dwilcox", () => {
  const actual = M3N3_X.map((x) =>
    dwilcox({ at: x, sizeFirstSample: 3, sizeSecondSample: 3 })
  );
  assertArrayClose(actual, ref.m3n3_pdf, TOL, "m3n3_pdf");
});

Deno.test("wilcoxon m=3 n=3: pwilcox", () => {
  const actual = M3N3_X.map((x) =>
    pwilcox({ at: x, sizeFirstSample: 3, sizeSecondSample: 3 })
  );
  assertArrayClose(actual, ref.m3n3_cdf, TOL, "m3n3_cdf");
});

// --- Upper tail ---

Deno.test("wilcoxon: pwilcox upper tail", () => {
  const actual = pwilcox({
    at: 10,
    sizeFirstSample: 4,
    sizeSecondSample: 6,
    direction: "above",
  });
  assertClose(actual, ref.upper_tail, TOL, "upper_tail");
});

// --- Log density ---

Deno.test("wilcoxon: dwilcox log", () => {
  const actual = dwilcox({
    at: 5,
    sizeFirstSample: 4,
    sizeSecondSample: 6,
    returnLog: true,
  });
  assertClose(actual, ref.log_pdf, TOL, "log_pdf");
});

// --- Log CDF ---

Deno.test("wilcoxon: pwilcox log CDF", () => {
  const actual = pwilcox({
    at: 5,
    sizeFirstSample: 4,
    sizeSecondSample: 6,
    returnLog: true,
  });
  assertClose(actual, ref.log_cdf, TOL, "log_cdf");
});

// --- p-q round trip ---

Deno.test("wilcoxon: p-q round trip", () => {
  const f1 = 1 - 1e-7;
  const actual = ref.rt_x.map((x) =>
    qwilcox({
      probability: pwilcox({ at: x, sizeFirstSample: 4, sizeSecondSample: 6 }) * f1,
      sizeFirstSample: 4,
      sizeSecondSample: 6,
    })
  );
  assertArrayClose(actual, ref.rt_result, TOL, "round_trip");
});
