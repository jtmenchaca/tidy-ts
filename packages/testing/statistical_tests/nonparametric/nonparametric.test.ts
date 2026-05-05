import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import { wilcoxonSignedRankTest } from "../../../dataframe/ts/stats/statistical-tests/wilcoxon.ts";
import { kruskalWallisTest } from "../../../dataframe/ts/stats/statistical-tests/kruskal-wallis.ts";

const ref = getReferenceFromRScript<Record<string, number>>(
  new URL("./nonparametric-ref.R", import.meta.url).pathname,
);

// --- Fixed data ---
const paired_x = [85, 90, 78, 92, 88, 76, 95, 82];
const paired_y = [80, 85, 75, 89, 84, 72, 90, 78];

const kw_g1 = [7, 8, 6, 9, 7, 8];
const kw_g2 = [12, 14, 11, 13, 15, 12];
const kw_g3 = [18, 20, 17, 19, 21, 18];

// --- Wilcoxon Signed-Rank Tests ---
// R ref uses exact=FALSE, correct=TRUE to match our normal approximation with continuity correction

Deno.test("Nonparametric: wilcoxon_two_sided", () => {
  const result = wilcoxonSignedRankTest({ x: paired_x, y: paired_y });
  assertClose(result.testStatistic.value, ref.wilcoxon_two_sided_V, TOL, "V");
  assertClose(result.pValue, ref.wilcoxon_two_sided_p_value, TOL, "p-value");
});

Deno.test("Nonparametric: wilcoxon_greater", () => {
  const result = wilcoxonSignedRankTest({
    x: paired_x,
    y: paired_y,
    alternative: "greater",
  });
  assertClose(result.testStatistic.value, ref.wilcoxon_greater_V, TOL, "V");
  assertClose(result.pValue, ref.wilcoxon_greater_p_value, TOL, "p-value");
});

Deno.test("Nonparametric: wilcoxon_less", () => {
  const result = wilcoxonSignedRankTest({
    x: paired_x,
    y: paired_y,
    alternative: "less",
  });
  assertClose(result.testStatistic.value, ref.wilcoxon_less_V, TOL, "V");
  assertClose(result.pValue, ref.wilcoxon_less_p_value, TOL, "p-value");
});

Deno.test("Nonparametric: wilcoxon_ties", () => {
  const x = [1, 2, 2, 3, 4];
  const y = [1, 1, 2, 2, 3];
  const result = wilcoxonSignedRankTest({ x, y });
  assertClose(result.testStatistic.value, ref.wilcoxon_ties_V, TOL, "V");
  assertClose(result.pValue, ref.wilcoxon_ties_p_value, TOL, "p-value");
});

// --- Kruskal-Wallis Tests ---

Deno.test("Nonparametric: kruskal_basic", () => {
  const result = kruskalWallisTest([kw_g1, kw_g2, kw_g3]);
  assertClose(result.testStatistic.value, ref.kruskal_basic_H, TOL, "H");
  assertClose(result.pValue, ref.kruskal_basic_p_value, TOL, "p-value");
  expect(result.degreesOfFreedom).toBe(ref.kruskal_basic_df);
});

Deno.test("Nonparametric: kruskal_two_groups", () => {
  const result = kruskalWallisTest([kw_g1, kw_g2]);
  assertClose(result.testStatistic.value, ref.kruskal_two_groups_H, TOL, "H");
  assertClose(result.pValue, ref.kruskal_two_groups_p_value, TOL, "p-value");
  expect(result.degreesOfFreedom).toBe(ref.kruskal_two_groups_df);
});

Deno.test("Nonparametric: kruskal_ties", () => {
  const g1 = [1, 2, 2, 3];
  const g2 = [2, 3, 3, 4];
  const g3 = [3, 4, 4, 5];
  const result = kruskalWallisTest([g1, g2, g3]);
  assertClose(result.testStatistic.value, ref.kruskal_ties_H, TOL, "H");
  assertClose(result.pValue, ref.kruskal_ties_p_value, TOL, "p-value");
  expect(result.degreesOfFreedom).toBe(ref.kruskal_ties_df);
});
