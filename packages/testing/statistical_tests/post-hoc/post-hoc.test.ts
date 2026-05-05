import { expect } from "@std/expect";
import {
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../helpers.ts";
import { tukeyHSD } from "../../../dataframe/ts/stats/statistical-tests/post-hoc/tukey-hsd.ts";
import { gamesHowellTest } from "../../../dataframe/ts/stats/statistical-tests/post-hoc/games-howell.ts";
import { dunnTest } from "../../../dataframe/ts/stats/statistical-tests/post-hoc/dunn.ts";

const g1 = [12, 14, 11, 13, 15, 10];
const g2 = [17, 19, 18, 20, 16, 21];
const g3 = [22, 24, 23, 21, 25, 20];

const groups = [g1, g2, g3];

interface TukeyComparison {
  diff: number;
  lwr: number;
  upr: number;
  p_adj: number;
}

interface GamesHowellComparison {
  mean_diff: number;
  se: number;
  t_stat: number;
  df: number;
  p_value: number;
}

interface DunnComparison {
  Z: number;
  p_value: number;
}

interface RefData {
  tukey: {
    B_A: TukeyComparison;
    C_A: TukeyComparison;
    C_B: TukeyComparison;
  };
  games_howell: {
    B_A: GamesHowellComparison;
    C_A: GamesHowellComparison;
    C_B: GamesHowellComparison;
  };
  dunn: Record<string, DunnComparison>;
}

const rScriptPath = new URL("./post-hoc-ref.R", import.meta.url).pathname;
const ref = getReferenceFromRScript<RefData>(rScriptPath);

// Our impl: meanDifference = group1_mean - group2_mean
// R TukeyHSD: B-A diff = mean(B) - mean(A) = -(group1_mean - group2_mean)
// So our diff = -R_diff, and CI bounds are negated+swapped

Deno.test("Post-hoc: Tukey HSD", () => {
  const result = tukeyHSD(groups, 0.05);

  const findComp = (g1: string, g2: string) =>
    result.comparisons.find((c) => c.group1 === g1 && c.group2 === g2)!;

  // Group_1 vs Group_2 corresponds to R's B_A (negated)
  const g1g2 = findComp("Group_1", "Group_2");
  assertClose(g1g2.meanDifference, -ref.tukey.B_A.diff, TOL, "G2-G1 diff");
  assertClose(
    g1g2.confidenceInterval.lower,
    -ref.tukey.B_A.upr,
    TOL,
    "G2-G1 lwr",
  );
  assertClose(
    g1g2.confidenceInterval.upper,
    -ref.tukey.B_A.lwr,
    TOL,
    "G2-G1 upr",
  );
  assertClose(g1g2.adjustedPValue, ref.tukey.B_A.p_adj, TOL, "G2-G1 p_adj");

  // Group_1 vs Group_3 corresponds to R's C_A (negated)
  const g1g3 = findComp("Group_1", "Group_3");
  assertClose(g1g3.meanDifference, -ref.tukey.C_A.diff, TOL, "G3-G1 diff");
  assertClose(
    g1g3.confidenceInterval.lower,
    -ref.tukey.C_A.upr,
    TOL,
    "G3-G1 lwr",
  );
  assertClose(
    g1g3.confidenceInterval.upper,
    -ref.tukey.C_A.lwr,
    TOL,
    "G3-G1 upr",
  );
  assertClose(g1g3.adjustedPValue, ref.tukey.C_A.p_adj, TOL, "G3-G1 p_adj");

  // Group_2 vs Group_3 corresponds to R's C_B (negated)
  const g2g3 = findComp("Group_2", "Group_3");
  assertClose(g2g3.meanDifference, -ref.tukey.C_B.diff, TOL, "G3-G2 diff");
  assertClose(
    g2g3.confidenceInterval.lower,
    -ref.tukey.C_B.upr,
    TOL,
    "G3-G2 lwr",
  );
  assertClose(
    g2g3.confidenceInterval.upper,
    -ref.tukey.C_B.lwr,
    TOL,
    "G3-G2 upr",
  );
  assertClose(g2g3.adjustedPValue, ref.tukey.C_B.p_adj, TOL, "G3-G2 p_adj");
});

Deno.test("Post-hoc: Games-Howell", () => {
  const result = gamesHowellTest(groups, 0.05);

  const findComp = (g1: string, g2: string) =>
    result.comparisons.find((c) => c.group1 === g1 && c.group2 === g2)!;

  // Same negation as Tukey: our diff = group1_mean - group2_mean = -(R's higher-lower)
  const g1g2 = findComp("Group_1", "Group_2");
  assertClose(
    g1g2.meanDifference,
    -ref.games_howell.B_A.mean_diff,
    TOL,
    "GH G2-G1 mean_diff",
  );
  assertClose(
    g1g2.pValue,
    ref.games_howell.B_A.p_value,
    TOL,
    "GH G2-G1 p_value",
  );

  const g1g3 = findComp("Group_1", "Group_3");
  assertClose(
    g1g3.meanDifference,
    -ref.games_howell.C_A.mean_diff,
    TOL,
    "GH G3-G1 mean_diff",
  );
  assertClose(
    g1g3.pValue,
    ref.games_howell.C_A.p_value,
    TOL,
    "GH G3-G1 p_value",
  );

  const g2g3 = findComp("Group_2", "Group_3");
  assertClose(
    g2g3.meanDifference,
    -ref.games_howell.C_B.mean_diff,
    TOL,
    "GH G3-G2 mean_diff",
  );
  assertClose(
    g2g3.pValue,
    ref.games_howell.C_B.p_value,
    TOL,
    "GH G3-G2 p_value",
  );
});

Deno.test("Post-hoc: Dunn test (Bonferroni)", () => {
  const result = dunnTest(groups, 0.05);

  const findComp = (g1: string, g2: string) =>
    result.comparisons.find((c) => c.group1 === g1 && c.group2 === g2)!;

  // R dunn.test uses "A - B" format → key becomes "A_B"
  // Map: A=Group_1, B=Group_2, C=Group_3
  const labelMap: Record<string, string> = {
    A: "Group_1",
    B: "Group_2",
    C: "Group_3",
  };

  const dunnKeys = Object.keys(ref.dunn);

  for (const key of dunnKeys) {
    const [first, second] = key.split("_");
    const group1 = labelMap[first];
    const group2 = labelMap[second];
    const comp = findComp(group1, group2);
    expect(comp).toBeDefined();
    // Dunn Z sign may differ based on ordering convention
    assertClose(
      Math.abs(comp.testStatistic.value),
      Math.abs(ref.dunn[key].Z),
      TOL,
      `Dunn ${key} |Z|`,
    );
    assertClose(
      comp.adjustedPValue,
      ref.dunn[key].p_value,
      TOL,
      `Dunn ${key} p_value`,
    );
  }
});
