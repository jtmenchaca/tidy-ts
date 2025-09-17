//! Factor contrast coding for model matrices - modularized
//!
//! This module provides functionality equivalent to R's `contrasts()` function,
//! which creates contrast matrices for factor variables in statistical models.
//!
//! Contrasts determine how factor levels are encoded in the design matrix,
//! affecting the interpretation of model coefficients.

// Module declarations
pub mod contrasts_types;
pub mod contrasts_core;
pub mod contrasts_utils;
pub mod contrasts_tests;

// Re-export main types
pub use contrasts_types::{ContrastType, ContrastMatrix};

// Re-export main functions
pub use contrasts_core::create_contrasts;
pub use contrasts_utils::{
    apply_contrasts, get_contrast_names, get_level_names, get_contrast_dimensions,
    validate_contrast_matrix, contrast_matrix_to_2d, get_contrast_values_for_level,
    get_contrast_values_for_contrast
};
