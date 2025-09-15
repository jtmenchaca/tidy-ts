use super::super::super::core::{
    AlternativeType, TestResult, TestType, effect_sizes::cohens_d_z_test,
};
use super::super::super::distributions::normal;
use super::super::super::helpers::create_error_result;

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
) -> TestResult
where
    I: IntoIterator<Item = T>,
    T: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    // Validate population standard deviation
    if pop_std <= 0.0 {
        return create_error_result(
            "One-sample Z-test",
            &format!("Population standard deviation must be positive, got: {pop_std}"),
        );
    }

    // Convert iterator to Vec<f64>
    let sample_data: Vec<f64> = data.into_iter().map(|x| x.into()).collect();

    // Check for empty data
    if sample_data.is_empty() {
        return create_error_result("One-sample Z-test", "Empty data");
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

    let p_value = test_result.p_value.unwrap_or(f64::NAN);
    let confidence_interval = test_result.get_confidence_interval();

    // Calculate Cohen's d effect size
    let effect_size = cohens_d_z_test(sample_mean, pop_mean, pop_std);

    TestResult {
        test_type: TestType::OneSampleZTest,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: confidence_interval.map(|ci| ci.0),
        confidence_interval_upper: confidence_interval.map(|ci| ci.1),
        confidence_level: Some(1.0 - alpha),
        effect_size: Some(effect_size),
        cohens_d: Some(effect_size),
        sample_size: Some(n as usize),
        mean_difference: Some(sample_mean - pop_mean),
        standard_error: Some(std_error),
        sample_means: Some(vec![sample_mean]),
        sample_std_devs: Some(vec![pop_std]), // Using population std as it's known
        ..Default::default()
    }
}
