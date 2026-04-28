//! Quantile calculation WASM/NAPI exports

use super::quantile_core::{quantile, quantile_type7, quantile_type7_select};
use super::shared_types::QuantileType;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;
#[cfg(feature = "napi-rs")]
use rayon::prelude::*;

/// WASM export for general quantile calculation
/// Uses R's Type 7 algorithm (default)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn quantile_wasm(data: &[f64], probs: &[f64]) -> Result<Vec<f64>, JsValue> {
    quantile(data, probs, QuantileType::Type7).map_err(|e| JsValue::from_str(e.as_str()))
}

/// NAPI export: fast quantile with quickselect (single prob) or rayon par_sort (multi prob).
/// Skips NaN filter when data is all-finite (common for Float64Array from ColumnarStore).
#[cfg(feature = "napi-rs")]
#[napi]
pub fn quantile_napi(data: &[f64], probs: &[f64]) -> Result<Vec<f64>, napi::Error> {
    if data.is_empty() {
        return Err(napi::Error::from_reason("Cannot calculate quantiles of empty data"));
    }
    for &p in probs {
        if p < 0.0 || p > 1.0 {
            return Err(napi::Error::from_reason(format!("Probability {} is not in [0,1]", p)));
        }
    }

    // Check if all finite (fast scan, no allocation)
    let all_finite = data.iter().all(|x| x.is_finite());

    let mut buf = if all_finite {
        data.to_vec()
    } else {
        data.iter().filter(|x| x.is_finite()).copied().collect::<Vec<f64>>()
    };

    if buf.is_empty() {
        return Err(napi::Error::from_reason("No finite values in data"));
    }

    if probs.len() == 1 {
        // O(n) quickselect for single quantile
        Ok(vec![quantile_type7_select(&mut buf, probs[0])])
    } else {
        // Rayon parallel sort for multiple quantiles
        let n = buf.len() as f64;
        buf.par_sort_unstable_by(|a, b| a.partial_cmp(b).unwrap());
        Ok(probs.iter().map(|&p| quantile_type7(&buf, p, n)).collect())
    }
}
