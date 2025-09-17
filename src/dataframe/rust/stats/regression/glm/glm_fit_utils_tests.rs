//! GLM fit utility tests module
//!
//! This file contains tests for the GLM fit utility functions.

use super::glm_fit_utils_linear::*;
use super::glm_fit_utils_weights::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_working_weights() {
        let weights = vec![1.0, 2.0, 0.0];
        let mu_eta = vec![0.5, 1.0, 0.0];
        let variance = vec![1.0, 2.0, 1.0];

        let result = calculate_working_weights(&weights, &mu_eta, &variance);

        assert_eq!(result.len(), 3);
        assert!(result[0] > 0.0);
        assert!(result[1] > 0.0);
        assert_eq!(result[2], 0.0);
    }

    #[test]
    fn test_calculate_working_response() {
        let eta = vec![1.0, 2.0, 3.0];
        let offset = vec![0.1, 0.2, 0.3];
        let y = vec![1.5, 2.5, 3.5];
        let mu = vec![1.2, 2.2, 3.2];
        let mu_eta = vec![1.0, 1.0, 1.0];

        let result = calculate_working_response(&eta, &offset, &y, &mu, &mu_eta);

        assert_eq!(result.len(), 3);
        // Check first value: (1.0 - 0.1) + (1.5 - 1.2) / 1.0 = 0.9 + 0.3 = 1.2
        assert!((result[0] - 1.2).abs() < 1e-10);
    }

    #[test]
    fn test_get_valid_observations() {
        let weights = vec![1.0, 0.0, 2.0];
        let mu_eta = vec![1.0, 1.0, 0.0];

        let result = get_valid_observations(&weights, &mu_eta);

        assert_eq!(result, vec![true, false, false]);
    }

    #[test]
    fn test_calculate_linear_predictor() {
        let x = vec![vec![1.0, 2.0], vec![1.0, 3.0], vec![1.0, 4.0]];
        let coef = vec![1.0, 2.0];
        let offset = vec![0.1, 0.2, 0.3];

        let result = calculate_linear_predictor(&x, &coef, &offset);

        assert_eq!(result.len(), 3);
        // Check first value: 0.1 + 1.0*1.0 + 2.0*2.0 = 0.1 + 1.0 + 4.0 = 5.1
        assert!((result[0] - 5.1).abs() < 1e-10);
    }

    #[test]
    fn test_apply_step_halving() {
        let old_coef = vec![1.0, 2.0, 3.0];
        let new_coef = vec![3.0, 4.0, 5.0];

        let result = apply_step_halving(&old_coef, &new_coef);

        assert_eq!(result, vec![2.0, 3.0, 4.0]);
    }
}
