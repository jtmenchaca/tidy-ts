use super::super::super::core::{
    AlternativeType,
    types::{
        ConfidenceInterval, EffectSize, EffectSizeType, PairedTTestResult, TestStatistic,
        TestStatisticName, TwoSampleTTestResult,
    },
};
use super::super::super::distributions::students_t;
use super::one_sample::t_test;

/// Performs a paired two-sample t-test on two related samples.

pub fn t_test_paired<I1, I2, T1, T2>(
    data1: I1,
    data2: I2,
    alternative: AlternativeType,
    alpha: f64,
) -> Result<PairedTTestResult, String>
where
    I1: IntoIterator<Item = T1>,
    I2: IntoIterator<Item = T2>,
    T1: Into<f64>,
    T2: Into<f64>,
{
    // Convert iterators to Vec<f64>
    let sample1: Vec<f64> = data1.into_iter().map(|x| x.into()).collect();
    let sample2: Vec<f64> = data2.into_iter().map(|x| x.into()).collect();

    // Check that both samples have the same length
    if sample1.len() != sample2.len() {
        return Err(format!(
            "Sample sizes must be equal for paired t-test. Got {} and {}",
            sample1.len(),
            sample2.len()
        ));
    }

    // Calculate differences
    let differences: Vec<f64> = sample1
        .iter()
        .zip(sample2.iter())
        .map(|(x1, x2)| x1 - x2)
        .collect();

    // Perform one-sample t-test on differences against mean of 0
    let result = t_test(differences.iter().copied(), 0.0, alternative, alpha)?;

    // Calculate mean difference and standard error from differences
    let mean_diff = differences.iter().sum::<f64>() / differences.len() as f64;
    let variance_diff = differences
        .iter()
        .map(|x| (x - mean_diff).powi(2))
        .sum::<f64>()
        / (differences.len() - 1) as f64;
    let std_error = (variance_diff / differences.len() as f64).sqrt();

    // Calculate Cohen's d for paired samples using SD of differences
    // This matches R's effsize::cohen.d(..., paired=TRUE, within=FALSE) behavior
    // which is the standard Cohen's d for paired samples (mean_diff / sd_diff)
    let sd_diff = variance_diff.sqrt();
    let cohens_d = if sd_diff == 0.0 {
        0.0
    } else {
        mean_diff / sd_diff
    };

    // Create new result with updated test type for paired test
    Ok(PairedTTestResult {
        test_statistic: TestStatistic {
            value: result.test_statistic.value,
            name: TestStatisticName::TStatistic.as_str().to_string(),
        },
        p_value: result.p_value,
        test_name: "Paired T-Test".to_string(),
        alpha,
        error_message: None,
        confidence_interval: result.confidence_interval,
        degrees_of_freedom: result.degrees_of_freedom,
        effect_size: EffectSize {
            value: cohens_d,
            name: EffectSizeType::CohensD.as_str().to_string(),
        },
        mean_difference: mean_diff,
        standard_error: std_error,
        alternative: alternative.as_str().to_string(),
    })
}

