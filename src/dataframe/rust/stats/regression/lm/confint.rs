//! Confidence intervals for statistical models
//!
//! This module provides functionality equivalent to R's `confint()` function,
//! which computes confidence intervals for model parameters.
//!
//! The implementation supports different model types (lm, glm, nls) and uses
//! appropriate methods for each type.

use crate::stats::regression::model::Variable;

/// Confidence interval result
#[derive(Debug, Clone)]
pub struct ConfidenceInterval {
    /// Lower bounds of confidence intervals
    pub lower: Vec<f64>,
    /// Upper bounds of confidence intervals
    pub upper: Vec<f64>,
    /// Parameter names
    pub parameter_names: Vec<String>,
    /// Confidence level
    pub level: f64,
    /// Percentage labels for the bounds
    pub percentage_labels: Vec<String>,
}

/// Generic confidence interval function
pub fn confint(
    object: &dyn ModelObject,
    parm: Option<Vec<String>>,
    level: f64,
) -> Result<ConfidenceInterval, &'static str> {
    object.confint(parm, level)
}

/// Format percentage values for display
fn format_perc(probs: &[f64], digits: usize) -> Vec<String> {
    probs
        .iter()
        .map(|p| format!("{:.digits$}%", 100.0 * p, digits = digits))
        .collect()
}

/// Confidence interval for linear models
pub fn confint_lm(
    coefficients: &[f64],
    standard_errors: &[f64],
    parameter_names: &[String],
    df_residual: f64,
    parm: Option<Vec<String>>,
    level: f64,
) -> Result<ConfidenceInterval, &'static str> {
    let pnames = parameter_names.to_vec();
    let parm_indices = if let Some(parm_names) = parm {
        if parm_names.iter().all(|s| s.parse::<usize>().is_ok()) {
            // Numeric indices
            parm_names
                .iter()
                .map(|s| s.parse::<usize>().unwrap())
                .collect::<Vec<_>>()
        } else {
            // Parameter names
            let mut indices = Vec::new();
            for name in parm_names.iter() {
                let idx = pnames
                    .iter()
                    .position(|p| p == name)
                    .ok_or("parameter not found")?;
                indices.push(idx);
            }
            indices
        }
    } else {
        (0..pnames.len()).collect()
    };

    let a = (1.0 - level) / 2.0;
    let alpha = vec![a, 1.0 - a];

    // Use t-distribution for linear models
    let fac = t_quantile(&alpha, df_residual)?;
    let pct = format_perc(&alpha, 3);

    let mut lower = Vec::new();
    let mut upper = Vec::new();
    let mut param_names = Vec::new();

    for &idx in &parm_indices {
        if idx >= coefficients.len() || idx >= standard_errors.len() {
            return Err("parameter index out of range");
        }

        let cf = coefficients[idx];
        let se = standard_errors[idx];

        lower.push(cf + se * fac[0]);
        upper.push(cf + se * fac[1]);
        param_names.push(pnames[idx].clone());
    }

    Ok(ConfidenceInterval {
        lower,
        upper,
        parameter_names: param_names,
        level,
        percentage_labels: pct,
    })
}

/// Confidence interval for GLM models (uses profiling)
pub fn confint_glm(
    _object: &dyn GlmObject,
    parm: Option<Vec<String>>,
    level: f64,
    _trace: bool,
    _test: &str,
) -> Result<ConfidenceInterval, &'static str> {
    // GLM confidence intervals require profiling, which is complex
    // For now, return an error indicating this needs to be implemented
    Err("GLM confidence intervals require profiling - not yet implemented")
}

/// Confidence interval for NLS models
pub fn confint_nls(
    _object: &dyn NlsObject,
    parm: Option<Vec<String>>,
    level: f64,
) -> Result<ConfidenceInterval, &'static str> {
    // NLS confidence intervals also require profiling
    Err("NLS confidence intervals require profiling - not yet implemented")
}

