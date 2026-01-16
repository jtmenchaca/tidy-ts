//! Unified Model trait for regression models
//!
//! This provides a common interface that both GLM and GEE models can implement,
//! allowing shared utility functions to work with any model type.

use crate::stats::regression::family::GlmFamily;
use crate::stats::regression::model_utilities::ModelFrame;

/// Common interface for all regression models
pub trait Model {
    /// Get the model coefficients
    fn coefficients(&self) -> &[f64];

    /// Get the fitted values
    fn fitted_values(&self) -> &[f64];

    /// Get the residuals
    fn residuals(&self) -> &[f64];

    /// Get the deviance
    fn deviance(&self) -> f64;

    /// Get the AIC
    fn aic(&self) -> f64;

    /// Get the model rank
    fn rank(&self) -> usize;

    /// Get the family
    fn family(&self) -> &dyn GlmFamily;

    /// Get the formula
    fn formula(&self) -> Option<&str>;

    /// Get the call
    fn call(&self) -> Option<&str>;

    /// Get the model frame
    fn model_frame(&self) -> Option<&ModelFrame>;

    /// Get the response variable
    fn response(&self) -> &[f64];

    /// Get the prior weights
    fn prior_weights(&self) -> &[f64];

    /// Get the working weights
    fn working_weights(&self) -> &[f64];

    /// Get the linear predictors
    fn linear_predictors(&self) -> &[f64];

    /// Get the degrees of freedom for residuals
    fn df_residual(&self) -> usize;

    /// Get the degrees of freedom for null model
    fn df_null(&self) -> usize;

    /// Whether the model converged
    fn converged(&self) -> bool;

    /// Whether the model stopped at boundary
    fn boundary(&self) -> bool;

    /// Get the number of iterations
    fn iterations(&self) -> usize;

    /// Get the null deviance
    fn null_deviance(&self) -> f64;

    /// Get the offset
    fn offset(&self) -> Option<&[f64]>;

    /// Get the model name/type
    fn model_type(&self) -> &str;
}

/// Residual types
#[derive(Debug, Clone, PartialEq)]
pub enum ResidualType {
    Deviance,
    Pearson,
    Working,
    Response,
    Partial,
}

/// Weight types
#[derive(Debug, Clone, PartialEq)]
pub enum WeightType {
    Prior,
    Working,
}
