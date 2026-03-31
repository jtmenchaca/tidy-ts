// Translation of SEQTaRget test: test_survival.R
// R reference JSON: survival-source-test.R (sibling file)
// Tests survival curves, risk data, and risk comparisons

import { expect } from "@std/expect";
import { targetTrialEmulation } from "../../dataframe/ts/targetTrial/index.ts";
import type { TargetTrialConfig, ColumnarData } from "../../dataframe/ts/targetTrial/types.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadSEQdata,
  toColumnarData,
  TOL_SURV,
} from "./target-trial-test-helpers.ts";

const R_SOURCE_TEST = new URL("./survival-source-test.R", import.meta.url)
  .pathname;

interface SurvRef {
  surv_followup_0: number[];
  surv_value_0: number[];
  surv_followup_1: number[];
  surv_value_1: number[];
  risk_arms: string[];
  risk_values: number[];
  risk_comp_ax: string[];
  risk_comp_ay: string[];
  risk_ratio: number[];
  risk_difference: number[];
}

const ref = getReferenceFromRScript<SurvRef>(R_SOURCE_TEST);

function seqDataColumnar(): ColumnarData {
  const rows = loadSEQdata();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P", "excusedZero", "excusedOne"],
  );
}

function ittConfigWithKM(): TargetTrialConfig {
  return {
    id: "ID",
    time: "time",
    treatment: "tx_init",
    outcome: "outcome",
    eligible: "eligible",
    method: "ITT",
    treat_levels: [0, 1],
    multinomial: false,
    followup_min: 0,
    followup_max: Infinity,
    survival_max: Infinity,
    trial_include: true,
    followup_include: true,
    followup_spline: false,
    followup_class: false,
    time_varying: ["N", "L", "P"],
    fixed: ["sex"],
    covariates: null,
    numerator: null,
    denominator: null,
    cense_numerator: null,
    cense_denominator: null,
    visit_numerator: null,
    visit_denominator: null,
    cense: null,
    cense_eligible: null,
    excused: false,
    excused_cols: [],
    ltfu: false,
    km_curves: true,
    hazard: false,
    compevent: null,
    visit: null,
    subgroup: null,
    selection_random: false,
    selection_prob: 0.8,
    selection_first_trial: false,
    indicator_baseline: "_bas",
    indicator_squared: "_sq",
    bootstrap: {
      enabled: false,
      nboot: 0,
      sample_fraction: 0.8,
      ci_method: "SE",
      ci_level: 0.95,
      seed: 1636,
    },
    weights: {
      weighted: false,
      lower: 0,
      upper: Infinity,
      p99: false,
      preexpansion: true,
      lag_condition: true,
      eligible_cols: [],
    },
    deviation: {
      enabled: false,
      col: null,
      conditions: [],
      excused: false,
      excused_cols: [],
    },
  };
}

Deno.test("ITT survival curves match R", () => {
  const config = ittConfigWithKM();
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  // Check we have survival curves for arms "0" and "1"
  expect(result.survival).toBeDefined();
  const arm0 = result.survival["0"];
  const arm1 = result.survival["1"];
  expect(arm0).toBeDefined();
  expect(arm1).toBeDefined();

  // Check survival values match R
  const arm0_values = arm0.map((p) => p.value);
  const arm1_values = arm1.map((p) => p.value);

  assertArrayClose(arm0_values, ref.surv_value_0, TOL_SURV, "surv arm 0");
  assertArrayClose(arm1_values, ref.surv_value_1, TOL_SURV, "surv arm 1");
});

Deno.test("ITT risk data matches R", () => {
  const config = ittConfigWithKM();
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  // risk_data is Vec<(String, f64, Option<f64>, Option<f64>)>
  expect(result.risk_data.length).toBe(ref.risk_arms.length);
  for (let i = 0; i < ref.risk_arms.length; i++) {
    expect(result.risk_data[i][0]).toBe(ref.risk_arms[i]);
    assertClose(result.risk_data[i][1], ref.risk_values[i], TOL_SURV, `risk arm ${i}`);
  }
});

Deno.test("ITT risk comparison matches R", () => {
  const config = ittConfigWithKM();
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.risk_comparisons.length).toBe(ref.risk_ratio.length);
  for (let i = 0; i < ref.risk_ratio.length; i++) {
    assertClose(
      result.risk_comparisons[i].risk_ratio,
      ref.risk_ratio[i],
      TOL_SURV,
      `risk_ratio[${i}]`,
    );
    assertClose(
      result.risk_comparisons[i].risk_difference,
      ref.risk_difference[i],
      TOL_SURV,
      `risk_difference[${i}]`,
    );
  }
});
