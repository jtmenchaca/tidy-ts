//! Common types for post-hoc tests

use serde::{Deserialize, Serialize};

/// Result for a single pairwise comparison
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PairwiseComparison {
    /// First group label/index
    pub group1: String,
    /// Second group label/index
    pub group2: String,
    /// Mean difference between groups
    pub mean_difference: Option<f64>,
    /// Standard error of the difference
    pub std_error: Option<f64>,
    /// Test statistic (q for Tukey, t for Games-Howell, z for Dunn)
    pub test_statistic: Option<f64>,
    /// P-value for the comparison
    pub p_value: Option<f64>,
    /// Lower confidence interval bound
    pub ci_lower: Option<f64>,
    /// Upper confidence interval bound
    pub ci_upper: Option<f64>,
    /// Whether the difference is significant at the given alpha level
    pub significant: Option<bool>,
    /// Adjusted p-value (if applicable)
    pub adjusted_p_value: Option<f64>,
}

/// Result structure for post-hoc tests
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PostHocResult {
    /// Name of the test performed
    pub test_name: String,
    /// Multiple comparison correction method used
    pub correction_method: Option<String>,
    /// Significance level used
    pub alpha: Option<f64>,
    /// Number of groups compared
    pub n_groups: Option<usize>,
    /// Total sample size
    pub n_total: Option<usize>,
    /// Error message if test failed
    pub error_message: Option<String>,
}

// Custom implementation for serialized comparisons field
impl PostHocResult {
    pub fn comparisons(&self) -> Vec<PairwiseComparison> {
        // This will be populated through a separate mechanism
        Vec::new()
    }
    
    pub fn set_comparisons(&mut self, _comparisons: Vec<PairwiseComparison>) {
        // This will be handled through serialization
    }
}

// Note: WASM bindings will be handled through serde serialization in wasm.rs