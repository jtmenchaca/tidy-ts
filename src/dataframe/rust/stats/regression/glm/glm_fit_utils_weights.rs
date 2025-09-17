//! GLM fit utility weight functions
//!
//! This file contains weight and response calculation functions.

/// Calculate working weights for GLM
///
/// This function calculates the working weights used in the IRLS algorithm.
///
/// # Arguments
///
/// * `weights` - Prior weights
/// * `mu_eta` - Derivative of link function
/// * `variance` - Variance function values
///
/// # Returns
///
/// Vector of working weights.
pub fn calculate_working_weights(weights: &[f64], mu_eta: &[f64], variance: &[f64]) -> Vec<f64> {
    weights
        .iter()
        .zip(mu_eta.iter())
        .zip(variance.iter())
        .map(|((&w, &mu_eta_i), &var_i)| {
            if w > 0.0 && mu_eta_i != 0.0 && var_i > 0.0 {
                (w * mu_eta_i * mu_eta_i / var_i).sqrt()
            } else {
                0.0
            }
        })
        .collect()
}

/// Calculate working response for GLM
///
/// This function calculates the working response used in the IRLS algorithm.
///
/// # Arguments
///
/// * `eta` - Linear predictor
/// * `offset` - Offset vector
/// * `y` - Response vector
/// * `mu` - Fitted values
/// * `mu_eta` - Derivative of link function
///
/// # Returns
///
/// Vector of working response values.
pub fn calculate_working_response(
    eta: &[f64],
    offset: &[f64],
    y: &[f64],
    mu: &[f64],
    mu_eta: &[f64],
) -> Vec<f64> {
    eta.iter()
        .zip(offset.iter())
        .zip(y.iter())
        .zip(mu.iter())
        .zip(mu_eta.iter())
        .map(|((((&eta_i, &offset_i), &y_i), &mu_i), &mu_eta_i)| {
            (eta_i - offset_i) + (y_i - mu_i) / mu_eta_i
        })
        .collect()
}

/// Check for valid observations
///
/// This function determines which observations are valid for fitting
/// based on weights and mu_eta values.
///
/// # Arguments
///
/// * `weights` - Prior weights
/// * `mu_eta` - Derivative of link function
///
/// # Returns
///
/// Boolean vector indicating valid observations.
pub fn get_valid_observations(weights: &[f64], mu_eta: &[f64]) -> Vec<bool> {
    weights
        .iter()
        .zip(mu_eta.iter())
        .map(|(&w, &mu_eta_i)| w > 0.0 && mu_eta_i != 0.0)
        .collect()
}
