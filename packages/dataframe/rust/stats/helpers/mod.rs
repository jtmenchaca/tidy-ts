//! Helper functions for statistical tests and WASM bindings

#[cfg(any(feature = "wasm", feature = "napi-rs"))]
pub mod wasm_helpers;

#[cfg(any(feature = "wasm", feature = "napi-rs"))]
pub use wasm_helpers::*;
