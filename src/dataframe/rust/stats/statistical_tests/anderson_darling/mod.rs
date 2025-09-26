//! Anderson-Darling test for normality

pub mod anderson_darling;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
pub mod wasm;

pub use anderson_darling::{AndersonDarlingTest, AndersonDarlingError};