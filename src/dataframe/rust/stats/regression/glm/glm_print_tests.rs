//! GLM print tests module
//!
//! This file contains tests for the GLM print functions.

// Unused imports removed
use super::glm_print::{format_glm, format_glm_default, format_glm_digits, print_glm};
use super::types_results::GlmResult;
use crate::stats::regression::family::gaussian::GaussianFamily;
use crate::stats::regression::glm::glm_control::glm_control;

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
        effects: None,
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
    fn test_print_glm() {
        let result = create_test_glm_result();
        // This test just ensures the function doesn't panic
        print_glm(&result, Some(3));
    }

    #[test]
    fn test_format_glm() {
        let result = create_test_glm_result();
        let formatted = format_glm(&result, Some(3));

        // Check that the formatted string contains expected elements
        assert!(formatted.contains("Call:"));
        assert!(formatted.contains("Coefficients"));
        assert!(formatted.contains("(Intercept)"));
        assert!(formatted.contains("Degrees of Freedom"));
        assert!(formatted.contains("Null Deviance"));
        assert!(formatted.contains("Residual Deviance"));
        assert!(formatted.contains("AIC"));
    }

    #[test]
    fn test_format_glm_default() {
        let result = create_test_glm_result();
        let formatted = format_glm_default(&result);
        assert!(!formatted.is_empty());
    }

    #[test]
    fn test_format_glm_digits() {
        let result = create_test_glm_result();
        let formatted = format_glm_digits(&result, 5);
        assert!(!formatted.is_empty());
    }
}
