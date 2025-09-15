use super::super::super::core::{
    AlternativeType, TestResult, TestType,
    effect_sizes::{cohens_d_z_test_independent, cohens_d_z_test_paired},
};
use super::super::super::distributions::normal;
use super::super::super::helpers::create_error_result;

pub fn z_test_paired<I1, I2, T1, T2>(
    data1: I1,
    data2: I2,
    pop_std_diff: f64,
    alternative: AlternativeType,
    alpha: f64,
) -> TestResult
where
    I1: IntoIterator<Item = T1>,
    I2: IntoIterator<Item = T2>,
    T1: Into<f64>,
    T2: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    // Validate population standard deviation
    if pop_std_diff <= 0.0 {
        return create_error_result(
            "Paired two-sample Z-test",
            &format!("Population standard deviation must be positive, got: {pop_std_diff}"),
        );
    }

    // Convert iterators to Vec<f64>
    let sample1: Vec<f64> = data1.into_iter().map(|x| x.into()).collect();
    let sample2: Vec<f64> = data2.into_iter().map(|x| x.into()).collect();

    // Check for empty data
    if sample1.is_empty() || sample2.is_empty() {
        return create_error_result("Paired two-sample Z-test", "Empty data");
    }

    // Check for equal lengths
    if sample1.len() != sample2.len() {
        return create_error_result(
            "Paired two-sample Z-test",
            &format!(
                "Sample sizes must be equal: {} vs {}",
                sample1.len(),
                sample2.len()
            ),
        );
    }

    let n = sample1.len() as f64;

    // Calculate differences
    let differences: Vec<f64> = sample1
        .iter()
        .zip(sample2.iter())
        .map(|(x1, x2)| x1 - x2)
        .collect();

    // Calculate mean of differences
    let sample_mean_diff = differences.iter().sum::<f64>() / n;

    // Calculate standard error
    let std_error = pop_std_diff / n.sqrt();

    // Calculate Z test statistic
    let test_statistic = sample_mean_diff / std_error;

    // Use the normal distribution from our distributions module
    let test_result = normal::z_test_result(
        test_statistic,
        tail.clone(),
        sample_mean_diff,
        std_error,
        alpha,
    );

    let p_value = test_result.p_value.unwrap_or(0.0);
    let confidence_interval = test_result.get_confidence_interval().unwrap_or((0.0, 0.0));

    let reject_null = p_value < alpha;

    let null_hypothesis = match alternative {
        AlternativeType::Less => "H0: µ1 >= µ2".to_string(),
        AlternativeType::Greater => "H0: µ1 <= µ2".to_string(),
        AlternativeType::TwoSided => "H0: µ1 = µ2".to_string(),
    };

    let alt_hypothesis = match alternative {
        AlternativeType::Less => "Ha: µ1 < µ2".to_string(),
        AlternativeType::Greater => "Ha: µ1 > µ2".to_string(),
        AlternativeType::TwoSided => "Ha: µ1 ≠ µ2".to_string(),
    };

    // Calculate Cohen's d effect size
    let effect_size = cohens_d_z_test_paired(sample_mean_diff, pop_std_diff);

    TestResult {
        test_type: TestType::TwoSampleZTest,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        confidence_level: Some(1.0 - alpha),
        cohens_d: Some(effect_size),
        effect_size: Some(effect_size),
        sample_size: Some(sample1.len() + sample2.len()),
        degrees_of_freedom: Some(n),
        standard_error: Some(std_error),
        mean_difference: Some(sample_mean_diff),
        ..Default::default()
    }
}

/// Performs an independent two-sample Z-test on two unrelated samples.
///
/// The independent two-sample Z-test evaluates whether the means of two independent samples
/// differ significantly, when the population standard deviations are known. This test assumes
/// the samples are independent and the sampling distributions are approximately normal.
///
pub fn z_test_ind<I1, I2, T1, T2>(
    data1: I1,
    data2: I2,
    pop_std1: f64,
    pop_std2: f64,
    alternative: AlternativeType,
    alpha: f64,
) -> TestResult
where
    I1: IntoIterator<Item = T1>,
    I2: IntoIterator<Item = T2>,
    T1: Into<f64>,
    T2: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    // Validate population standard deviations
    if pop_std1 <= 0.0 {
        return create_error_result(
            "Independent two-sample Z-test",
            &format!("Population standard deviation 1 must be positive, got: {pop_std1}"),
        );
    }
    if pop_std2 <= 0.0 {
        return create_error_result(
            "Independent two-sample Z-test",
            &format!("Population standard deviation 2 must be positive, got: {pop_std2}"),
        );
    }

    // Convert iterators to Vec<f64>
    let sample1: Vec<f64> = data1.into_iter().map(|x| x.into()).collect();
    let sample2: Vec<f64> = data2.into_iter().map(|x| x.into()).collect();

    // Check for empty data
    if sample1.is_empty() {
        return create_error_result("Independent two-sample Z-test", "Empty data for sample 1");
    }
    if sample2.is_empty() {
        return create_error_result("Independent two-sample Z-test", "Empty data for sample 2");
    }

    let n1 = sample1.len() as f64;
    let n2 = sample2.len() as f64;

    // Calculate sample means
    let mean1 = sample1.iter().sum::<f64>() / n1;
    let mean2 = sample2.iter().sum::<f64>() / n2;

    // Calculate standard error
    let std_error = ((pop_std1.powi(2) / n1) + (pop_std2.powi(2) / n2)).sqrt();

    // Calculate Z test statistic
    let test_statistic = (mean1 - mean2) / std_error;

    // Use the normal distribution from our distributions module
    let test_result = normal::z_test_result(
        test_statistic,
        tail.clone(),
        mean1 - mean2,
        std_error,
        alpha,
    );

    let p_value = test_result.p_value.unwrap_or(0.0);
    let confidence_interval = test_result.get_confidence_interval().unwrap_or((0.0, 0.0));

    let reject_null = p_value < alpha;

    let null_hypothesis = match alternative {
        AlternativeType::Less => "H0: µ1 >= µ2".to_string(),
        AlternativeType::Greater => "H0: µ1 <= µ2".to_string(),
        AlternativeType::TwoSided => "H0: µ1 = µ2".to_string(),
    };

    let alt_hypothesis = match alternative {
        AlternativeType::Less => "Ha: µ1 < µ2".to_string(),
        AlternativeType::Greater => "Ha: µ1 > µ2".to_string(),
        AlternativeType::TwoSided => "Ha: µ1 ≠ µ2".to_string(),
    };

    // Calculate Cohen's d effect size
    let effect_size = cohens_d_z_test_independent(mean1, mean2, pop_std1, pop_std2);

    TestResult {
        test_type: TestType::TwoSampleZTest,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        confidence_level: Some(1.0 - alpha),
        cohens_d: Some(effect_size),
        effect_size: Some(effect_size),
        sample_size: Some((n1 as usize) + (n2 as usize)),
        standard_error: Some(std_error),
        mean_difference: Some(mean1 - mean2),
        sample_means: Some(vec![mean1, mean2]),
        sample_std_devs: Some(vec![pop_std1, pop_std2]),
        ..Default::default()
    }
}
