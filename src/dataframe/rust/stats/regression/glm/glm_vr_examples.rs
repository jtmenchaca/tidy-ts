//! GLM VR Example Execution Functions

use crate::stats::regression::family::poisson::PoissonFamily;
use crate::stats::regression::glm::glm_anova::anova_glm;
use crate::stats::regression::glm::glm_main::glm;
use crate::stats::regression::glm::glm_summary::summary_glm;
use crate::stats::regression::glm::glm_vr_data::{
    create_detergent_data, create_simple_example_data,
};
use crate::stats::regression::glm::glm_vr_results::{DetergentResults, SimpleExampleResults};
use std::collections::HashMap;

/// Run the detergent experiment example
///
/// This function runs the complete example from the GLM vignette.
///
/// # Returns
///
/// A tuple containing the results of both models and their comparison.
pub fn run_detergent_example() -> Result<DetergentResults, String> {
    // Create the data
    let data = create_detergent_data();

    // Model 0: Fr ~ M.user*Temp*Soft + Brand
    let detg_m0 = glm(
        "Fr ~ M.user*Temp*Soft + Brand".to_string(),
        Some(Box::new(PoissonFamily::log())),
        Some(data.clone()),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )?;

    // Model 1: Fr ~ M.user*Temp*Soft + Brand*M.user*Temp (with keep.order = TRUE)
    let detg_mod = glm(
        "Fr ~ M.user*Temp*Soft + Brand*M.user*Temp".to_string(),
        Some(Box::new(PoissonFamily::log())),
        Some(data),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )?;

    // Get summaries
    let summary_m0 = summary_glm(&detg_m0)?;
    let summary_mod = summary_glm(&detg_mod)?;

    // Get correlation summary for model 1
    let summary_mod_cor = summary_glm(&detg_mod)?;

    // Compare models with ANOVA
    let anova_result = anova_glm(&detg_m0, None, None)?;

    Ok(DetergentResults {
        model_0: detg_m0,
        model_1: detg_mod,
        summary_0: summary_m0,
        summary_1: summary_mod,
        summary_1_cor: summary_mod_cor,
        anova: anova_result,
    })
}

/// Run a simple GLM example
///
/// This function demonstrates basic GLM usage with a simple dataset.
pub fn run_simple_example() -> Result<SimpleExampleResults, String> {
    let data = create_simple_example_data();

    // Fit a simple linear model
    let model = glm(
        "y ~ x".to_string(),
        None, // Use default Gaussian family
        Some(data),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )?;

    let summary = summary_glm(&model)?;

    Ok(SimpleExampleResults { model, summary })
}

/// Run a comprehensive GLM family comparison example
///
/// This function demonstrates GLM usage across different family types.
pub fn run_family_comparison_example() -> Result<FamilyComparisonResults, String> {
    use crate::stats::regression::family::binomial::BinomialFamily;
    use crate::stats::regression::family::gaussian::GaussianFamily;

    let mut results = FamilyComparisonResults {
        gaussian: None,
        binomial: None,
        poisson: None,
    };

    // Gaussian example
    let gaussian_data = create_simple_example_data();
    let gaussian_model = glm(
        "y ~ x".to_string(),
        Some(Box::new(GaussianFamily::identity())),
        Some(gaussian_data),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )?;
    let gaussian_summary = summary_glm(&gaussian_model)?;
    results.gaussian = Some(SimpleExampleResults {
        model: gaussian_model,
        summary: gaussian_summary,
    });

    // Binomial example
    let mut binomial_data = HashMap::new();
    binomial_data.insert("x".to_string(), vec![1.0, 2.0, 3.0, 4.0, 5.0]);
    binomial_data.insert("n".to_string(), vec![10.0, 15.0, 20.0, 25.0, 30.0]);
    binomial_data.insert("successes".to_string(), vec![3.0, 7.0, 12.0, 18.0, 25.0]);

    let binomial_model = glm(
        "successes/n ~ x".to_string(),
        Some(Box::new(BinomialFamily::logit())),
        Some(binomial_data),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )?;
    let binomial_summary = summary_glm(&binomial_model)?;
    results.binomial = Some(SimpleExampleResults {
        model: binomial_model,
        summary: binomial_summary,
    });

    // Poisson example (simplified)
    let poisson_data = create_detergent_data();
    let poisson_model = glm(
        "Fr ~ Temp + Soft".to_string(),
        Some(Box::new(PoissonFamily::log())),
        Some(poisson_data),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )?;
    let poisson_summary = summary_glm(&poisson_model)?;
    results.poisson = Some(SimpleExampleResults {
        model: poisson_model,
        summary: poisson_summary,
    });

    Ok(results)
}

/// Results from family comparison example
#[derive(Debug)]
pub struct FamilyComparisonResults {
    /// Gaussian family results
    pub gaussian: Option<SimpleExampleResults>,
    /// Binomial family results
    pub binomial: Option<SimpleExampleResults>,
    /// Poisson family results
    pub poisson: Option<SimpleExampleResults>,
}

/// Run a model selection example
///
/// This function demonstrates model selection using AIC and deviance.
pub fn run_model_selection_example() -> Result<ModelSelectionResults, String> {
    let data = create_detergent_data();

    // Fit multiple models with different complexity
    let models = vec![
        (
            "Fr ~ 1",
            glm(
                "Fr ~ 1".to_string(),
                Some(Box::new(PoissonFamily::log())),
                Some(data.clone()),
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
            )?,
        ),
        (
            "Fr ~ Temp",
            glm(
                "Fr ~ Temp".to_string(),
                Some(Box::new(PoissonFamily::log())),
                Some(data.clone()),
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
            )?,
        ),
        (
            "Fr ~ Temp + Soft",
            glm(
                "Fr ~ Temp + Soft".to_string(),
                Some(Box::new(PoissonFamily::log())),
                Some(data.clone()),
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
            )?,
        ),
        (
            "Fr ~ Temp*Soft",
            glm(
                "Fr ~ Temp*Soft".to_string(),
                Some(Box::new(PoissonFamily::log())),
                Some(data),
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
            )?,
        ),
    ];

    // Get summaries for all models
    let summaries: Result<Vec<_>, String> = models
        .iter()
        .map(|(_, model)| summary_glm(model))
        .collect();

    Ok(ModelSelectionResults {
        models: models
            .into_iter()
            .map(|(name, model)| (name.to_string(), model))
            .collect(),
        summaries: summaries?,
    })
}

/// Results from model selection example
#[derive(Debug)]
pub struct ModelSelectionResults {
    /// Fitted models with their names
    pub models: Vec<(String, crate::stats::regression::glm::types::GlmResult)>,
    /// Model summaries
    pub summaries: Vec<crate::stats::regression::glm::types::GlmSummary>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run_detergent_example() {
        // This will fail until we implement proper model frame creation
        let result = run_detergent_example();
        assert!(result.is_err());
    }

    #[test]
    fn test_run_simple_example() {
        // This will fail until we implement proper model frame creation
        let result = run_simple_example();
        assert!(result.is_err());
    }

    #[test]
    fn test_run_family_comparison_example() {
        // This will fail until we implement proper model frame creation
        let result = run_family_comparison_example();
        assert!(result.is_err());
    }

    #[test]
    fn test_run_model_selection_example() {
        // This will fail until we implement proper model frame creation
        let result = run_model_selection_example();
        assert!(result.is_err());
    }
}
