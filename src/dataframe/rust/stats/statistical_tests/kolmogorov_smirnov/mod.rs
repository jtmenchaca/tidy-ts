//! Kolmogorov-Smirnov test module
//!
//! Provides functionality for comparing distributions using the 
//! Kolmogorov-Smirnov test, which is a non-parametric test of the
//! equality of continuous probability distributions.

pub mod kolmogorov_smirnov;

#[cfg(feature = "wasm")]
pub mod wasm;

pub use kolmogorov_smirnov::{
    kolmogorov_smirnov_test, 
    kolmogorov_smirnov_one_sample
};