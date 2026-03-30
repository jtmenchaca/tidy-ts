//! WASM bindings for Fisher's exact test

#![cfg(feature = "wasm")]

use super::fishers_exact::fishers_exact_test;
use wasm_bindgen::prelude::*;

/// WASM export for Fisher's exact test
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
