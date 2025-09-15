//! WASM bindings for Chi-square tests

#![cfg(feature = "wasm")]

use super::{categorical::independence, sample_size::chi2_sample_size_variance};
use crate::stats::core::TestResult;
use crate::stats::helpers::create_error_result;
use wasm_bindgen::prelude::*;

/// WASM export for chi-square test of independence
#[wasm_bindgen]
pub fn chi_square_independence(
    observed: &[f64],
    rows: usize,
    cols: usize,
    alpha: f64,
) -> TestResult {
    // Convert flattened data to 2D format
    if observed.len() != rows * cols {
        return create_error_result(
            "Chi-square Independence",
            "Observed data length must equal rows * cols",
        );
    }

    let mut data = Vec::new();
    for i in 0..rows {
        let start = i * cols;
        let end = start + cols;
        data.push(observed[start..end].to_vec());
    }

    independence(&data, alpha)
}

/// WASM export for chi-square sample size calculation
#[wasm_bindgen]
pub fn chi_square_sample_size_wasm(effect_size: f64, alpha: f64, power: f64, _df: usize) -> f64 {
    chi2_sample_size_variance(effect_size, alpha, power, 1.0) // Using variance=1.0 as default
}
