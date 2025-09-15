use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Represents the type of tail in hypothesis testing.
#[derive(Debug, Clone, PartialEq)]
pub enum TailType {
    /// Left tail test (used for testing if the observed statistic is less than a critical value).
    Left,
    /// Right tail test (used for testing if the observed statistic is greater than a critical value).
    Right,
    /// Two tail test (used for testing if the observed statistic differs from the critical value in either direction).
    Two,
}

/// Represents the type of alternative hypothesis for statistical tests.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub enum AlternativeType {
    /// Two-sided test (default)
    TwoSided,
    /// One-sided test: less than
    Less,
    /// One-sided test: greater than
    Greater,
}

impl AlternativeType {
    /// Convert from string representation
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "two-sided" | "two.sided" | "two_sided" | "two sided" => AlternativeType::TwoSided,
            "less" | "left" | "lower" => AlternativeType::Less,
            "greater" | "right" | "upper" => AlternativeType::Greater,
            _ => AlternativeType::TwoSided, // Default to two-sided
        }
    }

    /// Convert to TailType for internal calculations
    pub fn to_tail_type(self) -> TailType {
        match self {
            AlternativeType::TwoSided => TailType::Two,
            AlternativeType::Less => TailType::Left,
            AlternativeType::Greater => TailType::Right,
        }
    }

    /// Get string representation
    pub fn as_str(self) -> &'static str {
        match self {
            AlternativeType::TwoSided => "two-sided",
            AlternativeType::Less => "less",
            AlternativeType::Greater => "greater",
        }
    }
}

impl Default for AlternativeType {
    fn default() -> Self {
        AlternativeType::TwoSided
    }
}

/// Represents the type of statistical test performed.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub enum TestType {
    OneWayAnova,
    TwoWayAnovaFactorA,
    TwoWayAnovaFactorB,
    TwoWayAnovaInteraction,
    IndependentTTest,
    PairedTTest,
    OneSampleTTest,
    ChiSquareIndependence,
    MannWhitneyU,
    WilcoxonSignedRank,
    OneSampleZTest,
    TwoSampleZTest,
    OneSampleProportionTest,
    TwoSampleProportionTest,
    ShapiroWilk,
    PearsonCorrelation,
    SpearmanCorrelation,
    KendallCorrelation,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
/// Result of a statistical test containing all relevant information
pub struct TestResult {
    /// Type of statistical test performed
    pub test_type: TestType,
    // === CORE TEST RESULTS ===
    /// The calculated test statistic value
    pub test_statistic: Option<f64>,
    /// The p-value of the test
    pub p_value: Option<f64>,

    // === CONFIDENCE INTERVALS ===
    /// Confidence interval lower bound
    pub confidence_interval_lower: Option<f64>,
    /// Confidence interval upper bound
    pub confidence_interval_upper: Option<f64>,
    /// Confidence level used (e.g., 0.95 for 95%)
    pub confidence_level: Option<f64>,

    // === EFFECT SIZES ===
    /// General effect size measure
    pub effect_size: Option<f64>,
    /// Cohen's d (for t-tests)
    pub cohens_d: Option<f64>,
    /// Eta squared (for ANOVA)
    pub eta_squared: Option<f64>,
    /// Cramer's V (for chi-square)
    pub cramers_v: Option<f64>,
    /// Phi coefficient (for 2x2 chi-square)
    pub phi_coefficient: Option<f64>,
    /// Odds ratio (for categorical tests)
    pub odds_ratio: Option<f64>,
    /// Relative risk (for categorical tests)
    pub relative_risk: Option<f64>,

    // === TEST-SPECIFIC STATISTICS ===
    /// Degrees of freedom
    pub degrees_of_freedom: Option<f64>,
    /// Sample size
    pub sample_size: Option<usize>,
    /// Correlation coefficient (for correlation tests)
    pub correlation: Option<f64>,
    /// U statistic (for Mann-Whitney)
    pub u_statistic: Option<f64>,
    /// W statistic (for Wilcoxon)
    pub w_statistic: Option<f64>,
    /// F statistic (for ANOVA)
    pub f_statistic: Option<f64>,

