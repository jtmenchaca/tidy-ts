//! String manipulation functions for tidy-data
//!
//! This module provides Rust implementations of common string operations,
//! similar to R's stringr package functionality.

pub mod detect;
pub mod extract;
pub mod length;
pub mod replace;
pub mod split;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
pub mod wasm;

// Re-export main functionality
pub use self::detect::*;
pub use self::extract::*;
pub use self::length::*;
pub use self::replace::*;
pub use self::split::*;