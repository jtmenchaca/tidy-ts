import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import { mannWhitneyTest } from "../../../dataframe/ts/stats/statistical-tests/mann-whitney.ts";

interface MannWhitneyRef {
  basic_W: number;
  basic_pValue: number;
  basic_alternative: string;
  basic_method: string;

  one_sided_less_W: number;
  one_sided_less_pValue: number;
  one_sided_less_alternative: string;
  one_sided_less_method: string;

  one_sided_greater_W: number;
  one_sided_greater_pValue: number;
  one_sided_greater_alternative: string;
  one_sided_greater_method: string;

  ties_W: number;
  ties_pValue: number;
  ties_alternative: string;
  ties_method: string;

  large_sample_W: number;
  large_sample_pValue: number;
  large_sample_alternative: string;
  large_sample_method: string;

  identical_groups_W: number;
  identical_groups_pValue: number;
  identical_groups_alternative: string;
  identical_groups_method: string;

  single_obs_W: number;
  single_obs_pValue: number;
  single_obs_alternative: string;
  single_obs_method: string;

  continuity_W: number;
  continuity_pValue: number;
}

const ref = getReferenceFromRScript<MannWhitneyRef>(
  new URL("./mann-whitney-ref.R", import.meta.url).pathname,
);

// R ref uses exact=FALSE, correct=FALSE — matching our normal approximation

Deno.test("Mann-Whitney: basic two-sided", () => {
  const result = mannWhitneyTest({
    x: [14, 15, 16, 17, 18],
    y: [20, 21, 22, 23, 24],
    alternative: "two-sided",
    exact: false,
    continuityCorrection: false,
  });

  assertClose(result.testStatistic.value, ref.basic_W, TOL, "W statistic");
  assertClose(result.pValue, ref.basic_pValue, TOL, "p-value");
  expect(typeof result.effectSize.value).toBe("number");
  expect(result.alternative).toBe("two-sided");
});

Deno.test("Mann-Whitney: one-sided less", () => {
  const result = mannWhitneyTest({
    x: [14, 15, 16, 17, 18],
    y: [20, 21, 22, 23, 24],
    alternative: "less",
    exact: false,
    continuityCorrection: false,
  });

  assertClose(result.testStatistic.value, ref.one_sided_less_W, TOL, "W statistic");
  assertClose(result.pValue, ref.one_sided_less_pValue, TOL, "p-value");
  expect(typeof result.effectSize.value).toBe("number");
  expect(result.alternative).toBe("less");
});

Deno.test("Mann-Whitney: one-sided greater", () => {
  const result = mannWhitneyTest({
    x: [14, 15, 16, 17, 18],
    y: [20, 21, 22, 23, 24],
    alternative: "greater",
    exact: false,
    continuityCorrection: false,
  });

  assertClose(result.testStatistic.value, ref.one_sided_greater_W, TOL, "W statistic");
  assertClose(result.pValue, ref.one_sided_greater_pValue, TOL, "p-value");
  expect(typeof result.effectSize.value).toBe("number");
  expect(result.alternative).toBe("greater");
});

Deno.test("Mann-Whitney: ties", () => {
  const result = mannWhitneyTest({
    x: [1, 2, 2, 3, 4],
    y: [2, 3, 3, 4, 5],
    exact: false,
    continuityCorrection: false,
  });

  assertClose(result.testStatistic.value, ref.ties_W, TOL, "W statistic");
  assertClose(result.pValue, ref.ties_pValue, TOL, "p-value");
  expect(typeof result.effectSize.value).toBe("number");
  expect(result.alternative).toBe("two-sided");
});

Deno.test("Mann-Whitney: large sample normal approximation", () => {
  const x = Array.from({ length: 30 }, (_, i) => i + 1);
  const y = Array.from({ length: 30 }, (_, i) => i + 5);

  const result = mannWhitneyTest({
    x,
    y,
    exact: false,
    continuityCorrection: false,
  });

  assertClose(result.testStatistic.value, ref.large_sample_W, TOL, "W statistic");
  assertClose(result.pValue, ref.large_sample_pValue, TOL, "p-value");
  expect(typeof result.effectSize.value).toBe("number");
  expect(result.alternative).toBe("two-sided");
});

Deno.test("Mann-Whitney: identical groups", () => {
  const result = mannWhitneyTest({
    x: [1, 2, 3, 4, 5],
    y: [1, 2, 3, 4, 5],
    exact: false,
    continuityCorrection: false,
  });

  assertClose(result.testStatistic.value, ref.identical_groups_W, TOL, "W statistic");
  assertClose(result.pValue, ref.identical_groups_pValue, TOL, "p-value");
  expect(typeof result.effectSize.value).toBe("number");
  expect(result.alternative).toBe("two-sided");
});

Deno.test("Mann-Whitney: single observation", () => {
  const result = mannWhitneyTest({
    x: [5],
    y: [1, 2, 3],
    exact: false,
    continuityCorrection: false,
  });

  assertClose(result.testStatistic.value, ref.single_obs_W, TOL, "W statistic");
  assertClose(result.pValue, ref.single_obs_pValue, TOL, "p-value");
  expect(typeof result.effectSize.value).toBe("number");
  expect(result.alternative).toBe("two-sided");
});

Deno.test("Mann-Whitney: continuity correction", () => {
  const result = mannWhitneyTest({
    x: [14, 15, 16, 17, 18],
    y: [20, 21, 22, 23, 24],
    alternative: "two-sided",
    exact: false,
    continuityCorrection: true,
  });

  assertClose(result.testStatistic.value, ref.continuity_W, TOL, "W statistic");
  assertClose(result.pValue, ref.continuity_pValue, TOL, "p-value");
  expect(result.alternative).toBe("two-sided");
});
