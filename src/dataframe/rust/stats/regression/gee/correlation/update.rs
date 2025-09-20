//! Minimal alpha update utilities using Pearson-like residual correlations

use crate::stats::regression::gee::types::CorrelationStructure;

/// Estimate exchangeable correlation parameter (rho)
/// using moment estimate: average of off-diagonal correlations of residuals within clusters.
pub fn estimate_exchangeable_alpha(residuals: &[f64], id: &[usize]) -> f64 {
    if residuals.is_empty() {
        return 0.0;
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
        let r = &residuals[start..end];
        let m = r.len();
        if m >= 2 {
            for i in 0..m {
                for j in (i + 1)..m {
                    sum += r[i] * r[j];
                    count += 1;
                }
            }
        }
        start = end;
    }
    if count == 0 {
        0.0
    } else {
        (sum / count as f64).clamp(-0.99, 0.99)
    }
}

/// Estimate AR(1) correlation parameter (rho) using adjacent-lag residual products per cluster
pub fn estimate_ar1_alpha(residuals: &[f64], id: &[usize], waves: Option<&[usize]>) -> f64 {
    if residuals.is_empty() {
        return 0.0;
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
        let r = &residuals[start..end];
        if r.len() >= 2 {
            match waves {
                Some(ws) => {
                    let ws = &ws[start..end];
                    for i in 1..r.len() {
                        if ws[i] == ws[i - 1] + 1 {
                            sum += r[i] * r[i - 1];
                            count += 1;
                        }
                    }
                }
                None => {
                    for i in 1..r.len() {
                        sum += r[i] * r[i - 1];
                        count += 1;
                    }
                }
            }
        }
        start = end;
    }
    if count == 0 {
        0.0
    } else {
        (sum / count as f64).clamp(-0.99, 0.99)
    }
}
