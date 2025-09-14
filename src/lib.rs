//! Tidy-TS Dataframe: A Rust data manipulation library with WebAssembly
//!
//! This library provides high-performance data frame operations and statistical functions
//! compiled to WebAssembly for use in TypeScript/JavaScript applications.

#![deny(unsafe_op_in_unsafe_fn)] // 2024-edition safety convention

// Core dataframe module
#[path = "dataframe/rust/mod.rs"]
pub mod dataframe;

// Re-export the main dataframe module as the primary API
pub use dataframe::*;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

// WASM module for WebAssembly exports
#[cfg(feature = "wasm")]
pub mod wasm {
    // Re-export all dataframe WASM functions
    pub use crate::dataframe::*;
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn wasm_test() -> f64 {
    42.0
}
