//! WASM bindings for string operations
//!
//! This module provides WebAssembly exports for string manipulation functionality.

#![cfg(feature = "wasm")]

use wasm_bindgen::prelude::*;

// Import the pure Rust implementations
use super::{
    str_detect_vectorized, str_extract_all_vectorized, str_extract_vectorized,
    str_length_vectorized, str_replace_all_vectorized, str_replace_vectorized,
    str_split_fixed_vectorized, str_split_vectorized,
};

// ---------------------------------------------------------------------------
//                          String Detection
// ---------------------------------------------------------------------------

/// WASM export for string pattern detection
#[wasm_bindgen]
pub fn str_detect_wasm(strings: Vec<String>, pattern: &str, negate: bool) -> js_sys::Array {
    let results = str_detect_vectorized(&strings, pattern, negate);
    let array = js_sys::Array::new_with_length(results.len() as u32);

    for (i, result) in results.iter().enumerate() {
        array.set(i as u32, JsValue::from(*result));
    }

    array
}

// ---------------------------------------------------------------------------
//                          String Replacement
// ---------------------------------------------------------------------------

/// WASM export for string pattern replacement (first occurrence)
#[wasm_bindgen]
pub fn str_replace_wasm(strings: Vec<String>, pattern: &str, replacement: &str) -> Vec<String> {
    str_replace_vectorized(&strings, pattern, replacement)
}

/// WASM export for string pattern replacement (all occurrences)
#[wasm_bindgen]
pub fn str_replace_all_wasm(strings: Vec<String>, pattern: &str, replacement: &str) -> Vec<String> {
    str_replace_all_vectorized(&strings, pattern, replacement)
}

// ---------------------------------------------------------------------------
//                          String Extraction
// ---------------------------------------------------------------------------

/// Result type for string extraction operations
#[wasm_bindgen]
pub struct StringExtractResult {
    results: Vec<JsValue>,
}

#[wasm_bindgen]
impl StringExtractResult {
    #[wasm_bindgen(getter)]
    pub fn results(&self) -> Vec<JsValue> {
        self.results.clone()
    }
}

/// WASM export for string pattern extraction (first match)
#[wasm_bindgen]
pub fn str_extract_wasm(strings: Vec<String>, pattern: &str) -> StringExtractResult {
    let results = str_extract_vectorized(&strings, pattern);
    let js_results = results
        .into_iter()
        .map(|opt| match opt {
            Some(s) => JsValue::from_str(&s),
            None => JsValue::NULL,
        })
        .collect();

    StringExtractResult {
        results: js_results,
    }
}

/// WASM export for string pattern extraction (all matches)
#[wasm_bindgen]
pub fn str_extract_all_wasm(strings: Vec<String>, pattern: &str) -> js_sys::Array {
    let results = str_extract_all_vectorized(&strings, pattern);
    let outer_array = js_sys::Array::new_with_length(results.len() as u32);

    for (i, inner_vec) in results.iter().enumerate() {
        let inner_array = js_sys::Array::new_with_length(inner_vec.len() as u32);
        for (j, item) in inner_vec.iter().enumerate() {
            inner_array.set(j as u32, JsValue::from_str(item));
        }
        outer_array.set(i as u32, inner_array.into());
    }

    outer_array
}

// ---------------------------------------------------------------------------
//                          String Splitting
// ---------------------------------------------------------------------------

/// WASM export for string splitting
#[wasm_bindgen]
pub fn str_split_wasm(strings: Vec<String>, pattern: &str, n: Option<usize>) -> js_sys::Array {
    let results = str_split_vectorized(&strings, pattern, n);
    let outer_array = js_sys::Array::new_with_length(results.len() as u32);

    for (i, inner_vec) in results.iter().enumerate() {
        let inner_array = js_sys::Array::new_with_length(inner_vec.len() as u32);
        for (j, item) in inner_vec.iter().enumerate() {
            inner_array.set(j as u32, JsValue::from_str(item));
        }
        outer_array.set(i as u32, inner_array.into());
    }

    outer_array
}

/// WASM export for string splitting into fixed number of pieces
#[wasm_bindgen]
pub fn str_split_fixed_wasm(strings: Vec<String>, pattern: &str, n: usize) -> js_sys::Array {
    let results = str_split_fixed_vectorized(&strings, pattern, n);
    let outer_array = js_sys::Array::new_with_length(results.len() as u32);

    for (i, inner_vec) in results.iter().enumerate() {
        let inner_array = js_sys::Array::new_with_length(inner_vec.len() as u32);
        for (j, item) in inner_vec.iter().enumerate() {
            inner_array.set(j as u32, JsValue::from_str(item));
        }
        outer_array.set(i as u32, inner_array.into());
    }

    outer_array
}

// ---------------------------------------------------------------------------
//                          String Length
// ---------------------------------------------------------------------------

/// WASM export for string length calculation
#[wasm_bindgen]
pub fn str_length_wasm(strings: Vec<String>) -> Vec<usize> {
    str_length_vectorized(&strings)
}
