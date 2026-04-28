//! Median calculation WASM exports

use super::quantile_core::{quantile, quantile_type7_select};
use super::shared_types::QuantileType;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

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

/// NAPI export: fast median using O(n) quickselect.
/// Skips NaN filter when data is all-finite.
#[cfg(feature = "napi-rs")]
#[napi]
pub fn median_napi(data: &[f64]) -> Result<f64, napi::Error> {
    if data.is_empty() {
        return Err(napi::Error::from_reason("Cannot calculate median of empty data"));
    }

    let all_finite = data.iter().all(|x| x.is_finite());
    let mut buf = if all_finite {
        data.to_vec()
    } else {
        data.iter().filter(|x| x.is_finite()).copied().collect::<Vec<f64>>()
    };

    if buf.is_empty() {
        return Err(napi::Error::from_reason("No finite values in data"));
    }

    Ok(quantile_type7_select(&mut buf, 0.5))
}
