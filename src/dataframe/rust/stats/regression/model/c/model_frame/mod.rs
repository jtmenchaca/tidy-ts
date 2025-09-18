//! Model frame construction and data validation - modularized
//!
//! This module provides functionality equivalent to R's `model.frame()` function,
//! which prepares and validates data for statistical modeling.
//!
//! The model frame contains all variables needed for model construction,
//! with proper handling of different data types, missing values, and subsets.

// Module declarations
pub mod model_frame_core;
#[cfg(test)]
pub mod model_frame_tests;
pub mod model_frame_types;

// Re-export main types
pub use model_frame_types::{ModelFrame, ModelFrameResult, NaAction, Variable};

// Re-export main functions
pub use model_frame_core::create_model_frame;
