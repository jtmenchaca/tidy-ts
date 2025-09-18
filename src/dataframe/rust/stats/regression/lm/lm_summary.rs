//! Linear model summary and statistics

use super::lm_types::{CoefficientSummary, FStatistic, LmResult, LmSummary, QrResult};

/// Generate summary statistics for linear model
pub fn summary_lm(result: &LmResult) -> LmSummary {
    let n = result.residuals.len();
    let _p = result.coefficients.len();
    let rank = result.rank;
    let df_residual = result.df_residual;

    // Calculate residual standard error (sigma)
    let rss: f64 = result.residuals.iter().map(|&r| r * r).sum();
    let sigma = if df_residual > 0 {
        (rss / df_residual as f64).sqrt()
    } else {
        0.0
    };

    // Calculate R-squared
    let tss: f64 = result
        .fitted_values
        .iter()
        .zip(result.residuals.iter())
        .map(|(&f, &r)| (f + r).powi(2))
        .sum();
    let r_squared = if tss > 0.0 { 1.0 - rss / tss } else { 0.0 };

    // Calculate adjusted R-squared
    let adj_r_squared = if n > rank {
        1.0 - (1.0 - r_squared) * (n as f64 - 1.0) / (n as f64 - rank as f64)
    } else {
        r_squared
    };

    // Calculate coefficient statistics
    let mut coefficients = Vec::new();
    if let Some(qr) = &result.qr {
        // Use QR decomposition for standard errors
        for i in 0..rank {
            let estimate = result.coefficients[i];

            // Calculate standard error using QR decomposition
            let std_error = calculate_standard_error(qr, i, sigma);

            let t_value = if std_error > 0.0 {
                estimate / std_error
            } else {
                0.0
            };
            let p_value = 2.0 * (1.0 - t_distribution_cdf(t_value.abs(), df_residual as f64));

            coefficients.push(CoefficientSummary {
                estimate,
                std_error,
                t_value,
                p_value,
            });
        }
    } else {
        // Fallback: simple standard errors
        for i in 0..rank {
            let estimate = result.coefficients[i];
            let std_error = sigma; // Simplified
            let t_value = if std_error > 0.0 {
                estimate / std_error
            } else {
                0.0
            };
            let p_value = 2.0 * (1.0 - t_distribution_cdf(t_value.abs(), df_residual as f64));

            coefficients.push(CoefficientSummary {
                estimate,
                std_error,
                t_value,
                p_value,
            });
        }
    }

    // Calculate F-statistic
    let fstatistic = if rank > 0 && df_residual > 0 {
        let mss = tss - rss;
        let f_value = (mss / (rank as f64 - 1.0)) / (rss / df_residual as f64);
        let f_p_value = 1.0 - f_distribution_cdf(f_value, (rank - 1) as f64, df_residual as f64);

        Some(FStatistic {
            value: f_value,
            num_df: rank - 1,
            den_df: df_residual,
            p_value: f_p_value,
        })
    } else {
        None
    };

    // Calculate covariance matrix (simplified)
    let cov_unscaled = calculate_covariance_matrix(result, sigma);

    LmSummary {
        coefficients,
        sigma,
        df: vec![rank, df_residual],
        r_squared,
        adj_r_squared,
        fstatistic,
        cov_unscaled,
        correlation: None,
    }
}

/// Calculate standard error using QR decomposition
fn calculate_standard_error(_qr: &QrResult, _param_idx: usize, sigma: f64) -> f64 {
    // Simplified calculation - in practice, this would use the QR decomposition
    // to solve for the diagonal elements of (X'X)^-1
    sigma // Placeholder
}

/// Calculate covariance matrix
fn calculate_covariance_matrix(result: &LmResult, sigma: f64) -> Vec<Vec<f64>> {
    let rank = result.rank;
    let mut cov = vec![vec![0.0; rank]; rank];

    // Simplified covariance calculation
    for i in 0..rank {
        for j in 0..rank {
            if i == j {
                cov[i][j] = sigma * sigma; // Diagonal elements
            }
        }
    }

    cov
}

/// T-distribution CDF approximation
fn t_distribution_cdf(t: f64, df: f64) -> f64 {
    // Simplified approximation - in practice, use proper t-distribution
    if df > 30.0 {
        // Approximate with normal distribution
        normal_cdf(t)
    } else {
        // Use t-distribution approximation
        0.5 + 0.5 * (t / (t * t + df).sqrt()).atan() * (df + 1.0) / (df + t * t)
    }
}

/// F-distribution CDF approximation
fn f_distribution_cdf(f: f64, _df1: f64, _df2: f64) -> f64 {
    // Simplified approximation - in practice, use proper F-distribution
    if f < 0.0 {
        0.0
    } else if f > 100.0 {
        1.0
    } else {
        0.5 + 0.5 * (f - 1.0).atan() / std::f64::consts::PI
    }
}

/// Normal distribution CDF approximation
fn normal_cdf(x: f64) -> f64 {
    0.5 * (1.0 + erf(x / 2.0_f64.sqrt()))
}

/// Error function approximation
fn erf(x: f64) -> f64 {
    // Abramowitz and Stegun approximation
    let a1 = 0.254829592;
    let a2 = -0.284496736;
    let a3 = 1.421413741;
    let a4 = -1.453152027;
    let a5 = 1.061405429;
    let p = 0.3275911;

    let sign = if x >= 0.0 { 1.0 } else { -1.0 };
    let x = x.abs();

    let t = 1.0 / (1.0 + p * x);
    let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * (-x * x).exp();

    sign * y
}
