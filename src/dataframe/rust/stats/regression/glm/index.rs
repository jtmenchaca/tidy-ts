//! GLM module index
//!
//! This file provides the main entry point for the GLM module.
//!
//! This file organizes all GLM modules in dependency order.

// Core GLM modules (in dependency order)

// Additional GLM modules

// Re-export main functions for easy access
pub use super::glm_anova::{anova_glm, anova_glmlist, format_anova, print_anova};
pub use super::glm_control::glm_control;
pub use super::glm_fit::glm_fit;
pub use super::glm_main::{glm, glm_binomial, glm_gaussian, glm_poisson};
pub use super::glm_print::{format_glm, print_glm};
pub use super::glm_residuals::{
    residuals_glm, residuals_glm_deviance, residuals_glm_partial, residuals_glm_pearson,
    residuals_glm_response, residuals_glm_working,
};
pub use super::glm_summary::{format_summary_glm, print_summary_glm, summary_glm};
pub use super::glm_utils::{
    deviance_glm, effects_glm, family_glm, formula_glm, model_frame_glm, weights_glm,
    weights_glm_prior, weights_glm_working,
};

// Profile functions
pub use super::glm_profile::{pairs_profile, plot_profile, profile_glm};
// Example/demo functions
pub use super::glm_vr::{
    DetergentResults, SimpleExampleResults, create_detergent_data, create_simple_example_data,
    print_detergent_results, print_simple_results, run_detergent_example, run_simple_example,
};

// Re-export types
pub use crate::stats::regression::glm::types::{
    AnovaRow, CoefficientInfo, GlmAnova, GlmControl, GlmOptions, GlmProfile, GlmResult, GlmSummary,
    ParameterProfile, ResidualType, WeightType,
};

/// Initialize GLM module
///
/// This function initializes the GLM module and sets up any necessary
/// global state.
pub fn init_glm() -> Result<(), String> {
    // TODO: Add any necessary initialization code
    // For now, this is a placeholder
    Ok(())
}

/// GLM module information
///
/// This function returns information about the GLM module,
/// including version and available functions.
pub fn glm_info() -> GlmModuleInfo {
    GlmModuleInfo {
        version: "0.1.0".to_string(),
        description: "Generalized Linear Models".to_string(),
        functions: vec![
            "glm".to_string(),
            "glm.fit".to_string(),
            "glm.control".to_string(),
            "summary.glm".to_string(),
            "anova.glm".to_string(),
            "residuals.glm".to_string(),
            "profile.glm".to_string(),
            "print.glm".to_string(),
        ],
        families: vec![
            "gaussian".to_string(),
            "binomial".to_string(),
            "poisson".to_string(),
            "inverse.gaussian".to_string(),
        ],
        links: vec![
            "identity".to_string(),
            "logit".to_string(),
            "probit".to_string(),
            "log".to_string(),
            "inverse".to_string(),
        ],
    }
}

/// GLM module information structure
#[derive(Debug, Clone)]
pub struct GlmModuleInfo {
    /// Module version
    pub version: String,
    /// Module description
    pub description: String,
    /// Available functions
    pub functions: Vec<String>,
    /// Available families
    pub families: Vec<String>,
    /// Available links
    pub links: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init_glm() {
        let result = init_glm();
        assert!(result.is_ok());
    }

    #[test]
    fn test_glm_info() {
        let info = glm_info();
        assert_eq!(info.version, "0.1.0");
        assert!(info.functions.contains(&"glm".to_string()));
        assert!(info.families.contains(&"gaussian".to_string()));
        assert!(info.links.contains(&"identity".to_string()));
    }
}
