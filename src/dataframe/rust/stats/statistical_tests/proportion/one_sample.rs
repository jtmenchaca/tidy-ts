use super::super::super::core::{
    AlternativeType, StatError, TestResult, TestType, effect_sizes::cohens_h,
};
use super::super::super::distributions::normal;

/// Performs a one-sample proportion Z-test on the provided binary data.

/// use hypors::proportion::z_test;
/// use hypors::common::AlternativeType;
///
/// let data = vec![1, 0, 1, 1, 0, 1, 0, 0];
/// let result = z_test(data.iter().copied(), 0.5, AlternativeType::TwoSided, 0.05).unwrap();
///
/// println!("Z Statistic: {}", result.test_statistic);
/// ```
pub fn z_test<I, T>(
    data: I,
    pop_proportion: f64,
    alternative: AlternativeType,
    alpha: f64,
) -> Result<TestResult, StatError>
where
    I: IntoIterator<Item = T>,
    T: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    if !(0.0..=1.0).contains(&pop_proportion) {
        return Err(StatError::ComputeError(format!(
            "Population proportion must be between 0 and 1, got: {pop_proportion}"
        )));
    }

    let sample: Vec<f64> = data.into_iter().map(|x| x.into()).collect();

    if sample.is_empty() {
        return Err(StatError::EmptyData);
    }

    let n = sample.len() as f64;
    let successes: f64 = sample.iter().sum();
    let sample_proportion = successes / n;

    let std_error = (pop_proportion * (1.0 - pop_proportion) / n).sqrt();

    if std_error == 0.0 {
        return Err(StatError::ComputeError(
            "Standard error is zero; cannot compute test statistic".to_string(),
        ));
    }

    let test_statistic = (sample_proportion - pop_proportion) / std_error;

    // Use the normal distribution from our distributions module
    let test_result = normal::z_test_result(
        test_statistic,
        tail.clone(),
        sample_proportion,
        std_error,
        alpha,
    );

    let p_value = test_result.p_value.unwrap_or(0.0);
    let confidence_interval = test_result.get_confidence_interval().unwrap_or((0.0, 0.0));
    let reject_null = p_value < alpha;

    let null_hypothesis = match alternative {
        AlternativeType::Less => format!("H0: p >= {pop_proportion}"),
        AlternativeType::Greater => format!("H0: p <= {pop_proportion}"),
        AlternativeType::TwoSided => format!("H0: p = {pop_proportion}"),
    };

    let alt_hypothesis = match alternative {
        AlternativeType::Less => format!("Ha: p < {pop_proportion}"),
        AlternativeType::Greater => format!("Ha: p > {pop_proportion}"),
        AlternativeType::TwoSided => format!("Ha: p ≠ {pop_proportion}"),
    };

    // Calculate Cohen's h effect size
    let effect_size = cohens_h(sample_proportion, pop_proportion);

    Ok(TestResult {
        test_type: TestType::OneSampleProportionTest,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        confidence_level: Some(1.0 - alpha),
        effect_size: Some(effect_size),
        sample_size: Some(n as usize),
        standard_error: Some(std_error),
        mean_difference: Some(sample_proportion - pop_proportion),
        sample_means: Some(vec![sample_proportion]),
        ..Default::default()
    })
}
