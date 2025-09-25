use super::super::super::core::types::{
    EffectSize, EffectSizeType, OneWayAnovaTestResult, TestStatistic, TestStatisticName,
    WelchAnovaTestResult,
};
use super::super::super::core::{TailType, calculate_p, eta_squared};
use statrs::distribution::FisherSnedecor;

/// Performs a one-way ANOVA test to compare the means of multiple independent groups.

pub fn anova<T, I>(data_groups: &[I], alpha: f64) -> Result<OneWayAnovaTestResult, String>
where
    T: Into<f64> + Copy,
    I: AsRef<[T]>,
{
    let num_groups = data_groups.len();
    if num_groups < 2 {
        return Err("ANOVA requires at least two groups".to_string());
    }

    // Flatten all data and compute grand mean
    let mut all_values = Vec::new();
    for group in data_groups {
        let slice = group.as_ref();
        if slice.is_empty() {
            return Err("Empty group data".to_string());
        }
        all_values.extend(slice.iter().copied().map(Into::into));
    }

    let total_n = all_values.len() as f64;
    let grand_mean = all_values.iter().sum::<f64>() / total_n;

    // Sum of Squares Between Groups (SSB)
    let ss_between = data_groups.iter().fold(0.0, |acc, group| {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        let n = values.len() as f64;
        let mean = values.iter().sum::<f64>() / n;
        acc + n * (mean - grand_mean).powi(2)
    });

    // Sum of Squares Within Groups (SSW)
    let ss_within = data_groups.iter().fold(0.0, |acc, group| {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        let mean = values.iter().sum::<f64>() / values.len() as f64;
        acc + values.iter().map(|x| (x - mean).powi(2)).sum::<f64>()
    });

    // Total Sum of Squares (SST) for effect size calculation
    let ss_total = ss_between + ss_within;

    let df_between = (num_groups - 1) as f64;
    let df_within = total_n - num_groups as f64;

    if df_within <= 0.0 {
        return Err("Degrees of freedom too small".to_string());
    }

    let ms_between = ss_between / df_between;
    let ms_within = ss_within / df_within;

    if ms_within == 0.0 {
        return Err("Mean square within groups is zero".to_string());
    }

    let f_statistic = ms_between / ms_within;

    let f_dist = match FisherSnedecor::new(df_between, df_within) {
        Ok(dist) => dist,
        Err(e) => {
            return Err(format!("Failed to create F distribution: {e}"));
        }
    };

    let p_value = calculate_p(f_statistic, TailType::Right, &f_dist);

    // Calculate sample means and standard deviations for each group
    let mut sample_means = Vec::new();
    let mut sample_std_devs = Vec::new();

    for group in data_groups {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        let n = values.len() as f64;
        let mean = values.iter().sum::<f64>() / n;
        let variance = values.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1.0);
        let std_dev = variance.sqrt();

        sample_means.push(mean);
        sample_std_devs.push(std_dev);
    }

    let eta_sq = eta_squared(ss_between, ss_total);
    let r_squared = ss_between / ss_total;
    let adjusted_r_squared =
        1.0 - ((1.0 - r_squared) * (total_n - 1.0) / (total_n - num_groups as f64));

    Ok(OneWayAnovaTestResult {
        test_statistic: TestStatistic {
            value: f_statistic,
            name: TestStatisticName::FStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "One-way ANOVA".to_string(),
        alpha,
        error_message: None,
        degrees_of_freedom: df_between,
        effect_size: EffectSize {
            value: eta_sq,
            effect_type: EffectSizeType::EtaSquared.as_str().to_string(),
        },
        sample_size: total_n as usize,
        r_squared,
        adjusted_r_squared,
        sample_means,
        sample_std_devs,
        sum_of_squares: vec![ss_between, ss_within, ss_total],
    })
}

