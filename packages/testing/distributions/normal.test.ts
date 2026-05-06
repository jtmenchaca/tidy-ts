import { expect } from "@std/expect";
import {
  assertClose,
  assertArrayClose,
  getReferenceFromRScript,
  TOL,
} from "../statistical_tests/helpers.ts";
import {
  dnorm,
  pnorm,
  qnorm,
} from "../../dataframe/ts/stats/distributions/index.ts";

interface NormalRef {
  std_dnorm_x: number[];
  std_dnorm_vals: number[];
  std_pnorm_vals: number[];
  std_qnorm_p: number[];
  std_qnorm_vals: number[];
  ns_x: number[];
  ns_dnorm_vals: number[];
  ns_pnorm_vals: number[];
  ns_qnorm_p: number[];
  ns_qnorm_vals: number[];
  upper_tail_196: number;
  upper_tail_neg196: number;
  log_dnorm_0: number;
  log_pnorm_0: number;
  edge_sd0_dnorm: number[];
  edge_sd0_pnorm: number[];
  extreme_qnorm_1e20: number;
  extreme_qnorm_1e100: number;
  extreme_qnorm_1e300: number;
  roundtrip_x: number[];
  roundtrip_vals: number[];
}

const ref = getReferenceFromRScript<NormalRef>(
  new URL("./normal-ref.R", import.meta.url).pathname,
);

// --- Standard normal: dnorm ---

Deno.test("dnorm: standard normal density at representative points", () => {
  const x = ref.std_dnorm_x;
  const actual = x.map((v) => dnorm({ at: v }));
  assertArrayClose(actual, ref.std_dnorm_vals, TOL, "std_dnorm");
});

// --- Standard normal: pnorm ---

Deno.test("pnorm: standard normal CDF at representative points", () => {
  const x = ref.std_dnorm_x;
  const actual = x.map((v) => pnorm({ at: v }));
  assertArrayClose(actual, ref.std_pnorm_vals, TOL, "std_pnorm");
});

// --- Standard normal: qnorm ---

Deno.test("qnorm: standard normal quantiles", () => {
  const p = ref.std_qnorm_p;
  const actual = p.map((v) => qnorm({ probability: v }));
  assertArrayClose(actual, ref.std_qnorm_vals, TOL, "std_qnorm");
});

// --- Non-standard (mean=5, sd=2) ---

Deno.test("dnorm: non-standard normal (mean=5, sd=2)", () => {
  const x = ref.ns_x;
  const actual = x.map((v) =>
    dnorm({ at: v, mean: 5, standardDeviation: 2 })
  );
  assertArrayClose(actual, ref.ns_dnorm_vals, TOL, "ns_dnorm");
});

Deno.test("pnorm: non-standard normal (mean=5, sd=2)", () => {
  const x = ref.ns_x;
  const actual = x.map((v) =>
    pnorm({ at: v, mean: 5, standardDeviation: 2 })
  );
  assertArrayClose(actual, ref.ns_pnorm_vals, TOL, "ns_pnorm");
});

Deno.test("qnorm: non-standard normal (mean=5, sd=2)", () => {
  const p = ref.ns_qnorm_p;
  const actual = p.map((v) =>
    qnorm({ probability: v, mean: 5, standardDeviation: 2 })
  );
  assertArrayClose(actual, ref.ns_qnorm_vals, TOL, "ns_qnorm");
});

// --- Upper tail ---

Deno.test("pnorm: upper tail P(X > 1.96)", () => {
  const actual = pnorm({ at: 1.96, direction: "above" });
  assertClose(actual, ref.upper_tail_196, TOL, "upper_tail_196");
});

Deno.test("pnorm: upper tail P(X > -1.96)", () => {
  const actual = pnorm({ at: -1.96, direction: "above" });
  assertClose(actual, ref.upper_tail_neg196, TOL, "upper_tail_neg196");
});

// --- Log scale ---

Deno.test("dnorm: log density at 0", () => {
  const actual = dnorm({ at: 0, returnLog: true });
  assertClose(actual, ref.log_dnorm_0, TOL, "log_dnorm_0");
});

Deno.test("pnorm: log probability at 0", () => {
  const actual = pnorm({ at: 0, returnLog: true });
  assertClose(actual, ref.log_pnorm_0, TOL, "log_pnorm_0");
});

// --- Edge: sd=0 ---

Deno.test("dnorm: degenerate distribution (sd=0)", () => {
  const xs = [2, 3, 4];
  const actual = xs.map((v) =>
    dnorm({ at: v, mean: 3, standardDeviation: 0 })
  );
  assertArrayClose(actual, ref.edge_sd0_dnorm, TOL, "edge_sd0_dnorm");
});

Deno.test("pnorm: degenerate distribution (sd=0)", () => {
  const xs = [2, 3, 4];
  const actual = xs.map((v) =>
    pnorm({ at: v, mean: 3, standardDeviation: 0 })
  );
  assertArrayClose(actual, ref.edge_sd0_pnorm, TOL, "edge_sd0_pnorm");
});

// --- Extreme tails ---

Deno.test("qnorm: extreme tail probabilities", () => {
  assertClose(
    qnorm({ probability: 1e-20 }),
    ref.extreme_qnorm_1e20,
    TOL,
    "qnorm(1e-20)",
  );
  assertClose(
    qnorm({ probability: 1e-100 }),
    ref.extreme_qnorm_1e100,
    TOL,
    "qnorm(1e-100)",
  );
  assertClose(
    qnorm({ probability: 1e-300 }),
    ref.extreme_qnorm_1e300,
    TOL,
    "qnorm(1e-300)",
  );
});

// --- p-q round trip ---

Deno.test("qnorm(pnorm(x)) round trip", () => {
  const x = ref.roundtrip_x;
  const actual = x.map((v) => qnorm({ probability: pnorm({ at: v }) }));
  assertArrayClose(actual, ref.roundtrip_vals, TOL, "roundtrip");
});
