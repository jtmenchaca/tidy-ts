// Translation of SEQTaRget test: test_multinomial.R
// R reference JSON: multinomial-source-test.R, multinomial-excused-source-test.R (sibling files)
// Tests multinomial treatment level models

import { expect } from "@std/expect";
import { targetTrialEmulation } from "../../dataframe/ts/targetTrial/index.ts";
import type { TargetTrialConfig, ColumnarData } from "../../dataframe/ts/targetTrial/types.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  loadSEQdataMulti,
  toColumnarData,
  TOL,
} from "./target-trial-test-helpers.ts";

const R_SOURCE_TEST = new URL("./multinomial-source-test.R", import.meta.url)
  .pathname;

interface MultiRef {
  multi_itt_coef_names: string[];
  multi_itt_coef_values: number[];
  multi_itt_outcome_formula: string;
  multi_cens_pre_coef_names: string[];
  multi_cens_pre_coef_values: number[];
  multi_cens_post_coef_names: string[];
  multi_cens_post_coef_values: number[];
}

const ref = getReferenceFromRScript<MultiRef>(R_SOURCE_TEST);

function seqDataMultiColumnar(): ColumnarData {
  const rows = loadSEQdataMulti();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P", "excusedZero", "excusedOne"],
  );
}

function multiConfig(): TargetTrialConfig {
  return {
    id: "ID",
    time: "time",
    treatment: "tx_init",
    outcome: "outcome",
    eligible: "eligible",
    method: "ITT",
    treat_levels: [0, 1, 2],
    multinomial: true,
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

Deno.test("Multinomial ITT (3-level) coefficients match R", () => {
  const config = multiConfig();
  const data = seqDataMultiColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.multi_itt_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.multi_itt_coef_values,
    TOL,
    "Multi ITT coefs",
  );
});

Deno.test("Multinomial Censoring Pre-Expansion coefficients match R", () => {
  const config = multiConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  const data = seqDataMultiColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.multi_cens_pre_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.multi_cens_pre_coef_values,
    TOL,
    "Multi Cens pre coefs",
  );
});

Deno.test("Multinomial Censoring Post-Expansion coefficients match R", () => {
  const config = multiConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataMultiColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.multi_cens_post_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.multi_cens_post_coef_values,
    TOL,
    "Multi Cens post coefs",
  );
});

// ── Excused Censoring variants from test_multinomial.R ──

const R_EXC_SOURCE_TEST = new URL("./multinomial-excused-source-test.R", import.meta.url)
  .pathname;

interface MultiExcRef {
  multi_exc_pre_coef_names: string[];
  multi_exc_pre_coef_values: number[];
  multi_exc_post_coef_names: string[];
  multi_exc_post_coef_values: number[];
}

const excRef = getReferenceFromRScript<MultiExcRef>(R_EXC_SOURCE_TEST);

Deno.test("Multinomial Censoring Excused Pre-Expansion coefficients match R", () => {
  const config = multiConfig();
  config.method = "Censoring";
  config.treat_levels = [0, 1];
  config.weights.weighted = true;
  config.weights.preexpansion = true;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataMultiColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(excRef.multi_exc_pre_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    excRef.multi_exc_pre_coef_values,
    TOL,
    "Multi Exc pre coefs",
  );
});

Deno.test("Multinomial Censoring Excused Post-Expansion coefficients match R", () => {
  const config = multiConfig();
  config.method = "Censoring";
  config.treat_levels = [0, 1];
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataMultiColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(excRef.multi_exc_post_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    excRef.multi_exc_post_coef_values,
    TOL,
    "Multi Exc post coefs",
  );
});
