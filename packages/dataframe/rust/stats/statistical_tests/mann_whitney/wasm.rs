//! WASM bindings for Mann-Whitney U test

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::mann_whitney_u::MannWhitneyConfig;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for Mann-Whitney U test (automatically chooses exact vs asymptotic)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn mann_whitney_test(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: &str,
) -> Result<JsValue, JsValue> {
    use super::mann_whitney_u::MannWhitneyUTest;
    let result = MannWhitneyUTest::independent(x, y, alpha, alternative)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for Mann-Whitney U test with configuration
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn mann_whitney_test_with_config(
    x: &[f64],
    y: &[f64],
    exact: bool,
    continuity_correction: bool,
    alpha: f64,
    alternative: &str,
) -> Result<JsValue, JsValue> {
    use super::mann_whitney_u::MannWhitneyUTest;
    let config = MannWhitneyConfig {
        exact,
        continuity_correction,
        alternative: alternative.to_string(),
    };
    let result = MannWhitneyUTest::independent_with_config(x, y, config, alpha, alternative)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn mann_whitney_test_napi(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: String,
) -> Result<String, napi::Error> {
    use super::mann_whitney_u::MannWhitneyUTest;
    let result = MannWhitneyUTest::independent(x, y, alpha, &alternative)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn mann_whitney_test_with_config_napi(
    x: &[f64],
    y: &[f64],
    exact: bool,
    continuity_correction: bool,
    alpha: f64,
    alternative: String,
) -> Result<String, napi::Error> {
    use super::mann_whitney_u::MannWhitneyUTest;
    let config = MannWhitneyConfig {
        exact,
        continuity_correction,
        alternative: alternative.clone(),
    };
    let result = MannWhitneyUTest::independent_with_config(x, y, config, alpha, &alternative)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
