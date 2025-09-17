//! GLM main module - modularized
//!
//! This file coordinates the modularized GLM main components.

// Re-export main functions from the core module
pub use super::glm_main_core::glm;

// Re-export convenience functions
pub use super::glm_main_convenience::{glm_binomial, glm_gaussian, glm_poisson};
