// Translation of SEQTaRget tests: test_errors.R, test_coverage.R (validation paths)
// Tests error handling and input validation — no R reference needed

import { expect } from "@std/expect";
import { targetTrialEmulation } from "../../dataframe/ts/targetTrial/index.ts";
import type { TargetTrialConfig, ColumnarData } from "../../dataframe/ts/targetTrial/types.ts";
import {
  loadSEQdata,
  toColumnarData,
} from "./target-trial-test-helpers.ts";

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

// ── Structural absence tests from test_coverage.R ──

Deno.test("no valid hazard_ratio when hazard=false", () => {
  const config = baseConfig();
  config.hazard = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  // WASM serialization of Option::None may produce null, undefined, or non-object
  const hr = result.hazard_ratio;
  expect(hr == null || typeof hr !== "object" || !("hr" in hr)).toBe(true);
});

Deno.test("survival curves empty when km_curves=false", () => {
  const config = baseConfig();
  config.km_curves = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  expect(Object.keys(result.survival)).toHaveLength(0);
});

Deno.test("risk_comparisons empty when km_curves=false", () => {
  const config = baseConfig();
  config.km_curves = false;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  expect(result.risk_comparisons).toHaveLength(0);
});

// ── Validation from test_errors.R ──
// WASM throws strings (not Error objects), so we catch with try/catch

function expectThrows(fn: () => void, label: string) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error(`Expected ${label} to throw, but it did not`);
  }
}

Deno.test("errors on missing ID column", () => {
  const config = baseConfig();
  config.id = "NONEXISTENT";
  const data = seqDataColumnar();
  expectThrows(() => targetTrialEmulation({ config, data }), "missing ID");
});

Deno.test("errors on missing outcome column", () => {
  const config = baseConfig();
  config.outcome = "NONEXISTENT";
  const data = seqDataColumnar();
  expectThrows(() => targetTrialEmulation({ config, data }), "missing outcome");
});

Deno.test("errors on missing treatment column", () => {
  const config = baseConfig();
  config.treatment = "NONEXISTENT";
  const data = seqDataColumnar();
  expectThrows(() => targetTrialEmulation({ config, data }), "missing treatment");
});

Deno.test("errors on missing eligible column", () => {
  const config = baseConfig();
  config.eligible = "NONEXISTENT";
  const data = seqDataColumnar();
  expectThrows(() => targetTrialEmulation({ config, data }), "missing eligible");
});

Deno.test("errors on missing time column", () => {
  const config = baseConfig();
  config.time = "NONEXISTENT";
  const data = seqDataColumnar();
  expectThrows(() => targetTrialEmulation({ config, data }), "missing time");
});

// ── Structural presence tests from test_coverage.R ──

Deno.test("hazard_ratio returns values when hazard=true", () => {
  const config = baseConfig();
  config.hazard = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  expect(result.hazard_ratio).not.toBeNull();
  expect(result.hazard_ratio!.hr).toBeGreaterThan(0);
  expect(typeof result.hazard_ratio!.hr).toBe("number");
});

Deno.test("survival curves returned when km_curves=true", () => {
  const config = baseConfig();
  config.km_curves = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  expect(Object.keys(result.survival).length).toBeGreaterThan(0);
});

Deno.test("risk_data returned when km_curves=true", () => {
  const config = baseConfig();
  config.km_curves = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  expect(result.risk_data.length).toBeGreaterThan(0);
});

Deno.test("risk_comparisons returned when km_curves=true", () => {
  const config = baseConfig();
  config.km_curves = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  expect(result.risk_comparisons.length).toBeGreaterThan(0);
});

Deno.test("outcome_coefficients has correct structure", () => {
  const config = baseConfig();
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  expect(result.outcome_coefficients.length).toBeGreaterThan(0);
  expect(result.outcome_coef_names.length).toBeGreaterThan(0);
  expect(result.outcome_coefficients[0].length).toBe(result.outcome_coef_names.length);
});

Deno.test("no valid weight_diagnostics for unweighted ITT", () => {
  const config = baseConfig();
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  // WASM serialization of Option::None may produce null, undefined, or non-object
  const wd = result.weight_diagnostics;
  expect(wd == null || typeof wd !== "object" || !("min" in wd)).toBe(true);
});

Deno.test("weight_diagnostics present for weighted censoring", () => {
  const config = baseConfig();
  config.method = "Censoring";
  config.weights.weighted = true;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });
  expect(result.weight_diagnostics).not.toBeNull();
});
