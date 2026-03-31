//! Target trial emulation types and configuration.
//!
//! Ported from SEQTaRget's `class_definitions.R` (SEQopts S4 class, 64 slots)
//! and `SEQopts.R` (options builder with validation).

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Analysis method for target trial emulation.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum AnalysisMethod {
    /// Intention-to-treat: once assigned, always assigned
    ITT,
    /// Track cumulative treatment exposure, censor at max dose
    DoseResponse,
    /// Per-protocol: censor at treatment switch, IPCW for informative censoring
    Censoring,
}

/// Bootstrap CI computation method.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum CIMethod {
    /// point ± z * sd(bootstrap estimates)
    SE,
    /// quantile-based
    Percentile,
}

/// Bootstrap configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BootstrapConfig {
    /// Whether to run bootstrap
    pub enabled: bool,
    /// Number of bootstrap iterations
    pub nboot: usize,
    /// Proportion of IDs to resample (0, 1], default 0.8
    pub sample_fraction: f64,
    /// CI computation method
    pub ci_method: CIMethod,
    /// Confidence level (0, 1), default 0.95
    pub ci_level: f64,
    /// RNG seed for reproducibility
    pub seed: u64,
}

impl Default for BootstrapConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            nboot: 0,
            sample_fraction: 0.8,
            ci_method: CIMethod::SE,
            ci_level: 0.95,
            seed: 1636,
        }
    }
}

/// Weight computation configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeightConfig {
    /// Whether to compute IPCW weights
    pub weighted: bool,
    /// Lower truncation bound for weights
    pub lower: f64,
    /// Upper truncation bound for weights
    pub upper: f64,
    /// Truncate at 1st/99th percentiles
    pub p99: bool,
    /// Pre-expansion weighting (weight before trial expansion)
    pub preexpansion: bool,
    /// Condition weights on lagged treatment
    pub lag_condition: bool,
    /// Column names for weight eligibility
    pub eligible_cols: Vec<String>,
}

impl Default for WeightConfig {
    fn default() -> Self {
        Self {
            weighted: false,
            lower: 0.0,
            upper: f64::INFINITY,
            p99: false,
            preexpansion: true,
            lag_condition: true,
            eligible_cols: Vec::new(),
        }
    }
}

/// Deviation/excused switch configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviationConfig {
    /// Use deviation-based censoring
    pub enabled: bool,
    /// Column containing deviation indicator
    pub col: Option<String>,
    /// Per-treatment-level conditions (R expressions as strings)
    pub conditions: Vec<String>,
    /// Whether deviations can be excused
    pub excused: bool,
    /// Per-treatment-level excusing columns
    pub excused_cols: Vec<Option<String>>,
}

impl Default for DeviationConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            col: None,
            conditions: Vec::new(),
            excused: false,
            excused_cols: Vec::new(),
        }
    }
}

