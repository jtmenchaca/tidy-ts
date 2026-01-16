//! Shapiro-Wilk normality test

pub mod shapiro_wilk;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
pub mod wasm;

pub use shapiro_wilk::{ShapiroWilkTest, ShapiroWilkError, ShapiroWilkStatus};
// ShapiroWilk distribution is now in utilities::distributions::shapiro_wilk
pub use super::super::distributions::shapiro_wilk::ShapiroWilk;