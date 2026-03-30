//! IQR calculation WASM exports

use super::quantile_core::quantile;
use super::shared_types::QuantileType;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Calculate quartiles (Q1, Q2, Q3) using Type 7
fn quartiles(data: &[f64]) -> Result<(f64, f64, f64), String> {
    let result = quantile(data, &[0.25, 0.5, 0.75], QuantileType::Type7)?;
    Ok((result[0], result[1], result[2]))
}

/// Calculate IQR (Q3 - Q1) using Type 7
fn iqr(data: &[f64]) -> Result<f64, String> {
    let (q1, _, q3) = quartiles(data)?;
    Ok(q3 - q1)
}

/// WASM export for IQR calculation
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn iqr_wasm(data: &[f64]) -> Result<f64, JsValue> {
    iqr(data).map_err(|e| JsValue::from_str(e.as_str()))
}
