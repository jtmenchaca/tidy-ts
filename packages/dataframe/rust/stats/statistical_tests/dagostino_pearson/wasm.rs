//! WASM bindings for D'Agostino-Pearson K² test

#![cfg(feature = "wasm")]

use wasm_bindgen::prelude::*;

/// WASM export for D'Agostino-Pearson K² normality test
#[wasm_bindgen]
pub fn dagostino_pearson_test(x: &[f64], alpha: f64) -> Result<JsValue, JsValue> {
    use super::dagostino_pearson::DAgostinoPearsonTest;
    let result = DAgostinoPearsonTest::new(x, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
