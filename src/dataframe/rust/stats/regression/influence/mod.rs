//! Influence diagnostics for statistical models
//!
//! This module contains implementations of influence diagnostic functions.

// Core influence modules
pub mod influence_core;
pub mod influence_diagnostics;
pub mod influence_generic;
pub mod influence_measures;
pub mod influence_print;
pub mod influence_standardized;

// Re-export main functions
pub use influence_core::{
    hat, weighted_residuals, qr_influence, lm_influence, QrLsResult, LinearModel, InfluenceResult
};
pub use influence_diagnostics::{
    dffits, dfbeta, dfbetas, covratio, cooks_distance
};
pub use influence_standardized::{
    rstandard, rstudent
};
pub use influence_measures::{
    influence_measures, InfluenceMeasuresResult
};
pub use influence_generic::{
    influence, influence_lm, influence_glm, hatvalues, hatvalues_lm
};
