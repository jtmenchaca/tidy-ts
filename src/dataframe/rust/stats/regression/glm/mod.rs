//! Generalized Linear Models (GLM)
//!
//! This module contains implementations of GLM functions.
//! The functions have been modularized for better organization.
//!
//! ## Structure
//!
//! The module is organized to match the R file structure exactly:
//! - `glm_control.rs` - glm.control() function
//! - `glm_fit.rs` - glm.fit() function  
//! - `glm_main.rs` - Main glm() function
//! - `glm_print.rs` - print.glm() function
//! - `glm_anova.rs` - anova.glm() functions
//! - `glm_summary.rs` - summary.glm() function
//! - `glm_residuals.rs` - residuals.glm() function
//! - `glm_utils.rs` - Utility functions
//! - `glm_profile.rs` - profile.glm() function
//! - `glm_vr.rs` - Example/demo functions
//! - `index.rs` - Module organization and initialization
//! - `types.rs` - Core types and structures
//! - `glm.rs` - Main coordination file

// Core GLM modules (in dependency order)
pub mod glm_anova;
pub mod glm_anova_core;
pub mod glm_anova_core_multiple;
pub mod glm_anova_core_single;
pub mod glm_anova_core_tests;
pub mod glm_anova_format;
pub mod glm_anova_print;
pub mod glm_control;
pub mod glm_fit;
pub mod glm_fit_core;
pub mod glm_fit_core_calculation;
pub mod glm_fit_core_initialization;
pub mod glm_fit_core_validation;
pub mod glm_fit_core_warnings;
pub mod glm_fit_irls;
pub mod glm_fit_irls_core;
pub mod glm_fit_utils;
pub mod glm_fit_utils_linear;
pub mod glm_fit_utils_qr;
pub mod glm_fit_utils_tests;
pub mod glm_fit_utils_weights;
pub mod glm_main;
pub mod glm_main_convenience;
pub mod glm_main_core;
pub mod glm_main_tests;
pub mod glm_print;
pub mod glm_print_core;
pub mod glm_print_helpers;
pub mod glm_print_tests;
pub mod glm_residuals;
pub mod glm_summary;
pub mod glm_summary_core;
pub mod glm_summary_format;
pub mod glm_summary_print;
pub mod glm_utils;
pub mod glm_utils_extractors;
pub mod glm_utils_tests;
pub mod glm_utils_weights;

// Additional GLM modules
pub mod formula_parser;
pub mod formula_parser_core;
pub mod formula_parser_matrix;
pub mod formula_parser_model_frame;
pub mod formula_parser_tests;
pub mod glm_demo;
pub mod glm_profile;
pub mod glm_profile_core;
pub mod glm_profile_plot;
pub mod glm_profile_utils;
pub mod glm_vr;
pub mod glm_vr_data;
pub mod glm_vr_examples;
pub mod glm_vr_results;
pub mod glm_vr_tests;
pub mod index;
pub mod types;
pub mod types_anova;
pub mod types_control;
pub mod types_enums;
pub mod types_profile;
pub mod types_results;

// Re-export main functions for easy access
pub use glm_anova::{anova_glm, anova_glmlist, format_anova, print_anova};
pub use glm_control::glm_control;
pub use glm_fit::glm_fit;
pub use glm_main::{glm, glm_binomial, glm_gaussian, glm_poisson};
pub use glm_print::{format_glm, print_glm};
pub use glm_residuals::{
    residuals_glm, residuals_glm_deviance, residuals_glm_partial, residuals_glm_pearson,
    residuals_glm_response, residuals_glm_working,
};
pub use glm_summary::{format_summary_glm, print_summary_glm, summary_glm};
pub use glm_utils::{
    deviance_glm, effects_glm, family_glm, formula_glm, model_frame_glm, weights_glm,
    weights_glm_prior, weights_glm_working,
};

// Profile functions
pub use glm_profile::{pairs_profile, plot_profile, profile_glm};

// Example/demo functions
pub use glm_vr::{
    DetergentResults, FamilyComparisonResults, ModelSelectionResults, SimpleExampleResults,
    benchmark_data_creation, create_detergent_data, create_family_example_data,
    create_simple_example_data, demonstrate_capabilities, print_anova_comparison,
    print_correlation_matrix, print_detailed_model_summary, print_detergent_results,
    print_family_comparison_results, print_model_selection_results, print_simple_results,
    run_all_examples, run_all_tests, run_detergent_example, run_family_comparison_example,
    run_model_selection_example, run_simple_example,
};

// Module initialization
pub use index::{GlmModuleInfo, glm_info, init_glm};

// Re-export types
pub use types::{
    AnovaRow, CoefficientInfo, GlmAnova, GlmControl, GlmOptions, GlmProfile, GlmResult, GlmSummary,
    ParameterProfile, ResidualType, WeightType,
};
