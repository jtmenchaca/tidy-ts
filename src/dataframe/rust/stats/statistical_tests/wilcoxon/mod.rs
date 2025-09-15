//! Wilcoxon signed-rank test

pub mod signed_rank;
pub mod wilcoxon_w;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
pub mod wasm;

pub use wilcoxon_w::WilcoxonWTest;