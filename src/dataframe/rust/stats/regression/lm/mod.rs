//! Linear Models (lm)
//!
//! This module contains implementations of linear model functions.

// Core lm modules
pub mod lm_fit;
pub mod lm_fit_main;
pub mod lm_fit_weighted;
pub mod lm_qr;
pub mod lm_types;
pub mod lm_utils;
pub mod lm_print;
pub mod lm_summary;
pub mod lm_anova;
pub mod lm_tests;

// Additional modules
pub mod confint;
pub mod plot_lm;
pub mod predict;
pub mod lm_influence_modular;

// WASM bindings
#[cfg(feature = "wasm")]
pub mod wasm;

// Re-export main functions
pub use lm_fit::lm;
pub use lm_print::print_lm;
pub use lm_summary::summary_lm;
pub use lm_anova::anova_lm;
pub use confint::confint_lm;
pub use plot_lm::plot_lm;
pub use predict::predict;
