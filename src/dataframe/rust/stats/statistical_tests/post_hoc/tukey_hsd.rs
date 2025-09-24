//! Tukey's Honestly Significant Difference (HSD) test
//!
//! Post-hoc test for pairwise comparisons after significant one-way ANOVA.
//! Assumes equal variances and uses the studentized range distribution.

use super::types::{PairwiseComparison, TukeyHsdTestResult};
use crate::stats::core::types::{ConfidenceInterval, TestStatistic};
use statrs::distribution::{ContinuousCDF, StudentsT};
use std::f64::consts::PI;

/// Standard normal PDF
fn phi(z: f64) -> f64 {
    (1.0 / (2.0 * PI).sqrt()) * (-0.5 * z * z).exp()
}

/// Standard normal CDF (using approximation)
fn big_phi(z: f64) -> f64 {
    if z < -8.0 {
        return 0.0;
    }
    if z > 8.0 {
        return 1.0;
    }

    // Use statrs for accurate standard normal CDF
    use statrs::distribution::{ContinuousCDF, Normal};
    let normal = Normal::new(0.0, 1.0).unwrap();
    normal.cdf(z)
}

/// Gamma function using statrs
fn gamma(x: f64) -> f64 {
    use statrs::function::gamma::gamma as statrs_gamma;
    statrs_gamma(x)
}

/// Studentized range CDF implementation based on the mathematical definition
/// F_R(q;k,ν) = (sqrt(2π) k ν^(ν/2)) / (Γ(ν/2) 2^(ν/2-1)) ∫[0,∞] s^(ν-1) φ(√ν s) [∫[-∞,∞] φ(z) [Φ(z+qs) - Φ(z)]^(k-1) dz] ds
pub fn ptukey_exact(q: f64, k: f64, nu: f64) -> f64 {
    if q <= 0.0 {
        return 0.0;
    }
    if q >= 20.0 {
        return 1.0; // For very large q, CDF approaches 1
    }

    // Pre-calculate constants
    let sqrt_2pi = (2.0 * PI).sqrt();
    let sqrt_nu = nu.sqrt();
    let gamma_nu_2 = gamma(nu / 2.0);
    let power_2 = 2.0_f64.powf(nu / 2.0 - 1.0);
    let nu_power = nu.powf(nu / 2.0);

    let constant = (sqrt_2pi * k * nu_power) / (gamma_nu_2 * power_2);

    // Numerical integration over s using Simpson's rule
    let n_steps = 100;
    let s_max = 10.0; // Integration limit for s
    let ds = s_max / n_steps as f64;

    let mut integral_s = 0.0;

    for i in 0..=n_steps {
        let s = i as f64 * ds;
        if s == 0.0 {
            continue; // Skip s=0 to avoid division issues
        }

        // Calculate s^(ν-1) * φ(√ν s)
        let s_term = s.powf(nu - 1.0) * phi(sqrt_nu * s);

        // Inner integral over z using numerical integration
        let n_z_steps = 50;
        let z_min = -8.0;
        let z_max = 8.0;
        let dz = (z_max - z_min) / n_z_steps as f64;

        let mut integral_z = 0.0;

        for j in 0..=n_z_steps {
            let z = z_min + j as f64 * dz;
            let phi_z = phi(z);
            let cdf_diff = big_phi(z + q * s) - big_phi(z);

            if cdf_diff > 0.0 {
                let term = phi_z * cdf_diff.powf(k - 1.0);

                // Simpson's rule weights
                let weight = if j == 0 || j == n_z_steps {
                    1.0
                } else if j % 2 == 1 {
                    4.0
                } else {
                    2.0
                };
                integral_z += weight * term;
            }
        }

        integral_z *= dz / 3.0; // Simpson's rule

        // Simpson's rule weights for outer integral
        let weight = if i == 0 || i == n_steps {
            1.0
        } else if i % 2 == 1 {
            4.0
        } else {
            2.0
        };
        integral_s += weight * s_term * integral_z;
    }

    integral_s *= ds / 3.0; // Simpson's rule

    let result = constant * integral_s;

    // Clamp result to [0, 1]
    result.max(0.0).min(1.0)
}

