//! Linear model tests

// Unused imports removed
use super::lm_fit::{lm, lm_wfit};
use super::lm_summary::summary_lm;
use super::lm_types::LmOptions;
use super::lm_utils::{
    anova_lm, case_names_lm, coef_lm, deviance_lm, fitted_lm, labels_lm, residuals_lm,
    variable_names_lm,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lm_basic() {
        // Simple linear regression: y = 2x + 1 + noise
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![3.1, 5.0, 7.2, 8.8, 11.1];
        let n = 5;
        let p = 2; // intercept + slope
        let ny = 1;

        // Create design matrix with intercept
        let mut x_matrix = vec![0.0; n * p];
        for i in 0..n {
            x_matrix[i] = 1.0; // intercept
            x_matrix[i + n] = x[i]; // slope
        }

        let result = lm(&x_matrix, &y, n, p, ny, None).unwrap();

        // Check that we get reasonable coefficients
        assert!((result.coefficients[0] - 1.0).abs() < 1.0); // intercept around 1
        assert!((result.coefficients[1] - 2.0).abs() < 1.0); // slope around 2
        assert_eq!(result.rank, 2);
        assert_eq!(result.df_residual, 3);
    }

    #[test]
    fn test_lm_empty_model() {
        let x = vec![];
        let y = vec![1.0, 2.0, 3.0];
        let n = 3;
        let p = 0;
        let ny = 1;

        let result = lm(&x, &y, n, p, ny, None).unwrap();

        assert_eq!(result.coefficients.len(), 0);
        assert_eq!(result.residuals, y);
        assert_eq!(result.fitted_values, vec![0.0; n]);
        assert_eq!(result.rank, 0);
        assert_eq!(result.df_residual, n);
    }

    #[test]
    fn test_lm_with_weights() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![3.1, 5.0, 7.2, 8.8, 11.1];
        let weights = vec![1.0, 2.0, 1.0, 2.0, 1.0];
        let n = 5;
        let p = 2;
        let ny = 1;

        // Create design matrix with intercept
        let mut x_matrix = vec![0.0; n * p];
        for i in 0..n {
            x_matrix[i] = 1.0; // intercept
            x_matrix[i + n] = x[i]; // slope
        }

        let options = LmOptions {
            weights: Some(weights),
            ..Default::default()
        };

        let result = lm(&x_matrix, &y, n, p, ny, Some(options)).unwrap();

        // Should complete without error
        assert_eq!(result.rank, 2);
        assert_eq!(result.df_residual, 3);
    }

    #[test]
    fn test_lm_error_cases() {
        // Dimension mismatch
        let x = vec![1.0, 2.0, 3.0];
        let y = vec![1.0, 2.0];
        assert!(lm(&x, &y, 3, 1, 1, None).is_err());

        // Empty data
        let x = vec![];
        let y = vec![];
        assert!(lm(&x, &y, 0, 0, 0, None).is_err());

        // Invalid weights
        let x = vec![1.0, 2.0, 3.0];
        let y = vec![1.0, 2.0, 3.0];
        let options = LmOptions {
            weights: Some(vec![1.0, -1.0, 1.0]), // negative weight
            ..Default::default()
        };
        assert!(lm(&x, &y, 3, 1, 1, Some(options)).is_err());
    }

    #[test]
    fn test_lm_wfit() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![3.1, 5.0, 7.2, 8.8, 11.1];
        let weights = vec![1.0, 2.0, 1.0, 2.0, 1.0];
        let n = 5;
        let p = 2;
        let ny = 1;

        // Create design matrix with intercept
        let mut x_matrix = vec![0.0; n * p];
        for i in 0..n {
            x_matrix[i] = 1.0; // intercept
            x_matrix[i + n] = x[i]; // slope
        }

        let result = lm_wfit(&x_matrix, &y, &weights, n, p, ny, None, true).unwrap();

        assert_eq!(result.rank, 2);
        assert_eq!(result.df_residual, 3);
    }

    #[test]
    fn test_summary_lm() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![3.1, 5.0, 7.2, 8.8, 11.1];
        let n = 5;
        let p = 2;
        let ny = 1;

        // Create design matrix with intercept
        let mut x_matrix = vec![0.0; n * p];
        for i in 0..n {
            x_matrix[i] = 1.0; // intercept
            x_matrix[i + n] = x[i]; // slope
        }

        let result = lm(&x_matrix, &y, n, p, ny, None).unwrap();
        let summary = summary_lm(&result);

        assert_eq!(summary.coefficients.len(), 2);
        assert!(summary.sigma > 0.0);
        assert!(summary.r_squared >= 0.0 && summary.r_squared <= 1.0);
        assert!(summary.adj_r_squared >= 0.0 && summary.adj_r_squared <= 1.0);
    }

    #[test]
    fn test_anova_lm() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![3.1, 5.0, 7.2, 8.8, 11.1];
        let n = 5;
        let p = 2;
        let ny = 1;

        // Create design matrix with intercept
        let mut x_matrix = vec![0.0; n * p];
        for i in 0..n {
            x_matrix[i] = 1.0; // intercept
            x_matrix[i + n] = x[i]; // slope
        }

        let result = lm(&x_matrix, &y, n, p, ny, None).unwrap();
        let anova = anova_lm(&result);

        assert_eq!(anova.rows.len(), 2); // Model + Residuals
        assert_eq!(anova.rows[0].source, "Model");
        assert_eq!(anova.rows[1].source, "Residuals");
    }

    #[test]
    fn test_utility_functions() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![3.1, 5.0, 7.2, 8.8, 11.1];
        let n = 5;
        let p = 2;
        let ny = 1;

        // Create design matrix with intercept
        let mut x_matrix = vec![0.0; n * p];
        for i in 0..n {
            x_matrix[i] = 1.0; // intercept
            x_matrix[i + n] = x[i]; // slope
        }

        let result = lm(&x_matrix, &y, n, p, ny, None).unwrap();

        // Test utility functions
        let residuals = residuals_lm(&result, "response");
        assert_eq!(residuals.len(), n);

        let deviance = deviance_lm(&result);
        assert!(deviance > 0.0);

        let fitted = fitted_lm(&result);
        assert_eq!(fitted.len(), n);

        let coef = coef_lm(&result);
        assert_eq!(coef.len(), p);

        let var_names = variable_names_lm(&result, false);
        assert_eq!(var_names.len(), result.rank);

        let case_names = case_names_lm(&result, false);
        assert_eq!(case_names.len(), n);

        let labels = labels_lm(&result);
        assert_eq!(labels.len(), result.rank);
    }
}
