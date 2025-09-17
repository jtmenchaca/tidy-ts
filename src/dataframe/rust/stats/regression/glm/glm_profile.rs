//! GLM profile module - modularized
//!
//! This file coordinates the modularized GLM profile components.

// Re-export main functions from the core module
pub use super::glm_profile_core::profile_glm;

// Re-export plot functions
pub use super::glm_profile_plot::{pairs_profile, plot_profile};

// Re-export utility functions
pub use super::glm_profile_utils::{
    calculate_linear_predictor, chi_square_quantile, create_reduced_design_matrix, f_quantile,
    get_coefficient_names, get_design_matrix,
};
