//! GLM fit function - modularized
//!
//! This file coordinates the modularized GLM fitting components.

// Re-export the main function from the core module
pub use super::glm_fit_core::glm_fit;

// Re-export utility functions
pub use super::glm_fit_utils::{
    apply_step_halving, calculate_linear_predictor, calculate_working_response,
    calculate_working_weights, get_valid_observations, solve_weighted_ls,
};

// Re-export IRLS functions
pub use super::glm_fit_irls::{IrlsResult, run_irls_iteration};
