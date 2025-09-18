//! Linear model utility functions

use super::lm_types::{AnovaRow, AnovaTable, LmResult, QrResult};

/// Extract residuals from linear model
pub fn residuals_lm(result: &LmResult, rtype: &str) -> Vec<f64> {
    match rtype {
        "response" => result.residuals.clone(),
        "pearson" => {
            // Pearson residuals (standardized)
            let sigma = (result.residuals.iter().map(|&r| r * r).sum::<f64>()
                / result.df_residual as f64)
                .sqrt();
            result.residuals.iter().map(|&r| r / sigma).collect()
        }
        "deviance" => result.residuals.clone(), // Same as response for linear models
        _ => result.residuals.clone(),
    }
}

/// Calculate deviance for linear model
pub fn deviance_lm(result: &LmResult) -> f64 {
    result.residuals.iter().map(|&r| r * r).sum()
}

/// Extract fitted values from linear model
pub fn fitted_lm(result: &LmResult) -> Vec<f64> {
    result.fitted_values.clone()
}

/// Extract coefficients from linear model
pub fn coef_lm(result: &LmResult) -> Vec<f64> {
    result.coefficients.clone()
}

/// Extract QR decomposition from linear model
pub fn qr_lm(result: &LmResult) -> Result<&QrResult, &'static str> {
    result.qr.as_ref().ok_or("QR decomposition not available")
}

/// Simulate from linear model
pub fn simulate_lm(result: &LmResult, nsim: usize) -> Vec<Vec<f64>> {
    let n = result.residuals.len();
    let sigma = (deviance_lm(result) / result.df_residual as f64).sqrt();

    let mut simulations = Vec::new();
    for _ in 0..nsim {
        let mut sim = Vec::new();
        for i in 0..n {
            // Generate normal random variable (simplified)
            let u1 = (i as f64 + 1.0) / (n as f64 + 1.0);
            let u2 = ((i as f64 + 1.0) * 1.618033988749895) % 1.0; // Golden ratio
            let z = (-2.0 * u1.ln()).sqrt() * (2.0 * std::f64::consts::PI * u2).cos();
            sim.push(result.fitted_values[i] + sigma * z);
        }
        simulations.push(sim);
    }
    simulations
}

/// Extract formula from linear model
pub fn formula_lm(_result: &LmResult) -> String {
    "y ~ x".to_string() // Placeholder
}

/// Extract family from linear model
pub fn family_lm(_result: &LmResult) -> String {
    "gaussian".to_string()
}

/// Extract model frame from linear model
pub fn model_frame_lm(_result: &LmResult) -> String {
    "model.frame".to_string() // Placeholder
}

/// Extract variable names from linear model
pub fn variable_names_lm(result: &LmResult, full: bool) -> Vec<String> {
    if full {
        (0..result.coefficients.len())
            .map(|i| format!("x{}", i))
            .collect()
    } else {
        (0..result.rank).map(|i| format!("x{}", i)).collect()
    }
}

/// Extract case names from linear model
pub fn case_names_lm(result: &LmResult, _full: bool) -> Vec<String> {
    (0..result.residuals.len())
        .map(|i| format!("{}", i + 1))
        .collect()
}

/// Generate ANOVA table for linear model
pub fn anova_lm(result: &LmResult) -> AnovaTable {
    let _n = result.residuals.len();
    let rank = result.rank;
    let df_residual = result.df_residual;

    // Calculate sums of squares
    let tss: f64 = result
        .fitted_values
        .iter()
        .zip(result.residuals.iter())
        .map(|(&f, &r)| (f + r).powi(2))
        .sum();
    let rss: f64 = result.residuals.iter().map(|&r| r * r).sum();
    let mss = tss - rss;

    let mut rows = Vec::new();

    // Model row
    if rank > 0 {
        rows.push(AnovaRow {
            source: "Model".to_string(),
            df: rank - 1,
            sum_sq: mss,
            mean_sq: mss / (rank - 1) as f64,
            f_value: if df_residual > 0 {
                Some(mss / (rank - 1) as f64 / (rss / df_residual as f64))
            } else {
                None
            },
            p_value: None, // Would need F-distribution calculation
        });
    }

    // Residuals row
    rows.push(AnovaRow {
        source: "Residuals".to_string(),
        df: df_residual,
        sum_sq: rss,
        mean_sq: rss / df_residual as f64,
        f_value: None,
        p_value: None,
    });

    AnovaTable { rows }
}

/// Extract effects from linear model
pub fn effects_lm(result: &LmResult, _set_sign: bool) -> Vec<f64> {
    result.effects.clone()
}

/// Extract model matrix from linear model
pub fn model_matrix_lm(_result: &LmResult) -> String {
    "model.matrix".to_string() // Placeholder
}

/// Extract labels from linear model
pub fn labels_lm(result: &LmResult) -> Vec<String> {
    (0..result.rank).map(|i| format!("x{}", i)).collect()
}
