//! WASM bindings for Shapiro-Wilk test

#![cfg(feature = "wasm")]

use wasm_bindgen::prelude::*;

/// WASM export for Shapiro-Wilk normality test
#[wasm_bindgen]
pub fn shapiro_wilk_test(x: &[f64], alpha: f64) -> Result<JsValue, JsValue> {
    use super::shapiro_wilk::ShapiroWilkTest;
    let result = ShapiroWilkTest::new(x, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
