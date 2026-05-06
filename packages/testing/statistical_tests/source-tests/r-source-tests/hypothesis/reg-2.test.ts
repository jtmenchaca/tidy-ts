// Coverage of reg-tests-2.R (hypothesis tests):
// [x] L2418-2429: cor.test Kendall and Spearman with all three alternatives
// [x] L3199: t.test(1:28) basic correctness

import {
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../../../helpers.ts";
import { kendallTest } from "../../../../../dataframe/ts/stats/statistical-tests/correlation/kendall.ts";
import { spearmanTest } from "../../../../../dataframe/ts/stats/statistical-tests/correlation/spearman.ts";
import { tTestOneSample } from "../../../../../dataframe/ts/stats/statistical-tests/t-tests.ts";

const refPath = new URL("./reg-2-source-test.R", import.meta.url).pathname;

interface Ref {
  cor_x: number[];
  cor_y: number[];
  kendall_two_tau: number;
  kendall_two_p: number;
  kendall_less_p: number;
  kendall_greater_p: number;
  spearman_two_rho: number;
  spearman_two_p: number;
  spearman_less_p: number;
  spearman_greater_p: number;
  ttest_statistic: number;
  ttest_p_value: number;
  ttest_mean: number;
  ttest_ci_lower: number;
  ttest_ci_upper: number;
}

const ref = getReferenceFromRScript<Ref>(refPath);

Deno.test("L2418-2429: cor.test Kendall with all three alternatives", () => {
  const two = kendallTest({ x: ref.cor_x, y: ref.cor_y });
  const less = kendallTest({
    x: ref.cor_x,
    y: ref.cor_y,
    alternative: "less",
  });
  const greater = kendallTest({
    x: ref.cor_x,
    y: ref.cor_y,
    alternative: "greater",
  });

  assertClose(two.effectSize.value, ref.kendall_two_tau, TOL, "tau two-sided");
  assertClose(two.pValue, ref.kendall_two_p, TOL, "p two-sided");
  assertClose(less.pValue, ref.kendall_less_p, TOL, "p less");
  assertClose(greater.pValue, ref.kendall_greater_p, TOL, "p greater");
});

Deno.test("L2418-2429: cor.test Spearman with all three alternatives", () => {
  const two = spearmanTest({ x: ref.cor_x, y: ref.cor_y });
  const less = spearmanTest({
    x: ref.cor_x,
    y: ref.cor_y,
    alternative: "less",
  });
  const greater = spearmanTest({
    x: ref.cor_x,
    y: ref.cor_y,
    alternative: "greater",
  });

  assertClose(
    two.effectSize.value,
    ref.spearman_two_rho,
    TOL,
    "rho two-sided",
  );
  assertClose(two.pValue, ref.spearman_two_p, TOL, "p two-sided");
  assertClose(less.pValue, ref.spearman_less_p, TOL, "p less");
  assertClose(greater.pValue, ref.spearman_greater_p, TOL, "p greater");
});

Deno.test("L3199: t.test(1:28) basic correctness", () => {
  const data = Array.from({ length: 28 }, (_, i) => i + 1);
  const result = tTestOneSample({ data });

  assertClose(result.testStatistic.value, ref.ttest_statistic, TOL, "t stat");
  assertClose(result.pValue, ref.ttest_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.ttest_ci_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.ttest_ci_upper,
    TOL,
    "CI upper",
  );
});
