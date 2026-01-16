//! Model utilities and extraction functions - modularized
//!
//! This module provides functionality equivalent to R's `model_utilities.R` functions,
//! including model component extraction, validation utilities, and helper functions
//! for statistical modeling.
//!
//! Key functions implemented:
//! - `model.weights()` - Extract model weights
//! - `model.offset()` - Extract model offset
//! - `model.response()` - Extract model response
//! - `model.extract()` - Generic model component extraction
//! - `is.empty.model()` - Check if model is empty
//! - `get_all_vars()` - Get all variables from formula

// Module declarations
pub mod model_utilities;

// Re-export everything from the model_utilities module for backward compatibility
pub use model_utilities::*;
