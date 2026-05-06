// Coverage of reg-tests-1a.R (hypothesis tests):
// [x] L1147-1154: ks.test two-sample, Hollander & Wolfe example (PR#1004 rounding fix)

import {
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../../../helpers.ts";
import { kolmogorovSmirnovTest } from "../../../../../dataframe/ts/stats/statistical-tests/kolmogorov-smirnov.ts";

const refPath = new URL("./reg-1a-source-test.R", import.meta.url).pathname;

interface Ref {
  ks_x: number[];
  ks_y: number[];
  ks_statistic: number;
  ks_p_value: number;
}

const ref = getReferenceFromRScript<Ref>(refPath);

Deno.test("L1147-1154: ks.test two-sample (D=0.6, p=15/286)", () => {
  const result = kolmogorovSmirnovTest({ x: ref.ks_x, y: ref.ks_y });
  assertClose(result.dStatistic, ref.ks_statistic, TOL, "D statistic");
  assertClose(result.pValue, ref.ks_p_value, TOL, "p-value");
});
