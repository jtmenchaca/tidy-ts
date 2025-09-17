//! Unique values WASM exports

use std::collections::HashSet;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Generic unique function for any hashable type
#[allow(dead_code)]
fn unique<T: Eq + std::hash::Hash + Clone>(values: &[T]) -> Vec<T> {
    let mut seen = HashSet::new();
    let mut result = Vec::new();
    
    for value in values {
        if seen.insert(value) {
            result.push(value.clone());
        }
    }
    
    result
}

/// WASM export for unique f64 values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn unique_f64(values: &[f64]) -> Vec<f64> {
    // Convert f64 to i64 for uniqueness (handles NaN properly)
    let int_values: Vec<i64> = values.iter()
        .map(|&v| v.to_bits() as i64)
        .collect();
    
    let unique_ints = unique(&int_values);
    
    unique_ints.iter()
        .map(|&v| f64::from_bits(v as u64))
        .collect()
}

/// WASM export for unique i32 values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn unique_i32(values: &[i32]) -> Vec<i32> {
    unique(values)
}

/// WASM export for unique string values
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn unique_str(values: Vec<String>) -> Vec<String> {
    unique(&values)
}