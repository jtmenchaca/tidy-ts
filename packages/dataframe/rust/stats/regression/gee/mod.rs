//! Generalized Estimating Equations (GEE)
//!
//! This module extends GLM to handle clustered/longitudinal data with
//! working correlation structures and robust variance estimation.
//! It reuses the existing GLM pipeline for model parsing and IRLS.

pub mod control;
pub mod geeglm;
pub mod geese_fit;
pub mod model_impl;
pub mod types;

pub mod correlation;
pub mod utils;
pub mod variance;

#[cfg(feature = "wasm")]
pub mod wasm;

// Re-exports
pub use control::geese_control;
pub use geeglm::geeglm;
pub use types::{
    ClusterInfo, CorrelationStructure, GeeInfo, GeeParams, GeeglmResult, WorkingCorrelation,
};
pub use variance::vcov_geeglm;
