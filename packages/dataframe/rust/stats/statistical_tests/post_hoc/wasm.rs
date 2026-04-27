//! WASM bindings for post-hoc tests

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::{dunn_test, games_howell, tukey_hsd};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for Tukey HSD test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn tukey_hsd_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> Result<JsValue, JsValue> {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return Err(JsValue::from_str("Group sizes exceed data length"));
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let result = tukey_hsd(&groups, alpha);
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for Games-Howell test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn games_howell_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> Result<JsValue, JsValue> {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return Err(JsValue::from_str("Group sizes exceed data length"));
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let result = games_howell(&groups, alpha);
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for Dunn's test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn dunn_test_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> Result<JsValue, JsValue> {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return Err(JsValue::from_str("Group sizes exceed data length"));
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let result = dunn_test(&groups, alpha);
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn tukey_hsd_napi(data: &[f64], group_sizes: &[u32], alpha: f64) -> Result<String, napi::Error> {
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        let size = size as usize;
        if start + size > data.len() {
            return Err(napi::Error::from_reason("Group sizes exceed data length"));
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let result = tukey_hsd(&groups, alpha);
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn games_howell_napi(data: &[f64], group_sizes: &[u32], alpha: f64) -> Result<String, napi::Error> {
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        let size = size as usize;
        if start + size > data.len() {
            return Err(napi::Error::from_reason("Group sizes exceed data length"));
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let result = games_howell(&groups, alpha);
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn dunn_test_napi(data: &[f64], group_sizes: &[u32], alpha: f64) -> Result<String, napi::Error> {
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        let size = size as usize;
        if start + size > data.len() {
            return Err(napi::Error::from_reason("Group sizes exceed data length"));
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let result = dunn_test(&groups, alpha);
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
