import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import { shapiroWilkTest } from "../../../dataframe/ts/stats/statistical-tests/shapiro-wilk.ts";
import { andersonDarlingTest } from "../../../dataframe/ts/stats/statistical-tests/anderson-darling.ts";
import { dagostinoPearsonTest } from "../../../dataframe/ts/stats/statistical-tests/dagostino-pearson.ts";

const refPath = new URL("./normality-ref.R", import.meta.url).pathname;

interface NormalityRef {
  shapiro_normal_W: number;
  shapiro_normal_p: number;
  shapiro_skewed_W: number;
  shapiro_skewed_p: number;
  shapiro_uniform_W: number;
  shapiro_uniform_p: number;
  ad_normal_A: number;
  ad_normal_p: number;
  ad_skewed_A: number;
  ad_skewed_p: number;
  dagostino_normal_stat: number;
  dagostino_normal_p: number;
  dagostino_skewed_stat: number;
  dagostino_skewed_p: number;
}

const ref = getReferenceFromRScript<NormalityRef>(refPath);

const normal_data = [0.12, -0.45, 0.78, -0.23, 1.34, -0.67, 0.56, -0.12, 0.89, -0.34, 0.45, -0.78, 1.12, -0.56, 0.23, 0.67, -0.89, 0.34, -0.11, 0.90];
const skewed_data = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 10.0, 12.0, 15.0, 20.0, 30.0];
const uniform_data = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00];

Deno.test("Normality: Shapiro-Wilk normal data", () => {
  const result = shapiroWilkTest({ data: normal_data, alpha: 0.05 });
  assertClose(result.testStatistic.value, ref.shapiro_normal_W, TOL, "W");
  assertClose(result.pValue, ref.shapiro_normal_p, TOL, "p-value");
});

Deno.test("Normality: Shapiro-Wilk skewed data", () => {
  const result = shapiroWilkTest({ data: skewed_data, alpha: 0.05 });
  assertClose(result.testStatistic.value, ref.shapiro_skewed_W, TOL, "W");
  assertClose(result.pValue, ref.shapiro_skewed_p, TOL, "p-value");
});

Deno.test("Normality: Shapiro-Wilk uniform data", () => {
  const result = shapiroWilkTest({ data: uniform_data, alpha: 0.05 });
  assertClose(result.testStatistic.value, ref.shapiro_uniform_W, TOL, "W");
  assertClose(result.pValue, ref.shapiro_uniform_p, TOL, "p-value");
});

Deno.test("Normality: Anderson-Darling normal data", () => {
  const result = andersonDarlingTest({ data: normal_data, alpha: 0.05 });
  assertClose(result.testStatistic.value, ref.ad_normal_A, TOL, "A");
  assertClose(result.pValue, ref.ad_normal_p, TOL, "p-value");
});

Deno.test("Normality: Anderson-Darling skewed data", () => {
  const result = andersonDarlingTest({ data: skewed_data, alpha: 0.05 });
  assertClose(result.testStatistic.value, ref.ad_skewed_A, TOL, "A");
  assertClose(result.pValue, ref.ad_skewed_p, TOL, "p-value");
});

Deno.test("Normality: D'Agostino-Pearson normal data", () => {
  const result = dagostinoPearsonTest({ data: normal_data, alpha: 0.05 });
  assertClose(result.testStatistic.value, ref.dagostino_normal_stat, TOL, "omnibus statistic");
  assertClose(result.pValue, ref.dagostino_normal_p, TOL, "p-value");
});

Deno.test("Normality: D'Agostino-Pearson skewed data", () => {
  const result = dagostinoPearsonTest({ data: skewed_data, alpha: 0.05 });
  assertClose(result.testStatistic.value, ref.dagostino_skewed_stat, TOL, "omnibus statistic");
  assertClose(result.pValue, ref.dagostino_skewed_p, TOL, "p-value");
});
