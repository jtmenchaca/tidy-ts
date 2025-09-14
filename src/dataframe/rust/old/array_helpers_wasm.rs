//! WASM bindings for array helper functions

use wasm_bindgen::prelude::*;
use crate::data_manipulation::array_helpers;

#[wasm_bindgen]
pub fn unique_f64(values: &[f64]) -> Vec<f64> {
    // Convert f64 to i64 for uniqueness (handles NaN properly)
    let int_values: Vec<i64> = values.iter()
        .map(|&v| v.to_bits() as i64)
        .collect();
    
    let unique_ints = array_helpers::unique(&int_values);
    
    unique_ints.iter()
        .map(|&v| f64::from_bits(v as u64))
        .collect()
}

#[wasm_bindgen]
pub fn unique_i32(values: &[i32]) -> Vec<i32> {
    array_helpers::unique(values)
}

#[wasm_bindgen]
pub fn unique_str(values: Vec<String>) -> Vec<String> {
    array_helpers::unique(&values)
}

#[wasm_bindgen]
pub fn count_f64(values: &[f64], target: f64) -> usize {
    array_helpers::count(values, &target)
}

#[wasm_bindgen]
pub fn count_i32(values: &[i32], target: i32) -> usize {
    array_helpers::count(values, &target)
}

#[wasm_bindgen]
pub fn count_str(values: Vec<String>, target: String) -> usize {
    array_helpers::count(&values, &target)
}

#[wasm_bindgen]
pub fn sum_wasm(values: &[f64]) -> f64 {
    array_helpers::sum_f64(values)
}

#[wasm_bindgen]
pub fn mean_wasm(values: &[f64], remove_na: bool) -> JsValue {
    match array_helpers::mean_f64(values, remove_na) {
        Some(mean) => JsValue::from_f64(mean),
        None => JsValue::NULL
    }
}

#[wasm_bindgen]
pub fn is_na_wasm(value: f64) -> bool {
    array_helpers::is_na_f64(value)
}