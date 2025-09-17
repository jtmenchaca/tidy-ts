//! Standardized and studentized residuals
//! 
//! This module provides standardized and studentized residual functions
//! equivalent to R's influence_standardized.R module.

use super::influence_core::{LinearModel, InfluenceResult, lm_influence};
use std::f64;

/// Standardized residual type
#[derive(Debug, Clone, Copy)]
pub enum StandardizedType {
    /// Standard deviation type (sd.1)
    Sd1,
    /// Predictive type
    Predictive,
}

/// GLM residual type
#[derive(Debug, Clone, Copy)]
pub enum GlmResidualType {
    /// Deviance residuals
    Deviance,
    /// Pearson residuals
    Pearson,
}

/// Generic standardized residuals function
///
/// This function provides a generic interface for computing standardized residuals
/// from different model types.
///
/// # Arguments
///
/// * `model` - Model object
/// * `infl` - Optional pre-computed influence result
/// * `sd` - Optional standard deviation
/// * `residuals` - Optional residuals vector
/// * `residual_type` - Type of standardized residual
///
/// # Returns
///
/// Vector of standardized residuals
pub fn rstandard(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
    sd: Option<f64>,
    residuals: Option<&[f64]>,
    residual_type: StandardizedType,
) -> Result<Vec<f64>, &'static str> {
    rstandard_lm(model, infl, sd, residuals, residual_type)
}

/// Linear model standardized residuals
///
/// This function computes standardized residuals for linear models.
///
/// # Arguments
///
/// * `model` - Linear model object
/// * `infl` - Optional pre-computed influence result
/// * `sd` - Optional standard deviation
/// * `residuals` - Optional residuals vector
/// * `residual_type` - Type of standardized residual
///
/// # Returns
///
/// Vector of standardized residuals
pub fn rstandard_lm(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
    sd: Option<f64>,
    residuals: Option<&[f64]>,
    residual_type: StandardizedType,
) -> Result<Vec<f64>, &'static str> {
    let influence_result = match infl {
        Some(infl) => infl.clone(),
        None => lm_influence(model, false)?,
    };
    
    let residuals = residuals.unwrap_or(&influence_result.wt_res);
    
    let sd_val = sd.unwrap_or_else(|| {
        let df_residual = model.n.saturating_sub(model.rank) as f64;
        if df_residual > 0.0 {
            let sum_sq_residuals: f64 = model.residuals.iter().map(|&r| r * r).sum();
            (sum_sq_residuals / df_residual).sqrt()
        } else {
            0.0
        }
    });
    
    let mut rstandard_vals = vec![0.0; model.n];
    
    for i in 0..model.n {
        let hat_val = influence_result.hat[i];
        let res = residuals[i];
        
        if hat_val == 1.0 {
            rstandard_vals[i] = f64::NAN;
        } else {
            let denominator = match residual_type {
                StandardizedType::Sd1 => sd_val * (1.0 - hat_val).sqrt(),
                StandardizedType::Predictive => 1.0 - hat_val,
            };
            rstandard_vals[i] = res / denominator;
        }
    }
    
    // Handle infinite values
    for val in &mut rstandard_vals {
        if val.is_infinite() {
            *val = f64::NAN;
        }
    }
    
    Ok(rstandard_vals)
}

/// GLM standardized residuals
///
/// This function computes standardized residuals for generalized linear models.
///
/// # Arguments
///
/// * `model` - GLM model object
/// * `infl` - Optional pre-computed influence result
/// * `residual_type` - Type of residual (deviance or pearson)
/// * `dispersion` - Dispersion parameter
///
/// # Returns
///
/// Vector of standardized residuals
pub fn rstandard_glm(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
    residual_type: GlmResidualType,
    dispersion: f64,
) -> Result<Vec<f64>, &'static str> {
    let influence_result = match infl {
        Some(infl) => infl.clone(),
        None => lm_influence(model, false)?,
    };
    
    let residuals = match residual_type {
        GlmResidualType::Deviance => &influence_result.wt_res,
        GlmResidualType::Pearson => {
            // In a full implementation, we would have pearson residuals
            // For now, use deviance residuals as placeholder
            &influence_result.wt_res
        }
    };
    
    let mut rstandard_vals = vec![0.0; model.n];
    
    for i in 0..model.n {
        let hat_val = influence_result.hat[i];
        let res = residuals[i];
        
        if hat_val == 1.0 {
            rstandard_vals[i] = f64::NAN;
        } else {
            rstandard_vals[i] = res / (dispersion * (1.0 - hat_val)).sqrt();
        }
    }
    
    // Handle infinite values
    for val in &mut rstandard_vals {
        if val.is_infinite() {
            *val = f64::NAN;
        }
    }
    
    Ok(rstandard_vals)
}

