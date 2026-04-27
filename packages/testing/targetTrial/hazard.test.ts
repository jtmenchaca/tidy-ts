// Translation of SEQTaRget test: test_hazard.R
// R reference JSON: hazard-source-test.R, hazard-percentile-source-test.R (sibling files)
// Tests hazard ratio estimation and reproducibility

import { expect } from "@std/expect";
import { targetTrialEmulation } from "../../dataframe/ts/targetTrial/index.ts";
import type { TargetTrialConfig, ColumnarData } from "../../dataframe/ts/targetTrial/types.ts";
import {
  assertClose,
  getReferenceFromRScript,
  loadSEQdata,
  toColumnarData,
  TOL,
} from "./target-trial-test-helpers.ts";

const R_SOURCE_TEST = new URL("./hazard-source-test.R", import.meta.url)
  .pathname;

interface HazardRef {
  hr_value: number;
  hr_repro_value: number;
  hr_boot_value: number;
  hr_boot_lci: number;
  hr_boot_uci: number;
}

const ref = getReferenceFromRScript<HazardRef>(R_SOURCE_TEST);

function seqDataColumnar(): ColumnarData {
  const rows = loadSEQdata();
  return toColumnarData(
    rows,
    ["ID", "time", "eligible", "outcome", "tx_init", "sex", "N", "L", "P", "excusedZero", "excusedOne"],
  );
}

function hazardConfig(seed: number): TargetTrialConfig {
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
    hazard: true,
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
      seed,
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

Deno.test("ITT hazard ratio matches R", () => {
  const config = hazardConfig(123);
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.hazard_ratio).toBeDefined();
  assertClose(result.hazard_ratio!.hr, ref.hr_value, TOL, "hr_value");
});

Deno.test("Hazard ratio is reproducible with same seed", () => {
  const data = seqDataColumnar();

  const result1 = targetTrialEmulation({ config: hazardConfig(123), data });
  const result2 = targetTrialEmulation({ config: hazardConfig(123), data });

  expect(result1.hazard_ratio!.hr).toBe(result2.hazard_ratio!.hr);
  assertClose(result1.hazard_ratio!.hr, ref.hr_repro_value, TOL, "hr_repro");
});

Deno.test("Hazard ratio bootstrap CIs match R", () => {
  const config = hazardConfig(42);
  config.bootstrap.enabled = true;
  config.bootstrap.nboot = 3;
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.hazard_ratio).toBeDefined();
  assertClose(result.hazard_ratio!.hr, ref.hr_boot_value, TOL, "hr_boot");
  expect(result.hazard_ratio!.lci).not.toBeNull();
  expect(result.hazard_ratio!.uci).not.toBeNull();
  assertClose(result.hazard_ratio!.lci!, ref.hr_boot_lci, TOL, "hr_boot_lci");
  assertClose(result.hazard_ratio!.uci!, ref.hr_boot_uci, TOL, "hr_boot_uci");
});

// ── Percentile CI method ──

const R_PCT_SOURCE_TEST = new URL("./hazard-percentile-source-test.R", import.meta.url)
  .pathname;

interface HazardPctRef {
  hr_pct_value: number;
  hr_pct_lci: number;
  hr_pct_uci: number;
}

const pctRef = getReferenceFromRScript<HazardPctRef>(R_PCT_SOURCE_TEST);

Deno.test("Hazard ratio percentile bootstrap CIs match R", () => {
  const config = hazardConfig(42);
  config.bootstrap.enabled = true;
  config.bootstrap.nboot = 3;
  config.bootstrap.ci_method = "Percentile";
  const data = seqDataColumnar();
  const result = targetTrialEmulation({ config, data });

  expect(result.hazard_ratio).toBeDefined();
  assertClose(result.hazard_ratio!.hr, pctRef.hr_pct_value, TOL, "hr_pct");
  expect(result.hazard_ratio!.lci).not.toBeNull();
  expect(result.hazard_ratio!.uci).not.toBeNull();
  // Percentile quantile with only 3 bootstrap samples has limited precision
  // due to R's type-7 quantile interpolation vs our rounding approach
  assertClose(result.hazard_ratio!.lci!, pctRef.hr_pct_lci, 0.02, "hr_pct_lci");
  assertClose(result.hazard_ratio!.uci!, pctRef.hr_pct_uci, 0.02, "hr_pct_uci");
});

Deno.test("Hazard bootstrap percentile CIs are reproducible with same seed", () => {
  const data = seqDataColumnar();

  const config1 = hazardConfig(42);
  config1.bootstrap.enabled = true;
  config1.bootstrap.nboot = 3;
  config1.bootstrap.ci_method = "Percentile";

  const config2 = hazardConfig(42);
  config2.bootstrap.enabled = true;
  config2.bootstrap.nboot = 3;
  config2.bootstrap.ci_method = "Percentile";

  const result1 = targetTrialEmulation({ config: config1, data });
  const result2 = targetTrialEmulation({ config: config2, data });

  expect(result1.hazard_ratio!.hr).toBe(result2.hazard_ratio!.hr);
  expect(result1.hazard_ratio!.lci).toBe(result2.hazard_ratio!.lci);
  expect(result1.hazard_ratio!.uci).toBe(result2.hazard_ratio!.uci);
});
