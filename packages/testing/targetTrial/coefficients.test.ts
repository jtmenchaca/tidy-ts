// Translation of SEQTaRget test: test_coefficients.R
// R reference JSON: coefficients-source-test.R (sibling file)
// Tests outcome model coefficients across all analysis methods
//
// Coverage of test_coefficients.R:
// [x] L1-18:   ITT on SEQdata
// [x] L20-36:  Pre-Expansion Dose-Response on SEQdata
// [x] L38-56:  Post-Expansion Dose-Response on SEQdata
// [x] L58-74:  Pre-Expansion Censoring on SEQdata
// [x] L76-95:  Post-Expansion Censoring on SEQdata
// [x] L97-114: Pre-Expansion Excused Censoring on SEQdata
// [x] L116-136: Post-Expansion Excused Censoring on SEQdata
// [x] L138-154: Pre-Expansion ITT with LTFU on SEQdata.LTFU
// [x] L156-172: Post-Expansion ITT with LTFU on SEQdata.LTFU
// [x] L174-190: ITT Multinomial (treat.level = c(1,2)) on SEQdata.multitreatment
// [x] L192-212: Pre-Expansion ITT visit variable on SEQdata.LTFU

import { expect } from "@std/expect";
import { targetTrialEmulation } from "../../dataframe/ts/targetTrial/index.ts";
import type { TargetTrialConfig, ColumnarData } from "../../dataframe/ts/targetTrial/types.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  loadSEQdata,
  loadSEQdataLTFU,
  loadSEQdataMulti,
  toColumnarData,
  TOL,
} from "./target-trial-test-helpers.ts";

const R_SOURCE_TEST = new URL("./coefficients-source-test.R", import.meta.url)
  .pathname;

interface CoefRef {
  itt_coef_names: string[];
  itt_coef_values: number[];
  itt_outcome_formula: string;
  itt_numerator_formula: string | null;
  itt_denominator_formula: string | null;

  dr_pre_coef_names: string[];
  dr_pre_coef_values: number[];
  dr_post_coef_names: string[];
  dr_post_coef_values: number[];

  cens_pre_coef_names: string[];
  cens_pre_coef_values: number[];
  cens_post_coef_names: string[];
  cens_post_coef_values: number[];

  exc_pre_coef_names: string[];
  exc_pre_coef_values: number[];
  exc_post_coef_names: string[];
  exc_post_coef_values: number[];

  ltfu_pre_coef_names: string[];
  ltfu_pre_coef_values: number[];
  ltfu_post_coef_names: string[];
  ltfu_post_coef_values: number[];

  multi_coef_names: string[];
  multi_coef_values: number[];
}

const ref = getReferenceFromRScript<CoefRef>(R_SOURCE_TEST);

// Helper to build SEQdata ColumnarData
function seqDataColumnar(): ColumnarData {
  const rows = loadSEQdata();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P", "excusedZero", "excusedOne"],
  );
}

// Helper to build SEQdata.LTFU ColumnarData
function seqDataLTFUColumnar(): ColumnarData {
  const rows = loadSEQdataLTFU();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P",
     "excusedZero", "excusedOne", "LTFU", "eligible_cense"],
  );
}

// Helper to build SEQdata.multitreatment ColumnarData
function seqDataMultiColumnar(): ColumnarData {
  const rows = loadSEQdataMulti();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P", "excusedZero", "excusedOne"],
  );
}

// Base config for SEQdata tests
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

Deno.test("ITT coefficients match R", () => {
  const config = baseConfig();
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.itt_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.itt_coef_values,
    TOL,
    "ITT coefs",
  );
});

Deno.test("Pre-Expansion Dose-Response coefficients match R", () => {
  const config = baseConfig();
  config.method = "DoseResponse";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.dr_pre_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.dr_pre_coef_values,
    TOL,
    "DR pre coefs",
  );
});

Deno.test("Post-Expansion Dose-Response coefficients match R", () => {
  const config = baseConfig();
  config.method = "DoseResponse";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.dr_post_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.dr_post_coef_values,
    TOL,
    "DR post coefs",
  );
});

Deno.test("Pre-Expansion Censoring coefficients match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.cens_pre_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.cens_pre_coef_values,
    TOL,
    "Cens pre coefs",
  );
});

Deno.test("Post-Expansion Censoring coefficients match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.cens_post_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.cens_post_coef_values,
    TOL,
    "Cens post coefs",
  );
});

Deno.test("Pre-Expansion Excused Censoring coefficients match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.exc_pre_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.exc_pre_coef_values,
    TOL,
    "Exc pre coefs",
  );
});

Deno.test("Post-Expansion Excused Censoring coefficients match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  config.weights.upper = 1;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.exc_post_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.exc_post_coef_values,
    TOL,
    "Exc post coefs",
  );
});

Deno.test("Pre-Expansion ITT with LTFU coefficients match R", () => {
  const config = baseConfig();
  config.ltfu = true;
  config.cense = "LTFU";
  config.weights.preexpansion = true;
  const data = seqDataLTFUColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.ltfu_pre_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.ltfu_pre_coef_values,
    TOL,
    "LTFU pre coefs",
  );
});

Deno.test("Post-Expansion ITT with LTFU coefficients match R", () => {
  const config = baseConfig();
  config.ltfu = true;
  config.cense = "LTFU";
  config.weights.preexpansion = false;
  const data = seqDataLTFUColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.ltfu_post_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.ltfu_post_coef_values,
    TOL,
    "LTFU post coefs",
  );
});

Deno.test("ITT Multinomial (treat.level = [1,2]) coefficients match R", () => {
  const config = baseConfig();
  config.multinomial = true;
  config.treat_levels = [1, 2];
  const data = seqDataMultiColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.outcome_coef_names).toEqual(ref.multi_coef_names);
  assertArrayClose(
    result.outcome_coefficients[0],
    ref.multi_coef_values,
    TOL,
    "Multi coefs",
  );
});
