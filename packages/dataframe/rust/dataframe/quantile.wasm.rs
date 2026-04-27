//! Quantile calculation WASM exports

use super::quantile_core::quantile;
use super::shared_types::QuantileType;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

/// WASM export for general quantile calculation
/// Uses R's Type 7 algorithm (default)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn quantile_wasm(data: &[f64], probs: &[f64]) -> Result<Vec<f64>, JsValue> {
    quantile(data, probs, QuantileType::Type7).map_err(|e| JsValue::from_str(e.as_str()))
}

/// NAPI export for general quantile calculation
#[cfg(feature = "napi-rs")]
#[napi]
pub fn quantile_napi(data: &[f64], probs: &[f64]) -> Result<Vec<f64>, napi::Error> {
    quantile(data, probs, QuantileType::Type7).map_err(|e| napi::Error::from_reason(e.to_string()))
}
