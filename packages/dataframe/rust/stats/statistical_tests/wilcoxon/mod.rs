//! Wilcoxon signed-rank test

pub mod signed_rank;
pub mod wilcoxon_w;

// WASM bindings (when compiled for WASM)
#[cfg(any(feature = "wasm", feature = "napi-rs"))]
pub mod wasm;

pub use wilcoxon_w::WilcoxonWTest;