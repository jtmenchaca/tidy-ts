//! Count operations WASM exports

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn count_f64(values: &[f64], target: f64) -> usize {
    values.iter().filter(|&&v| v == target).count()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn count_i32(values: &[i32], target: i32) -> usize {
    values.iter().filter(|&&v| v == target).count()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn count_str(values: Vec<String>, target: String) -> usize {
    values.iter().filter(|v| **v == target).count()
}
