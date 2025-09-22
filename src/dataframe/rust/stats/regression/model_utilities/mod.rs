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
pub mod model_utilities_types;
pub mod model_utilities_extractors;
pub mod model_utilities_validation;
#[cfg(test)]
pub mod model_utilities_tests;

// Re-export main types
pub use model_utilities_types::{
    ModelFrame, ModelObject, TermsObject, Variable, FactorInfo, OffsetInfo
};

// Re-export main functions
pub use model_utilities_extractors::{
    model_weights, model_offset, model_response, model_extract,
    get_all_vars, get_xlevels, make_predict_call, make_predict_call_default
};
pub use model_utilities_validation::{
    is_empty_model, validate_model_object, validate_terms_object, has_weights, has_offset, has_response,
    get_model_dimensions, get_nobs, get_nvars, get_variable_names, get_row_names,
    is_complete_model, get_model_summary
};
