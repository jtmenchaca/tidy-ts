//! Generalized Linear Models (GLM)
//!
//! This module contains implementations of GLM functions.
//! The functions have been modularized for better organization and use
//! shared components from the regression/shared module.
//!
//! ## Structure
//!
//! The module is organized to match the R file structure exactly:
//! - `glm_control.rs` - glm.control() function
//! - `glm_fit.rs` - glm.fit() function  
//! - `glm_main.rs` - Main glm() function
//! - `glm_utils.rs` - Utility functions (uses shared utilities)
//! - `types.rs` - Core types and structures

// Core GLM modules (in dependency order) - public for internal use but not exported
pub mod glm_aic;
pub mod glm_control;
pub mod glm_diagnostics;
pub mod glm_fit_core;
pub mod serde_special_floats;
pub mod glm_fit_core_calculation;
pub mod glm_fit_core_initialization;
pub mod glm_fit_core_validation;
pub mod glm_fit_core_warnings;
pub mod glm_fit_irls_core;
pub mod glm_main_core;
pub mod qr_decomposition;
pub mod types;
pub mod types_anova;
pub mod types_control;
pub mod types_profile;
pub mod types_results;

// WASM bindings - ONLY export
#[cfg(feature = "wasm")]
pub mod wasm;
