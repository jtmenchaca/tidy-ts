//! GLM utility weight functions
//!
//! This file contains weight-related utility functions for GLM objects.

use super::types_results::GlmResult;
use super::types_enums::WeightType;

/// GLM weights function
///
/// This function extracts weights from a GLM object.
///
/// # Arguments
///
/// * `object` - GLM result object
/// * `type` - Type of weights to extract (default: "prior")
///
/// # Returns
///
/// The weights vector.
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_utils_weights::weights_glm;
/// use tidy_ts::stats::regression::glm::types::{GlmResult, WeightType};
///
/// // Assuming you have a GLM result
/// // let prior_weights = weights_glm(&result, WeightType::Prior);
/// // let working_weights = weights_glm(&result, WeightType::Working);
/// ```
pub fn weights_glm(object: &GlmResult, type_: WeightType) -> Vec<f64> {
    match type_ {
        WeightType::Prior => object.prior_weights.clone(),
        WeightType::Working => object.weights.clone(),
    }
}

/// Extract prior weights - convenience function
pub fn weights_glm_prior(object: &GlmResult) -> Vec<f64> {
    weights_glm(object, WeightType::Prior)
}

/// Extract working weights - convenience function
pub fn weights_glm_working(object: &GlmResult) -> Vec<f64> {
    weights_glm(object, WeightType::Working)
}