/// Performs Welch's ANOVA test for comparing means when variances are unequal.
/// This is an alternative to one-way ANOVA that doesn't assume equal variances.
///
/// References:
/// - Welch, B. L. (1951). On the comparison of several mean values: an alternative approach.
/// - Games, P. A., & Howell, J. F. (1976). Pairwise multiple comparison procedures.
pub fn welch_anova<T, I>(data_groups: &[I], alpha: f64) -> Result<WelchAnovaTestResult, String>
where
    T: Into<f64> + Copy,
    I: AsRef<[T]>,
{
    let num_groups = data_groups.len();
    if num_groups < 2 {
        return Err("Welch ANOVA requires at least two groups".to_string());
    }

    // Calculate group statistics
    let mut group_stats = Vec::new();
    let mut total_n = 0;

    for group in data_groups {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        if values.len() < 2 {
            return Err("Each group must have at least 2 observations for Welch ANOVA".to_string());
        }

        let n = values.len() as f64;
        let mean = values.iter().sum::<f64>() / n;
        let variance = values.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1.0);
        let std_dev = variance.sqrt();

        if variance <= 0.0 {
            return Err("Group variance must be positive".to_string());
        }

        group_stats.push((n, mean, variance, std_dev));
        total_n += values.len();
    }

    // Calculate weights (inverse of variance divided by sample size)
    let weights: Vec<f64> = group_stats.iter().map(|(n, _, var, _)| n / var).collect();
    let sum_weights: f64 = weights.iter().sum();

    // Weighted grand mean
    let weighted_grand_mean = group_stats
        .iter()
        .zip(weights.iter())
        .map(|((_, mean, _, _), w)| mean * w)
        .sum::<f64>()
        / sum_weights;

    // Calculate Welch's F statistic
    let numerator: f64 = group_stats
        .iter()
        .zip(weights.iter())
        .map(|((_, mean, _, _), w)| w * (mean - weighted_grand_mean).powi(2))
        .sum();

    let f_welch = numerator / (num_groups as f64 - 1.0);

    // Calculate denominator for F statistic
    let lambda: f64 = group_stats
        .iter()
        .zip(weights.iter())
        .map(|((n, _, _, _), w)| (1.0 - w / sum_weights).powi(2) / (n - 1.0))
        .sum();

    let denominator =
        1.0 + (2.0 * (num_groups as f64 - 2.0) * lambda) / ((num_groups as f64).powi(2) - 1.0);

    let f_statistic = f_welch / denominator;

    // Calculate approximate degrees of freedom using Welch-Satterthwaite equation
    let df_num = num_groups as f64 - 1.0;
    let df_denom = ((num_groups as f64).powi(2) - 1.0) / (3.0 * lambda);

    if df_denom <= 0.0 {
        return Err("Invalid degrees of freedom calculation".to_string());
    }

    let f_dist = match FisherSnedecor::new(df_num, df_denom) {
        Ok(dist) => dist,
        Err(e) => {
            return Err(format!("Failed to create F distribution: {e}"));
        }
    };

    let p_value = calculate_p(f_statistic, TailType::Right, &f_dist);

    // Calculate effect size (omega-squared for Welch ANOVA)
    // This is an approximation since traditional eta-squared doesn't apply directly
    let ss_between_approx = numerator;
    let ss_total_approx = group_stats
        .iter()
        .map(|(n, mean, var, _)| (n - 1.0) * var + n * (mean - weighted_grand_mean).powi(2))
        .sum::<f64>();

    let omega_squared = if ss_total_approx > 0.0 {
        (ss_between_approx - (num_groups as f64 - 1.0)) / (ss_total_approx + 1.0)
    } else {
        0.0
    }
    .max(0.0); // Ensure non-negative

    // Extract means and std devs for output
    let sample_means: Vec<f64> = group_stats.iter().map(|(_, mean, _, _)| *mean).collect();
    let sample_std_devs: Vec<f64> = group_stats.iter().map(|(_, _, _, std)| *std).collect();

    // For Welch ANOVA, we don't have traditional sum of squares
    let _sum_of_squares = vec![ss_between_approx, 0.0, ss_total_approx];

    let r_squared = if ss_total_approx > 0.0 {
        ss_between_approx / ss_total_approx
    } else {
        0.0
    };
    let adjusted_r_squared = if total_n as f64 > num_groups as f64 {
        1.0 - ((1.0 - r_squared) * (total_n as f64 - 1.0) / (total_n as f64 - num_groups as f64))
    } else {
        0.0
    };

    Ok(WelchAnovaTestResult {
        test_statistic: TestStatistic {
            value: f_statistic,
            name: TestStatisticName::FStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "Welch's ANOVA".to_string(),
        alpha,
        error_message: None,
        df1: df_num,
        df2: df_denom,
        effect_size: EffectSize {
            value: omega_squared,
            effect_type: EffectSizeType::OmegaSquared.as_str().to_string(),
        },
        sample_size: total_n,
        r_squared,
        adjusted_r_squared,
        sample_means,
        sample_std_devs,
    })
}
