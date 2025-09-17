//! High-level model construction API - modularized
//!
//! This module provides a fluent builder interface for constructing statistical models,
//! coordinating the formula parsing, model frame creation, and design matrix construction.
//!
//! The builder pattern makes it easy to create models step by step with clear,
//! readable code.

// Module declarations
pub mod builder_types;
pub mod builder_core;
pub mod builder_utils;

#[cfg(test)]
pub mod builder_tests;

// Re-export main types
pub use builder_types::ModelBuilder;

// Re-export main functions
pub use builder_utils::{
    quick_model_matrix, extract_response, extract_predictors, validate_model_matrix
};
