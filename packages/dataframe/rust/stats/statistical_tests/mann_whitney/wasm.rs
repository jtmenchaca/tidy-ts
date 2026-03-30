//! WASM bindings for Mann-Whitney U test

#![cfg(feature = "wasm")]

use super::mann_whitney_u::MannWhitneyConfig;
use wasm_bindgen::prelude::*;

/// WASM export for Mann-Whitney U test (automatically chooses exact vs asymptotic)
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
