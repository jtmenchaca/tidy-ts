//! Variance-covariance matrix functions for statistical models - modularized
//!
//! This module provides Rust implementations of R's vcov functions for extracting
//! variance-covariance matrices from fitted models and their summaries.
//!
//! ## Functions
//!
//! - `vcov()`: Generic function for extracting variance-covariance matrices
//! - `vcov_lm()`: Method for linear models
//! - `vcov_glm()`: Method for generalized linear models  
//! - `vcov_mlm()`: Method for multivariate linear models
//! - `vcov_summary_lm()`: Method for linear model summaries
//! - `vcov_summary_glm()`: Method for GLM summaries
//! - `sigma()`: Generic function for extracting residual standard deviation
//! - `sigma_default()`: Default sigma method
//! - `sigma_mlm()`: Sigma method for multivariate linear models
//! - `sigma_glm()`: Sigma method for GLM models

// Module declarations
pub mod vcov;

// Re-export everything from the vcov module for backward compatibility
pub use vcov::*;
