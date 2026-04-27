//! Anderson-Darling test for normality

pub mod anderson_darling;

// WASM bindings (when compiled for WASM)
#[cfg(any(feature = "wasm", feature = "napi-rs"))]
pub mod wasm;

pub use anderson_darling::{AndersonDarlingTest, AndersonDarlingError};