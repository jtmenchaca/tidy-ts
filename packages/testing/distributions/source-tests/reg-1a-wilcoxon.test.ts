// Coverage of reg-tests-1a.R:
// [x] L792-794: dwilcox(x, 4, 6) == dwilcox(x, 6, 4) -- symmetry
// [x] L795-796: abs(pwilcox(x, 4, 6) - cumsum(dwilcox(x, 4, 6))) < 10 * .Machine$double.eps

import { expect } from "@std/expect";
import {
  dwilcox,
  pwilcox,
} from "../../../dataframe/ts/stats/distributions/wilcoxon.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  TOL,
} from "../../statistical_tests/helpers.ts";

const refPath = new URL("./reg-1a-wilcoxon-source-test.R", import.meta.url)
  .pathname;

interface Ref {
  x: number[];
  dwilcox_46: number[];
  dwilcox_64: number[];
  pwilcox: number[];
  cumsum_dwilcox: number[];
}

const ref = getReferenceFromRScript<Ref>(refPath);

Deno.test("L792-794: dwilcox(x, 4, 6) == dwilcox(x, 6, 4) -- symmetry", () => {
  const fx46 = ref.x.map((xi) =>
    dwilcox({ at: xi, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  const fx64 = ref.x.map((xi) =>
    dwilcox({ at: xi, sizeFirstSample: 6, sizeSecondSample: 4 })
  );
  assertArrayClose(fx46, ref.dwilcox_46, TOL, "dwilcox(x,4,6) vs R");
  assertArrayClose(fx64, ref.dwilcox_64, TOL, "dwilcox(x,6,4) vs R");
  // Symmetry: dwilcox(x,4,6) == dwilcox(x,6,4)
  assertArrayClose(fx46, fx64, TOL, "symmetry");
});

Deno.test("L795-796: pwilcox(x, 4, 6) == cumsum(dwilcox(x, 4, 6))", () => {
  const Fx = ref.x.map((xi) =>
    pwilcox({ at: xi, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  assertArrayClose(Fx, ref.pwilcox, TOL, "pwilcox vs R");

  // Verify cumsum(dwilcox) matches pwilcox (R assertion: < 10 * .Machine$double.eps)
  const fx = ref.x.map((xi) =>
    dwilcox({ at: xi, sizeFirstSample: 4, sizeSecondSample: 6 })
  );
  const cumFx: number[] = [];
  let sum = 0;
  for (const v of fx) {
    sum += v;
    cumFx.push(sum);
  }
  assertArrayClose(cumFx, Fx, TOL, "cumsum(dwilcox) == pwilcox");
});
