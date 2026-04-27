#[cfg(feature = "wasm")]
use super::levene_test;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM wrapper for Levene's test for equality of variances
///
/// Tests whether groups have equal variances using the Brown-Forsythe
/// modification (deviations from medians rather than means).
///
/// # Arguments
/// * `data` - Flattened array of all group data
/// * `group_sizes` - Array of group sizes
/// * `alpha` - Significance level
///
/// # Returns
/// * `Result<JsValue, JsValue>` - Serialized result or error
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn levene_test_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> Result<JsValue, JsValue> {
    // Validate alpha
    if !(0.0..=1.0).contains(&alpha) {
        return Err(JsValue::from_str("Alpha must be between 0 and 1"));
    }

    // Reconstruct groups from flat data (inline reconstruction like ANOVA)
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return Err(JsValue::from_str("Group sizes exceed data length"));
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    // Run Levene's test
    let result = levene_test(&groups, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use super::levene_test as levene_test_core;

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn levene_test_napi(data: &[f64], group_sizes: &[u32], alpha: f64) -> Result<String, napi::Error> {
    if !(0.0..=1.0).contains(&alpha) {
        return Err(napi::Error::from_reason("Alpha must be between 0 and 1"));
    }

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

    let result = levene_test_core(&groups, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
