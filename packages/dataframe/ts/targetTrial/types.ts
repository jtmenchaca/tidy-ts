/**
 * Target Trial Emulation — TypeScript types.
 *
 * These mirror the Rust structs in `rust/stats/target_trial/types.rs`.
 * The entire pipeline runs in Rust/WASM; TypeScript only marshals data.
 */

/** Analysis method for target trial emulation. */
export type AnalysisMethod = "ITT" | "DoseResponse" | "Censoring";

/** Bootstrap CI computation method. */
export type CIMethod = "SE" | "Percentile";

/** Bootstrap configuration. */
export interface BootstrapConfig {
  enabled: boolean;
  nboot: number;
  sample_fraction: number;
  ci_method: CIMethod;
  ci_level: number;
  seed: number;
}

/** Weight computation configuration. */
export interface WeightConfig {
  weighted: boolean;
  lower: number;
  upper: number;
  p99: boolean;
  preexpansion: boolean;
  lag_condition: boolean;
  eligible_cols: string[];
}

/** Deviation/excused switch configuration. */
export interface DeviationConfig {
  enabled: boolean;
  col: string | null;
  conditions: string[];
  excused: boolean;
  excused_cols: (string | null)[];
}

/** Full configuration for target trial emulation. */
export interface TargetTrialConfig {
  // Column names
  id: string;
  time: string;
  treatment: string;
  outcome: string;
  eligible: string;

  // Analysis
  method: AnalysisMethod;
  treat_levels: number[];
  multinomial: boolean;

  // Follow-up
  followup_min: number;
  followup_max: number;
  survival_max: number;
  trial_include: boolean;
  followup_include: boolean;
  followup_spline: boolean;
  followup_class: boolean;

  // Column lists
  time_varying: string[];
  fixed: string[];

  // Formula strings (null = auto-generated)
  covariates: string | null;
  numerator: string | null;
  denominator: string | null;
  cense_numerator: string | null;
  cense_denominator: string | null;
  visit_numerator: string | null;
  visit_denominator: string | null;

  // Censoring
  cense: string | null;
  cense_eligible: string | null;
  excused: boolean;
  excused_cols: (string | null)[];

  // Optional features
  ltfu: boolean;
  km_curves: boolean;
  hazard: boolean;
  compevent: string | null;
  visit: string | null;
  subgroup: string | null;

  // Selection
  selection_random: boolean;
  selection_prob: number;
  selection_first_trial: boolean;

  // Indicator suffixes
  indicator_baseline: string;
  indicator_squared: string;

  // Sub-configs
  bootstrap: BootstrapConfig;
  weights: WeightConfig;
  deviation: DeviationConfig;
}

/** Columnar data representation. */
export interface ColumnarData {
  numeric: Record<string, number[]>;
  categorical: Record<string, string[]>;
  nrows: number;
}

/** Survival curve data point. */
export interface SurvivalPoint {
  followup: number;
  value: number;
  se: number | null;
  lci: number | null;
  uci: number | null;
}

/** Weight diagnostics. */
export interface WeightDiagnostics {
  min: number;
  max: number;
  sd: number;
  p01: number;
  p25: number;
  p50: number;
  p75: number;
  p99: number;
  numerator_coefs: number[];
  denominator_coefs: number[];
}

/** Hazard ratio result. */
export interface HazardRatioResult {
  hr: number;
  lci: number | null;
  uci: number | null;
  se: number | null;
}

/** Risk comparison between treatment arms. */
export interface RiskComparison {
  arm_x: string;
  arm_y: string;
  risk_ratio: number;
  rr_lci: number | null;
  rr_uci: number | null;
  risk_difference: number;
  rd_lci: number | null;
  rd_uci: number | null;
}

/** Full result of target trial emulation. */
export interface TargetTrialResult {
  survival: Record<string, SurvivalPoint[]>;
  hazard_ratio: HazardRatioResult | null;
  risk_comparisons: RiskComparison[];
  risk_data: [string, number, number | null, number | null][];
  weight_diagnostics: WeightDiagnostics | null;
  outcome_coefficients: number[][];
  outcome_coef_names: string[];
  ce_coefficients: number[][];
  outcome_formula: string;
  numerator_formula: string;
  denominator_formula: string;
}
