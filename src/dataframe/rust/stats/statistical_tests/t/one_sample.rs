use super::super::super::core::{
    AlternativeType,
    types::{
        ConfidenceInterval, EffectSize, EffectSizeType, OneSampleTTestResult, TestStatistic,
        TestStatisticName,
    },
};
use super::super::super::distributions::students_t;

/// Performs a one-sample t-test on the provided data.
///
/// This function compares the mean of a sample to a known population mean to determine if there is a statistically significant difference.
///

pub fn t_test<I, T>(
    data: I,
    pop_mean: f64,
    alternative: AlternativeType,
    alpha: f64,
) -> Result<OneSampleTTestResult, String>
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
        return Err("Empty data".to_string());
    }

    // Check for insufficient data (need at least 2 points for variance)
    if sample_data.len() < 2 {
        return Err("Insufficient data: need at least 2 observations".to_string());
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

    // Handle zero variance case (all values identical)
    if sample_var == 0.0 {
        if (sample_mean - pop_mean).abs() < f64::EPSILON {
            // Sample mean equals hypothesized mean - no difference, cannot reject H0
            return Err("Cannot perform t-test with zero variance (all values identical and equal to hypothesized mean)".to_string());
        } else {
            // Sample mean differs from hypothesized mean with zero variance - perfect evidence
            return Err("Cannot perform t-test with zero variance (all values identical)".to_string());
        }
    }

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

    let p_value = test_result.p_value;
    let confidence_interval = test_result.confidence_interval;

    // Calculate Cohen's d effect size
    let sample_std = sample_var.sqrt();
    let cohens_d = if sample_std == 0.0 {
        0.0
    } else {
        (sample_mean - pop_mean) / sample_std
    };

    Ok(OneSampleTTestResult {
        test_name: "One-sample t-test".to_string(),
        p_value,
        effect_size: EffectSize {
            value: cohens_d,
            name: EffectSizeType::CohensD.as_str().to_string(),
        },
        test_statistic: TestStatistic {
            value: test_statistic,
            name: TestStatisticName::TStatistic.as_str().to_string(),
        },
        confidence_interval: ConfidenceInterval {
            lower: confidence_interval.0,
            upper: confidence_interval.1,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: df,
        alternative: alternative.as_str().to_string(),
        alpha,
        error_message: None,
    })
}
