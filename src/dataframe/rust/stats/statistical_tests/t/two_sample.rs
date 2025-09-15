use super::super::super::core::{AlternativeType, TestResult, TestType};
use super::super::super::distributions::students_t;
use super::super::super::helpers::create_error_result;
use super::one_sample::t_test;

/// Performs a paired two-sample t-test on two related samples.

pub fn t_test_paired<I1, I2, T1, T2>(
    data1: I1,
    data2: I2,
    alternative: AlternativeType,
    alpha: f64,
) -> TestResult
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
        return create_error_result(
            "Paired t-test",
            &format!(
                "Sample sizes must be equal for paired t-test. Got {} and {}",
                sample1.len(),
                sample2.len()
            ),
        );
    }

    // Calculate differences
    let differences: Vec<f64> = sample1
        .iter()
        .zip(sample2.iter())
        .map(|(x1, x2)| x1 - x2)
        .collect();

    // Perform one-sample t-test on differences against mean of 0
    let result = t_test(differences.iter().copied(), 0.0, alternative, alpha);

    // Create new result with updated test type for paired test
    TestResult {
        test_type: TestType::PairedTTest,
        test_statistic: result.test_statistic,
        p_value: result.p_value,
        confidence_interval_lower: result.confidence_interval_lower,
        confidence_interval_upper: result.confidence_interval_upper,
        confidence_level: result.confidence_level,
        effect_size: result.effect_size,
        cohens_d: result.cohens_d,
        degrees_of_freedom: result.degrees_of_freedom,
        sample_size: Some(sample1.len()),
        mean_difference: result.mean_difference,
        standard_error: result.standard_error,
        margin_of_error: result.margin_of_error,
        sample_means: Some(vec![
            sample1.iter().sum::<f64>() / sample1.len() as f64,
            sample2.iter().sum::<f64>() / sample2.len() as f64,
        ]),
        sample_std_devs: Some(vec![
            (sample1
                .iter()
                .map(|&v| (v - sample1.iter().sum::<f64>() / sample1.len() as f64).powi(2))
                .sum::<f64>()
                / (sample1.len() - 1) as f64)
                .sqrt(),
            (sample2
                .iter()
                .map(|&v| (v - sample2.iter().sum::<f64>() / sample2.len() as f64).powi(2))
                .sum::<f64>()
                / (sample2.len() - 1) as f64)
                .sqrt(),
        ]),
        ..result
    }
}

/// Convenience function for paired t-test with `Vec<f64>` input
pub fn t_test_paired_vec(
    data1: &[f64],
    data2: &[f64],
    alternative: AlternativeType,
    alpha: f64,
) -> TestResult {
    t_test_paired(
        data1.iter().copied(),
        data2.iter().copied(),
        alternative,
        alpha,
    )
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
) -> TestResult
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
        return create_error_result("Independent t-test", "Cannot perform test on empty data");
    }

    // Check for insufficient data (need at least 2 points per group for variance)
    if sample1.len() < 2 || sample2.len() < 2 {
        return create_error_result(
            "Independent t-test",
            "Insufficient data: need at least 2 points per group for variance estimation",
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

    let p_value = test_result.p_value.unwrap_or(f64::NAN);
    let confidence_interval = (
        test_result.confidence_interval_lower.unwrap_or(f64::NAN),
        test_result.confidence_interval_upper.unwrap_or(f64::NAN),
    );

    // Calculate Cohen's d effect size
    let pooled_var = ((n1 - 1.0) * var1 + (n2 - 1.0) * var2) / (n1 + n2 - 2.0);
    let pooled_std = pooled_var.sqrt();
    let cohens_d = if pooled_std == 0.0 {
        0.0
    } else {
        (mean1 - mean2) / pooled_std
    };

    TestResult {
        test_type: TestType::IndependentTTest,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        confidence_level: Some(1.0 - alpha),
        effect_size: Some(cohens_d),
        cohens_d: Some(cohens_d),
        degrees_of_freedom: Some(df),
        sample_size: Some((n1 + n2) as usize),
        mean_difference: Some(mean1 - mean2),
        standard_error: Some(std_error),
        margin_of_error: Some((confidence_interval.1 - confidence_interval.0) / 2.0),
        sample_means: Some(vec![mean1, mean2]),
        sample_std_devs: Some(vec![var1.sqrt(), var2.sqrt()]),
        ..Default::default()
    }
}
