//! Shared utilities for regression models
//!
//! This module provides a unified Model trait and utility functions that work
//! with both GLM and GEE models, allowing shared functionality without duplication.

pub mod formula_parser;
pub mod model_trait;
pub mod utils;
pub mod example;
pub mod test_unified;

// Re-export commonly used types
pub use model_trait::{Model, ResidualType, WeightType};
pub use utils::{
    ModelSummary, adj_r_squared, aic, bic, deviance, family, formula, log_likelihood, 
    model_frame, model_summary, print_summary, prior_weights, r_squared, weights, 
    working_weights
};
