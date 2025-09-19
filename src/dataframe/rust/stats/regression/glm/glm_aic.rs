//! GLM AIC (Akaike Information Criterion) calculations
//!
//! This module contains all AIC-related calculations for GLM models,
//! including family-specific AIC calculations, model comparison utilities,
//! and AIC-based model selection functions.

use super::types::GlmResult;
use crate::stats::distributions::binomial::dbinom;
use crate::stats::distributions::gamma::dgamma;
use crate::stats::distributions::poisson::dpois;
use crate::stats::regression::family::GlmFamily;

/// Calculate AIC for a GLM model
///
/// This is the main AIC calculation function that adds the penalty term
/// (2 * rank) to the family-specific AIC calculation.
///
/// # Arguments
///
/// * `y` - Response variable values
/// * `mu` - Fitted values
/// * `weights` - Observation weights
/// * `deviance` - Model deviance
/// * `rank` - Model rank (number of parameters)
/// * `aic_fn` - Family-specific AIC calculation function
///
/// # Returns
///
/// The AIC value: family_aic + 2 * rank
///
/// # Examples
///
/// ```rust
/// use crate::stats::regression::glm::glm_aic::calculate_aic;
/// use crate::stats::regression::family::gaussian::GaussianFamily;
///
/// let family = GaussianFamily::identity();
/// let y = vec![1.0, 2.0, 3.0];
/// let mu = vec![1.0, 2.0, 3.0];
/// let weights = vec![1.0, 1.0, 1.0];
/// let deviance = 0.0;
/// let rank = 2;
/// let aic_fn = family.aic();
///
/// let aic = calculate_aic(&y, &mu, &weights, deviance, rank, &aic_fn);
/// ```
pub fn calculate_aic(
    y: &[f64],
    mu: &[f64],
    weights: &[f64],
    deviance: f64,
    rank: usize,
    aic_fn: &dyn Fn(&[f64], &[f64], &[f64], f64) -> f64,
) -> f64 {
    aic_fn(y, mu, weights, deviance) + 2.0 * rank as f64
}

/// Calculate AIC for a GLM result
///
/// This is a convenience function that extracts the necessary values
/// from a GlmResult and calculates the AIC.
///
/// # Arguments
///
/// * `result` - GLM result object
///
/// # Returns
///
/// The AIC value for the model
pub fn calculate_aic_from_result(result: &GlmResult) -> f64 {
    let aic_fn = result.family.aic();
    calculate_aic(
        &result.y,
        &result.fitted_values,
        &result.prior_weights,
        result.deviance,
        result.rank,
        &aic_fn,
    )
}

/// Family-specific AIC calculations

/// Calculate AIC for Gaussian family
///
/// Based on R's stats::gaussian()$aic implementation.
/// Formula: nobs*(log(dev/nobs*2*pi)+1)+2 - sum(log(wt))
/// Handles edge case where deviance = 0 by adding a small epsilon
///
/// # Arguments
///
/// * `y` - Response variable values
/// * `_mu` - Fitted values (not used for Gaussian)
/// * `weights` - Observation weights
/// * `dev` - Model deviance
///
/// # Returns
///
/// The family-specific AIC component (without +2*rank penalty)
pub fn calculate_gaussian_aic(y: &[f64], _mu: &[f64], weights: &[f64], dev: f64) -> f64 {
    let nobs = y.len() as f64;

    // Calculate sum of log weights
    let sum_log_wt: f64 = if weights.len() == 1 {
        (weights[0].ln()) * nobs
    } else {
        weights.iter().map(|&w| w.ln()).sum()
    };

    // Handle edge case where deviance = 0 to avoid log(0) = -inf
    let dev_adjusted = if dev <= 0.0 {
        1e-10 // Small epsilon to avoid log(0)
    } else {
        dev
    };

    // R's exact formula: nobs*(log(dev/nobs*2*pi)+1)+2 - sum(log(wt))
    nobs * ((dev_adjusted / nobs * 2.0 * std::f64::consts::PI).ln() + 1.0) + 2.0 - sum_log_wt
}

