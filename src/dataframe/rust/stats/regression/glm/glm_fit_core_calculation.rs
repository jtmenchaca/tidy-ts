//! GLM fit calculation functions
//!
//! This module contains calculation logic for GLM fitting results.

// Unused import removed

/// Calculates residuals for GLM
pub fn calculate_residuals(
    y: &[f64],
    mu: &[f64],
    eta: &[f64],
    mu_eta: &dyn Fn(&[f64]) -> Vec<f64>,
) -> Vec<f64> {
    y.iter()
        .zip(mu.iter())
        .zip(mu_eta(eta).iter())
        .map(|((&y_i, &mu_i), &mu_eta_i)| (y_i - mu_i) / mu_eta_i)
        .collect()
}

/// Calculates working weights for GLM
pub fn calculate_working_weights(
    weights: &[f64],
    mu: &[f64],
    eta: &[f64],
    variance: &dyn Fn(&[f64]) -> Vec<f64>,
    mu_eta: &dyn Fn(&[f64]) -> Vec<f64>,
) -> (Vec<f64>, Vec<bool>) {
    let n = weights.len();
    let mut w = vec![0.0; n];
    let mut good = vec![false; n];

    let varmu = variance(mu);
    let mu_eta_val = mu_eta(eta);

    for i in 0..n {
        good[i] = weights[i] > 0.0 && mu_eta_val[i] != 0.0;
        if good[i] {
            w[i] = (weights[i] * mu_eta_val[i] * mu_eta_val[i] / varmu[i]).sqrt();
        }
    }

    (w, good)
}

/// Calculates null deviance
pub fn calculate_null_deviance(
    y: &[f64],
    weights: &[f64],
    offset: &[f64],
    intercept: bool,
    linkinv: &dyn Fn(&[f64]) -> Vec<f64>,
    dev_resids: &dyn Fn(&[f64], &[f64], &[f64]) -> Vec<f64>,
) -> f64 {
    let n = y.len();
    let wtdmu = if intercept {
        weights
            .iter()
            .zip(y.iter())
            .map(|(w, &y)| w * y)
            .sum::<f64>()
            / weights.iter().sum::<f64>()
    } else {
        linkinv(offset)[0] // Assuming single value for null model
    };

    dev_resids(y, &vec![wtdmu; n], weights).iter().sum::<f64>()
}

/// Calculates degrees of freedom
pub fn calculate_degrees_of_freedom(
    n: usize,
    p: usize,
    weights: &[f64],
    intercept: bool,
    empty: bool,
) -> (usize, usize, usize, usize) {
    let n_ok = n - weights.iter().filter(|&&w| w == 0.0).count();
    let nulldf = n_ok - if intercept { 1 } else { 0 };
    let rank = if empty { 0 } else { p };
    let resdf = n_ok - rank;

    (n_ok, nulldf, rank, resdf)
}

/// Calculates AIC
pub fn calculate_aic(
    y: &[f64],
    mu: &[f64],
    weights: &[f64],
    deviance: f64,
    rank: usize,
    aic: &dyn Fn(&[f64], &[f64], &[f64], f64) -> f64,
) -> f64 {
    aic(y, mu, weights, deviance) + 2.0 * rank as f64
}

/// Creates final working weights
pub fn create_final_working_weights(w: &[f64], good: &[bool]) -> Vec<f64> {
    let mut wt = vec![0.0; w.len()];
    for (i, &is_good) in good.iter().enumerate() {
        if is_good {
            wt[i] = w[i] * w[i];
        }
    }
    wt
}
