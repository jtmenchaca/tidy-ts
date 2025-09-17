//! Sum calculation WASM exports

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Sum calculation for f64 values
#[allow(dead_code)]
fn sum_f64(values: &[f64]) -> f64 {
    values.iter().sum()
}

/// WASM export for sum calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn sum_wasm(values: &[f64]) -> f64 {
    sum_f64(values)
}