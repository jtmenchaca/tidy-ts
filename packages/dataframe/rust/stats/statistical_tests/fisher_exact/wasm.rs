//! WASM bindings for Fisher's exact test

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::fishers_exact::fishers_exact_test;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for Fisher's exact test
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn fishers_exact_test_wasm(
    a: f64,
    b: f64,
    c: f64,
    d: f64,
    alternative: &str,
    odds_ratio: f64,
    alpha: f64,
) -> Result<JsValue, JsValue> {
    let table = vec![a, b, c, d];
    let result = fishers_exact_test(&table, alternative, odds_ratio, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn fishers_exact_test_napi(
    a: f64,
    b: f64,
    c: f64,
    d: f64,
    alternative: String,
    odds_ratio: f64,
    alpha: f64,
) -> Result<String, napi::Error> {
    let table = vec![a, b, c, d];
    let result = fishers_exact_test(&table, &alternative, odds_ratio, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
