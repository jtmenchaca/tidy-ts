//! Sum calculation WASM exports

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Sum calculation for f64 values
#[allow(dead_code)]
fn sum_f64(values: &[f64]) -> f64 {
    values.iter().sum()
}

/// Sum calculation for f64 values
#[allow(dead_code)]
fn mean_f64(values: &[f64]) -> f64 {
    values.iter().sum::<f64>() / values.len() as f64
}

/// WASM export for sum calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn sum_wasm(values: &[f64]) -> f64 {
    sum_f64(values)
}

/// WASM export for mean calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn mean_wasm(values: &[f64]) -> f64 {
    mean_f64(values)
}
