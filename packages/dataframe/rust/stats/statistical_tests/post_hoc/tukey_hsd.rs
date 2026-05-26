//! Tukey's Honestly Significant Difference (HSD) test
//!
//! Post-hoc test for pairwise comparisons after significant one-way ANOVA.
//! Assumes equal variances and uses the studentized range distribution
//! (`ptukey` / `qtukey` in [`super::studentized_range`]).

use super::studentized_range::{ptukey, qtukey};
use super::types::{PairwiseComparison, TukeyHsdTestResult};
use crate::stats::core::types::{ConfidenceInterval, TestStatistic};

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

    // Match R's TukeyHSD convention: lower-triangle iteration produces
    // pairs labeled `"higher-lower"` with mean_diff = mean[higher] - mean[lower].
    // R source: TukeyHSD.R L66-75 — `center <- outer(means, means, "-")`
    // then `keep <- lower.tri(center)` and labels are `outer(nms, nms, paste, sep="-")[keep]`.
    for j in 0..n_groups {
        for i in (j + 1)..n_groups {
            let (mean_i, n_i, _) = group_stats[i];
            let (mean_j, n_j, _) = group_stats[j];

            // mean_diff = mean(higher-indexed) - mean(lower-indexed), matches R.
            let mean_diff = mean_i - mean_j;
            let se = (pooled_variance * (1.0 / n_i as f64 + 1.0 / n_j as f64)).sqrt();

            // Calculate q-statistic (studentized range statistic)
            // For Tukey HSD: q = sqrt(2) * |mean_diff| / SE
            let q_statistic = (mean_diff.abs() / se) * (2.0_f64).sqrt();

            // Calculate p-value using R's studentized range distribution
            // (Copenhaver-Holland 1988, ported from r-source-trunk/src/nmath/ptukey.c).
            // For Tukey HSD on one ANOVA: rr=1, cc=n_groups.
            let cdf_value = ptukey(q_statistic, 1.0, n_groups as f64, df_within);
            let p_value = 1.0 - cdf_value;

            // For Tukey HSD, the p-value from studentized range is already adjusted
            let adjusted_p = p_value;

            // Confidence interval using studentized range critical value:
            //   ci_margin = qtukey(1 - alpha, 1, n_groups, df) / sqrt(2) * se
            // where se = sqrt(MSE * (1/n_i + 1/n_j)) (matches R's TukeyHSD output).
            let q_critical = qtukey(1.0 - alpha, 1.0, n_groups as f64, df_within);
            let ci_margin = q_critical / (2.0_f64).sqrt() * se;
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
