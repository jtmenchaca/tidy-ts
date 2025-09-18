//! Model matrix construction for statistical modeling - modularized
//!
//! This module provides functionality equivalent to R's `model.matrix()` function,
//! which creates design matrices from model frames and formulas.
//!
//! The design matrix is the core input for statistical modeling algorithms,
//! containing the predictor variables in a format suitable for matrix operations.

// Module declarations
pub mod model_matrix_core;
#[cfg(test)]
pub mod model_matrix_tests;
pub mod model_matrix_types;
pub mod model_matrix_utils;

// Re-export main types
pub use model_matrix_types::{ModelMatrix, ModelMatrixResult};

// Re-export main functions
pub use model_matrix_core::create_model_matrix;
pub use model_matrix_utils::{get_column, get_columns, get_matrix_2d};
