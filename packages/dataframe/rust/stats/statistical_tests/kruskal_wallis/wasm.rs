//! WASM bindings for Kruskal-Wallis test

#![cfg(feature = "wasm")]

use super::kruskal_wallis::kruskal_wallis_test;
use wasm_bindgen::prelude::*;

/// WASM export for Kruskal-Wallis test
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
