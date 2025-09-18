//! GLM utility tests module
//!
//! This file contains tests for the GLM utility functions.

// Unused imports removed
use super::types_results::GlmResult;
use crate::stats::regression::family::gaussian::GaussianFamily;
use crate::stats::regression::glm::glm_control::glm_control;
use crate::stats::regression::glm::{
    deviance_glm, effects_glm, family_glm, formula_glm, weights_glm_prior, weights_glm_working,
};

fn create_test_glm_result() -> GlmResult {
    let family = Box::new(GaussianFamily::identity());
    let control = glm_control(None, None, None).unwrap();

    GlmResult {
        coefficients: vec![1.0, 2.0],
        residuals: vec![0.1, -0.1, 0.0],
        fitted_values: vec![1.0, 2.0, 3.0],
        linear_predictors: vec![1.0, 2.0, 3.0],
        working_residuals: vec![0.1, -0.1, 0.0],
        response_residuals: vec![0.1, -0.1, 0.0],
        deviance_residuals: vec![0.1, -0.1, 0.0],
        pearson_residuals: vec![0.1, -0.1, 0.0],
        effects: Some(vec![1.0, 2.0, 3.0]),
        r_matrix: None,
        qr: None,
        rank: 2,
        qr_rank: 2,
        pivot: vec![0, 1],
        tol: 1e-8,
        pivoted: false,
        family,
        deviance: 0.02,
        aic: 10.0,
        null_deviance: 2.0,
        iter: 3,
        weights: vec![1.0, 1.0, 1.0],
        prior_weights: vec![1.0, 1.0, 1.0],
        df_residual: 1,
        df_null: 2,
        y: vec![1.1, 1.9, 3.0],
        converged: true,
        boundary: false,
        model: None,
        x: None,
        call: Some("glm(formula = y ~ x, family = gaussian, data = data)".to_string()),
        formula: Some("y ~ x".to_string()),
        terms: Some("y ~ x".to_string()),
        data: Some("data".to_string()),
        offset: None,
        control,
        method: "glm.fit".to_string(),
        contrasts: None,
        xlevels: None,
        na_action: Some("na.omit".to_string()),
        dispersion: 1.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deviance_glm() {
        let result = create_test_glm_result();
        let deviance = deviance_glm(&result);
        assert_eq!(deviance, 0.02);
    }

    #[test]
    fn test_effects_glm() {
        let result = create_test_glm_result();
        let effects = effects_glm(&result);
        assert_eq!(effects, Some(vec![1.0, 2.0, 3.0]));
    }

    #[test]
    fn test_family_glm() {
        let result = create_test_glm_result();
        let family = family_glm(&result);
        assert_eq!(family.family_name(), "gaussian");
    }

    #[test]
    fn test_weights_glm() {
        let result = create_test_glm_result();
        let prior_weights = weights_glm_prior(&result);
        let working_weights = weights_glm_working(&result);

        assert_eq!(prior_weights, vec![1.0, 1.0, 1.0]);
        assert_eq!(working_weights, vec![1.0, 1.0, 1.0]);
    }

    #[test]
    fn test_formula_glm() {
        let result = create_test_glm_result();
        let formula = formula_glm(&result);
        assert_eq!(formula, Some("y ~ x".to_string()));
    }
}
