//! Core variance-covariance matrix functions

use super::vcov_types::*;

/// Generic vcov function - dispatches to appropriate method
pub fn vcov<T: VcovObject>(object: &T, complete: bool) -> Result<Vec<Vec<f64>>, &'static str> {
    object.vcov(complete)
}

/// Augment a vcov matrix by NA rows & cols when needed
///
/// This function handles aliased coefficients by adding NA rows and columns
/// to the variance-covariance matrix when complete=TRUE.
pub fn vcov_aliased(
    aliased: &[bool],
    vc: &[Vec<f64>],
    complete: bool,
) -> Result<Vec<Vec<f64>>, &'static str> {
    if complete && vc.len() < aliased.len() && aliased.iter().any(|&x| x) {
        // Add NA rows and columns in vcov
        let p = aliased.len();
        let mut vc_augmented = vec![vec![f64::NAN; p]; p];

        // Find non-aliased coefficients
        let non_aliased: Vec<usize> = aliased
            .iter()
            .enumerate()
            .filter_map(|(i, &aliased)| if !aliased { Some(i) } else { None })
            .collect();

        // Copy non-aliased coefficients to their positions
        for (i, &orig_idx) in non_aliased.iter().enumerate() {
            for (j, &orig_jdx) in non_aliased.iter().enumerate() {
                vc_augmented[orig_idx][orig_jdx] = vc[i][j];
            }
        }

        Ok(vc_augmented)
    } else {
        Ok(vc.to_vec())
    }
}

/// Linear model vcov implementation
impl VcovObject for LmObject {
    fn vcov(&self, complete: bool) -> Result<Vec<Vec<f64>>, &'static str> {
        vcov_lm(self, complete)
    }
}

/// GLM vcov implementation
impl VcovObject for GlmObject {
    fn vcov(&self, complete: bool) -> Result<Vec<Vec<f64>>, &'static str> {
        vcov_glm(self, complete)
    }
}

/// Multivariate linear model vcov implementation
impl VcovObject for MlmObject {
    fn vcov(&self, complete: bool) -> Result<Vec<Vec<f64>>, &'static str> {
        vcov_mlm(self, complete)
    }
}

/// Linear model vcov calculation
pub fn vcov_lm(object: &LmObject, complete: bool) -> Result<Vec<Vec<f64>>, &'static str> {
    // Simplified implementation - in practice would use QR decomposition
    let p = object.coefficients.len();
    let sigma_sq = object.residuals.iter().map(|&r| r * r).sum::<f64>() / object.df_residual as f64;
    
    // Create identity matrix scaled by sigma^2 (simplified)
    let mut vc = vec![vec![0.0; p]; p];
    for i in 0..p {
        vc[i][i] = sigma_sq;
    }
    
    Ok(vc)
}

/// GLM vcov calculation
pub fn vcov_glm(object: &GlmObject, complete: bool) -> Result<Vec<Vec<f64>>, &'static str> {
    // Simplified implementation - in practice would use information matrix
    let p = object.coefficients.len();
    let dispersion = object.deviance / object.df_residual as f64;
    
    // Create identity matrix scaled by dispersion (simplified)
    let mut vc = vec![vec![0.0; p]; p];
    for i in 0..p {
        vc[i][i] = dispersion;
    }
    
    Ok(vc)
}

/// Multivariate linear model vcov calculation
pub fn vcov_mlm(
    object: &MlmObject,
    complete: bool,
) -> Result<Vec<Vec<f64>>, &'static str> {
    // For MLM, we need to handle multiple response variables
    // This is a simplified implementation
    let p = object.coefficients[0].len();
    let sigma_sq = object.residuals[0].iter().map(|&r| r * r).sum::<f64>() / object.df_residual as f64;
    
    // Create identity matrix scaled by sigma^2 (simplified)
    let mut vc = vec![vec![0.0; p]; p];
    for i in 0..p {
        vc[i][i] = sigma_sq;
    }
    
    Ok(vc)
}

/// Linear model summary vcov calculation
pub fn vcov_summary_lm(object: &LmSummary, complete: bool) -> Result<Vec<Vec<f64>>, &'static str> {
    // Use the unscaled covariance matrix and scale by sigma^2
    let sigma_sq = object.sigma * object.sigma;
    let mut vc = object.cov_unscaled.clone();
    
    for i in 0..vc.len() {
        for j in 0..vc[i].len() {
            vc[i][j] *= sigma_sq;
        }
    }
    
    Ok(vc)
}

/// GLM summary vcov calculation
pub fn vcov_summary_glm(
    object: &GlmSummary,
    complete: bool,
) -> Result<Vec<Vec<f64>>, &'static str> {
    // Use the unscaled covariance matrix and scale by dispersion
    let dispersion = object.dispersion;
    let mut vc = vec![vec![0.0; object.coefficients.len()]; object.coefficients.len()];
    
    // Simplified implementation - in practice would use the actual covariance matrix
    for i in 0..vc.len() {
        vc[i][i] = dispersion;
    }
    
    Ok(vc)
}
