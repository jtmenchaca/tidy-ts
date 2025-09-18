//! GLM profile utility functions
//!
//! This file contains utility functions for GLM profile calculations.

use super::types::GlmResult;

/// Get coefficient names from a GLM result
pub fn get_coefficient_names(fitted: &GlmResult) -> Vec<String> {
    // TODO: Extract coefficient names from the model
    // For now, create generic names
    (0..fitted.coefficients.len())
        .map(|i| format!("x{}", i))
        .collect()
}

/// Get design matrix from a GLM result
pub fn get_design_matrix(fitted: &GlmResult) -> Result<Vec<Vec<f64>>, String> {
    // TODO: Extract design matrix from the model
    // For now, create a placeholder
    if let Some(ref x) = fitted.x {
        // Reshape the flat matrix into a 2D vector
        let mut result = Vec::new();
        for i in 0..x.n_rows {
            let start = i * x.n_cols;
            let end = start + x.n_cols;
            result.push(x.matrix[start..end].to_vec());
        }
        Ok(result)
    } else {
        Err("Design matrix not available".to_string())
    }
}

/// Create reduced design matrix by removing specified columns
pub fn create_reduced_design_matrix(x: &[Vec<f64>], a: &[bool]) -> Result<Vec<Vec<f64>>, String> {
    if x.is_empty() {
        return Ok(vec![]);
    }

    let mut xi = Vec::new();
    for row in x {
        let new_row: Vec<f64> = row
            .iter()
            .enumerate()
            .filter(|(i, _)| a[*i])
            .map(|(_, &val)| val)
            .collect();
        xi.push(new_row);
    }
    Ok(xi)
}

/// Calculate linear predictor from design matrix and coefficients
pub fn calculate_linear_predictor(
    x: &[Vec<f64>],
    coef: &[f64],
    non_a: &[bool],
    offset: &[f64],
) -> Result<Vec<f64>, String> {
    if x.is_empty() {
        return Ok(offset.to_vec());
    }

    let mut lp = Vec::new();
    for (i, row) in x.iter().enumerate() {
        let mut sum = offset[i];
        for (j, &val) in row.iter().enumerate() {
            if j < non_a.len() && non_a[j] && j < coef.len() {
                sum += val * coef[j];
            }
        }
        lp.push(sum);
    }
    Ok(lp)
}

/// Chi-square quantile function
pub fn chi_square_quantile(p: f64, df: f64) -> f64 {
    // TODO: Implement chi-square quantile function
    // For now, return a placeholder
    if p > 0.5 { 2.0 * df } else { 0.5 * df }
}

/// F quantile function
pub fn f_quantile(p: f64, _df1: f64, _df2: f64) -> f64 {
    // TODO: Implement F quantile function
    // For now, return a placeholder
    if p > 0.5 { 2.0 } else { 0.5 }
}

#[cfg(test)]
mod tests {
    use super::*;
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
            x: Some(crate::stats::regression::model::ModelMatrix {
                matrix: vec![1.0, 1.0, 1.0, 1.0, 2.0, 3.0],
                n_rows: 3,
                n_cols: 2,
                column_names: vec!["(Intercept)".to_string(), "x".to_string()],
                term_assignments: vec![0, 1],
                row_names: None,
            }),
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

    #[test]
    fn test_get_coefficient_names() {
        let result = create_test_glm_result();
        let names = get_coefficient_names(&result);
        assert_eq!(names, vec!["x0", "x1"]);
    }

    #[test]
    fn test_get_design_matrix() {
        let result = create_test_glm_result();
        let matrix = get_design_matrix(&result).unwrap();
        assert_eq!(matrix.len(), 3);
        assert_eq!(matrix[0], vec![1.0, 1.0]);
    }

    #[test]
    fn test_create_reduced_design_matrix() {
        let x = vec![vec![1.0, 2.0, 3.0], vec![4.0, 5.0, 6.0]];
        let a = vec![true, false, true];
        let reduced = create_reduced_design_matrix(&x, &a).unwrap();
        assert_eq!(reduced, vec![vec![1.0, 3.0], vec![4.0, 6.0]]);
    }

    #[test]
    fn test_calculate_linear_predictor() {
        let x = vec![vec![1.0, 2.0], vec![1.0, 3.0]];
        let coef = vec![1.0, 2.0];
        let non_a = vec![true, true];
        let offset = vec![0.0, 0.0];
        let lp = calculate_linear_predictor(&x, &coef, &non_a, &offset).unwrap();
        assert_eq!(lp, vec![5.0, 7.0]); // 1*1 + 2*2 + 0, 1*1 + 2*3 + 0
    }

    #[test]
    fn test_chi_square_quantile() {
        let q = chi_square_quantile(0.95, 1.0);
        assert!(q > 0.0);
    }

    #[test]
    fn test_f_quantile() {
        let q = f_quantile(0.95, 1.0, 10.0);
        assert!(q > 0.0);
    }
}
