//! Main GLM module
//!
//! This file contains the main GLM functionality.

// Re-export all GLM functions for easy access

// Re-export main functions
pub use glm_aic::{
    calculate_aic, calculate_aic_from_result, calculate_aic_differences, calculate_aic_weights,
    calculate_binomial_aic, calculate_gamma_aic, calculate_gaussian_aic,
    calculate_inverse_gaussian_aic, calculate_poisson_aic, calculate_quasi_aic,
    compare_models_aic, find_best_model_aic, interpret_aic_difference,
};
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
    DetergentResults, SimpleExampleResults, create_detergent_data, create_simple_example_data,
    print_detergent_results, print_simple_results, run_detergent_example, run_simple_example,
};

// Module initialization
pub use index::{GlmModuleInfo, glm_info, init_glm};

// Re-export types
pub use types::{
    AnovaRow, CoefficientInfo, GlmAnova, GlmControl, GlmOptions, GlmResult, GlmSummary,
    ResidualType, WeightType,
};
