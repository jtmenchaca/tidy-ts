//! Count operations WASM/NAPI exports

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

// Pure Rust core functions
fn count_f64_core(values: &[f64], target: f64) -> usize {
    values.iter().filter(|&&v| v == target).count()
}

fn count_i32_core(values: &[i32], target: i32) -> usize {
    values.iter().filter(|&&v| v == target).count()
}

fn count_str_core(values: &[String], target: &str) -> usize {
    values.iter().filter(|v| v.as_str() == target).count()
}

// WASM exports
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn count_f64(values: &[f64], target: f64) -> usize {
    count_f64_core(values, target)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn count_i32(values: &[i32], target: i32) -> usize {
    count_i32_core(values, target)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn count_str(values: Vec<String>, target: String) -> usize {
    count_str_core(&values, &target)
}

// NAPI exports
#[cfg(feature = "napi-rs")]
#[napi]
pub fn count_f64_napi(values: &[f64], target: f64) -> u32 {
    count_f64_core(values, target) as u32
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn count_i32_napi(values: Vec<i32>, target: i32) -> u32 {
    count_i32_core(&values, target) as u32
}

#[cfg(feature = "napi-rs")]
#[napi]
pub fn count_str_napi(values: Vec<String>, target: String) -> u32 {
    count_str_core(&values, &target) as u32
}
