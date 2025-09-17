//! GLM IRLS (Iteratively Reweighted Least Squares) algorithm - modularized
//!
//! This file coordinates the modularized GLM IRLS components.

// Module declarations

// Re-export main functions from the core module
pub use super::glm_fit_irls_core::{IrlsResult, run_irls_iteration};