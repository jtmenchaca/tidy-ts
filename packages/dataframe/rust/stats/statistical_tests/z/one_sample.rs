use super::super::super::core::{
    AlternativeType, effect_sizes::cohens_d_z_test,
    types::{OneSampleZTestResult, TestStatistic, TestStatisticName, EffectSize, EffectSizeType, ConfidenceInterval},
};
use super::super::super::distributions::normal;

///
///
/// # When to use Z-test vs t-test
///
/// - **Use Z-test when**: Population standard deviation is known, large sample size (n ≥ 30)
/// - **Use t-test when**: Population standard deviation is unknown, small sample size
pub fn z_test<I, T>(
    data: I,
    pop_mean: f64,
    pop_std: f64,
    alternative: AlternativeType,
    alpha: f64,
) -> Result<OneSampleZTestResult, String>
where
    I: IntoIterator<Item = T>,
    T: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    // Validate population standard deviation
    if pop_std <= 0.0 {
        return Err(format!("Population standard deviation must be positive, got: {pop_std}"));
    }

    // Convert iterator to Vec<f64>
    let sample_data: Vec<f64> = data.into_iter().map(|x| x.into()).collect();

    // Check for empty data
    if sample_data.is_empty() {
        return Err("Empty data".to_string());
    }

    let n = sample_data.len() as f64;

    // Calculate sample mean
    let sample_mean = sample_data.iter().sum::<f64>() / n;

    // Calculate standard error of the mean
    let std_error = pop_std / n.sqrt();

    // Calculate Z test statistic
    let test_statistic = (sample_mean - pop_mean) / std_error;

    // Use the normal distribution from our distributions module
    let test_result =
        normal::z_test_result(test_statistic, tail.clone(), sample_mean, std_error, alpha);

    let p_value = test_result.p_value;
    let confidence_interval = Some(test_result.confidence_interval);

    // Calculate Cohen's d effect size
    let effect_size = cohens_d_z_test(sample_mean, pop_mean, pop_std);

    Ok(OneSampleZTestResult {
        test_statistic: TestStatistic {
            value: test_statistic,
            name: TestStatisticName::ZStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "One-sample Z-test".to_string(),
        alpha,
        error_message: None,
        confidence_interval: ConfidenceInterval {
            lower: confidence_interval.map(|ci| ci.0).unwrap_or(f64::NAN),
            upper: confidence_interval.map(|ci| ci.1).unwrap_or(f64::NAN),
            confidence_level: 1.0 - alpha,
        },
        alternative: alternative.as_str().to_string(),
        effect_size: EffectSize {
            value: effect_size,
            name: EffectSizeType::CohensD.as_str().to_string(),
        },
    })
}
