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

// Our impl matches R's TukeyHSD convention: pair label "higher-lower",
// meanDifference = mean(higher) - mean(lower), CI bounds in the same order as R.

Deno.test("Post-hoc: Tukey HSD", () => {
  const result = tukeyHSD(groups, 0.05);

  const findComp = (g1: string, g2: string) =>
    result.comparisons.find((c) => c.group1 === g1 && c.group2 === g2)!;

  // Group_2 vs Group_1 corresponds to R's B-A.
  const g2g1 = findComp("Group_2", "Group_1");
  assertClose(g2g1.meanDifference, ref.tukey.B_A.diff, TOL, "B-A diff");
  assertClose(
    g2g1.confidenceInterval.lower,
    ref.tukey.B_A.lwr,
    TOL,
    "B-A lwr",
  );
  assertClose(
    g2g1.confidenceInterval.upper,
    ref.tukey.B_A.upr,
    TOL,
    "B-A upr",
  );
  assertClose(g2g1.adjustedPValue, ref.tukey.B_A.p_adj, TOL, "B-A p_adj");

  // Group_3 vs Group_1 corresponds to R's C-A.
  const g3g1 = findComp("Group_3", "Group_1");
  assertClose(g3g1.meanDifference, ref.tukey.C_A.diff, TOL, "C-A diff");
  assertClose(
    g3g1.confidenceInterval.lower,
    ref.tukey.C_A.lwr,
    TOL,
    "C-A lwr",
  );
  assertClose(
    g3g1.confidenceInterval.upper,
    ref.tukey.C_A.upr,
    TOL,
    "C-A upr",
  );
  assertClose(g3g1.adjustedPValue, ref.tukey.C_A.p_adj, TOL, "C-A p_adj");

  // Group_3 vs Group_2 corresponds to R's C-B.
  const g3g2 = findComp("Group_3", "Group_2");
  assertClose(g3g2.meanDifference, ref.tukey.C_B.diff, TOL, "C-B diff");
  assertClose(
    g3g2.confidenceInterval.lower,
    ref.tukey.C_B.lwr,
    TOL,
    "C-B lwr",
  );
  assertClose(
    g3g2.confidenceInterval.upper,
    ref.tukey.C_B.upr,
    TOL,
    "C-B upr",
  );
  assertClose(g3g2.adjustedPValue, ref.tukey.C_B.p_adj, TOL, "C-B p_adj");
});

Deno.test("Post-hoc: Games-Howell", () => {
  const result = gamesHowellTest(groups, 0.05);

  const findComp = (g1: string, g2: string) =>
    result.comparisons.find((c) => c.group1 === g1 && c.group2 === g2)!;

  // Same "higher-lower" convention as Tukey.
  const g2g1 = findComp("Group_2", "Group_1");
  assertClose(
    g2g1.meanDifference,
    ref.games_howell.B_A.mean_diff,
    TOL,
    "GH B-A mean_diff",
  );
  assertClose(
    g2g1.pValue,
    ref.games_howell.B_A.p_value,
    TOL,
    "GH B-A p_value",
  );

  const g3g1 = findComp("Group_3", "Group_1");
  assertClose(
    g3g1.meanDifference,
    ref.games_howell.C_A.mean_diff,
    TOL,
    "GH C-A mean_diff",
  );
  assertClose(
    g3g1.pValue,
    ref.games_howell.C_A.p_value,
    TOL,
    "GH C-A p_value",
  );

  const g3g2 = findComp("Group_3", "Group_2");
  assertClose(
    g3g2.meanDifference,
    ref.games_howell.C_B.mean_diff,
    TOL,
    "GH C-B mean_diff",
  );
  assertClose(
    g3g2.pValue,
    ref.games_howell.C_B.p_value,
    TOL,
    "GH C-B p_value",
  );
});

Deno.test("Post-hoc: Dunn test (Bonferroni)", () => {
  const result = dunnTest(groups, 0.05);

  const findComp = (g1: string, g2: string) =>
    result.comparisons.find((c) => c.group1 === g1 && c.group2 === g2)!;

  // tidy-ts matches R `dunn.test`'s native convention:
  //   pair "A - B" (A=earlier factor level) → group1="Group_1", group2="Group_2"
  //   Z = (mean_rank_A - mean_rank_B) / SE, signed (so Z < 0 when A < B in values)
  //   adjusted p = pmin(1, P × m) where P = pnorm(|Z|, lower.tail=FALSE)
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
    // Z is signed and must match R exactly (sign + magnitude).
    assertClose(
      comp.testStatistic.value,
      ref.dunn[key].Z,
      TOL,
      `Dunn ${key} Z`,
    );
    assertClose(
      comp.adjustedPValue,
      ref.dunn[key].p_value,
      TOL,
      `Dunn ${key} p_value`,
    );
  }
});
