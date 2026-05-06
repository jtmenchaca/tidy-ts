import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import { leveneTest } from "../../../dataframe/ts/stats/statistical-tests/levene.ts";

const ref = getReferenceFromRScript<Record<string, number>>(
  new URL("./levene-ref.R", import.meta.url).pathname,
);

Deno.test("Levene: equal_variance", () => {
  const g1 = [10, 12, 11, 13, 14];
  const g2 = [20, 22, 21, 23, 24];
  const g3 = [30, 32, 31, 33, 34];
  const result = leveneTest([g1, g2, g3]);

  assertClose(result.testStatistic.value, ref.equal_F, TOL, "F");
  assertClose(result.pValue, ref.equal_p, TOL, "p");
  expect(result.dfBetween).toBe(ref.equal_df_between);
  expect(result.dfWithin).toBe(ref.equal_df_within);
});

Deno.test("Levene: unequal_variance", () => {
  const g4 = [10, 11, 10, 11, 10];
  const g5 = [5, 15, 25, 35, 45];
  const g6 = [18, 22, 20, 24, 16];
  const result = leveneTest([g4, g5, g6]);

  assertClose(result.testStatistic.value, ref.unequal_F, TOL, "F");
  assertClose(result.pValue, ref.unequal_p, TOL, "p");
  expect(result.dfBetween).toBe(ref.unequal_df_between);
  expect(result.dfWithin).toBe(ref.unequal_df_within);
});

Deno.test("Levene: two_groups", () => {
  const g7 = [5.1, 4.9, 5.3, 5.0, 5.2, 4.8, 5.4];
  const g8 = [2.0, 8.0, 5.0, 1.0, 9.0, 3.0, 7.0];
  const result = leveneTest([g7, g8]);

  assertClose(result.testStatistic.value, ref.two_F, TOL, "F");
  assertClose(result.pValue, ref.two_p, TOL, "p");
  expect(result.dfBetween).toBe(ref.two_df_between);
  expect(result.dfWithin).toBe(ref.two_df_within);
});
