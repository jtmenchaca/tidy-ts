//! # Tests of Proportion
//!
//! The `proportion` module provides functions for performing proportion tests.
//!
//! Proportion tests are used to determine if there is a significant difference
//! between the proportions of two groups or to test a single proportion against a known value.
//!

pub mod one_sample;
pub mod sample_size;
pub mod two_sample;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
pub mod wasm;

pub use one_sample::z_test;
pub use sample_size::prop_sample_size;
pub use two_sample::z_test_ind;
