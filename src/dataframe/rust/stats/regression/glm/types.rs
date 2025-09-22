//! Core types and structures for Generalized Linear Models (GLM) - modularized
//!
//! This module defines the fundamental data structures used throughout the GLM implementation,
//! including control parameters, fit results, and model specifications.
//!

// Re-export control types
pub use super::types_control::{GlmControl, GlmOptions};

// Re-export result types
pub use super::types_results::{CoefficientInfo, GlmResult, GlmSummary, QrResult};

// Re-export ANOVA types
pub use super::types_anova::{AnovaRow, GlmAnova};

// Re-export profile types
pub use super::types_profile::{GlmProfile, ParameterProfile};

// Re-export shared enum types
pub use crate::stats::regression::shared::{ResidualType, WeightType};
