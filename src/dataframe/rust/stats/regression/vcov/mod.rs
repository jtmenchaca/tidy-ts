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
pub mod vcov_types;
pub mod vcov_core;
pub mod vcov_sigma;
pub mod vcov_tests;

// Re-export main types
pub use vcov_types::{
    VcovObject, SigmaObject, DevianceObject, NobsObject, CoefObject,
    LmObject, QrResult, LmSummary, CoefficientSummary, FStatistic,
    GlmObject, GlmSummary, MlmObject, MlmSummary
};

// Re-export main functions
pub use vcov_core::{
    vcov, vcov_aliased, vcov_lm, vcov_glm, vcov_mlm, 
    vcov_summary_lm, vcov_summary_glm
};
pub use vcov_sigma::{
    sigma, sigma_default, sigma_mlm, sigma_glm
};