/// Performs Tukey's HSD test for multiple comparisons
///
/// # Arguments
/// * `groups` - Vector of groups, where each group is a vector of observations
/// * `alpha` - Significance level (default: 0.05)
///
/// # Returns
/// A PostHocResult containing all pairwise comparisons
pub fn tukey_hsd<T, I>(groups: &[I], alpha: f64) -> TukeyHsdTestResult
where
    T: Into<f64> + Copy,
    I: AsRef<[T]>,
{
    let n_groups = groups.len();
    if n_groups < 2 {
        return TukeyHsdTestResult {
            test_statistic: TestStatistic {
                value: 0.0,
                name: "Q-Statistic".to_string(),
            },
            p_value: 1.0,
            test_name: "Tukey HSD".to_string(),
            alpha,
            error_message: Some("Tukey HSD requires at least 2 groups".to_string()),
            note: None,
            correction_method: "Tukey HSD".to_string(),
            n_groups: 0,
            n_total: 0,
            comparisons: Vec::new(),
        };
    }

    // Calculate group means and sizes
    let mut group_stats = Vec::new();
    let mut total_n = 0usize;
    let mut pooled_variance = 0.0;

    for group in groups {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        if values.is_empty() {
            return TukeyHsdTestResult {
                test_statistic: TestStatistic {
                    value: 0.0,
                    name: "Q-Statistic".to_string(),
                },
                p_value: 1.0,
                test_name: "Tukey HSD".to_string(),
                alpha,
                error_message: Some("Empty group found".to_string()),
                note: None,
                correction_method: "Tukey HSD".to_string(),
                n_groups: 0,
                n_total: 0,
                comparisons: Vec::new(),
            };
        }

        let n = values.len();
        let mean = values.iter().sum::<f64>() / n as f64;
        let variance = values.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1) as f64;

        group_stats.push((mean, n, variance));
        total_n += n;
        pooled_variance += (n - 1) as f64 * variance;
    }

    // Calculate pooled variance (MSE)
    let df_within = (total_n - n_groups) as f64;
    pooled_variance /= df_within;

    // Perform pairwise comparisons
    let mut comparisons = Vec::new();

    // For Tukey HSD, we need to use the studentized range distribution
    // For now, we'll calculate p-values individually using the correct method

    for i in 0..n_groups {
        for j in (i + 1)..n_groups {
            let (mean_i, n_i, _) = group_stats[i];
            let (mean_j, n_j, _) = group_stats[j];

            let mean_diff = mean_i - mean_j;
            let se = (pooled_variance * (1.0 / n_i as f64 + 1.0 / n_j as f64)).sqrt();

            // Calculate q-statistic (studentized range statistic)
            // For Tukey HSD: q = sqrt(2) * |mean_diff| / SE
            // This matches the built-in TukeyHSD function in R
            let q_statistic = (mean_diff.abs() / se) * (2.0_f64).sqrt();

            // Calculate p-value using proper studentized range distribution
            let cdf_value = ptukey_exact(q_statistic, n_groups as f64, df_within);
            let p_value = 1.0 - cdf_value;

            // For Tukey HSD, the p-value from studentized range is already adjusted
            let adjusted_p = p_value;

            // For confidence intervals, use t-distribution critical value
            let t_dist = StudentsT::new(0.0, 1.0, df_within).unwrap();
            let t_critical = t_dist.inverse_cdf(1.0 - alpha / 2.0);
            let ci_margin = t_critical * se;
            let ci_lower = mean_diff - ci_margin;
            let ci_upper = mean_diff + ci_margin;

            let comparison = PairwiseComparison {
                group1: format!("Group_{}", i + 1),
                group2: format!("Group_{}", j + 1),
                mean_difference: mean_diff,
                standard_error: se,
                test_statistic: TestStatistic {
                    value: q_statistic,
                    name: "Q-Statistic".to_string(),
                },
                p_value: p_value,
                adjusted_p_value: adjusted_p,
                confidence_interval: ConfidenceInterval {
                    lower: ci_lower,
                    upper: ci_upper,
                    confidence_level: 1.0 - alpha,
                },
                significant: adjusted_p < alpha,
            };

            comparisons.push(comparison);
        }
    }

    TukeyHsdTestResult {
        test_statistic: TestStatistic {
            value: 0.0, // Post-hoc tests use pairwise comparisons, no single global statistic
            name: "Q-Statistic".to_string(),
        },
        p_value: 1.0, // Post-hoc tests use pairwise comparisons, no single global p-value
        test_name: "Tukey HSD".to_string(),
        alpha,
        error_message: None,
        note: Some("Post-hoc header has no global test; see pairwise rows".to_string()),
        correction_method: "Tukey HSD".to_string(), // Tukey HSD uses studentized range distribution, not Bonferroni
        n_groups,
        n_total: total_n,
        comparisons,
    }
}
