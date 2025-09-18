//! GLM ANOVA core tests
//!
//! This file contains tests for GLM ANOVA core functions.

// Unused imports removed - only used in tests
use super::types::GlmResult;
use super::glm_anova::{anova_glm, anova_glmlist};
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
        dispersion: 1.0, // Default dispersion value
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_anova_glm() {
        let result = create_test_glm_result();
        let anova = anova_glm(&result, None, None).unwrap();

        assert_eq!(anova.table.len(), 2);
        assert_eq!(anova.row_names.len(), 2);
        assert!(anova.row_names.contains(&"NULL".to_string()));
    }

    #[test]
    fn test_anova_glmlist() {
        let result1 = create_test_glm_result();
        let result2 = create_test_glm_result();
        let anova = anova_glmlist(&[result1, result2], None, None).unwrap();

        assert_eq!(anova.table.len(), 2);
        assert_eq!(anova.row_names.len(), 2);
    }
}
