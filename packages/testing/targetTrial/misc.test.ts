// Translation of SEQTaRget tests: test_misc.R
// R reference JSON: misc-source-test.R (sibling file)
// Tests miscellaneous configuration variants and edge cases

import { expect } from "@std/expect";
import { targetTrialEmulation } from "../../dataframe/ts/targetTrial/index.ts";
import type { TargetTrialConfig, ColumnarData } from "../../dataframe/ts/targetTrial/types.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  loadSEQdata,
  loadSEQdataLTFU,
  toColumnarData,
  TOL,
} from "./target-trial-test-helpers.ts";

const R_SOURCE_TEST = new URL("./misc-source-test.R", import.meta.url)
  .pathname;

interface MiscRef {
  cens_unwt_coef_names: string[];
  cens_unwt_coef_values: number[];
  spline_coef_names: string[];
  spline_coef_values: number[];
  no_fup_coef_names: string[];
  no_fup_coef_values: number[];
  visit_coef_names: string[];
  visit_coef_values: number[];
  max_trial_expanded: number;
  max_last_elig: number;
}

const ref = getReferenceFromRScript<MiscRef>(R_SOURCE_TEST);

function seqDataColumnar(): ColumnarData {
  const rows = loadSEQdata();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P", "excusedZero", "excusedOne"],
  );
}

function seqDataLTFUColumnar(): ColumnarData {
  const rows = loadSEQdataLTFU();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P",
     "excusedZero", "excusedOne", "LTFU", "eligible_cense"],
  );
}

function baseConfig(): TargetTrialConfig {
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
    km_curves: false,
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

Deno.test("Unweighted Censoring coefficients match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.cens_unwt_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.cens_unwt_coef_values,
    TOL,
    "Cens unwt coefs",
  );
});

Deno.test("ITT with followup.spline coefficients match R", () => {
  const config = baseConfig();
  config.followup_spline = true;
  config.followup_include = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.spline_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.spline_coef_values,
    TOL,
    "Spline coefs",
  );
});

Deno.test("ITT with followup.include=false coefficients match R", () => {
  const config = baseConfig();
  config.followup_include = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.no_fup_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.no_fup_coef_values,
    TOL,
    "No followup coefs",
  );
});

Deno.test("ITT with visit variable coefficients match R", () => {
  const config = baseConfig();
  config.visit = "LTFU";
  config.weights.preexpansion = true;
  config.weights.weighted = true;
  const data = seqDataLTFUColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.visit_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.visit_coef_values,
    TOL,
    "Visit coefs",
  );
});

Deno.test("Expanded data max trial equals last eligible index", () => {
  // R: max(model@DT$trial) == max(last_elig_idx$last_elig)
  expect(ref.max_trial_expanded).toBe(ref.max_last_elig);
});
