//! WASM bindings for Wilcoxon tests

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for Wilcoxon W test (paired).
///
/// `exact` is `Option<bool>`: `None` for R's auto rule, `Some(true)`/`Some(false)`
/// to force a regime. `correct` is the continuity-correction toggle for the
/// asymptotic path (ignored when exact).
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wilcoxon_w_test(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: &str,
    exact: Option<bool>,
    correct: bool,
) -> Result<JsValue, JsValue> {
    use super::wilcoxon_w::WilcoxonWTest;
    let result = WilcoxonWTest::paired(x, y, alpha, alternative, exact, correct)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn wilcoxon_w_test_napi(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: String,
    exact: Option<bool>,
    correct: bool,
) -> Result<String, napi::Error> {
    use super::wilcoxon_w::WilcoxonWTest;
    let result = WilcoxonWTest::paired(x, y, alpha, &alternative, exact, correct)
        .map_err(napi::Error::from_reason)?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