/// Full configuration for target trial emulation.
///
/// Equivalent to SEQopts S4 class (64 slots).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetTrialConfig {
    // Column names
    /// ID column name
    pub id: String,
    /// Time/period column name
    pub time: String,
    /// Treatment column name
    pub treatment: String,
    /// Outcome column name
    pub outcome: String,
    /// Eligibility column name
    pub eligible: String,

    // Analysis
    /// Analysis method
    pub method: AnalysisMethod,
    /// Treatment levels (e.g., [0, 1] for binary; [0, 1, 2] for multinomial)
    pub treat_levels: Vec<f64>,
    /// Use multinomial logistic regression for >2 treatment levels
    pub multinomial: bool,

    // Follow-up
    /// Minimum follow-up to include
    pub followup_min: f64,
    /// Maximum follow-up to include
    pub followup_max: f64,
    /// Maximum survival time
    pub survival_max: f64,
    /// Include trial as covariate
    pub trial_include: bool,
    /// Include followup as covariate
    pub followup_include: bool,
    /// Use ns(followup) instead of followup + followup_sq
    pub followup_spline: bool,
    /// Use factor(followup) instead of followup + followup_sq
    pub followup_class: bool,

    // Column lists
    /// Time-varying covariate column names
    pub time_varying: Vec<String>,
    /// Fixed (baseline) covariate column names
    pub fixed: Vec<String>,

    // Formula strings (None = auto-generated)
    /// Outcome model covariates formula string
    pub covariates: Option<String>,
    /// Weight numerator formula
    pub numerator: Option<String>,
    /// Weight denominator formula
    pub denominator: Option<String>,
    /// LTFU numerator formula
    pub cense_numerator: Option<String>,
    /// LTFU denominator formula
    pub cense_denominator: Option<String>,
    /// Visit numerator formula
    pub visit_numerator: Option<String>,
    /// Visit denominator formula
    pub visit_denominator: Option<String>,

    // Censoring
    /// Censor column name
    pub cense: Option<String>,
    /// Censor eligibility column
    pub cense_eligible: Option<String>,
    /// Use excused switches (non-deviation based)
    pub excused: bool,
    /// Per-treatment-level excused columns
    pub excused_cols: Vec<Option<String>>,

    // Optional features
    /// Enable loss-to-followup weights
    pub ltfu: bool,
    /// Generate KM survival curves
    pub km_curves: bool,
    /// Estimate hazard ratios
    pub hazard: bool,
    /// Competing event column name
    pub compevent: Option<String>,
    /// Visit column name
    pub visit: Option<String>,
    /// Subgroup column name
    pub subgroup: Option<String>,

    // Selection
    /// Random trial selection
    pub selection_random: bool,
    /// Selection probability
    pub selection_prob: f64,
    /// First trial only
    pub selection_first_trial: bool,

    // Indicator suffixes (for generated column names)
    /// Suffix for baseline indicator columns (default "_bas")
    pub indicator_baseline: String,
    /// Suffix for squared term columns (default "_sq")
    pub indicator_squared: String,

    // Sub-configs
    pub bootstrap: BootstrapConfig,
    pub weights: WeightConfig,
    pub deviation: DeviationConfig,
}

impl Default for TargetTrialConfig {
    fn default() -> Self {
        Self {
            id: String::new(),
            time: String::new(),
            treatment: String::new(),
            outcome: String::new(),
            eligible: String::new(),
            method: AnalysisMethod::ITT,
            treat_levels: vec![0.0, 1.0],
            multinomial: false,
            followup_min: 0.0,
            followup_max: f64::INFINITY,
            survival_max: f64::INFINITY,
            trial_include: true,
            followup_include: true,
            followup_spline: false,
            followup_class: false,
            time_varying: Vec::new(),
            fixed: Vec::new(),
            covariates: None,
            numerator: None,
            denominator: None,
            cense_numerator: None,
            cense_denominator: None,
            visit_numerator: None,
            visit_denominator: None,
            cense: None,
            cense_eligible: None,
            excused: false,
            excused_cols: Vec::new(),
            ltfu: false,
            km_curves: false,
            hazard: false,
            compevent: None,
            visit: None,
            subgroup: None,
            selection_random: false,
            selection_prob: 0.8,
            selection_first_trial: false,
            indicator_baseline: "_bas".to_string(),
            indicator_squared: "_sq".to_string(),
            bootstrap: BootstrapConfig::default(),
            weights: WeightConfig::default(),
            deviation: DeviationConfig::default(),
        }
    }
}

/// Factor metadata for a numeric column that should be treated as categorical
/// in model.matrix construction (R's `as.factor()` equivalent).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FactorInfo {
    /// Sorted unique levels as strings (matching R's factor levels).
    /// e.g., ["0", "1"] for a binary treatment column.
    pub levels: Vec<String>,
    /// Index of the reference level (dropped in dummy encoding).
    /// Default: 0 (first/smallest level, matching R's default for numeric-origin factors).
    pub reference: usize,
}

/// Columnar data representation for the pipeline.
///
/// All data is stored column-major. Each column is either f64 (numeric)
/// or String (categorical/factor). The pipeline operates on this directly.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnarData {
    /// Numeric columns: column_name → values
    pub numeric: HashMap<String, Vec<f64>>,
    /// String/categorical columns: column_name → values
    pub categorical: HashMap<String, Vec<String>>,
    /// Factor metadata for numeric columns that should be treated as factors
    /// in model.matrix. Key is the column name. The column remains in `numeric`
    /// but is encoded as dummies when building the design matrix.
    #[serde(default)]
    pub factors: HashMap<String, FactorInfo>,
    /// Number of rows
    pub nrows: usize,
}

