//! WASM bindings for Wilcoxon tests

#![cfg(feature = "wasm")]

use wasm_bindgen::prelude::*;

/// WASM export for Wilcoxon W test (paired)
#[wasm_bindgen]
pub fn wilcoxon_w_test(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: &str,
) -> Result<JsValue, JsValue> {
    use super::wilcoxon_w::WilcoxonWTest;
    let result = WilcoxonWTest::paired(x, y, alpha, alternative)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
