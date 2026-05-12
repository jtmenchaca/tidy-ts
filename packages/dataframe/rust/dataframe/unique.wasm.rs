//! Unique values WASM exports

use hashbrown::HashSet;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;
#[cfg(feature = "napi-rs")]
use napi_derive::napi;

/// Generic unique function for any hashable type
pub(crate) fn unique<T: Eq + std::hash::Hash + Clone>(values: &[T]) -> Vec<T> {
    let mut seen = HashSet::with_capacity(values.len() / 2);
    let mut result = Vec::new();

    for value in values {
        if seen.insert(value) {
            result.push(value.clone());
        }
    }

    result
}

/// Fast unique for f64 values — works on bits directly to avoid intermediate Vec
fn unique_f64_impl(values: &[f64]) -> Vec<f64> {
    let mut seen = HashSet::with_capacity(values.len() / 2);
    let mut result = Vec::new();

    for &v in values {
        if seen.insert(v.to_bits()) {
            result.push(v);
        }
    }

    result
}

/// WASM export for unique f64 values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn unique_f64(values: &[f64]) -> Vec<f64> {
    unique_f64_impl(values)
}

/// NAPI export for unique f64 values
#[cfg(feature = "napi-rs")]
#[napi]
pub fn unique_f64_napi(values: &[f64]) -> Vec<f64> {
    unique_f64_impl(values)
}

/// Count unique f64 values without allocating result array
fn n_unique_f64_impl(values: &[f64]) -> u32 {
    let mut seen = HashSet::with_capacity(values.len() / 2);
    for &v in values {
        seen.insert(v.to_bits());
    }
    seen.len() as u32
}

/// WASM export for n_unique f64
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn n_unique_f64(values: &[f64]) -> u32 {
    n_unique_f64_impl(values)
}

/// NAPI export for n_unique f64
#[cfg(feature = "napi-rs")]
#[napi]
pub fn n_unique_f64_napi(values: &[f64]) -> u32 {
    n_unique_f64_impl(values)
}

/// WASM export for unique i32 values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn unique_i32(values: &[i32]) -> Vec<i32> {
    unique(values)
}

/// NAPI export for unique i32 values
#[cfg(feature = "napi-rs")]
#[napi]
pub fn unique_i32_napi(values: Vec<i32>) -> Vec<i32> {
    unique(&values)
}

/// WASM export for unique string values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn unique_str(values: Vec<String>) -> Vec<String> {
    unique(&values)
}

/// NAPI export for unique string values
#[cfg(feature = "napi-rs")]
#[napi]
pub fn unique_str_napi(values: Vec<String>) -> Vec<String> {
    unique(&values)
}