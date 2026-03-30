//! WASM bindings for Anderson-Darling test

#![cfg(feature = "wasm")]

use wasm_bindgen::prelude::*;

/// WASM export for Anderson-Darling normality test
#[wasm_bindgen]
pub fn anderson_darling_test(x: &[f64], alpha: f64) -> Result<JsValue, JsValue> {
    use super::anderson_darling::AndersonDarlingTest;
    let result = AndersonDarlingTest::new(x, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
