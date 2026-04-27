//! WASM bindings for Kruskal-Wallis test

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::kruskal_wallis::kruskal_wallis_test;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for Kruskal-Wallis test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn kruskal_wallis_test_wasm(
    data: &[f64],
    group_sizes: &[usize],
    alpha: f64,
) -> Result<JsValue, JsValue> {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return Err(JsValue::from_str("Error: Group sizes exceed data length"));
        }
        groups.push(data[start..start + size].to_vec());
        start += size;
    }

    let result = kruskal_wallis_test(&groups, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn kruskal_wallis_test_napi(
    data: &[f64],
    group_sizes: &[u32],
    alpha: f64,
) -> Result<String, napi::Error> {
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        let size = size as usize;
        if start + size > data.len() {
            return Err(napi::Error::from_reason("Error: Group sizes exceed data length"));
        }
        groups.push(data[start..start + size].to_vec());
        start += size;
    }

    let result = kruskal_wallis_test(&groups, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
