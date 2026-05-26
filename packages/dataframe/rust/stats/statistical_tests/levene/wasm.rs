#[cfg(feature = "wasm")]
use super::levene_test::{LeveneCenter, levene_test};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Parse the JS-facing `center` string to a `LeveneCenter`. Defaults to median.
#[cfg(feature = "wasm")]
fn parse_center(center: &str) -> LeveneCenter {
    match center {
        "mean" => LeveneCenter::Mean,
        _ => LeveneCenter::Median, // "median" or any unknown → robust default
    }
}

/// WASM wrapper for Levene's test for equality of variances.
///
/// `center` selects the centering strategy:
/// - `"median"` (default) — Brown-Forsythe; matches R `leveneTest(center = median)`.
/// - `"mean"` — classical Levene; matches R `leveneTest(center = mean)`.
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn levene_test_wasm(
    data: &[f64],
    group_sizes: &[usize],
    alpha: f64,
    center: &str,
) -> Result<JsValue, JsValue> {
    if !(0.0..=1.0).contains(&alpha) {
        return Err(JsValue::from_str("Alpha must be between 0 and 1"));
    }

    let mut groups = Vec::new();
    let mut start = 0;
    for &size in group_sizes {
        if start + size > data.len() {
            return Err(JsValue::from_str("Group sizes exceed data length"));
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let result = levene_test(&groups, alpha, parse_center(center))
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use super::levene_test::{LeveneCenter as NapiLeveneCenter, levene_test as levene_test_core};

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
fn parse_center_napi(center: &str) -> NapiLeveneCenter {
    match center {
        "mean" => NapiLeveneCenter::Mean,
        _ => NapiLeveneCenter::Median,
    }
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn levene_test_napi(
    data: &[f64],
    group_sizes: &[u32],
    alpha: f64,
    center: String,
) -> Result<String, napi::Error> {
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

    let result = levene_test_core(&groups, alpha, parse_center_napi(&center))
        .map_err(napi::Error::from_reason)?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
