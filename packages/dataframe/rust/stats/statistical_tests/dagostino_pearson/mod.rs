//! D'Agostino-Pearson K² test for normality

pub mod dagostino_pearson;

// WASM bindings (when compiled for WASM)
#[cfg(any(feature = "wasm", feature = "napi-rs"))]
pub mod wasm;

pub use dagostino_pearson::{DAgostinoPearsonTest, DAgostinoPearsonError};