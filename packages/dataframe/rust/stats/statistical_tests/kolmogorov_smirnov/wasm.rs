//! WASM bindings for Kolmogorov-Smirnov test

#![cfg(feature = "wasm")]

use super::kolmogorov_smirnov::{kolmogorov_smirnov_test, kolmogorov_smirnov_one_sample};
use wasm_bindgen::prelude::*;

/// WASM export for two-sample Kolmogorov-Smirnov test
#[wasm_bindgen]
pub fn kolmogorov_smirnov_test_wasm(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> Result<JsValue, JsValue> {
    let result = kolmogorov_smirnov_test(x, y, alternative, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// WASM export for one-sample Kolmogorov-Smirnov test against uniform distribution
#[wasm_bindgen]
pub fn kolmogorov_smirnov_uniform_wasm(
    x: &[f64],
    min: f64,
    max: f64,
    alternative: &str,
    alpha: f64,
) -> Result<JsValue, JsValue> {
    // Create uniform CDF function
    let uniform_cdf = move |value: f64| -> f64 {
        if value < min {
            0.0
        } else if value > max {
            1.0
        } else {
            (value - min) / (max - min)
        }
    };

    let result = kolmogorov_smirnov_one_sample(x, uniform_cdf, alternative, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
