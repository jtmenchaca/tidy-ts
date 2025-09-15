use super::super::super::core::{AlternativeType, TestResult, TestType};
use super::super::super::distributions::students_t;
use super::super::super::helpers::create_error_result;

/// Performs a one-sample t-test on the provided data.
///
/// This function compares the mean of a sample to a known population mean to determine if there is a statistically significant difference.
///

pub fn t_test<I, T>(data: I, pop_mean: f64, alternative: AlternativeType, alpha: f64) -> TestResult
where
    I: IntoIterator<Item = T>,
    T: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    // Convert iterator to Vec<f64>
    let sample_data: Vec<f64> = data.into_iter().map(|x| x.into()).collect();

    // Check for empty data
    if sample_data.is_empty() {
        return create_error_result("One-sample t-test", "Empty data");
    }

    // Check for insufficient data (need at least 2 points for variance)
    if sample_data.len() < 2 {
        return create_error_result(
            "One-sample t-test",
            "Insufficient data: need at least 2 observations",
        );
    }

    let n = sample_data.len() as f64;

    // Calculate sample mean
    let sample_mean = sample_data.iter().sum::<f64>() / n;

    // Calculate sample variance (using n-1 denominator for unbiased estimate)
    let sample_var = sample_data
        .iter()
        .map(|x| (x - sample_mean).powi(2))
        .sum::<f64>()
        / (n - 1.0);

    let std_error = (sample_var / n).sqrt();

    // Calculate test statistic
    let test_statistic = (sample_mean - pop_mean) / std_error;
    let df = n - 1.0;

    // Use the students t-distribution from our distributions module
    let test_result = students_t::t_test_result(
        test_statistic,
        df,
        tail.clone(),
        sample_mean,
        std_error,
        alpha,
    );

    let p_value = test_result.p_value.unwrap_or(0.0);
    let confidence_interval = test_result.get_confidence_interval().unwrap_or((0.0, 0.0));

    let reject_null = p_value < alpha;

    // Calculate Cohen's d effect size
    let sample_std = sample_var.sqrt();
    let cohens_d = if sample_std == 0.0 {
        0.0
    } else {
        (sample_mean - pop_mean) / sample_std
    };

    let null_hypothesis = match alternative {
        AlternativeType::Less => format!("H0: µ >= {pop_mean}"),
        AlternativeType::Greater => format!("H0: µ <= {pop_mean}"),
        AlternativeType::TwoSided => format!("H0: µ = {pop_mean}"),
    };

    let alt_hypothesis = match alternative {
        AlternativeType::Less => format!("Ha: µ < {pop_mean}"),
        AlternativeType::Greater => format!("Ha: µ > {pop_mean}"),
        AlternativeType::TwoSided => format!("Ha: µ ≠ {pop_mean}"),
    };

    TestResult {
        test_type: TestType::OneSampleTTest,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        confidence_level: Some(1.0 - alpha),
        effect_size: Some(cohens_d),
        cohens_d: Some(cohens_d),
        degrees_of_freedom: Some(df),
        sample_size: Some(n as usize),
        mean_difference: Some(sample_mean - pop_mean),
        standard_error: Some(std_error),
        margin_of_error: Some((confidence_interval.1 - confidence_interval.0) / 2.0),
        ..Default::default()
    }
}
