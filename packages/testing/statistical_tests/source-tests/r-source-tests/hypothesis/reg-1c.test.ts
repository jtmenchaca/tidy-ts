// Coverage of reg-tests-1c.R (hypothesis tests):
// [x] L1390-1399: cor.test() with extremely small p-values -- symmetry check (PR#16704)

import {
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../../../helpers.ts";
import { pearsonTest } from "../../../../../dataframe/ts/stats/statistical-tests/correlation/pearson.ts";

const refPath = new URL("./reg-1c-source-test.R", import.meta.url).pathname;

interface Ref {
  a: number[];
  b: number[];
  pearson_p1: number;
  pearson_p2: number;
  pearson_r1: number;
  pearson_r2: number;
}

const ref = getReferenceFromRScript<Ref>(refPath);

Deno.test("L1390-1399: cor.test Pearson symmetry with small p-values", () => {
  const negB = ref.b.map((v) => -v);
  const r1 = pearsonTest({ x: ref.a, y: ref.b });
  const r2 = pearsonTest({ x: ref.a, y: negB });

  assertClose(r1.effectSize.value, ref.pearson_r1, TOL, "r(a,b)");
  assertClose(r2.effectSize.value, ref.pearson_r2, TOL, "r(a,-b)");
  assertClose(r1.pValue, ref.pearson_p1, TOL, "p(a,b)");
  assertClose(r2.pValue, ref.pearson_p2, TOL, "p(a,-b)");
  // Symmetry: p-values should be equal
  assertClose(r1.pValue, r2.pValue, TOL, "symmetry p-values");
});
