//! Generalized Estimating Equations (GEE)
//!
//! This module extends GLM to handle clustered/longitudinal data with
//! working correlation structures and robust variance estimation.
//! It reuses the existing GLM pipeline for model parsing and IRLS.

pub mod types;
pub mod control;
pub mod geese_fit;
pub mod geeglm;

pub mod correlation;
pub mod variance;
pub mod utils;

#[cfg(feature = "wasm")]
pub mod wasm;

// Re-exports
pub use control::geese_control;
pub use geeglm::geeglm;
pub use types::{CorrelationStructure, GeeglmResult, GeeInfo, GeeParams, ClusterInfo, WorkingCorrelation};
pub use variance::vcov_geeglm;
