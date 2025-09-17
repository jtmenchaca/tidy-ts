//! GLM fit utility linear functions
//!
//! This file contains linear predictor and step halving functions.

/// Calculate linear predictor from coefficients
///
/// This function calculates the linear predictor eta = X * beta + offset.
///
/// # Arguments
///
/// * `x` - Design matrix
/// * `coef` - Coefficient vector
/// * `offset` - Offset vector
///
/// # Returns
///
/// Vector of linear predictor values.
pub fn calculate_linear_predictor(x: &[Vec<f64>], coef: &[f64], offset: &[f64]) -> Vec<f64> {
    let p = coef.len();

    if p == 1 {
        offset
            .iter()
            .zip(coef.iter())
            .map(|(o, &c)| o + x[0][0] * c)
            .collect()
    } else {
        offset
            .iter()
            .enumerate()
            .map(|(i, &o)| {
                o + x[i]
                    .iter()
                    .zip(coef.iter())
                    .map(|(x_ij, &c_j)| x_ij * c_j)
                    .sum::<f64>()
            })
            .collect()
    }
}

/// Apply step halving to coefficients
///
/// This function applies step halving to correct for divergence or boundary issues.
///
/// # Arguments
///
/// * `old_coef` - Previous coefficient values
/// * `new_coef` - Current coefficient values
///
/// # Returns
///
/// Halved coefficient values.
pub fn apply_step_halving(old_coef: &[f64], new_coef: &[f64]) -> Vec<f64> {
    old_coef
        .iter()
        .zip(new_coef.iter())
        .map(|(old, new)| (old + new) / 2.0)
        .collect()
}
