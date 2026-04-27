//! WASM bindings for Anderson-Darling test

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for Anderson-Darling normality test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn anderson_darling_test(x: &[f64], alpha: f64) -> Result<JsValue, JsValue> {
    use super::anderson_darling::AndersonDarlingTest;
    let result = AndersonDarlingTest::new(x, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn anderson_darling_test_napi(x: &[f64], alpha: f64) -> Result<String, napi::Error> {
    use super::anderson_darling::AndersonDarlingTest;
    let result = AndersonDarlingTest::new(x, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