impl ColumnarData {
    pub fn new() -> Self {
        Self {
            numeric: HashMap::new(),
            categorical: HashMap::new(),
            factors: HashMap::new(),
            nrows: 0,
        }
    }

    /// Mark a numeric column as a factor, discovering levels from the data.
    /// Levels are sorted numerically (matching R's behavior for numeric-origin factors).
    /// Reference level is the first (smallest) level.
    pub fn factorize(&mut self, col_name: &str) -> Result<(), String> {
        let col = self
            .numeric
            .get(col_name)
            .ok_or_else(|| format!("Column '{}' not found for factorization", col_name))?;

        let mut level_set = std::collections::BTreeSet::new();
        for v in col {
            if !v.is_nan() {
                level_set.insert(format!("{}", *v as i64));
            }
        }
        let mut levels: Vec<String> = level_set.into_iter().collect();
        // Sort numerically
        levels.sort_by(|a, b| {
            a.parse::<f64>()
                .unwrap_or(0.0)
                .partial_cmp(&b.parse::<f64>().unwrap_or(0.0))
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        self.factors.insert(
            col_name.to_string(),
            FactorInfo {
                levels,
                reference: 0,
            },
        );
        Ok(())
    }

    /// Get a numeric column, returning None if not found.
    pub fn get_numeric(&self, name: &str) -> Option<&Vec<f64>> {
        self.numeric.get(name)
    }

    /// Get a categorical column, returning None if not found.
    pub fn get_categorical(&self, name: &str) -> Option<&Vec<String>> {
        self.categorical.get(name)
    }

    /// Add a numeric column. Panics if length doesn't match nrows (unless nrows is 0).
    pub fn add_numeric(&mut self, name: String, values: Vec<f64>) {
        if self.nrows == 0 {
            self.nrows = values.len();
        }
        assert_eq!(values.len(), self.nrows, "column '{}' has {} rows, expected {}", name, values.len(), self.nrows);
        self.numeric.insert(name, values);
    }

    /// Add a categorical column.
    pub fn add_categorical(&mut self, name: String, values: Vec<String>) {
        if self.nrows == 0 {
            self.nrows = values.len();
        }
        assert_eq!(values.len(), self.nrows, "column '{}' has {} rows, expected {}", name, values.len(), self.nrows);
        self.categorical.insert(name, values);
    }

    /// Check if a column exists (numeric or categorical).
    pub fn has_column(&self, name: &str) -> bool {
        self.numeric.contains_key(name) || self.categorical.contains_key(name)
    }

    /// Get all column names.
    pub fn column_names(&self) -> Vec<&str> {
        let mut names: Vec<&str> = self.numeric.keys().map(|s| s.as_str()).collect();
        names.extend(self.categorical.keys().map(|s| s.as_str()));
        names
    }
}

/// Survival curve data point.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurvivalPoint {
    pub followup: f64,
    pub value: f64,
    pub se: Option<f64>,
    pub lci: Option<f64>,
    pub uci: Option<f64>,
}

/// Weight diagnostics from the IPCW computation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeightDiagnostics {
    pub min: f64,
    pub max: f64,
    pub sd: f64,
    pub p01: f64,
    pub p25: f64,
    pub p50: f64,
    pub p75: f64,
    pub p99: f64,
    pub numerator_coefs: Vec<f64>,
    pub denominator_coefs: Vec<f64>,
}

/// Hazard ratio result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HazardRatioResult {
    pub hr: f64,
    pub lci: Option<f64>,
    pub uci: Option<f64>,
    pub se: Option<f64>,
}

/// Risk comparison (risk ratio and risk difference between treatment arms).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskComparison {
    pub arm_x: String,
    pub arm_y: String,
    pub risk_ratio: f64,
    pub rr_lci: Option<f64>,
    pub rr_uci: Option<f64>,
    pub risk_difference: f64,
    pub rd_lci: Option<f64>,
    pub rd_uci: Option<f64>,
}

