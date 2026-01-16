//! Helper functions for distribution calculations
//!
//! This module provides numerical utilities and helper functions used by
//! various distribution implementations for high-precision calculations.

pub mod bd0;
pub mod beta;
pub mod clamp_unit;
pub mod incomplete_beta;
pub mod incomplete_beta_continued_fraction;
pub mod log_gamma;
pub mod pow1p;
pub mod stirlerr;
pub mod validate_integer;

// Re-export commonly used helpers
pub use clamp_unit::clamp_unit;
pub use validate_integer::validate_integer;
