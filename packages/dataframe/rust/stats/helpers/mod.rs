//! Helper functions for statistical tests and WASM bindings

#[cfg(feature = "wasm")]
pub mod wasm_helpers;

#[cfg(feature = "wasm")]
pub use wasm_helpers::*;
