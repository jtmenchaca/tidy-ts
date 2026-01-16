//! GLM fit validation functions
//!
//! This module contains validation logic for GLM fitting parameters.

use super::types::GlmControl;

/// Validates GLM control parameters
pub fn validate_control(control: &GlmControl) -> Result<(), String> {
    control.validate()
}

/// Validates weights vector
pub fn validate_weights(weights: &[f64], n: usize) -> Result<(), String> {
    if weights.len() != n {
        return Err("weights length must match number of observations".to_string());
    }
    if weights.iter().any(|&w| w < 0.0) {
        return Err("negative weights not allowed".to_string());
    }
    Ok(())
}

/// Validates offset vector
pub fn validate_offset(offset: &[f64], n: usize) -> Result<(), String> {
    if offset.len() != n {
        return Err("offset length must match number of observations".to_string());
    }
    Ok(())
}

/// Validates starting values
pub fn validate_start_values(start: &[f64], p: usize) -> Result<(), String> {
    if start.len() != p {
        return Err(format!(
            "length of 'start' should equal {} and correspond to initial coefs",
            p
        ));
    }
    Ok(())
}

/// Validates family starting values
pub fn validate_family_start_values(
    eta: &[f64],
    mu: &[f64],
    valideta: &dyn Fn(&[f64]) -> bool,
    validmu: &dyn Fn(&[f64]) -> bool,
) -> Result<(), String> {
    if !valideta(eta) || !validmu(mu) {
        return Err("cannot find valid starting values: please specify some".to_string());
    }
    Ok(())
}
