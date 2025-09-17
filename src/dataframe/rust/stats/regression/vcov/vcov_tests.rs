//! Variance-covariance matrix tests

use super::vcov_types::*;
use super::vcov_core::*;
use super::vcov_sigma::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vcov_aliased() {
        let aliased = vec![false, true, false];
        let vc = vec![vec![1.0, 2.0], vec![3.0, 4.0]];

        let result = vcov_aliased(&aliased, &vc, true).unwrap();
        assert_eq!(result.len(), 3);
        assert_eq!(result[0].len(), 3);

        // Check that aliased coefficient gets NaN
        assert!(result[1][1].is_nan());
        assert!(result[1][0].is_nan());
        assert!(result[0][1].is_nan());
        assert!(result[2][1].is_nan());
        assert!(result[1][2].is_nan());
    }

    #[test]
    fn test_vcov_aliased_complete_false() {
        let aliased = vec![false, true, false];
        let vc = vec![vec![1.0, 2.0], vec![3.0, 4.0]];

        let result = vcov_aliased(&aliased, &vc, false).unwrap();
        assert_eq!(result, vc);
    }

    #[test]
    fn test_sigma_default() {
        let lm = LmObject {
            coefficients: vec![1.0, 2.0],
            residuals: vec![0.1, -0.1, 0.2, -0.2],
            fitted_values: vec![1.0, 2.0, 3.0, 4.0],
            rank: 2,
            df_residual: 2,
            qr: None,
            assign: None,
            qr_rank: 2,
            pivot: vec![1, 2],
            tol: 1e-7,
            pivoted: false,
        };

        let sigma_val = sigma_default(&lm, true).unwrap();
        let expected = (0.1 * 0.1 + 0.1 * 0.1 + 0.2 * 0.2 + 0.2 * 0.2) / 2.0;
        assert!((sigma_val - expected.sqrt()).abs() < 1e-10);
    }

    #[test]
    fn test_sigma_glm() {
        let glm = GlmObject {
            coefficients: vec![1.0, 2.0],
            residuals: vec![0.1, -0.1, 0.2, -0.2],
            fitted_values: vec![1.0, 2.0, 3.0, 4.0],
            rank: 2,
            df_residual: 2,
            family: "gaussian".to_string(),
            linear_predictors: vec![1.0, 2.0, 3.0, 4.0],
            deviance: 0.1,
            aic: 10.0,
            null_deviance: 1.0,
            iter: 5,
            weights: vec![1.0, 1.0, 1.0, 1.0],
            prior_weights: vec![1.0, 1.0, 1.0, 1.0],
            y: vec![1.1, 1.9, 3.2, 3.8],
            converged: true,
            boundary: false,
        };

        let sigma_val = sigma_glm(&glm).unwrap();
        let expected = (0.1 / 2.0).sqrt();
        assert!((sigma_val - expected).abs() < 1e-10);
    }

    #[test]
    fn test_vcov_lm() {
        let lm = LmObject {
            coefficients: vec![1.0, 2.0],
            residuals: vec![0.1, -0.1, 0.2, -0.2],
            fitted_values: vec![1.0, 2.0, 3.0, 4.0],
            rank: 2,
            df_residual: 2,
            qr: None,
            assign: None,
            qr_rank: 2,
            pivot: vec![1, 2],
            tol: 1e-7,
            pivoted: false,
        };

        let vc = vcov_lm(&lm, false).unwrap();
        assert_eq!(vc.len(), 2);
        assert_eq!(vc[0].len(), 2);
        assert!(vc[0][0] > 0.0);
        assert!(vc[1][1] > 0.0);
    }

    #[test]
    fn test_vcov_glm() {
        let glm = GlmObject {
            coefficients: vec![1.0, 2.0],
            residuals: vec![0.1, -0.1, 0.2, -0.2],
            fitted_values: vec![1.0, 2.0, 3.0, 4.0],
            rank: 2,
            df_residual: 2,
            family: "gaussian".to_string(),
            linear_predictors: vec![1.0, 2.0, 3.0, 4.0],
            deviance: 0.1,
            aic: 10.0,
            null_deviance: 1.0,
            iter: 5,
            weights: vec![1.0, 1.0, 1.0, 1.0],
            prior_weights: vec![1.0, 1.0, 1.0, 1.0],
            y: vec![1.1, 1.9, 3.2, 3.8],
            converged: true,
            boundary: false,
        };

        let vc = vcov_glm(&glm, false).unwrap();
        assert_eq!(vc.len(), 2);
        assert_eq!(vc[0].len(), 2);
        assert!(vc[0][0] > 0.0);
        assert!(vc[1][1] > 0.0);
    }

    #[test]
    fn test_vcov_mlm() {
        let mlm = MlmObject {
            coefficients: vec![vec![1.0, 2.0], vec![3.0, 4.0]],
            residuals: vec![vec![0.1, -0.1], vec![0.2, -0.2]],
            fitted_values: vec![vec![1.0, 2.0], vec![3.0, 4.0]],
            rank: 2,
            df_residual: 2,
            qr: None,
            assign: None,
            qr_rank: 2,
            pivot: vec![1, 2],
            tol: 1e-7,
            pivoted: false,
        };

        let vc = vcov_mlm(&mlm, false).unwrap();
        assert_eq!(vc.len(), 2);
        assert_eq!(vc[0].len(), 2);
        assert!(vc[0][0] > 0.0);
        assert!(vc[1][1] > 0.0);
    }

    #[test]
    fn test_sigma_mlm() {
        let mlm = MlmObject {
            coefficients: vec![vec![1.0, 2.0], vec![3.0, 4.0]],
            residuals: vec![vec![0.1, -0.1], vec![0.2, -0.2]],
            fitted_values: vec![vec![1.0, 2.0], vec![3.0, 4.0]],
            rank: 2,
            df_residual: 2,
            qr: None,
            assign: None,
            qr_rank: 2,
            pivot: vec![1, 2],
            tol: 1e-7,
            pivoted: false,
        };

        let sigma_val = sigma_mlm(&mlm).unwrap();
        let expected = (0.1 * 0.1 + 0.1 * 0.1) / 2.0;
        assert!((sigma_val - expected.sqrt()).abs() < 1e-10);
    }

    #[test]
    fn test_vcov_summary_lm() {
        let summary = LmSummary {
            coefficients: vec![
                CoefficientSummary {
                    estimate: 1.0,
                    std_error: 0.1,
                    t_value: 10.0,
                    p_value: 0.001,
                },
                CoefficientSummary {
                    estimate: 2.0,
                    std_error: 0.2,
                    t_value: 10.0,
                    p_value: 0.001,
                },
            ],
            sigma: 0.5,
            df: vec![2, 2],
            r_squared: 0.9,
            adj_r_squared: 0.8,
            fstatistic: None,
            cov_unscaled: vec![vec![1.0, 0.0], vec![0.0, 1.0]],
            correlation: None,
        };

        let vc = vcov_summary_lm(&summary, false).unwrap();
        assert_eq!(vc.len(), 2);
        assert_eq!(vc[0].len(), 2);
        assert!((vc[0][0] - 0.25).abs() < 1e-10); // sigma^2 = 0.5^2 = 0.25
        assert!((vc[1][1] - 0.25).abs() < 1e-10);
    }

    #[test]
    fn test_vcov_summary_glm() {
        let summary = GlmSummary {
            coefficients: vec![
                CoefficientSummary {
                    estimate: 1.0,
                    std_error: 0.1,
                    t_value: 10.0,
                    p_value: 0.001,
                },
                CoefficientSummary {
                    estimate: 2.0,
                    std_error: 0.2,
                    t_value: 10.0,
                    p_value: 0.001,
                },
            ],
            dispersion: 0.5,
            df: vec![2, 2],
            null_deviance: 10.0,
            deviance: 1.0,
            aic: 20.0,
            iter: 5,
            deviance_resid: vec![0.1, -0.1, 0.2, -0.2],
            df_residual: 2,
            null_df: 3,
            converged: true,
            boundary: false,
        };

        let vc = vcov_summary_glm(&summary, false).unwrap();
        assert_eq!(vc.len(), 2);
        assert_eq!(vc[0].len(), 2);
        assert!((vc[0][0] - 0.5).abs() < 1e-10); // dispersion = 0.5
        assert!((vc[1][1] - 0.5).abs() < 1e-10);
    }
}