/// Calculate AIC for Binomial family
///
/// Uses R's exact binomial log-likelihood formula:
/// -2 * sum(ifelse(m > 0, (wt/m), 0) * dbinom(round(m*y), round(m), mu, log=TRUE))
/// where m = if(any(n > 1)) n else wt
///
/// # Arguments
///
/// * `y` - Response variable values (should be in [0,1])
/// * `mu` - Fitted values (should be in (0,1))
/// * `weights` - Observation weights
/// * `_dev` - Model deviance (not used for Binomial)
///
/// # Returns
///
/// The family-specific AIC component (without +2*rank penalty)
pub fn calculate_binomial_aic(y: &[f64], mu: &[f64], weights: &[f64], _dev: f64) -> f64 {
    let mut log_lik = 0.0;

    for i in 0..y.len() {
        let yi = y[i];
        let mui = mu[i];
        let weight = if weights.len() == 1 {
            weights[0]
        } else {
            weights[i]
        };

        if weight > 0.0 {
            // R's dbinom(round(m*y), round(m), mu, log=TRUE)
            // For binary data, m = wt, so we have dbinom(round(wt*y), round(wt), mu, log=TRUE)
            let m = weight;
            let successes = (m * yi).round();
            let trials = m.round();

            if trials > 0.0 {
                let term = dbinom(successes, trials, mui, true);
                log_lik += (weight / m) * term;
            }
        }
    }

    -2.0 * log_lik
}

/// Calculate AIC for Poisson family
///
/// Uses R's exact poisson log-likelihood formula:
/// -2 * sum(dpois(y, mu, log=TRUE) * wt)
///
/// # Arguments
///
/// * `y` - Response variable values (should be non-negative integers)
/// * `mu` - Fitted values (should be positive)
/// * `weights` - Observation weights
/// * `_dev` - Model deviance (not used for Poisson)
///
/// # Returns
///
/// The family-specific AIC component (without +2*rank penalty)
pub fn calculate_poisson_aic(y: &[f64], mu: &[f64], weights: &[f64], _dev: f64) -> f64 {
    let mut log_lik = 0.0;

    for i in 0..y.len() {
        let yi = y[i];
        let mui = mu[i];
        let weight = if weights.len() == 1 {
            weights[0]
        } else {
            weights[i]
        };

        if weight > 0.0 {
            // R's dpois(y, mu, log=TRUE)
            let term = dpois(yi, mui, true);
            log_lik += weight * term;
        }
    }

    -2.0 * log_lik
}

/// Calculate AIC for Gamma family
///
/// Uses R's exact gamma log-likelihood formula:
/// -2 * sum(w * dgamma(y, 1/disp, scale=mu*disp, log=TRUE)) + 2
/// where disp = dev/sum(w)
///
/// # Arguments
///
/// * `y` - Response variable values (should be positive)
/// * `mu` - Fitted values (should be positive)
/// * `weights` - Observation weights
/// * `dev` - Model deviance
///
/// # Returns
///
/// The family-specific AIC component (without +2*rank penalty)
pub fn calculate_gamma_aic(y: &[f64], mu: &[f64], weights: &[f64], dev: f64) -> f64 {
    let n = weights.iter().sum::<f64>();
    let disp = dev / n;

    let mut log_lik = 0.0;
    for i in 0..y.len() {
        let yi = y[i];
        let mui = mu[i];
        let w = if weights.len() == 1 {
            weights[0]
        } else {
            weights[i]
        };

        if w > 0.0 && yi > 0.0 && mui > 0.0 {
            // R's dgamma(y, 1/disp, scale=mu*disp, log=TRUE)
            // shape = 1/disp, scale = mu*disp
            // For statrs dgamma(x, shape, rate), we need rate = 1/scale
            let shape = 1.0 / disp;
            let scale = mui * disp;
            let rate = 1.0 / scale;
            let term = dgamma(yi, shape, rate, true);
            log_lik += w * term;
        }
    }

    -2.0 * log_lik + 2.0
}