    // === DESCRIPTIVE STATISTICS ===
    /// Mean difference between groups
    pub mean_difference: Option<f64>,
    /// Standard error
    pub standard_error: Option<f64>,
    /// Margin of error
    pub margin_of_error: Option<f64>,
    /// Sample means for each group
    pub sample_means: Option<Vec<f64>>,
    /// Sample standard deviations for each group
    pub sample_std_devs: Option<Vec<f64>>,

    // === TEST-SPECIFIC DETAILS ===
    /// Expected frequencies (for chi-square)
    pub chi_square_expected: Option<Vec<f64>>,
    /// Residuals (for chi-square)
    pub residuals: Option<Vec<f64>>,
    /// Ranks (for non-parametric tests)
    pub ranks: Option<Vec<f64>>,
    /// Tie correction factor
    pub tie_correction: Option<f64>,
    /// Exact p-value (when available)
    pub exact_p_value: Option<f64>,
    /// Asymptotic p-value (for large samples)
    pub asymptotic_p_value: Option<f64>,

    // === MODEL INFORMATION (for regression/ANOVA) ===
    /// R-squared value
    pub r_squared: Option<f64>,
    /// Adjusted R-squared value
    pub adjusted_r_squared: Option<f64>,
    /// Akaike Information Criterion
    pub aic: Option<f64>,
    /// Bayesian Information Criterion
    pub bic: Option<f64>,
    /// Sum of squares breakdown
    pub sum_of_squares: Option<Vec<f64>>,

    // === DATA QUALITY ===
    /// Number of missing values
    pub missing_values: Option<usize>,
    /// Number of outliers detected
    pub outliers_detected: Option<usize>,
    /// List of violated assumptions
    pub assumptions_violated: Option<Vec<String>>,
    /// P-value from normality test
    pub normality_test_p_value: Option<f64>,

    // === ERROR HANDLING ===
    /// Error message if the test failed
    pub error_message: Option<String>,
}

impl TestResult {
    /// Get confidence interval as a tuple (for internal use)
    pub fn get_confidence_interval(&self) -> Option<(f64, f64)> {
        match (
            self.confidence_interval_lower,
            self.confidence_interval_upper,
        ) {
            (Some(lower), Some(upper)) => Some((lower, upper)),
            _ => None,
        }
    }

    /// Create an error TestResult
    pub fn error(method: &str, error_msg: &str) -> Self {
        Self {
            test_type: TestType::Error,
            error_message: Some(format!("{}: {}", method, error_msg)),
            ..Default::default()
        }
    }
}

impl Default for TestResult {
    fn default() -> Self {
        Self {
            test_statistic: None,
            p_value: None,
            test_type: TestType::IndependentTTest,
            confidence_interval_lower: None,
            confidence_interval_upper: None,
            confidence_level: None,
            effect_size: None,
            degrees_of_freedom: None,
            correlation: None,
            u_statistic: None,
            w_statistic: None,
            sample_size: None,
            cohens_d: None,
            eta_squared: None,
            cramers_v: None,
            phi_coefficient: None,
            odds_ratio: None,
            relative_risk: None,
            mean_difference: None,
            standard_error: None,
            margin_of_error: None,
            sample_means: None,
            sample_std_devs: None,
            chi_square_expected: None,
            residuals: None,
            ranks: None,
            tie_correction: None,
            exact_p_value: None,
            asymptotic_p_value: None,
            r_squared: None,
            adjusted_r_squared: None,
            aic: None,
            bic: None,
            f_statistic: None,
            sum_of_squares: None,
            missing_values: None,
            outliers_detected: None,
            assumptions_violated: None,
            normality_test_p_value: None,
            error_message: None,
        }
    }
}

// The getters are now automatically generated by the wasm_bindgen(getter_with_clone) attribute on the struct
