//! Common types for post-hoc tests

use crate::stats::core::types::{ConfidenceInterval, TestStatistic};
use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Result for a single pairwise comparison
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct PairwiseComparison {
    /// First group label/index
    pub group1: String,
    /// Second group label/index
    pub group2: String,
    /// Mean difference between groups
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "meanDifference"))]
    pub mean_difference: f64,
    /// Standard error of the difference
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "standardError"))]
    pub standard_error: f64,
    /// Test statistic with name (q for Tukey, t for Games-Howell, z for Dunn)
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "testStatistic"))]
    pub test_statistic: TestStatistic,
    /// P-value for the comparison
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "pValue"))]
    pub p_value: f64,
    /// Confidence interval for the difference
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "confidenceInterval"))]
    pub confidence_interval: ConfidenceInterval,
    /// Whether the difference is significant at the given alpha level
    pub significant: bool,
    /// Adjusted p-value (if applicable)
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "adjustedPValue"))]
    pub adjusted_p_value: f64,
}

/// Result structure for Tukey HSD test
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct TukeyHsdTestResult {
    /// Name of the test performed
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "testName"))]
    pub test_name: String,
    /// P-value for the overall test (if applicable)
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "pValue"))]
    pub p_value: f64,
    /// Test statistic for the overall test (if applicable)
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "testStatistic"))]
    pub test_statistic: TestStatistic,
    /// Number of groups compared
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "nGroups"))]
    pub n_groups: usize,
    /// Total sample size
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "nTotal"))]
    pub n_total: usize,
    /// Individual pairwise comparisons
    pub comparisons: Vec<PairwiseComparison>,
    /// Multiple comparison correction method used
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "correctionMethod"))]
    pub correction_method: String,
    /// Explanatory note about the header values
    pub note: Option<String>,
    /// Significance level used
    pub alpha: f64,
    /// Error message if test failed
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "errorMessage"))]
    pub error_message: Option<String>,
}

/// Result structure for Games-Howell test
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct GamesHowellTestResult {
    /// Test statistic for the overall test (if applicable)
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "testStatistic"))]
    pub test_statistic: TestStatistic,
    /// P-value for the overall test (if applicable)
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "pValue"))]
    pub p_value: f64,
    /// Name of the test performed
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "testName"))]
    pub test_name: String,
    /// Significance level used
    pub alpha: f64,
    /// Error message if test failed
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "errorMessage"))]
    pub error_message: Option<String>,
    /// Explanatory note about the header values
    pub note: Option<String>,
    /// Multiple comparison correction method used
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "correctionMethod"))]
    pub correction_method: String,
    /// Number of groups compared
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "nGroups"))]
    pub n_groups: usize,
    /// Total sample size
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "nTotal"))]
    pub n_total: usize,
    /// Individual pairwise comparisons
    pub comparisons: Vec<PairwiseComparison>,
}

/// Result structure for Dunn's test
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct DunnTestResult {
    /// Test statistic for the overall test (if applicable)
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "testStatistic"))]
    pub test_statistic: TestStatistic,
    /// P-value for the overall test (if applicable)
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "pValue"))]
    pub p_value: f64,
    /// Name of the test performed
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "testName"))]
    pub test_name: String,
    /// Significance level used
    pub alpha: f64,
    /// Error message if test failed
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "errorMessage"))]
    pub error_message: Option<String>,
    /// Explanatory note about the header values
    pub note: Option<String>,
    /// Multiple comparison correction method used
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "correctionMethod"))]
    pub correction_method: String,
    /// Number of groups compared
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "nGroups"))]
    pub n_groups: usize,
    /// Total sample size
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "nTotal"))]
    pub n_total: usize,
    /// Individual pairwise comparisons
    pub comparisons: Vec<PairwiseComparison>,
}

// Note: WASM bindings will be handled through serde serialization in wasm.rs
