// Coverage of reg-tests-1b.R (hypothesis tests):
// [x] L364: shapiro.test(c(0,0,1))$p.value >= 0 (rounding fix)
// [x] L810-813: cor.test Spearman symmetry -- greater on (x,y) == less on (x,-y) (PR#13574)
// [x] L1074-1076: ks.test(1:5, c(2.5,4.5)) p=20/21 (floating point edge case)

import { expect } from "@std/expect";
import {
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../../../helpers.ts";
import { shapiroWilkTest } from "../../../../../dataframe/ts/stats/statistical-tests/shapiro-wilk.ts";
import { spearmanTest } from "../../../../../dataframe/ts/stats/statistical-tests/correlation/spearman.ts";
import { kolmogorovSmirnovTest } from "../../../../../dataframe/ts/stats/statistical-tests/kolmogorov-smirnov.ts";

const refPath = new URL("./reg-1b-source-test.R", import.meta.url).pathname;

interface Ref {
  shapiro_statistic: number;
  shapiro_p_value: number;
  spearman_x: number[];
  spearman_y: number[];
  spearman_greater_p: number;
  spearman_greater_rho: number;
  spearman_less_p: number;
  spearman_less_rho: number;
  ks5_statistic: number;
  ks5_p_value: number;
}

const ref = getReferenceFromRScript<Ref>(refPath);

Deno.test("L364: shapiro.test(c(0,0,1)) p-value >= 0", () => {
  const result = shapiroWilkTest({ data: [0, 0, 1] });
  expect(result.pValue).toBeGreaterThanOrEqual(0);
  assertClose(
    result.testStatistic.value,
    ref.shapiro_statistic,
    TOL,
    "W statistic",
  );
  assertClose(result.pValue, ref.shapiro_p_value, TOL, "p-value");
});

Deno.test("L810-813: cor.test Spearman symmetry (PR#13574)", () => {
  const negY = ref.spearman_y.map((v) => -v);
  const greater = spearmanTest({
    x: ref.spearman_x,
    y: ref.spearman_y,
    alternative: "greater",
  });
  const less = spearmanTest({
    x: ref.spearman_x,
    y: negY,
    alternative: "less",
  });
  assertClose(greater.pValue, ref.spearman_greater_p, TOL, "greater p-value");
  assertClose(
    greater.effectSize.value,
    ref.spearman_greater_rho,
    TOL,
    "greater rho",
  );
  assertClose(less.pValue, ref.spearman_less_p, TOL, "less p-value");
  assertClose(less.effectSize.value, ref.spearman_less_rho, TOL, "less rho");
  // Symmetry: p-values should be equal
  assertClose(greater.pValue, less.pValue, TOL, "symmetry p-values");
});

Deno.test("L1074-1076: ks.test(1:5, c(2.5,4.5)) p=20/21", () => {
  const result = kolmogorovSmirnovTest({
    x: [1, 2, 3, 4, 5],
    y: [2.5, 4.5],
  });
  assertClose(result.dStatistic, ref.ks5_statistic, TOL, "D statistic");
  assertClose(result.pValue, ref.ks5_p_value, TOL, "p-value");
});
