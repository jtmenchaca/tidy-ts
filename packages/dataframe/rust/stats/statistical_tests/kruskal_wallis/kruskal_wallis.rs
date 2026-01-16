//! Kruskal-Wallis test implementation
//! Non-parametric alternative to one-way ANOVA

use crate::stats::core::types::{
    EffectSize, EffectSizeType, KruskalWallisTestResult, TestStatistic, TestStatisticName,
};
use crate::stats::distributions::pchisq;

/// Calculate ranks for a combined array with tie handling
fn rank(values: &[f64]) -> (Vec<f64>, f64) {
    let n = values.len();
    let mut indexed: Vec<(f64, usize)> = values
        .iter()
        .enumerate()
        .map(|(i, &val)| (val, i))
        .collect();
    indexed.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));

    let mut ranks = vec![0.0; n];
    let mut i = 0;
    let mut tie_correction = 0.0;

    while i < n {
        let mut j = i;
        // Find all tied values
        while j < n && indexed[j].0 == indexed[i].0 {
            j += 1;
        }

        // Calculate average rank for tied values
        let avg_rank = (i + 1 + j) as f64 / 2.0;

        // Assign average rank to all tied values
        for k in i..j {
            ranks[indexed[k].1] = avg_rank;
        }

        // Calculate tie correction
        let tie_count = j - i;
        if tie_count > 1 {
            tie_correction += (tie_count * (tie_count * tie_count - 1)) as f64;
        }

        i = j;
    }

    (ranks, tie_correction)
}

/// Perform Kruskal-Wallis test
///
/// # Arguments
/// * `groups` - Vector of groups, each group is a vector of numbers
/// * `alpha` - Significance level (default: 0.05)
///
/// # Returns
/// TestResult containing the test statistic, p-value, and degrees of freedom
pub fn kruskal_wallis_test(groups: &[Vec<f64>], alpha: f64) -> Result<KruskalWallisTestResult, String> {
    // Validate input
    if groups.len() < 2 {
        return Err("Need at least 2 groups for Kruskal-Wallis test".to_string());
    }

    // Remove any empty groups
    let non_empty_groups: Vec<&Vec<f64>> = groups.iter().filter(|g| !g.is_empty()).collect();
    if non_empty_groups.len() < 2 {
        return Err("Need at least 2 non-empty groups".to_string());
    }

    // Combine all observations
    let mut combined = Vec::new();
    let mut group_indices = Vec::new();

    for (i, group) in non_empty_groups.iter().enumerate() {
        for &val in *group {
            combined.push(val);
            group_indices.push(i);
        }
    }

    let n = combined.len();
    if n < 2 {
        return Err("Not enough observations".to_string());
    }

    // Calculate ranks
    let (ranks, tie_correction) = rank(&combined);

    // Calculate rank sums for each group
    let mut rank_sums = vec![0.0; non_empty_groups.len()];
    let mut group_sizes = vec![0; non_empty_groups.len()];

    for i in 0..n {
        let group_idx = group_indices[i];
        rank_sums[group_idx] += ranks[i];
        group_sizes[group_idx] += 1;
    }

    // Calculate H statistic following R's exact algorithm
    // STATISTIC <- sum(tapply(r, g, sum)^2 / tapply(r, g, length))
    let mut statistic = 0.0;
    for i in 0..non_empty_groups.len() {
        let ni = group_sizes[i] as f64;
        if ni > 0.0 {
            statistic += (rank_sums[i] * rank_sums[i]) / ni;
        }
    }

    // STATISTIC <- ((12 * STATISTIC / (n * (n + 1)) - 3 * (n + 1)) /
    //               (1 - sum(TIES^3 - TIES) / (n^3 - n)))

    // First calculate the main H statistic
    let n_f64 = n as f64;
    let mut h = (12.0 * statistic / (n_f64 * (n_f64 + 1.0))) - 3.0 * (n_f64 + 1.0);

    // Apply tie correction using R's exact formula
    let denominator = n_f64 * n_f64 * n_f64 - n_f64;
    let df = (non_empty_groups.len() - 1) as f64;
    if tie_correction == denominator {
        // All values are identical, H = 0, p = 1
        return Ok(KruskalWallisTestResult {
            test_statistic: TestStatistic {
                value: 0.0,
                name: TestStatisticName::HStatistic.as_str().to_string(),
            },
            p_value: 1.0,
            test_name: "Kruskal-Wallis Test".to_string(),
            alpha,
            error_message: None,
            degrees_of_freedom: df,
            effect_size: EffectSize {
                value: 0.0,
                name: EffectSizeType::EtaSquared.as_str().to_string(),
            },
            sample_size: n,
        });
    }

    // Apply tie correction: H_adjusted = H / (1 - sum(TIES^3 - TIES) / (n^3 - n))
    if tie_correction > 0.0 {
        h = h / (1.0 - tie_correction / denominator);
    }

    // Calculate p-value using chi-squared distribution
    let p_value = pchisq(h, df, false, false); // upper tail probability

    let _reject_null = p_value < alpha;

    // Calculate eta-squared effect size for Kruskal-Wallis
    // eta² = (H - k + 1) / (n - k) where k = number of groups
    let k = non_empty_groups.len() as f64;
    let eta_squared = if n_f64 - k > 0.0 {
        (h - k + 1.0) / (n_f64 - k)
    } else {
        0.0
    };

    Ok(KruskalWallisTestResult {
        test_statistic: TestStatistic {
            value: h,
            name: TestStatisticName::HStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "Kruskal-Wallis Test".to_string(),
        alpha,
        error_message: None,
        degrees_of_freedom: df,
        effect_size: EffectSize {
            value: eta_squared,
            name: EffectSizeType::EtaSquared.as_str().to_string(),
        },
        sample_size: n,
    })
}