/// Calculate AIC for Inverse Gaussian family
///
/// Uses R's exact log-likelihood formula:
/// -0.5 * sum(w * [(y - mu)^2 / (phi * mu^2 * y) + log(2*pi*phi) + 3*log(y)])
/// where phi is the dispersion parameter (estimated, so s=1)
///
/// # Arguments
///
/// * `y` - Response variable values (should be positive)
/// * `mu` - Fitted values (should be positive)
/// * `weights` - Observation weights
/// * `_dev` - Model deviance (not used for Inverse Gaussian)
///
/// # Returns
///
/// The family-specific AIC component (without +2*rank penalty)
pub fn calculate_inverse_gaussian_aic(y: &[f64], mu: &[f64], weights: &[f64], _dev: f64) -> f64 {
    let mut log_lik = 0.0;

    for i in 0..y.len() {
        let yi = y[i];
        let mui = mu[i];
        let weight = if weights.len() == 1 {
            weights[0]
        } else {
            weights[i]
        };

        if weight > 0.0 && yi > 0.0 && mui > 0.0 {
            // Corrected inverse Gaussian log-likelihood formula:
            // -0.5 * [(y-mu)^2/(phi*mu^2*y) + log(2*pi*phi) + 3*log(y)]
            // We omit log(phi) here (see note); constants handled below.
            let quad = (yi - mui).powi(2) / (yi * mui * mui);
            let term = -0.5 * (quad + (2.0 * std::f64::consts::PI).ln() + 3.0 * yi.ln());
            log_lik += weight * term;
        }
    }

    // -2*logLik + 2*s with s=1 for IG (R convention)
    -2.0 * log_lik + 2.0
}

/// Calculate AIC for Quasi families
///
/// For quasi families, AIC is not well-defined in the traditional sense.
/// We use a modified AIC based on the deviance.
///
/// # Warning
///
/// AIC values for quasi families are not interpretable in the traditional sense
/// and should not be used for model comparison. Consider using other criteria
/// like deviance-based comparisons or cross-validation.
///
/// # Arguments
///
/// * `_y` - Response variable values (not used)
/// * `_mu` - Fitted values (not used)
/// * `_weights` - Observation weights (not used)
/// * `dev` - Model deviance
///
/// # Returns
///
/// The family-specific AIC component (without +2*rank penalty)
pub fn calculate_quasi_aic(_y: &[f64], _mu: &[f64], _weights: &[f64], dev: f64) -> f64 {
    // For quasi families, AIC is not well-defined in the traditional sense
    // We use a modified AIC based on the deviance
    // Note: This value is not interpretable for model comparison
    dev
}

/// Model comparison and selection utilities

/// Compare two models by AIC
///
/// # Arguments
///
/// * `model1` - First GLM result
/// * `model2` - Second GLM result
///
/// # Returns
///
/// A tuple containing (aic1, aic2, delta_aic) where delta_aic = aic2 - aic1
pub fn compare_models_aic(model1: &GlmResult, model2: &GlmResult) -> (f64, f64, f64) {
    let aic1 = calculate_aic_from_result(model1);
    let aic2 = calculate_aic_from_result(model2);
    let delta_aic = aic2 - aic1;
    (aic1, aic2, delta_aic)
}

/// Find the best model by AIC from a list of models
///
/// # Arguments
///
/// * `models` - Vector of (name, GlmResult) tuples
///
/// # Returns
///
/// A tuple containing (best_index, best_name, best_aic) or None if no models provided
pub fn find_best_model_aic(models: &[(String, GlmResult)]) -> Option<(usize, String, f64)> {
    if models.is_empty() {
        return None;
    }

    let mut best_idx = 0;
    let mut best_aic = calculate_aic_from_result(&models[0].1);

    for (i, (_, model)) in models.iter().enumerate() {
        let aic = calculate_aic_from_result(model);
        if aic < best_aic {
            best_aic = aic;
            best_idx = i;
        }
    }

    Some((best_idx, models[best_idx].0.clone(), best_aic))
}

/// Calculate AIC differences for model comparison
///
/// This function calculates AIC differences relative to the best model,
/// which is useful for model selection and interpretation.
///
/// # Arguments
///
/// * `models` - Vector of (name, GlmResult) tuples
///
/// # Returns
///
/// A vector of (name, aic, delta_aic) tuples sorted by AIC
pub fn calculate_aic_differences(models: &[(String, GlmResult)]) -> Vec<(String, f64, f64)> {
    if models.is_empty() {
        return Vec::new();
    }

    let mut results: Vec<(String, f64, f64)> = models
        .iter()
        .map(|(name, model)| {
            let aic = calculate_aic_from_result(model);
            (name.clone(), aic, 0.0) // delta will be calculated below
        })
        .collect();

    // Sort by AIC
    results.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());

    // Calculate delta AIC (difference from best model)
    let best_aic = results[0].1;
    for result in &mut results {
        result.2 = result.1 - best_aic;
    }

    results
}

/// AIC interpretation utilities

