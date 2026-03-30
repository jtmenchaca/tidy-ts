//! Quantile calculation WASM exports

use super::quantile_core::quantile;
use super::shared_types::QuantileType;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for general quantile calculation
/// Uses R's Type 7 algorithm (default)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn quantile_wasm(data: &[f64], probs: &[f64]) -> Result<Vec<f64>, JsValue> {
    quantile(data, probs, QuantileType::Type7).map_err(|e| JsValue::from_str(e.as_str()))
}