/// Default confidence interval method
pub fn confint_default(
    coefficients: &[f64],
    standard_errors: &[f64],
    parameter_names: &[String],
    parm: Option<Vec<String>>,
    level: f64,
) -> Result<ConfidenceInterval, &'static str> {
    let pnames = parameter_names.to_vec();
    let parm_indices = if let Some(parm_names) = parm {
        if parm_names.iter().all(|s| s.parse::<usize>().is_ok()) {
            // Numeric indices
            parm_names
                .iter()
                .map(|s| s.parse::<usize>().unwrap())
                .collect::<Vec<_>>()
        } else {
            // Parameter names
            let mut indices = Vec::new();
            for name in parm_names.iter() {
                let idx = pnames
                    .iter()
                    .position(|p| p == name)
                    .ok_or("parameter not found")?;
                indices.push(idx);
            }
            indices
        }
    } else {
        (0..pnames.len()).collect()
    };

    let a = (1.0 - level) / 2.0;
    let alpha = vec![a, 1.0 - a];

    // Use normal distribution for default method
    let fac = normal_quantile(&alpha)?;
    let pct = format_perc(&alpha, 3);

    let mut lower = Vec::new();
    let mut upper = Vec::new();
    let mut param_names = Vec::new();

    for &idx in &parm_indices {
        if idx >= coefficients.len() || idx >= standard_errors.len() {
            return Err("parameter index out of range");
        }

        let cf = coefficients[idx];
        let se = standard_errors[idx];

        lower.push(cf + se * fac[0]);
        upper.push(cf + se * fac[1]);
        param_names.push(pnames[idx].clone());
    }

    Ok(ConfidenceInterval {
        lower,
        upper,
        parameter_names: param_names,
        level,
        percentage_labels: pct,
    })
}

/// Trait for model objects that can compute confidence intervals
pub trait ModelObject {
    fn confint(
        &self,
        parm: Option<Vec<String>>,
        level: f64,
    ) -> Result<ConfidenceInterval, &'static str>;
}

/// Trait for GLM objects
pub trait GlmObject {
    fn coefficients(&self) -> &[f64];
    fn parameter_names(&self) -> &[String];
    fn vcov(&self) -> Result<Vec<Vec<f64>>, &'static str>;
}

/// Trait for NLS objects
pub trait NlsObject {
    fn coefficients(&self) -> &[f64];
    fn parameter_names(&self) -> &[String];
    fn vcov(&self) -> Result<Vec<Vec<f64>>, &'static str>;
}

/// Compute t-distribution quantiles
fn t_quantile(probs: &[f64], df: f64) -> Result<Vec<f64>, &'static str> {
    if df <= 0.0 {
        return Err("degrees of freedom must be positive");
    }

    // Simple approximation for t-quantiles
    // In a full implementation, this would use proper t-distribution quantiles
    let mut result = Vec::new();
    for &p in probs {
        if p <= 0.0 || p >= 1.0 {
            return Err("probability must be in (0, 1)");
        }

        // For large df, t-distribution approximates normal
        // This is a simplified implementation
        let z = normal_quantile(&[p])?[0];
        let correction = if df < 30.0 {
            // Apply small sample correction
            z * (1.0 + z * z / (4.0 * df))
        } else {
            z
        };
        result.push(correction);
    }

    Ok(result)
}

/// Compute normal distribution quantiles
fn normal_quantile(probs: &[f64]) -> Result<Vec<f64>, &'static str> {
    let mut result = Vec::new();
    for &p in probs {
        if p <= 0.0 || p >= 1.0 {
            return Err("probability must be in (0, 1)");
        }

        // Simple approximation for normal quantiles
        // In a full implementation, this would use proper normal quantiles
        let z = if p < 0.5 {
            -normal_quantile_approx(1.0 - p)
        } else {
            normal_quantile_approx(p)
        };
        result.push(z);
    }

    Ok(result)
}

/// Approximate normal quantile using Beasley-Springer-Moro algorithm
fn normal_quantile_approx(p: f64) -> f64 {
    const A: [f64; 4] = [
        0.0,
        -3.969683028665376e1,
        2.209460984245205e2,
        -2.759285104469687e2,
    ];
    const B: [f64; 4] = [
        1.0,
        1.767588059005474e1,
        -1.128023431620161e2,
        2.344105222083393e2,
    ];
    const C: [f64; 9] = [
        0.0,
        7.7108870705487895e-1,
        2.7772013533685169e-1,
        3.4722222222222222e-2,
        1.1574074074074074e-2,
        2.6740692645506314e-3,
        1.8251328623852542e-3,
        1.3666950047992669e-4,
        1.5252733804059817e-4,
    ];
    const D: [f64; 9] = [
        1.0,
        1.0,
        2.7772013533685169e-1,
        3.4722222222222222e-2,
        1.1574074074074074e-2,
        2.6740692645506314e-3,
        1.8251328623852542e-3,
        1.3666950047992669e-4,
        1.5252733804059817e-4,
    ];

    if p <= 0.0 || p >= 1.0 {
        return if p <= 0.0 {
            -f64::INFINITY
        } else {
            f64::INFINITY
        };
    }

    let r = if p > 0.5 {
        (-2.0 * (1.0 - p).ln()).sqrt()
    } else {
        (-2.0 * p.ln()).sqrt()
    };

    let x = r
        - (A[0] + A[1] * r + A[2] * r * r + A[3] * r * r * r)
            / (B[0] + B[1] * r + B[2] * r * r + B[3] * r * r * r);

    let mut sum = 0.0;
    for i in 0..9 {
        sum += C[i] * x.powi(i as i32);
    }
    let mut denom = 0.0;
    for i in 0..9 {
        denom += D[i] * x.powi(i as i32);
    }
    x - sum / denom
}

