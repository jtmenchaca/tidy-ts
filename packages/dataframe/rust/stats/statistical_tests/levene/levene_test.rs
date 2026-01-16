use crate::stats::core::types::{
    EffectSize, EffectSizeType, OneWayAnovaTestResult, TestStatistic, TestStatisticName,
};
use statrs::distribution::{ContinuousCDF, FisherSnedecor};

/// Levene's test for equality of variances
///
/// ALGORITHM OVERVIEW:
/// 1. Calculate group medians (Brown-Forsythe modification for robustness)
/// 2. Compute absolute deviations from each group's median
/// 3. Perform one-way ANOVA on these deviations
/// 4. F-statistic tests if group means of deviations differ significantly
/// 5. Significant F-test indicates unequal variances across groups
///
/// Tests the null hypothesis that all groups have equal variances.
/// Uses the absolute deviations from group medians (Brown-Forsythe modification)
/// which is more robust to non-normality than using means.
///
/// # Arguments
/// * `groups` - Vector of groups, each containing numeric data
/// * `alpha` - Significance level (default: 0.05)
///
/// # Returns
/// * `OneWayAnovaTestResult` - F-statistic, p-value, degrees of freedom
///   - Significant result (p < alpha) indicates unequal variances
///   - Non-significant result suggests equal variances
pub fn levene_test<T, I>(groups: &[I], alpha: f64) -> Result<OneWayAnovaTestResult, String>
where
    T: Into<f64> + Copy + PartialOrd,
    I: AsRef<[T]>,
{
    // STEP 1: Input validation - ensure we have at least 2 groups to compare
    if groups.len() < 2 {
        return Err("Levene's test requires at least 2 groups".to_string());
    }

    // STEP 2: Data preparation - convert all data to f64 and validate each group
    // Each group must have at least 2 observations for variance calculation
    let data_groups: Vec<Vec<f64>> = groups
        .iter()
        .map(|group| {
            let vals: Vec<f64> = group.as_ref().iter().map(|&x| x.into()).collect();
            if vals.is_empty() {
                return Err("Empty group found".to_string());
            }
            if vals.len() < 2 {
                return Err("Each group must have at least 2 observations".to_string());
            }
            Ok(vals)
        })
        .collect::<Result<Vec<_>, _>>()?;

    // STEP 3: Calculate group medians (Brown-Forsythe modification)
    // Using medians instead of means makes the test more robust to outliers
    // and non-normal distributions. This is the key difference from classic Levene's test.
    let group_medians: Vec<f64> = data_groups
        .iter()
        .map(|group| {
            let mut sorted = group.clone();
            sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
            let n = sorted.len();
            // Calculate median: average of two middle values if even length, middle value if odd
            if n % 2 == 0 {
                (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0
            } else {
                sorted[n / 2]
            }
        })
        .collect();

    // STEP 4: Calculate absolute deviations from group medians
    // Transform each observation to its absolute distance from its group's median
    // This converts the variance test into a test of whether these deviations
    // have equal means across groups (which indicates equal variances)
    let deviations: Vec<Vec<f64>> = data_groups
        .iter()
        .zip(group_medians.iter())
        .map(|(group, &median)| group.iter().map(|&x| (x - median).abs()).collect())
        .collect();

    // STEP 5: Prepare data for ANOVA - flatten all deviations into single vector
    // and track group sizes for later calculations
    let mut all_deviations = Vec::new();
    let mut group_sizes = Vec::new();

    for dev_group in &deviations {
        all_deviations.extend(dev_group);
        group_sizes.push(dev_group.len());
    }

    let n_total = all_deviations.len();
    let k = groups.len(); // number of groups

    // Ensure we have enough data for meaningful ANOVA (at least k+1 total observations)
    if n_total < k + 1 {
        return Err("Insufficient data for Levene's test".to_string());
    }

    // STEP 6: Calculate group means of deviations
    // Each group's mean deviation represents how "spread out" that group is
    // Groups with higher variance will have larger mean deviations
    let group_means: Vec<f64> = deviations
        .iter()
        .map(|group| group.iter().sum::<f64>() / group.len() as f64)
        .collect();

    // STEP 7: Calculate grand mean of all deviations
    // This is the overall average deviation across all groups
    let grand_mean = all_deviations.iter().sum::<f64>() / n_total as f64;

    // STEP 8: Calculate between-group sum of squares (SSB)
    // Measures how much group means of deviations differ from the grand mean
    // Large SSB indicates groups have very different spread (unequal variances)
    let mut ss_between = 0.0;
    for (i, &group_mean) in group_means.iter().enumerate() {
        let ni = group_sizes[i] as f64;
        ss_between += ni * (group_mean - grand_mean).powi(2);
    }

    // STEP 9: Calculate within-group sum of squares (SSW)
    // Measures variability within each group's deviations
    // This represents the "error" or unexplained variance
    let mut ss_within = 0.0;
    for (i, dev_group) in deviations.iter().enumerate() {
        let group_mean = group_means[i];
        for &deviation in dev_group {
            ss_within += (deviation - group_mean).powi(2);
        }
    }

    // STEP 10: Calculate degrees of freedom for F-test
    // df_between = k-1 (number of groups minus 1)
    // df_within = n_total - k (total observations minus number of groups)
    let df_between = (k - 1) as f64;
    let df_within = (n_total - k) as f64;

    // STEP 11: Calculate mean squares (variance estimates)
    // MSB = SSB / df_between (between-group variance)
    // MSW = SSW / df_within (within-group variance)
    let ms_between = ss_between / df_between;
    let ms_within = ss_within / df_within;

    // STEP 12: Calculate F-statistic
    // F = MSB / MSW - ratio of between-group to within-group variance
    // Large F indicates groups have significantly different spreads
    let f_statistic = if ms_within > 0.0 {
        ms_between / ms_within
    } else {
        return Err("Zero within-group variance in deviations".to_string());
    };

    // STEP 13: Calculate p-value using F-distribution
    // Create F-distribution with calculated degrees of freedom
    // p-value = 1 - CDF(F) = probability of observing F or larger under null hypothesis
    let f_dist = FisherSnedecor::new(df_between, df_within)
        .map_err(|e| format!("Failed to create F-distribution: {}", e))?;

    let p_value = 1.0 - f_dist.cdf(f_statistic);

    // STEP 14: Calculate effect size (eta-squared)
    // Proportion of total variance explained by group differences
    // eta² = SSB / (SSB + SSW) - ranges from 0 to 1
    let eta_squared = if ss_between + ss_within > 0.0 {
        ss_between / (ss_between + ss_within)
    } else {
        0.0
    };

    // STEP 15: Calculate descriptive statistics for original data
    // These are included in the result for reference and interpretation
    let sample_means: Vec<f64> = data_groups
        .iter()
        .map(|group| group.iter().sum::<f64>() / group.len() as f64)
        .collect();

    let sample_std_devs: Vec<f64> = data_groups
        .iter()
        .zip(sample_means.iter())
        .map(|(group, &mean)| {
            let variance =
                group.iter().map(|&x| (x - mean).powi(2)).sum::<f64>() / (group.len() - 1) as f64;
            variance.sqrt()
        })
        .collect();

    // STEP 16: Return comprehensive test results
    // If p < alpha, reject null hypothesis (variances are unequal)
    // If p >= alpha, fail to reject null hypothesis (variances are equal)
    Ok(OneWayAnovaTestResult {
        test_statistic: TestStatistic {
            value: f_statistic,
            name: TestStatisticName::FStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "Levene's Test".to_string(),
        alpha,
        error_message: None,
        df_between,
        df_within,
        effect_size: EffectSize {
            value: eta_squared,
            name: EffectSizeType::EtaSquared.as_str().to_string(),
        },
        sample_size: n_total,
        sample_means,
        sample_std_devs,
        sum_of_squares: vec![ss_between, ss_within],
        r_squared: eta_squared,
        adjusted_r_squared: if n_total > k {
            1.0 - ((1.0 - eta_squared) * (n_total as f64 - 1.0) / (n_total as f64 - k as f64))
        } else {
            eta_squared
        },
    })
}