/// Full result of target trial emulation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetTrialResult {
    /// Survival curves per treatment arm: arm_label → time series
    pub survival: HashMap<String, Vec<SurvivalPoint>>,
    /// Hazard ratio (if requested)
    pub hazard_ratio: Option<HazardRatioResult>,
    /// Risk comparisons (if KM curves requested)
    pub risk_comparisons: Vec<RiskComparison>,
    /// Risk data per arm
    pub risk_data: Vec<(String, f64, Option<f64>, Option<f64>)>,
    /// Weight diagnostics (if weighted)
    pub weight_diagnostics: Option<WeightDiagnostics>,
    /// Outcome model coefficients (per bootstrap iteration; first = full data)
    pub outcome_coefficients: Vec<Vec<f64>>,
    /// Outcome model coefficient names
    pub outcome_coef_names: Vec<String>,
    /// Competing event model coefficients (if compevent specified)
    pub ce_coefficients: Vec<Vec<f64>>,
    /// Formulas used
    pub outcome_formula: String,
    pub numerator_formula: String,
    pub denominator_formula: String,
}

/// Validate a TargetTrialConfig, returning an error message if invalid.
pub fn validate_config(config: &TargetTrialConfig) -> Result<(), String> {
    if config.id.is_empty() {
        return Err("id column name is required".to_string());
    }
    if config.time.is_empty() {
        return Err("time column name is required".to_string());
    }
    if config.treatment.is_empty() {
        return Err("treatment column name is required".to_string());
    }
    if config.outcome.is_empty() {
        return Err("outcome column name is required".to_string());
    }
    if config.eligible.is_empty() {
        return Err("eligible column name is required".to_string());
    }
    if config.treat_levels.len() < 2 {
        return Err("treat_levels must have at least 2 levels".to_string());
    }
    if config.bootstrap.enabled {
        if config.bootstrap.nboot == 0 {
            return Err("bootstrap.nboot must be > 0 when bootstrap is enabled".to_string());
        }
        if config.bootstrap.sample_fraction <= 0.0 || config.bootstrap.sample_fraction > 1.0 {
            return Err("bootstrap.sample_fraction must be in (0, 1]".to_string());
        }
        if config.bootstrap.ci_level <= 0.0 || config.bootstrap.ci_level >= 1.0 {
            return Err("bootstrap.ci_level must be in (0, 1)".to_string());
        }
    }
    if config.weights.weighted {
        if config.weights.lower < 0.0 {
            return Err("weight.lower must be non-negative".to_string());
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = TargetTrialConfig::default();
        assert_eq!(config.method, AnalysisMethod::ITT);
        assert_eq!(config.treat_levels, vec![0.0, 1.0]);
        assert!(!config.bootstrap.enabled);
        assert!(!config.weights.weighted);
    }

    #[test]
    fn test_validate_config_missing_fields() {
        let config = TargetTrialConfig::default();
        assert!(validate_config(&config).is_err());

        let mut config = TargetTrialConfig::default();
        config.id = "id".to_string();
        config.time = "period".to_string();
        config.treatment = "treatment".to_string();
        config.outcome = "outcome".to_string();
        config.eligible = "eligible".to_string();
        assert!(validate_config(&config).is_ok());
    }

    #[test]
    fn test_validate_bootstrap_config() {
        let mut config = TargetTrialConfig::default();
        config.id = "id".to_string();
        config.time = "period".to_string();
        config.treatment = "treatment".to_string();
        config.outcome = "outcome".to_string();
        config.eligible = "eligible".to_string();
        config.bootstrap.enabled = true;
        config.bootstrap.nboot = 0;
        assert!(validate_config(&config).is_err());

        config.bootstrap.nboot = 200;
        assert!(validate_config(&config).is_ok());
    }

    #[test]
    fn test_columnar_data() {
        let mut data = ColumnarData::new();
        data.add_numeric("x".to_string(), vec![1.0, 2.0, 3.0]);
        data.add_numeric("y".to_string(), vec![4.0, 5.0, 6.0]);
        data.add_categorical("group".to_string(), vec!["A".to_string(), "B".to_string(), "A".to_string()]);

        assert_eq!(data.nrows, 3);
        assert!(data.has_column("x"));
        assert!(data.has_column("group"));
        assert!(!data.has_column("z"));
        assert_eq!(data.get_numeric("x").unwrap(), &vec![1.0, 2.0, 3.0]);
    }

    #[test]
    #[should_panic(expected = "has 2 rows, expected 3")]
    fn test_columnar_data_length_mismatch() {
        let mut data = ColumnarData::new();
        data.add_numeric("x".to_string(), vec![1.0, 2.0, 3.0]);
        data.add_numeric("y".to_string(), vec![4.0, 5.0]); // wrong length
    }
}
