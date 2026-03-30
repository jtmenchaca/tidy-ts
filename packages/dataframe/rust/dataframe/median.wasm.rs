//! Median calculation WASM exports

use super::quantile_core::quantile;
use super::shared_types::QuantileType;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Calculate median using Type 7 quantile
fn median(data: &[f64]) -> Result<f64, String> {
    let result = quantile(data, &[0.5], QuantileType::Type7)?;
    Ok(result[0])
}

/// WASM export for median calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn median_wasm(data: &[f64]) -> Result<f64, JsValue> {
    median(data).map_err(|e| JsValue::from_str(e.as_str()))
}
