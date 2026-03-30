//! WASM bindings for post-hoc tests

#![cfg(feature = "wasm")]

use super::{dunn_test, games_howell, tukey_hsd};
use wasm_bindgen::prelude::*;

/// WASM export for Tukey HSD test
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