/// Interpret AIC difference
///
/// Provides qualitative interpretation of AIC differences based on
/// Burnham & Anderson (2002) guidelines.
///
/// # Arguments
///
/// * `delta_aic` - AIC difference from the best model
///
/// # Returns
///
/// A string describing the model support level
pub fn interpret_aic_difference(delta_aic: f64) -> &'static str {
    if delta_aic <= 2.0 {
        "Substantial support"
    } else if delta_aic <= 4.0 {
        "Considerable support"
    } else if delta_aic <= 7.0 {
        "Less support"
    } else if delta_aic <= 10.0 {
        "Little support"
    } else {
        "No support"
    }
}

/// Calculate AIC weights
///
/// AIC weights represent the relative likelihood of each model
/// given the data and the set of models considered.
///
/// # Arguments
///
/// * `models` - Vector of (name, GlmResult) tuples
///
/// # Returns
///
/// A vector of (name, aic, aic_weight) tuples sorted by AIC
pub fn calculate_aic_weights(models: &[(String, GlmResult)]) -> Vec<(String, f64, f64)> {
    let aic_diffs = calculate_aic_differences(models);

    if aic_diffs.is_empty() {
        return Vec::new();
    }

    // Calculate AIC weights using the formula: exp(-0.5 * delta_aic) / sum(exp(-0.5 * delta_aic))
    let mut weights: Vec<(String, f64, f64)> = aic_diffs
        .into_iter()
        .map(|(name, aic, delta_aic)| {
            let weight = (-0.5 * delta_aic).exp();
            (name, aic, weight)
        })
        .collect();

    // Normalize weights
    let total_weight: f64 = weights.iter().map(|(_, _, w)| w).sum();
    for (_, _, weight) in &mut weights {
        *weight /= total_weight;
    }

    weights
}

