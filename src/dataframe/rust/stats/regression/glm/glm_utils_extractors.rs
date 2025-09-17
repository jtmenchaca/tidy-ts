//! GLM utility extractor functions
//!
//! This file contains functions that extract information from GLM objects.

use super::types_results::GlmResult;
use crate::stats::regression::family::GlmFamily;
use crate::stats::regression::model::ModelFrame;
use std::collections::HashMap;

/// GLM deviance function
///
/// This function extracts the deviance from a GLM object.
///
/// # Arguments
///
/// * `object` - GLM result object
///
/// # Returns
///
/// The deviance value.
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_utils_extractors::deviance_glm;
/// use tidy_ts::stats::regression::glm::types::GlmResult;
///
/// // Assuming you have a GLM result
/// // let dev = deviance_glm(&result);
/// ```
pub fn deviance_glm(object: &GlmResult) -> f64 {
    object.deviance
}

/// GLM effects function
///
/// This function extracts the effects from a GLM object.
///
/// # Arguments
///
/// * `object` - GLM result object
///
/// # Returns
///
/// The effects vector, or None if not available.
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_utils_extractors::effects_glm;
/// use tidy_ts::stats::regression::glm::types::GlmResult;
///
/// // Assuming you have a GLM result
/// // let effects = effects_glm(&result);
/// ```
pub fn effects_glm(object: &GlmResult) -> Option<Vec<f64>> {
    object.effects.clone()
}

/// GLM family function
///
/// This function extracts the family from a GLM object.
///
/// # Arguments
///
/// * `object` - GLM result object
///
/// # Returns
///
/// A reference to the family object.
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_utils_extractors::family_glm;
/// use tidy_ts::stats::regression::glm::types::GlmResult;
///
/// // Assuming you have a GLM result
/// // let family = family_glm(&result);
/// ```
pub fn family_glm(object: &GlmResult) -> &dyn GlmFamily {
    object.family.as_ref()
}

/// GLM model frame function
///
/// This function extracts or recreates the model frame from a GLM object.
///
/// # Arguments
///
/// * `formula` - GLM result object (acting as formula)
/// * `data` - Optional data frame
/// * `na_action` - Optional NA action
/// * `subset` - Optional subset
///
/// # Returns
///
/// The model frame, or None if not available.
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_utils_extractors::model_frame_glm;
/// use tidy_ts::stats::regression::glm::types::GlmResult;
///
/// // Assuming you have a GLM result
/// // let model_frame = model_frame_glm(&result, None, None, None);
/// ```
pub fn model_frame_glm(
    formula: &GlmResult,
    data: Option<HashMap<String, Vec<f64>>>,
    na_action: Option<String>,
    subset: Option<Vec<bool>>,
) -> Option<ModelFrame> {
    // If we have arguments or no model, we need to recreate the model frame
    if data.is_some() || na_action.is_some() || subset.is_some() || formula.model.is_none() {
        // TODO: Implement model frame recreation
        // This would involve calling glm() with method = "model.frame"
        None
    } else {
        formula.model.clone()
    }
}

/// GLM formula function
///
/// This function extracts the formula from a GLM object.
///
/// # Arguments
///
/// * `x` - GLM result object
///
/// # Returns
///
/// The formula string, or None if not available.
///
/// # Examples
///
/// ```rust
/// use tidy_ts::stats::regression::glm::glm_utils_extractors::formula_glm;
/// use tidy_ts::stats::regression::glm::types::GlmResult;
///
/// // Assuming you have a GLM result
/// // let formula = formula_glm(&result);
/// ```
pub fn formula_glm(x: &GlmResult) -> Option<String> {
    if let Some(ref form) = x.formula {
        // Equivalent to: form <- formula(x$terms) # has . expanded
        // environment(form) <- environment(x$formula)
        Some(form.clone())
    } else {
        // Equivalent to: formula(x$terms)
        x.terms.clone()
    }
}
