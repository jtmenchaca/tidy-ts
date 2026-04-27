//! WASM bindings for target trial emulation.
//!
//! Single entry point: `target_trial_wasm()`.
//! TypeScript sends JSON config + data, Rust runs the full pipeline,
//! returns JSON result.

#![cfg(any(feature = "wasm", feature = "napi-rs"))]

use super::pipeline::target_trial_emulation;
use super::types::{ColumnarData, TargetTrialConfig};
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "wasm")]
use web_sys::console;

#[cfg(feature = "napi-rs")]
use napi_derive::napi;

/// WASM export for target trial emulation.
///
/// Runs the full pipeline in Rust: expand → weights → model → survival → hazard → bootstrap.
///
/// # Arguments
/// * `config_json` - JSON string containing `TargetTrialConfig`
/// * `data_json` - JSON string containing `ColumnarData` (numeric + categorical columns)
///
/// # Returns
/// JsValue containing the `TargetTrialResult`
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn target_trial_wasm(
    config_json: &str,
    data_json: &str,
) -> Result<JsValue, JsValue> {
    // Parse config
    let config: TargetTrialConfig = serde_json::from_str(config_json)
        .map_err(|e| {
            let msg = format!("Failed to parse config JSON: {}", e);
            console::log_1(&msg.clone().into());
            JsValue::from_str(&msg)
        })?;

    // Parse data
    let data: ColumnarData = serde_json::from_str(data_json)
        .map_err(|e| {
            let msg = format!("Failed to parse data JSON: {}", e);
            console::log_1(&msg.clone().into());
            JsValue::from_str(&msg)
        })?;

    // Run pipeline
    let result = target_trial_emulation(&data, &config)
        .map_err(|e| {
            let msg = format!("Target trial emulation error: {}", e);
            console::log_1(&msg.clone().into());
            JsValue::from_str(&msg)
        })?;

    // Serialize result
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| {
            let msg = format!("Failed to serialize result: {}", e);
            console::log_1(&msg.clone().into());
            JsValue::from_str(&msg)
        })
}

/// NAPI export for target trial emulation.
///
/// Runs the full pipeline in Rust: expand → weights → model → survival → hazard → bootstrap.
///
/// # Arguments
/// * `config_json` - JSON string containing `TargetTrialConfig`
/// * `data_json` - JSON string containing `ColumnarData` (numeric + categorical columns)
///
/// # Returns
/// JSON string containing the `TargetTrialResult`
#[cfg(feature = "napi-rs")]
#[napi]
pub fn target_trial_napi(
    config_json: String,
    data_json: String,
) -> Result<String, napi::Error> {
    // Parse config
    let config: TargetTrialConfig = serde_json::from_str(&config_json)
        .map_err(|e| {
            let msg = format!("Failed to parse config JSON: {}", e);
            eprintln!("{}", msg);
            napi::Error::from_reason(msg)
        })?;

    // Parse data
    let data: ColumnarData = serde_json::from_str(&data_json)
        .map_err(|e| {
            let msg = format!("Failed to parse data JSON: {}", e);
            eprintln!("{}", msg);
            napi::Error::from_reason(msg)
        })?;

    // Run pipeline
    let result = target_trial_emulation(&data, &config)
        .map_err(|e| {
            let msg = format!("Target trial emulation error: {}", e);
            eprintln!("{}", msg);
            napi::Error::from_reason(msg)
        })?;

    // Serialize result
    serde_json::to_string(&result)
        .map_err(|e| {
            let msg = format!("Failed to serialize result: {}", e);
            eprintln!("{}", msg);
            napi::Error::from_reason(msg)
        })
}
