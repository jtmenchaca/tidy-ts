// Translation of SEQTaRget tests: test_covariates.R, test_numerators.R, test_denominators.R
// R reference JSON: covariates-source-test.R (sibling file)
// Tests default formula generation for outcome, numerator, and denominator covariates

import { targetTrialEmulation } from "../../dataframe/ts/targetTrial/index.ts";
import type { TargetTrialConfig, ColumnarData } from "../../dataframe/ts/targetTrial/types.ts";
import {
  getReferenceFromRScript,
  loadSEQdata,
  toColumnarData,
} from "./target-trial-test-helpers.ts";

const R_SOURCE_TEST = new URL("./covariates-source-test.R", import.meta.url)
  .pathname;

interface CovRef {
  itt_outcome: string[];

  dr_pre_outcome: string[];
  dr_pre_numerator: string[];
  dr_pre_denominator: string[];
  dr_post_outcome: string[];
  dr_post_numerator: string[];
  dr_post_denominator: string[];

  cens_pre_outcome: string[];
  cens_pre_numerator: string[];
  cens_pre_denominator: string[];
  cens_post_outcome: string[];
  cens_post_numerator: string[];
  cens_post_denominator: string[];

  exc_pre_outcome: string[];
  exc_pre_numerator: string[];
  exc_pre_denominator: string[];
  exc_post_outcome: string[];
  exc_post_numerator: string[];
  exc_post_denominator: string[];
}

const ref = getReferenceFromRScript<CovRef>(R_SOURCE_TEST);

function seqDataColumnar(): ColumnarData {
  const rows = loadSEQdata();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P", "excusedZero", "excusedOne"],
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

/** Extract formula components as a sorted set from a "+" delimited formula string */
function formulaComponents(formula: string): string[] {
  return formula.split("+").map((s) => s.trim()).filter(Boolean).sort();
}

/** Assert that two arrays have the same elements regardless of order */
function assertSameElements(actual: string[], expected: string[], label?: string) {
  const a = [...actual].sort();
  const e = [...expected].sort();
  if (a.length !== e.length || !a.every((v, i) => v === e[i])) {
    throw new Error(
      `${label ?? ""} formula mismatch:\n  actual:   [${a.join(", ")}]\n  expected: [${e.join(", ")}]`,
    );
  }
}

// ── Outcome formula tests ──

Deno.test("ITT outcome formula components match R", () => {
  const config = baseConfig();
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.outcome_formula), ref.itt_outcome, "ITT outcome");
});

Deno.test("Pre-Expansion Dose-Response outcome formula match R", () => {
  const config = baseConfig();
  config.method = "DoseResponse";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.outcome_formula), ref.dr_pre_outcome, "DR pre outcome");
});

Deno.test("Post-Expansion Dose-Response outcome formula match R", () => {
  const config = baseConfig();
  config.method = "DoseResponse";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.outcome_formula), ref.dr_post_outcome, "DR post outcome");
});

Deno.test("Pre-Expansion Censoring outcome formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.outcome_formula), ref.cens_pre_outcome, "Cens pre outcome");
});

Deno.test("Post-Expansion Censoring outcome formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.outcome_formula), ref.cens_post_outcome, "Cens post outcome");
});

Deno.test("Pre-Expansion Excused Censoring outcome formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.outcome_formula), ref.exc_pre_outcome, "Exc pre outcome");
});

Deno.test("Post-Expansion Excused Censoring outcome formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  config.weights.upper = 1;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.outcome_formula), ref.exc_post_outcome, "Exc post outcome");
});

// ── Numerator formula tests ──

Deno.test("Pre-Expansion Dose-Response numerator formula match R", () => {
  const config = baseConfig();
  config.method = "DoseResponse";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.numerator_formula), ref.dr_pre_numerator, "DR pre numerator");
});

Deno.test("Post-Expansion Dose-Response numerator formula match R", () => {
  const config = baseConfig();
  config.method = "DoseResponse";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.numerator_formula), ref.dr_post_numerator, "DR post numerator");
});

Deno.test("Pre-Expansion Censoring numerator formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.numerator_formula), ref.cens_pre_numerator, "Cens pre numerator");
});

Deno.test("Post-Expansion Censoring numerator formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.numerator_formula), ref.cens_post_numerator, "Cens post numerator");
});

Deno.test("Pre-Expansion Excused Censoring numerator formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.numerator_formula), ref.exc_pre_numerator, "Exc pre numerator");
});

Deno.test("Post-Expansion Excused Censoring numerator formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  config.weights.upper = 1;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.numerator_formula), ref.exc_post_numerator, "Exc post numerator");
});

// ── Denominator formula tests ──

Deno.test("Pre-Expansion Dose-Response denominator formula match R", () => {
  const config = baseConfig();
  config.method = "DoseResponse";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.denominator_formula), ref.dr_pre_denominator, "DR pre denominator");
});

Deno.test("Post-Expansion Dose-Response denominator formula match R", () => {
  const config = baseConfig();
  config.method = "DoseResponse";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.denominator_formula), ref.dr_post_denominator, "DR post denominator");
});

Deno.test("Pre-Expansion Censoring denominator formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.denominator_formula), ref.cens_pre_denominator, "Cens pre denominator");
});

Deno.test("Post-Expansion Censoring denominator formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.denominator_formula), ref.cens_post_denominator, "Cens post denominator");
});

Deno.test("Pre-Expansion Excused Censoring denominator formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.denominator_formula), ref.exc_pre_denominator, "Exc pre denominator");
});

Deno.test("Post-Expansion Excused Censoring denominator formula match R", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  config.weights.preexpansion = false;
  config.weights.upper = 1;
  config.excused = true;
  config.excused_cols = ["excusedZero", "excusedOne"];
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  assertSameElements(formulaComponents(result.denominator_formula), ref.exc_post_denominator, "Exc post denominator");
});