/// Convenience function for paired t-test with `Vec<f64>` input
pub fn t_test_paired_vec(
    data1: &[f64],
    data2: &[f64],
    alternative: AlternativeType,
    alpha: f64,
) -> PairedTTestResult {
    t_test_paired(
        data1.iter().copied(),
        data2.iter().copied(),
        alternative,
        alpha,
    )
    .unwrap_or_else(|e| PairedTTestResult {
        test_statistic: TestStatistic {
            value: f64::NAN,
            name: TestStatisticName::TStatistic.as_str().to_string(),
        },
        p_value: f64::NAN,
        test_name: "Paired T-Test".to_string(),
        alpha,
        error_message: Some(e),
        confidence_interval: ConfidenceInterval {
            lower: f64::NAN,
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: f64::NAN,
        effect_size: EffectSize {
            value: f64::NAN,
            name: EffectSizeType::CohensD.as_str().to_string(),
        },
        mean_difference: f64::NAN,
        standard_error: f64::NAN,
        alternative: alternative.as_str().to_string(),
    })
}

/// Performs an independent two-sample t-test on two unrelated samples.
///
/// This function evaluates whether the means of two independent groups differ from each other.
/// It supports both pooled variance (standard t-test) and unequal variance (Welch's t-test) approaches.
///
/// # Arguments
///
/// * `data1` - An iterator containing the first set of sample data.
/// * `data2` - An iterator containing the second set of sample data.
/// * `alternative` - The alternative hypothesis type (less, greater, or two-sided) for the test.
/// * `alpha` - The significance level (e.g., 0.05 for a 95% confidence interval).
/// * `pooled` - Whether to pool variances (true for a standard t-test, false for Welch's t-test).
///
/// # Returns
///
/// A `TestResult` struct containing the test statistic, p-value, confidence interval,
/// null/alternative hypotheses, and a boolean indicating whether the null hypothesis should be rejected.
///
/// # Errors
///
/// Returns a `StatError` if there are issues with the data (empty, insufficient) or calculations.
///
/// # Example
///
/// ```rust
/// use tidy_ts_dataframe::stats::statistical_tests::t::t_test_ind;
/// use tidy_ts_dataframe::stats::core::types::AlternativeType;
///
/// let group1 = vec![1.2, 2.3, 1.9, 2.5, 2.8];
/// let group2 = vec![1.1, 2.0, 1.7, 2.3, 2.6];
/// let alternative = AlternativeType::TwoSided; // Two-sided test
/// let alpha = 0.05; // 5% significance level
/// let pooled = false; // Use Welch's t-test
///
/// // Perform the independent two-sample t-test
/// let result = t_test_ind(group1.iter().copied(), group2.iter().copied(), alternative, alpha, pooled);
///
/// // Check if the p-value is within valid range
/// assert!(result.p_value() > 0.0 && result.p_value() < 1.0);
/// // Verify if the null hypothesis should be rejected
/// assert_eq!(result.reject_null(), result.p_value() < alpha);
/// ```
///
/// # Example with different sample sizes
///
/// ```rust
/// use tidy_ts_dataframe::stats::statistical_tests::t::two_sample::t_test_ind;
/// use tidy_ts_dataframe::stats::core::types::AlternativeType;
///
/// let control = [12.0, 15.0, 14.0, 16.0, 13.0, 18.0];
/// let treatment = [20.0, 22.0, 19.0, 24.0]; // Different size is OK for independent samples
///
/// let result = t_test_ind(control.iter().copied(), treatment.iter().copied(),
///                        AlternativeType::TwoSided, 0.05, false);
/// ```
pub fn t_test_ind<I1, I2, T1, T2>(
    data1: I1,
    data2: I2,
    alternative: AlternativeType,
    alpha: f64,
    pooled: bool,
) -> Result<TwoSampleTTestResult, String>
where
    I1: IntoIterator<Item = T1>,
    I2: IntoIterator<Item = T2>,
    T1: Into<f64>,
    T2: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    // Convert iterators to Vec<f64>
    let sample1: Vec<f64> = data1.into_iter().map(|x| x.into()).collect();
    let sample2: Vec<f64> = data2.into_iter().map(|x| x.into()).collect();

    // Check for empty data
    if sample1.is_empty() || sample2.is_empty() {
        return Err("Cannot perform test on empty data".to_string());
    }

    // Check for insufficient data (need at least 2 points per group for variance)
    if sample1.len() < 2 || sample2.len() < 2 {
        return Err(
            "Insufficient data: need at least 2 points per group for variance estimation"
                .to_string(),
        );
    }

    let n1 = sample1.len() as f64;
    let n2 = sample2.len() as f64;

    // Calculate means
    let mean1 = sample1.iter().sum::<f64>() / n1;
    let mean2 = sample2.iter().sum::<f64>() / n2;

    // Calculate variances (using n-1 denominator for unbiased estimate)
    let var1 = sample1.iter().map(|x| (x - mean1).powi(2)).sum::<f64>() / (n1 - 1.0);
    let var2 = sample2.iter().map(|x| (x - mean2).powi(2)).sum::<f64>() / (n2 - 1.0);

    // Calculate standard error and degrees of freedom based on pooled vs unpooled
    let (std_error, df) = if pooled {
        // Pooled variance approach (standard t-test)
        let pooled_var = ((n1 - 1.0) * var1 + (n2 - 1.0) * var2) / (n1 + n2 - 2.0);
        let std_error = (pooled_var * (1.0 / n1 + 1.0 / n2)).sqrt();
        let df = n1 + n2 - 2.0;
        (std_error, df)
    } else {
        // Welch's t-test (unequal variances)
        let std_error = (var1 / n1 + var2 / n2).sqrt();
        let df = (var1 / n1 + var2 / n2).powi(2)
            / ((var1 / n1).powi(2) / (n1 - 1.0) + (var2 / n2).powi(2) / (n2 - 1.0));
        (std_error, df)
    };

    // Calculate test statistic
    let test_statistic = (mean1 - mean2) / std_error;

    // Use the students t-distribution from our distributions module
    let test_result = students_t::t_test_result(
        test_statistic,
        df,
        tail.clone(),
        mean1 - mean2,
        std_error,
        alpha,
    );

    let p_value = test_result.p_value;
    let confidence_interval = test_result.confidence_interval;

    // Calculate Cohen's d effect size
    let pooled_var = ((n1 - 1.0) * var1 + (n2 - 1.0) * var2) / (n1 + n2 - 2.0);
    let pooled_std = pooled_var.sqrt();
    let cohens_d = if pooled_std == 0.0 {
        0.0
    } else {
        (mean1 - mean2) / pooled_std
    };

    Ok(TwoSampleTTestResult {
        test_statistic: TestStatistic {
            value: test_statistic,
            name: TestStatisticName::TStatistic.as_str().to_string(),
        },
        p_value,
        test_name: if pooled { "Independent T-Test".to_string() } else { "Welch's T-Test".to_string() },
        alpha,
        error_message: None,
        confidence_interval: ConfidenceInterval {
            lower: confidence_interval.0,
            upper: confidence_interval.1,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: df,
        effect_size: EffectSize {
            value: cohens_d,
            name: EffectSizeType::CohensD.as_str().to_string(),
        },
        mean_difference: mean1 - mean2,
        standard_error: std_error,
        alternative: alternative.as_str().to_string(),
    })
}