/// Generic studentized residuals function
///
/// This function provides a generic interface for computing studentized residuals
/// from different model types.
///
/// # Arguments
///
/// * `model` - Model object
/// * `infl` - Optional pre-computed influence result
/// * `residuals` - Optional residuals vector
///
/// # Returns
///
/// Vector of studentized residuals
pub fn rstudent(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
    residuals: Option<&[f64]>,
) -> Result<Vec<f64>, &'static str> {
    rstudent_lm(model, infl, residuals)
}

/// Linear model studentized residuals
///
/// This function computes studentized residuals for linear models.
///
/// # Arguments
///
/// * `model` - Linear model object
/// * `infl` - Optional pre-computed influence result
/// * `residuals` - Optional residuals vector
///
/// # Returns
///
/// Vector of studentized residuals
pub fn rstudent_lm(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
    residuals: Option<&[f64]>,
) -> Result<Vec<f64>, &'static str> {
    let influence_result = match infl {
        Some(infl) => infl.clone(),
        None => lm_influence(model, false)?,
    };
    
    let residuals = residuals.unwrap_or(&influence_result.wt_res);
    
    let mut rstudent_vals = vec![0.0; model.n];
    
    for i in 0..model.n {
        let hat_val = influence_result.hat[i];
        let sigma = influence_result.sigma[i];
        let res = residuals[i];
        
        if hat_val == 1.0 {
            rstudent_vals[i] = f64::NAN;
        } else {
            rstudent_vals[i] = res / (sigma * (1.0 - hat_val).sqrt());
        }
    }
    
    // Handle infinite values
    for val in &mut rstudent_vals {
        if val.is_infinite() {
            *val = f64::NAN;
        }
    }
    
    Ok(rstudent_vals)
}

/// GLM studentized residuals
///
/// This function computes studentized residuals for generalized linear models.
///
/// # Arguments
///
/// * `model` - GLM model object
/// * `infl` - Optional pre-computed influence result
/// * `pearson_residuals` - Optional Pearson residuals
/// * `family` - GLM family type
///
/// # Returns
///
/// Vector of studentized residuals
pub fn rstudent_glm(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
    pearson_residuals: Option<&[f64]>,
    family: &str,
) -> Result<Vec<f64>, &'static str> {
    let influence_result = match infl {
        Some(infl) => infl.clone(),
        None => lm_influence(model, false)?,
    };
    
    let mut rstudent_vals = vec![0.0; model.n];
    
    for i in 0..model.n {
        let hat_val = influence_result.hat[i];
        let dev_res = influence_result.wt_res[i];
        
        if hat_val == 1.0 {
            rstudent_vals[i] = f64::NAN;
        } else {
            let mut r = dev_res;
            
            // Add Pearson residual component if available
            if let Some(pear_res) = pearson_residuals {
                let pear_res_val = pear_res[i];
                r = r.signum() * (r * r + (hat_val * pear_res_val * pear_res_val) / (1.0 - hat_val)).sqrt();
            }
            
            // For binomial and poisson families, don't divide by sigma
            if family == "binomial" || family == "poisson" {
                rstudent_vals[i] = r;
            } else {
                rstudent_vals[i] = r / influence_result.sigma[i];
            }
        }
    }
    
    // Handle infinite values
    for val in &mut rstudent_vals {
        if val.is_infinite() {
            *val = f64::NAN;
        }
    }
    
    Ok(rstudent_vals)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::model::influence_core::LinearModel;

    #[test]
    fn test_rstandard_lm() {
        let model = LinearModel {
            x: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0], // 3x2
            y: vec![1.0, 2.0, 3.0],
            n: 3,
            p: 2,
            rank: 2,
            weights: None,
            fitted: vec![1.0, 2.0, 3.0],
            residuals: vec![0.0, 0.0, 0.0],
            qr: None,
            na_action: None,
            deviance: 0.0,
            df_residual: 1.0,
        };
        
        let rstd = rstandard_lm(&model, None, None, None, StandardizedType::Sd1).unwrap();
        assert_eq!(rstd.len(), 3);
    }

    #[test]
    fn test_rstudent_lm() {
        let model = LinearModel {
            x: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0], // 3x2
            y: vec![1.0, 2.0, 3.0],
            n: 3,
            p: 2,
            rank: 2,
            weights: None,
            fitted: vec![1.0, 2.0, 3.0],
            residuals: vec![0.0, 0.0, 0.0],
            qr: None,
            na_action: None,
            deviance: 0.0,
            df_residual: 1.0,
        };
        
        let rstud = rstudent_lm(&model, None, None).unwrap();
        assert_eq!(rstud.len(), 3);
    }
}
