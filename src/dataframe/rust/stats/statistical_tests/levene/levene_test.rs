use crate::stats::core::types::{OneWayAnovaTestResult, TestStatistic, EffectSize, TestStatisticName, EffectSizeType};
use statrs::distribution::{ContinuousCDF, FisherSnedecor};

/// Levene's test for equality of variances
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
    if groups.len() < 2 {
        return Err("Levene's test requires at least 2 groups".to_string());
    }

    // Convert to f64 and validate
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

    // Calculate group medians (Brown-Forsythe modification)
    let group_medians: Vec<f64> = data_groups
        .iter()
        .map(|group| {
            let mut sorted = group.clone();
            sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
            let n = sorted.len();
            if n % 2 == 0 {
                (sorted[n/2 - 1] + sorted[n/2]) / 2.0
            } else {
                sorted[n/2]
            }
        })
        .collect();

    // Calculate absolute deviations from group medians
    let deviations: Vec<Vec<f64>> = data_groups
        .iter()
        .zip(group_medians.iter())
        .map(|(group, &median)| {
            group.iter().map(|&x| (x - median).abs()).collect()
        })
        .collect();

    // Flatten deviations and create group indicators
    let mut all_deviations = Vec::new();
    let mut group_sizes = Vec::new();
    
    for dev_group in &deviations {
        all_deviations.extend(dev_group);
        group_sizes.push(dev_group.len());
    }

    let n_total = all_deviations.len();
    let k = groups.len(); // number of groups

    if n_total < k + 1 {
        return Err("Insufficient data for Levene's test".to_string());
    }

    // Calculate group means of deviations
    let group_means: Vec<f64> = deviations
        .iter()
        .map(|group| group.iter().sum::<f64>() / group.len() as f64)
        .collect();

    // Grand mean of all deviations
    let grand_mean = all_deviations.iter().sum::<f64>() / n_total as f64;

    // Between-group sum of squares
    let mut ss_between = 0.0;
    for (i, &group_mean) in group_means.iter().enumerate() {
        let ni = group_sizes[i] as f64;
        ss_between += ni * (group_mean - grand_mean).powi(2);
    }

    // Within-group sum of squares
    let mut ss_within = 0.0;
    for (i, dev_group) in deviations.iter().enumerate() {
        let group_mean = group_means[i];
        for &deviation in dev_group {
            ss_within += (deviation - group_mean).powi(2);
        }
    }

    // Degrees of freedom
    let df_between = (k - 1) as f64;
    let df_within = (n_total - k) as f64;

    // Mean squares
    let ms_between = ss_between / df_between;
    let ms_within = ss_within / df_within;

    // F-statistic
    let f_statistic = if ms_within > 0.0 {
        ms_between / ms_within
    } else {
        return Err("Zero within-group variance in deviations".to_string());
    };

    // p-value using F-distribution
    let f_dist = FisherSnedecor::new(df_between, df_within)
        .map_err(|e| format!("Failed to create F-distribution: {}", e))?;
    
    let p_value = 1.0 - f_dist.cdf(f_statistic);

    // Effect size (eta-squared)
    let eta_squared = if ss_between + ss_within > 0.0 {
        ss_between / (ss_between + ss_within)
    } else {
        0.0
    };

    // Calculate sample means and standard deviations for the original data
    let sample_means: Vec<f64> = data_groups
        .iter()
        .map(|group| group.iter().sum::<f64>() / group.len() as f64)
        .collect();

    let sample_std_devs: Vec<f64> = data_groups
        .iter()
        .zip(sample_means.iter())
        .map(|(group, &mean)| {
            let variance = group.iter()
                .map(|&x| (x - mean).powi(2))
                .sum::<f64>() / (group.len() - 1) as f64;
            variance.sqrt()
        })
        .collect();

    Ok(OneWayAnovaTestResult {
        test_statistic: TestStatistic {
            value: f_statistic,
            name: TestStatisticName::FStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "Levene's Test".to_string(),
        alpha,
        error_message: None,
        degrees_of_freedom: df_between + df_within,
        effect_size: EffectSize {
            value: eta_squared,
            effect_type: EffectSizeType::EtaSquared.as_str().to_string(),
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