//! Games-Howell test for post-hoc comparisons
//!
//! Non-parametric alternative to Tukey HSD that does not assume equal variances.
//! Uses Welch's t-test for pairwise comparisons with adjusted degrees of freedom.

use super::types::{PairwiseComparison, GamesHowellTestResult};
use statrs::distribution::{ContinuousCDF, StudentsT};

/// Performs Games-Howell test for multiple comparisons
///
/// # Arguments
/// * `groups` - Vector of groups, where each group is a vector of observations
/// * `alpha` - Significance level (default: 0.05)
///
/// # Returns
/// A PostHocResult containing all pairwise comparisons
pub fn games_howell<T, I>(groups: &[I], alpha: f64) -> GamesHowellTestResult
where
    T: Into<f64> + Copy,
    I: AsRef<[T]>,
{
    let n_groups = groups.len();
    if n_groups < 2 {
        return GamesHowellTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: 0.0,
                name: "T-Statistic".to_string(),
            },
            p_value: 1.0,
            test_name: "Games-Howell".to_string(),
            alpha,
            error_message: Some("Games-Howell requires at least 2 groups".to_string()),
            note: None,
            correction_method: "Games-Howell".to_string(),
            n_groups: 0,
            n_total: 0,
            comparisons: Vec::new(),
        };
    }

    // Calculate group statistics
    let mut group_stats = Vec::new();
    let mut total_n = 0usize;
    
    for group in groups {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        if values.len() < 2 {
            return GamesHowellTestResult {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: "T-Statistic".to_string(),
                },
                p_value: 1.0,
                test_name: "Games-Howell".to_string(),
                alpha,
                error_message: Some("Each group must have at least 2 observations".to_string()),
                note: None,
                correction_method: "Games-Howell".to_string(),
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
    }
    
    // Perform pairwise comparisons
    let mut comparisons = Vec::new();
    let _n_comparisons = n_groups * (n_groups - 1) / 2;
    
    for i in 0..n_groups {
        for j in (i + 1)..n_groups {
            let (mean_i, n_i, var_i) = group_stats[i];
            let (mean_j, n_j, var_j) = group_stats[j];
            
            let mean_diff = mean_i - mean_j;
            
            // Calculate Welch's standard error
            let se_i = var_i / n_i as f64;
            let se_j = var_j / n_j as f64;
            let se_diff = (se_i + se_j).sqrt();
            
            // Calculate Welch's degrees of freedom
            let df_numerator = (se_i + se_j).powi(2);
            let df_denominator = se_i.powi(2) / (n_i - 1) as f64 + se_j.powi(2) / (n_j - 1) as f64;
            let df = df_numerator / df_denominator;
            
            // Calculate t-statistic
            let t_statistic = mean_diff.abs() / se_diff;
            
            // Games-Howell uses studentized range distribution for p-values
            // p-value = P(Q > sqrt(2) * |t|, k, df) where Q is studentized range
            let q_statistic = t_statistic * (2.0_f64).sqrt();
            
            // Use the same studentized range CDF function as in Tukey HSD
            let cdf_value = super::ptukey_exact(q_statistic, n_groups as f64, df);
            let p_value = 1.0 - cdf_value;
            
            // For Games-Howell, the p-value from studentized range is already adjusted
            let adjusted_p = p_value;
            
            // Calculate confidence interval using t-distribution
            let t_dist = StudentsT::new(0.0, 1.0, df).unwrap_or_else(|_| {
                // Fall back to standard normal if df is problematic
                StudentsT::new(0.0, 1.0, 1000.0).unwrap()
            });
            let critical_value = t_dist.inverse_cdf(1.0 - alpha / 2.0);
            let ci_margin = critical_value * se_diff;
            let ci_lower = mean_diff - ci_margin;
            let ci_upper = mean_diff + ci_margin;
            
            let comparison = PairwiseComparison {
                group1: format!("Group_{}", i + 1),
                group2: format!("Group_{}", j + 1),
                mean_difference: mean_diff,
                standard_error: se_diff,
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: t_statistic,
                    name: "T-Statistic".to_string(),
                },
                p_value: p_value,
                adjusted_p_value: adjusted_p,
                confidence_interval: crate::stats::core::types::ConfidenceInterval {
                    lower: ci_lower,
                    upper: ci_upper,
                    confidence_level: 1.0 - alpha,
                },
                significant: adjusted_p < alpha,
            };
            
            comparisons.push(comparison);
        }
    }
    
    GamesHowellTestResult {
        test_statistic: crate::stats::core::types::TestStatistic {
            value: 0.0, // Post-hoc tests use pairwise comparisons, no single global statistic
            name: "T-Statistic".to_string(),
        },
        p_value: 1.0, // Post-hoc tests use pairwise comparisons, no single global p-value
        test_name: "Games-Howell".to_string(),
        alpha,
        error_message: None,
        note: Some("Post-hoc header has no global test; see pairwise rows".to_string()),
        correction_method: "Games-Howell".to_string(), // Games-Howell uses its own degrees of freedom adjustment
        n_groups,
        n_total: total_n,
        comparisons,
    }
}