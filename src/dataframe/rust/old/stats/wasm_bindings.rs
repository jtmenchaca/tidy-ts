//! WASM bindings for statistical functions needed by dataframe

#![cfg(feature = "wasm")]

use crate::data_manipulation::stats::quantiles::{QuantileType, iqr, median, quantile};
use wasm_bindgen::prelude::*;

/// WASM export for median calculation
#[wasm_bindgen]
pub fn median_wasm(data: &[f64]) -> Result<f64, JsValue> {
    median(data).map_err(|e| JsValue::from_str(e.as_str()))
}

/// WASM export for interquartile range
#[wasm_bindgen]
pub fn iqr_wasm(data: &[f64]) -> Result<f64, JsValue> {
    iqr(data).map_err(|e| JsValue::from_str(e.as_str()))
}

/// WASM export for general quantile calculation
/// Uses R's Type 7 algorithm (default)
#[wasm_bindgen]
pub fn quantile_wasm(data: &[f64], probs: &[f64]) -> Result<Vec<f64>, JsValue> {
    quantile(data, probs, QuantileType::Type7).map_err(|e| JsValue::from_str(e.as_str()))
}