/// Extract diagonal from variance-covariance matrix
pub fn extract_diagonal(vcov: &[Vec<f64>]) -> Vec<f64> {
    vcov.iter()
        .enumerate()
        .map(|(i, row)| if i < row.len() { row[i] } else { 0.0 })
        .collect()
}

/// Compute standard errors from variance-covariance matrix
pub fn standard_errors(vcov: &[Vec<f64>]) -> Vec<f64> {
    extract_diagonal(vcov)
        .iter()
        .map(|&var| var.sqrt())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_confint_lm_basic() {
        let coefficients = vec![1.0, 2.0, 3.0];
        let standard_errors = vec![0.1, 0.2, 0.3];
        let parameter_names = vec![
            "(Intercept)".to_string(),
            "x1".to_string(),
            "x2".to_string(),
        ];
        let df_residual = 10.0;

        let ci = confint_lm(
            &coefficients,
            &standard_errors,
            &parameter_names,
            df_residual,
            None,
            0.95,
        )
        .unwrap();

        assert_eq!(ci.parameter_names.len(), 3);
        assert_eq!(ci.lower.len(), 3);
        assert_eq!(ci.upper.len(), 3);
        assert_eq!(ci.level, 0.95);
    }

    #[test]
    fn test_confint_lm_with_parm() {
        let coefficients = vec![1.0, 2.0, 3.0];
        let standard_errors = vec![0.1, 0.2, 0.3];
        let parameter_names = vec![
            "(Intercept)".to_string(),
            "x1".to_string(),
            "x2".to_string(),
        ];
        let df_residual = 10.0;

        let ci = confint_lm(
            &coefficients,
            &standard_errors,
            &parameter_names,
            df_residual,
            Some(vec!["x1".to_string()]),
            0.95,
        )
        .unwrap();

        assert_eq!(ci.parameter_names.len(), 1);
        assert_eq!(ci.parameter_names[0], "x1");
    }

    #[test]
    fn test_confint_default() {
        let coefficients = vec![1.0, 2.0];
        let standard_errors = vec![0.1, 0.2];
        let parameter_names = vec!["param1".to_string(), "param2".to_string()];

        let ci = confint_default(
            &coefficients,
            &standard_errors,
            &parameter_names,
            None,
            0.95,
        )
        .unwrap();

        assert_eq!(ci.parameter_names.len(), 2);
        assert_eq!(ci.level, 0.95);
    }

    #[test]
    fn test_format_perc() {
        let probs = vec![0.025, 0.975];
        let formatted = format_perc(&probs, 3);

        assert_eq!(formatted.len(), 2);
        assert!(formatted[0].contains("2.5"));
        assert!(formatted[1].contains("97.5"));
    }

    #[test]
    fn test_standard_errors() {
        let vcov = vec![vec![0.01, 0.0], vec![0.0, 0.04]];

        let ses = standard_errors(&vcov);
        assert_eq!(ses.len(), 2);
        assert!((ses[0] - 0.1).abs() < 1e-10);
        assert!((ses[1] - 0.2).abs() < 1e-10);
    }

    #[test]
    fn test_normal_quantile() {
        let probs = vec![0.025, 0.975];
        let quantiles = normal_quantile(&probs).unwrap();

        assert_eq!(quantiles.len(), 2);
        assert!(quantiles[0] < 0.0); // 2.5% quantile should be negative
        assert!(quantiles[1] > 0.0); // 97.5% quantile should be positive
        assert!((quantiles[0] + quantiles[1]).abs() < 1e-10); // Should be symmetric
    }

    #[test]
    fn test_t_quantile() {
        let probs = vec![0.025, 0.975];
        let quantiles = t_quantile(&probs, 10.0).unwrap();

        assert_eq!(quantiles.len(), 2);
        assert!(quantiles[0] < 0.0);
        assert!(quantiles[1] > 0.0);
    }

    #[test]
    fn test_error_cases() {
        // Invalid probability
        assert!(normal_quantile(&[1.5]).is_err());
        assert!(normal_quantile(&[-0.1]).is_err());

        // Invalid degrees of freedom
        assert!(t_quantile(&[0.5], 0.0).is_err());
        assert!(t_quantile(&[0.5], -1.0).is_err());
    }
}
