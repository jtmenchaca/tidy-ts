import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import {
  anovaOneWay,
  twoWayAnova,
  welchAnovaOneWay,
} from "../../../dataframe/ts/stats/statistical-tests/anova.ts";

interface AnovaRef {
  oneway: {
    F: number;
    p: number;
    df_between: number;
    df_within: number;
    SS_between: number;
    SS_within: number;
    MS_between: number;
    MS_within: number;
  };
  welch: {
    F: number;
    "num.df": number;
    "denom.df": number;
    "p.value": number;
  };
  oneway_unequal: {
    F: number;
    p: number;
    df_between: number;
    df_within: number;
    SS_between: number;
    SS_within: number;
    MS_between: number;
    MS_within: number;
  };
  two_way: {
    F_A: number;
    p_A: number;
    F_B: number;
    p_B: number;
    F_AB: number;
    p_AB: number;
    df_A: number;
    df_B: number;
    df_AB: number;
    df_error: number;
  };
}

const rScriptPath = new URL("./anova-ref.R", import.meta.url).pathname;
const ref = getReferenceFromRScript<AnovaRef>(rScriptPath);

// Fixed data
const group1 = [12, 14, 11, 13, 15];
const group2 = [17, 19, 18, 20, 16];
const group3 = [22, 24, 23, 21, 25];

Deno.test("ANOVA: oneway", () => {
  const result = anovaOneWay([group1, group2, group3]);

  assertClose(result.testStatistic.value, ref.oneway.F, TOL, "F");
  assertClose(result.pValue, ref.oneway.p, TOL, "p");
  expect(result.dfBetween).toBe(ref.oneway.df_between);
  expect(result.dfWithin).toBe(ref.oneway.df_within);
});

Deno.test("ANOVA: welch", () => {
  const result = welchAnovaOneWay([group1, group2, group3]);

  assertClose(result.testStatistic.value, ref.welch.F, TOL, "F");
  assertClose(result.pValue, ref.welch["p.value"], TOL, "p");
});

Deno.test("ANOVA: oneway_unequal", () => {
  const group4 = [5, 6, 7, 8, 9, 10, 11];
  const result = anovaOneWay([group1, group2, group4]);

  assertClose(result.testStatistic.value, ref.oneway_unequal.F, TOL, "F");
  assertClose(result.pValue, ref.oneway_unequal.p, TOL, "p");
  expect(result.dfBetween).toBe(ref.oneway_unequal.df_between);
  expect(result.dfWithin).toBe(ref.oneway_unequal.df_within);
});

Deno.test("ANOVA: two_way", () => {
  const data: number[][][] = [
    // Factor A level 1
    [
      [4, 5, 6, 7], // B1
      [8, 9, 10, 11], // B2
    ],
    // Factor A level 2
    [
      [6, 7, 8, 9], // B1
      [12, 13, 14, 15], // B2
    ],
  ];

  const result = twoWayAnova({ data, alpha: 0.05 });

  assertClose(result.factorA.testStatistic.value, ref.two_way.F_A, TOL, "F_A");
  assertClose(result.factorA.pValue, ref.two_way.p_A, TOL, "p_A");
  assertClose(result.factorB.testStatistic.value, ref.two_way.F_B, TOL, "F_B");
  assertClose(result.factorB.pValue, ref.two_way.p_B, TOL, "p_B");
  assertClose(
    result.interaction.testStatistic.value,
    ref.two_way.F_AB,
    TOL,
    "F_AB",
  );
  assertClose(result.interaction.pValue, ref.two_way.p_AB, TOL, "p_AB");
});
