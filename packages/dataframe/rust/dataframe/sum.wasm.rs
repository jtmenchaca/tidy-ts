//! Sum calculation WASM/NAPI exports

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

/// Sum calculation for f64 values
pub(crate) fn sum_f64(values: &[f64]) -> f64 {
    values.iter().sum()
}

/// Mean calculation for f64 values
pub(crate) fn mean_f64(values: &[f64]) -> f64 {
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

/// NAPI export for sum calculation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn sum_napi(values: &[f64]) -> f64 {
    sum_f64(values)
}

/// NAPI export for mean calculation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn mean_napi(values: &[f64]) -> f64 {
    mean_f64(values)
}
