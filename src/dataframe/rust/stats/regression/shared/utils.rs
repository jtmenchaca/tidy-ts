//! Shared utility functions for regression models
//!
//! These functions work with any model implementing the Model trait.

use super::model_trait::{Model, WeightType};

/// Extract deviance from any model
pub fn deviance<T: Model>(model: &T) -> f64 {
    model.deviance()
}

/// Extract AIC from any model
pub fn aic<T: Model>(model: &T) -> f64 {
    model.aic()
}

/// Extract family from any model
pub fn family<T: Model>(model: &T) -> &dyn crate::stats::regression::family::GlmFamily {
    model.family()
}

/// Extract formula from any model
pub fn formula<T: Model>(model: &T) -> Option<&str> {
    model.formula()
}

/// Extract model frame from any model
pub fn model_frame<T: Model>(
    model: &T,
) -> Option<&crate::stats::regression::model_utilities::ModelFrame> {
    model.model_frame()
}

/// Extract weights from any model
pub fn weights<T: Model>(model: &T, weight_type: WeightType) -> Vec<f64> {
    match weight_type {
        WeightType::Prior => model.prior_weights().to_vec(),
        WeightType::Working => model.working_weights().to_vec(),
    }
}

/// Extract prior weights - convenience function
pub fn prior_weights<T: Model>(model: &T) -> Vec<f64> {
    model.prior_weights().to_vec()
}

/// Extract working weights - convenience function
pub fn working_weights<T: Model>(model: &T) -> Vec<f64> {
    model.working_weights().to_vec()
}

/// Calculate R-squared (pseudo R-squared for GLM/GEE)
pub fn r_squared<T: Model>(model: &T) -> f64 {
    let null_deviance = model.null_deviance();
    let deviance = model.deviance();

    if null_deviance == 0.0 {
        0.0
    } else {
        1.0 - (deviance / null_deviance)
    }
}

/// Calculate adjusted R-squared
pub fn adj_r_squared<T: Model>(model: &T) -> f64 {
    let r2 = r_squared(model);
    let n = model.response().len();
    let p = model.rank();

    if n <= p + 1 {
        r2
    } else {
        1.0 - (1.0 - r2) * ((n - 1) as f64 / (n - p - 1) as f64)
    }
}

/// Calculate BIC (Bayesian Information Criterion)
pub fn bic<T: Model>(model: &T) -> f64 {
    let n = model.response().len();
    let k = model.rank();

    // BIC = -2 * log_likelihood + k * log(n)
    // For GLM: log_likelihood = -deviance/2 (approximately)
    // So BIC = deviance + k * log(n)
    model.deviance() + (k as f64) * (n as f64).ln()
}

/// Calculate log-likelihood (approximate for GLM)
pub fn log_likelihood<T: Model>(model: &T) -> f64 {
    // For GLM, this is approximate: -deviance/2
    -model.deviance() / 2.0
}

/// Get model summary information
pub fn model_summary<T: Model>(model: &T) -> ModelSummary {
    ModelSummary {
        model_type: model.model_type().to_string(),
        formula: model.formula().map(|s| s.to_string()),
        family: model.family().name().to_string(),
        coefficients: model.coefficients().to_vec(),
        deviance: model.deviance(),
        aic: model.aic(),
        rank: model.rank(),
        df_residual: model.df_residual(),
        df_null: model.df_null(),
        converged: model.converged(),
        boundary: model.boundary(),
        iterations: model.iterations(),
        null_deviance: model.null_deviance(),
        n_obs: model.response().len(),
    }
}

/// Model summary information
#[derive(Debug, Clone)]
pub struct ModelSummary {
    pub model_type: String,
    pub formula: Option<String>,
    pub family: String,
    pub coefficients: Vec<f64>,
    pub deviance: f64,
    pub aic: f64,
    pub rank: usize,
    pub df_residual: usize,
    pub df_null: usize,
    pub converged: bool,
    pub boundary: bool,
    pub iterations: usize,
    pub null_deviance: f64,
    pub n_obs: usize,
}

/// Print model summary
pub fn print_summary<T: Model>(model: &T) {
    let summary = model_summary(model);

    println!("Model: {}", summary.model_type);
    if let Some(ref formula) = summary.formula {
        println!("Formula: {}", formula);
    }
    println!("Family: {}", summary.family);
    println!("Deviance: {:.6}", summary.deviance);
    println!("AIC: {:.6}", summary.aic);
    println!("Rank: {}", summary.rank);
    println!("DF Residual: {}", summary.df_residual);
    println!("DF Null: {}", summary.df_null);
    println!("Converged: {}", summary.converged);
    if summary.boundary {
        println!("Boundary: {}", summary.boundary);
    }
    println!("Iterations: {}", summary.iterations);
    println!("Null Deviance: {:.6}", summary.null_deviance);
    println!("N Observations: {}", summary.n_obs);

    if !summary.coefficients.is_empty() {
        println!("\nCoefficients:");
        for (i, coef) in summary.coefficients.iter().enumerate() {
            println!("  [{}] {:.6}", i, coef);
        }
    }
}
