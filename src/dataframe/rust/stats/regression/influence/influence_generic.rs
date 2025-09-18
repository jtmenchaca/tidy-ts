//! Generic influence functions and method dispatch
//!
//! This module provides generic functions and method dispatch
//! equivalent to R's influence_generic.R module.

use super::influence_core::{InfluenceResult, LinearModel, lm_influence};

/// Generic influence function
///
/// This function provides a generic interface for influence calculations
/// that can be extended for different model types.
///
/// # Arguments
///
/// * `model` - Model object
/// * `do_coef` - Whether to compute coefficient changes
///
/// # Returns
///
/// Influence result
pub fn influence(model: &LinearModel, do_coef: bool) -> Result<InfluenceResult, &'static str> {
    influence_lm(model, do_coef)
}

/// Linear model influence method
///
/// This function computes influence measures for linear models.
///
/// # Arguments
///
/// * `model` - Linear model object
/// * `do_coef` - Whether to compute coefficient changes
///
/// # Returns
///
/// Influence result
pub fn influence_lm(model: &LinearModel, do_coef: bool) -> Result<InfluenceResult, &'static str> {
    lm_influence(model, do_coef)
}

/// GLM influence method
///
/// This function computes influence measures for generalized linear models.
///
/// # Arguments
///
/// * `model` - GLM model object
/// * `do_coef` - Whether to compute coefficient changes
///
/// # Returns
///
/// Influence result with additional GLM-specific components
pub fn influence_glm(
    model: &LinearModel,
    do_coef: bool,
    pearson_residuals: Option<Vec<f64>>,
) -> Result<InfluenceResult, &'static str> {
    let res = lm_influence(model, do_coef)?;

    // For GLM, we need to handle Pearson residuals
    if let Some(_pear_res) = pearson_residuals {
        // In a full implementation, we would add pearson_residuals to the result
        // For now, we just return the basic influence result
    }

    Ok(res)
}

/// Generic hat values function
///
/// This function provides a generic interface for extracting hat values
/// from different model types.
///
/// # Arguments
///
/// * `model` - Model object
/// * `infl` - Optional pre-computed influence result
///
/// # Returns
///
/// Vector of hat values
pub fn hatvalues(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
) -> Result<Vec<f64>, &'static str> {
    let influence_result = match infl {
        Some(infl) => infl.clone(),
        None => lm_influence(model, false)?,
    };

    Ok(influence_result.hat)
}

/// Linear model hat values method
///
/// This function extracts hat values from linear models.
///
/// # Arguments
///
/// * `model` - Linear model object
/// * `infl` - Optional pre-computed influence result
///
/// # Returns
///
/// Vector of hat values
pub fn hatvalues_lm(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
) -> Result<Vec<f64>, &'static str> {
    hatvalues(model, infl)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::influence::influence_core::LinearModel;

    #[test]
    fn test_influence_lm() {
        let model = LinearModel {
            x: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0], // 3x2
            y: vec![1.0, 2.0, 3.0],
            n: 3,
            p: 2,
            rank: 2,
            weights: None,
            fitted: vec![1.0, 2.0, 3.0],
            residuals: vec![0.0, 0.0, 0.0],
            qr: None,
            na_action: None,
            deviance: 0.0,
            df_residual: 1.0,
        };

        let infl = influence_lm(&model, false).unwrap();
        assert_eq!(infl.hat.len(), 3);
    }

    #[test]
    fn test_hatvalues() {
        let model = LinearModel {
            x: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0], // 3x2
            y: vec![1.0, 2.0, 3.0],
            n: 3,
            p: 2,
            rank: 2,
            weights: None,
            fitted: vec![1.0, 2.0, 3.0],
            residuals: vec![0.0, 0.0, 0.0],
            qr: None,
            na_action: None,
            deviance: 0.0,
            df_residual: 1.0,
        };

        let hat_vals = hatvalues(&model, None).unwrap();
        assert_eq!(hat_vals.len(), 3);
        assert!(hat_vals.iter().all(|&h| h >= 0.0 && h <= 1.0));
    }
}
