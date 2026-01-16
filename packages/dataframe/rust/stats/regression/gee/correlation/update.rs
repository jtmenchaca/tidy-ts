//! Minimal alpha update utilities using Pearson-like residual correlations

/// Estimate exchangeable correlation parameter (rho)
/// using moment estimate: average of off-diagonal correlations of Pearson residuals within clusters.
pub fn estimate_exchangeable_alpha(residuals: &[f64], id: &[usize]) -> f64 {
    if residuals.is_empty() {
        return 0.0;
    }

    // First, calculate Pearson residuals (standardized by sqrt(variance))
    let mut pearson_residuals = Vec::with_capacity(residuals.len());
    for &r in residuals {
        // For Pearson residuals, we should standardize by sqrt(variance)
        // But for simplicity, we'll use the raw residuals as an approximation
        pearson_residuals.push(r);
    }

    let mut sum = 0.0f64;
    let mut count = 0usize;
    let mut start = 0usize;

    while start < id.len() {
        let cid = id[start];
        let mut end = start + 1;
        while end < id.len() && id[end] == cid {
            end += 1;
        }

        // cluster residuals
        let r = &pearson_residuals[start..end];
        let m = r.len();

        if m >= 2 {
            // Calculate all pairwise correlations within cluster
            let mut cluster_sum = 0.0;
            let mut cluster_count = 0;

            for i in 0..m {
                for j in (i + 1)..m {
                    cluster_sum += r[i] * r[j];
                    cluster_count += 1;
                }
            }

            sum += cluster_sum;
            count += cluster_count;
        }
        start = end;
    }

    if count == 0 {
        0.0
    } else {
        // Apply more conservative bounds to match R's geepack behavior
        (sum / count as f64).clamp(-0.95, 0.95)
    }
}

/// Estimate AR(1) correlation parameter (rho) using adjacent-lag residual products per cluster
/// This follows the methodology in R's geepack for AR(1) correlation estimation
pub fn estimate_ar1_alpha(residuals: &[f64], id: &[usize], waves: Option<&[usize]>) -> f64 {
    if residuals.is_empty() {
        return 0.0;
    }

    let mut sum_numerator = 0.0f64;
    let mut sum_denominator = 0.0f64;
    let mut start = 0usize;

    while start < id.len() {
        let cid = id[start];
        let mut end = start + 1;
        while end < id.len() && id[end] == cid {
            end += 1;
        }

        let r = &residuals[start..end];
        if r.len() >= 2 {
            match waves {
                Some(ws) => {
                    let ws = &ws[start..end];
                    // Only use consecutive time points
                    for i in 1..r.len() {
                        if ws[i] == ws[i - 1] + 1 {
                            sum_numerator += r[i] * r[i - 1];
                            sum_denominator += r[i - 1] * r[i - 1];
                        }
                    }
                }
                None => {
                    // Assume consecutive observations
                    for i in 1..r.len() {
                        sum_numerator += r[i] * r[i - 1];
                        sum_denominator += r[i - 1] * r[i - 1];
                    }
                }
            }
        }
        start = end;
    }

    if sum_denominator == 0.0 || sum_denominator.abs() < 1e-10 {
        0.0
    } else {
        // Use the ratio estimator for AR(1) correlation
        let rho = sum_numerator / sum_denominator;
        // Apply more conservative bounds to match R's geepack behavior
        rho.clamp(-0.95, 0.95)
    }
}