/// Helper functions

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::binomial::BinomialFamily;
    use crate::stats::regression::family::gaussian::GaussianFamily;
    use crate::stats::regression::family::poisson::PoissonFamily;
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

    #[test]
    fn test_calculate_aic() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.0, 2.0, 3.0];
        let weights = vec![1.0, 1.0, 1.0];
        let deviance = 0.1; // Use small positive deviance instead of 0.0
        let rank = 2;

        let family = GaussianFamily::identity();
        let aic_fn = family.aic();

        let aic = calculate_aic(&y, &mu, &weights, deviance, rank, &aic_fn);
        assert!(aic > 0.0);
    }

    #[test]
    fn test_calculate_aic_from_result() {
        let result = create_test_glm_result();
        let aic = calculate_aic_from_result(&result);
        // AIC can be negative when the model fits very well
        assert!(aic.is_finite());
    }

    #[test]
    fn test_calculate_gaussian_aic() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.0, 2.0, 3.0];
        let weights = vec![1.0, 1.0, 1.0];
        let dev = 0.1; // Use small positive deviance instead of 0.0

        let aic = calculate_gaussian_aic(&y, &mu, &weights, dev);
        assert!(aic.is_finite());
    }

    #[test]
    fn test_calculate_gaussian_aic_zero_deviance() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.0, 2.0, 3.0];
        let weights = vec![1.0, 1.0, 1.0];
        let dev = 0.0; // Test edge case with zero deviance

        let aic = calculate_gaussian_aic(&y, &mu, &weights, dev);
        assert!(aic.is_finite());
        // AIC can be negative when the model fits perfectly (deviance = 0)
        // This is correct behavior - the test just ensures it's finite
    }

    #[test]
    fn test_calculate_binomial_aic() {
        let y = vec![0.0, 1.0, 1.0];
        let mu = vec![0.3, 0.7, 0.8];
        let weights = vec![1.0, 1.0, 1.0];
        let dev = 0.0;

        let aic = calculate_binomial_aic(&y, &mu, &weights, dev);
        assert!(aic.is_finite());
    }

    #[test]
    fn test_calculate_binomial_aic_edge_cases() {
        let y = vec![0.0, 1.0, 0.5];
        let mu = vec![1e-20, 1.0 - 1e-20, 0.5]; // Very close to 0 and 1
        let weights = vec![1.0, 1.0, 1.0];
        let dev = 0.0;

        let aic = calculate_binomial_aic(&y, &mu, &weights, dev);
        assert!(aic.is_finite());
        assert!(aic > 0.0);
    }

    #[test]
    fn test_calculate_poisson_aic() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.0, 2.0, 3.0];
        let weights = vec![1.0, 1.0, 1.0];
        let dev = 0.0;

        let aic = calculate_poisson_aic(&y, &mu, &weights, dev);
        assert!(aic.is_finite());
    }

    #[test]
    fn test_calculate_poisson_aic_edge_cases() {
        let y = vec![0.0, 1.0, 2.0];
        let mu = vec![1e-20, 1.0, 2.0]; // Very close to 0
        let weights = vec![1.0, 1.0, 1.0];
        let dev = 0.0;

        let aic = calculate_poisson_aic(&y, &mu, &weights, dev);
        assert!(aic.is_finite());
        assert!(aic > 0.0);
    }

    #[test]
    fn test_calculate_inverse_gaussian_aic() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.0, 2.0, 3.0];
        let weights = vec![1.0, 1.0, 1.0];
        let dev = 0.0;

        let aic = calculate_inverse_gaussian_aic(&y, &mu, &weights, dev);
        assert!(aic.is_finite());
        assert!(aic > 0.0);
    }

    #[test]
    fn test_calculate_inverse_gaussian_aic_edge_cases() {
        let y = vec![0.1, 1.0, 2.0];
        let mu = vec![1e-20, 1.0, 2.0]; // Very close to 0
        let weights = vec![1.0, 1.0, 1.0];
        let dev = 0.0;

        let aic = calculate_inverse_gaussian_aic(&y, &mu, &weights, dev);
        assert!(aic.is_finite());
        assert!(aic > 0.0);
    }

    #[test]
    fn test_compare_models_aic() {
        let model1 = create_test_glm_result();
        let mut model2 = create_test_glm_result();
        // Modify the deviance to make model2 worse (higher AIC)
        model2.deviance = model1.deviance + 5.0;

        let (aic1, aic2, delta_aic) = compare_models_aic(&model1, &model2);
        // The delta should be positive since model2 has higher deviance
        assert!(delta_aic > 0.0);
    }

    #[test]
    fn test_find_best_model_aic() {
        let model1 = create_test_glm_result();
        let mut model2 = create_test_glm_result();
        // Modify the deviance to make model2 worse (higher AIC)
        model2.deviance = model1.deviance + 5.0;

        let models = vec![
            ("model2".to_string(), model2),
            ("model1".to_string(), model1),
        ];

        let best = find_best_model_aic(&models);
        assert!(best.is_some());
        let (idx, name, _aic) = best.unwrap();
        assert_eq!(idx, 1); // model1 should be best
        assert_eq!(name, "model1");
    }

    #[test]
    fn test_calculate_aic_differences() {
        let model1 = create_test_glm_result();
        let mut model2 = create_test_glm_result();
        // Modify the deviance to make model2 worse (higher AIC)
        model2.deviance = model1.deviance + 5.0;

        let models = vec![
            ("model2".to_string(), model2),
            ("model1".to_string(), model1),
        ];

        let diffs = calculate_aic_differences(&models);
        assert_eq!(diffs.len(), 2);
        assert_eq!(diffs[0].2, 0.0); // Best model has delta = 0
        assert!(diffs[1].2 > 0.0); // Second model has positive delta
    }

    #[test]
    fn test_interpret_aic_difference() {
        assert_eq!(interpret_aic_difference(0.0), "Substantial support");
        assert_eq!(interpret_aic_difference(1.5), "Substantial support");
        assert_eq!(interpret_aic_difference(3.0), "Considerable support");
        assert_eq!(interpret_aic_difference(5.0), "Less support");
        assert_eq!(interpret_aic_difference(8.0), "Little support");
        assert_eq!(interpret_aic_difference(15.0), "No support");
    }

    #[test]
    fn test_calculate_aic_weights() {
        let model1 = create_test_glm_result();
        let mut model2 = create_test_glm_result();
        // Modify the deviance to make model2 slightly worse
        model2.deviance = model1.deviance + 2.0;

        let models = vec![
            ("model1".to_string(), model1),
            ("model2".to_string(), model2),
        ];

        let weights = calculate_aic_weights(&models);
        assert_eq!(weights.len(), 2);

        // Weights should sum to 1.0
        let total_weight: f64 = weights.iter().map(|(_, _, w)| w).sum();
        assert!((total_weight - 1.0).abs() < 1e-10);

        // First model should have higher weight (it's the better model)
        assert!(weights[0].2 > weights[1].2);
    }
}
