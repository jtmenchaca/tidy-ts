//! Modular lm.influence implementation
//! 
//! This module provides a modular implementation of R's lm.influence.R functionality,
//! organized into focused, maintainable components.

// Import all modular components from influence module
use crate::stats::regression::influence::{
    influence_core, influence_generic, influence_standardized,
    influence_diagnostics, influence_measures, influence_print
};

// Re-export main types and functions for convenience
pub use influence_core::{
    InfluenceResult, QrInfluenceResult, LinearModel, QrLsResult, NaAction,
    hat, weighted_residuals, qr_influence, lm_influence
};

pub use influence_generic::{
    influence, influence_lm, influence_glm, hatvalues, hatvalues_lm
};

pub use influence_standardized::{
    StandardizedType, GlmResidualType,
    rstandard, rstandard_lm, rstandard_glm,
    rstudent, rstudent_lm, rstudent_glm
};

pub use influence_diagnostics::{
    dffits, dfbeta, dfbeta_lm, dfbetas, dfbetas_lm, covratio,
    cooks_distance, cooks_distance_lm, cooks_distance_glm
};

pub use influence_measures::{
    InfluenceMeasuresResult,
    print_influence_measures, summary_influence_measures
};

pub use influence_print::{
    print_infl, summary_infl
};

/// Comprehensive influence analysis
///
/// This function provides a high-level interface for comprehensive influence analysis,
/// combining all influence measures and providing formatted output.
///
/// # Arguments
///
/// * `model` - Linear model object
/// * `print_results` - Whether to print results
/// * `digits` - Number of decimal places for output
///
/// # Returns
///
/// Comprehensive influence analysis result
pub fn analyze_influence(
    model: &LinearModel,
    print_results: bool,
    digits: Option<usize>,
) -> Result<InfluenceMeasuresResult, &'static str> {
    let measures = influence_measures::influence_measures(model, None)?;
    
    if print_results {
        println!("{}", print_infl(&measures, digits));
    }
    
    Ok(measures)
}

/// Quick influence check
///
/// This function provides a quick check for influential observations
/// without computing all measures.
///
/// # Arguments
///
/// * `model` - Linear model object
///
/// # Returns
///
/// Vector of hat values and Cook's distances
pub fn quick_influence_check(
    model: &LinearModel,
) -> Result<(Vec<f64>, Vec<f64>), &'static str> {
    let hat_vals = hatvalues(model, None)?;
    let cooks_vals = cooks_distance(model, None, None, None, None)?;
    
    Ok((hat_vals, cooks_vals))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analyze_influence() {
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
        
        let measures = analyze_influence(&model, false, None).unwrap();
        assert_eq!(measures.infmat.len(), 3);
    }

    #[test]
    fn test_quick_influence_check() {
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
        
        let (hat_vals, cooks_vals) = quick_influence_check(&model).unwrap();
        assert_eq!(hat_vals.len(), 3);
        assert_eq!(cooks_vals.len(), 3);
    }
}
