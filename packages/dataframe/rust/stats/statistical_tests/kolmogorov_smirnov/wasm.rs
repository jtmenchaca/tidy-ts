//! WASM bindings for Kolmogorov-Smirnov test

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::kolmogorov_smirnov::{kolmogorov_smirnov_test, kolmogorov_smirnov_one_sample};
use crate::stats::distributions::normal::pnorm;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// WASM export for two-sample Kolmogorov-Smirnov test
#[cfg(feature = "wasm")]
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
#[cfg(feature = "wasm")]
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

/// WASM export for one-sample Kolmogorov-Smirnov test against normal distribution.
///
/// Mirrors R's `ks.test(x, "pnorm", mean, sd)`. When `mean` / `sd` are not given,
/// defaults to the standard normal — R does the same for plain `ks.test(x, "pnorm")`.
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn kolmogorov_smirnov_normal_wasm(
    x: &[f64],
    mean: f64,
    sd: f64,
    alternative: &str,
    alpha: f64,
) -> Result<JsValue, JsValue> {
    let normal_cdf = move |value: f64| -> f64 { pnorm(value, mean, sd, true, false) };
    let result = kolmogorov_smirnov_one_sample(x, normal_cdf, alternative, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// --- NAPI-RS exports ---

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

#[cfg(feature = "napi-rs")]
#[napi]
pub fn kolmogorov_smirnov_test_napi(
    x: &[f64],
    y: &[f64],
    alternative: String,
    alpha: f64,
) -> Result<String, napi::Error> {
    let result = kolmogorov_smirnov_test(x, y, &alternative, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn kolmogorov_smirnov_uniform_napi(
    x: &[f64],
    min: f64,
    max: f64,
    alternative: String,
    alpha: f64,
) -> Result<String, napi::Error> {
    let uniform_cdf = move |value: f64| -> f64 {
        if value < min {
            0.0
        } else if value > max {
            1.0
        } else {
            (value - min) / (max - min)
        }
    };

    let result = kolmogorov_smirnov_one_sample(x, uniform_cdf, &alternative, alpha)
        .map_err(|e| napi::Error::from_reason(e))?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn kolmogorov_smirnov_normal_napi(
    x: &[f64],
    mean: f64,
    sd: f64,
    alternative: String,
    alpha: f64,
) -> Result<String, napi::Error> {
    let normal_cdf = move |value: f64| -> f64 { pnorm(value, mean, sd, true, false) };
    let result = kolmogorov_smirnov_one_sample(x, normal_cdf, &alternative, alpha)
        .map_err(napi::Error::from_reason)?;
    serde_json::to_string(&result)
        .map_err(|e| napi::Error::from_reason(e.to_string()))
}
