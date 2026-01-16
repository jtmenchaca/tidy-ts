//! Mann-Whitney U test implementation

pub mod mann_whitney_u;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
pub mod wasm;

pub use mann_whitney_u::{MannWhitneyConfig, MannWhitneyUTest};
