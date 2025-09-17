//! Sigma (residual standard deviation) functions

use super::vcov_types::*;

/// Generic sigma function - dispatches to appropriate method
pub fn sigma<T: SigmaObject>(object: &T) -> Result<f64, &'static str> {
    object.sigma()
}

/// Linear model sigma implementation
impl SigmaObject for LmObject {
    fn sigma(&self) -> Result<f64, &'static str> {
        sigma_default(self, true)
    }
}

/// GLM sigma implementation
impl SigmaObject for GlmObject {
    fn sigma(&self) -> Result<f64, &'static str> {
        sigma_glm(self)
    }
}

/// Multivariate linear model sigma implementation
impl SigmaObject for MlmObject {
    fn sigma(&self) -> Result<f64, &'static str> {
        sigma_mlm(self)
    }
}

/// Default sigma calculation
pub fn sigma_default<T: DevianceObject + NobsObject + CoefObject>(
    object: &T,
    use_df: bool,
) -> Result<f64, &'static str> {
    let deviance = object.deviance();
    let nobs = object.nobs();
    let n_coef = object.coef().len();
    
    let df = if use_df {
        nobs - n_coef
    } else {
        nobs
    };
    
    if df <= 0 {
        return Err("Degrees of freedom must be positive");
    }
    
    Ok((deviance / df as f64).sqrt())
}

/// Multivariate linear model sigma calculation
pub fn sigma_mlm(object: &MlmObject) -> Result<f64, &'static str> {
    // For MLM, calculate sigma for the first response variable
    if object.residuals.is_empty() {
        return Err("No residuals available");
    }
    
    let residuals = &object.residuals[0];
    let rss: f64 = residuals.iter().map(|&r| r * r).sum();
    let sigma_sq = rss / object.df_residual as f64;
    
    Ok(sigma_sq.sqrt())
}

/// GLM sigma calculation
pub fn sigma_glm(object: &GlmObject) -> Result<f64, &'static str> {
    // For GLM, sigma is the square root of the dispersion
    let dispersion = object.deviance / object.df_residual as f64;
    Ok(dispersion.sqrt())
}

/// Linear model deviance implementation
impl DevianceObject for LmObject {
    fn deviance(&self) -> f64 {
        self.residuals.iter().map(|&r| r * r).sum()
    }
}

/// Linear model nobs implementation
impl NobsObject for LmObject {
    fn nobs(&self) -> usize {
        self.residuals.len()
    }
}

/// Linear model coef implementation
impl CoefObject for LmObject {
    fn coef(&self) -> &[f64] {
        &self.coefficients
    }
}

/// GLM deviance implementation
impl DevianceObject for GlmObject {
    fn deviance(&self) -> f64 {
        self.deviance
    }
}

/// GLM nobs implementation
impl NobsObject for GlmObject {
    fn nobs(&self) -> usize {
        self.residuals.len()
    }
}

/// GLM coef implementation
impl CoefObject for GlmObject {
    fn coef(&self) -> &[f64] {
        &self.coefficients
    }
}

/// Multivariate linear model deviance implementation
impl DevianceObject for MlmObject {
    fn deviance(&self) -> f64 {
        // Sum of squared residuals across all response variables
        self.residuals.iter()
            .map(|residuals| residuals.iter().map(|&r| r * r).sum::<f64>())
            .sum()
    }
}

/// Multivariate linear model nobs implementation
impl NobsObject for MlmObject {
    fn nobs(&self) -> usize {
        if self.residuals.is_empty() {
            0
        } else {
            self.residuals[0].len()
        }
    }
}

/// Multivariate linear model coef implementation
impl CoefObject for MlmObject {
    fn coef(&self) -> &[f64] {
        if self.coefficients.is_empty() {
            &[]
        } else {
            &self.coefficients[0]
        }
    }
}
