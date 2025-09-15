use super::super::super::core::{
    AlternativeType, StatError, TestResult, TestType, effect_sizes::cohens_h,
};
use super::super::super::distributions::normal;

/// Performs an independent two-sample Z-test for proportions.

pub fn z_test_ind<I1, I2, T>(
    data1: I1,
    data2: I2,
    alternative: AlternativeType,
    alpha: f64,
    pooled: bool,
) -> Result<TestResult, StatError>
where
    I1: IntoIterator<Item = T>,
    I2: IntoIterator<Item = T>,
    T: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    let sample1: Vec<f64> = data1.into_iter().map(|x| x.into()).collect();
    let sample2: Vec<f64> = data2.into_iter().map(|x| x.into()).collect();

    if sample1.is_empty() || sample2.is_empty() {
        return Err(StatError::EmptyData);
    }

    let n1 = sample1.len() as f64;
    let n2 = sample2.len() as f64;

    let successes1: f64 = sample1.iter().sum();
    let successes2: f64 = sample2.iter().sum();

    let p1 = successes1 / n1;
    let p2 = successes2 / n2;

    let std_error = if pooled {
        let pooled_p = (successes1 + successes2) / (n1 + n2);
        (pooled_p * (1.0 - pooled_p) * (1.0 / n1 + 1.0 / n2)).sqrt()
    } else {
        ((p1 * (1.0 - p1) / n1) + (p2 * (1.0 - p2) / n2)).sqrt()
    };

    if std_error == 0.0 {
        return Err(StatError::ComputeError(
            "Standard error is zero; cannot compute test statistic".to_string(),
        ));
    }

    let test_statistic = (p1 - p2) / std_error;

    // Use the normal distribution from our distributions module
    let test_result =
        normal::z_test_result(test_statistic, tail.clone(), p1 - p2, std_error, alpha);

    let p_value = test_result.p_value.unwrap_or(0.0);
    let confidence_interval = test_result.get_confidence_interval().unwrap_or((0.0, 0.0));
    let reject_null = p_value < alpha;

    let null_hypothesis = match alternative {
        AlternativeType::Less => "H0: p1 >= p2".to_string(),
        AlternativeType::Greater => "H0: p1 <= p2".to_string(),
        AlternativeType::TwoSided => "H0: p1 = p2".to_string(),
    };

    let alt_hypothesis = match alternative {
        AlternativeType::Less => "Ha: p1 < p2".to_string(),
        AlternativeType::Greater => "Ha: p1 > p2".to_string(),
        AlternativeType::TwoSided => "Ha: p1 ≠ p2".to_string(),
    };

    // Calculate Cohen's h effect size
    let effect_size = cohens_h(p1, p2);

    Ok(TestResult {
        test_type: TestType::TwoSampleProportionTest,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        confidence_level: Some(1.0 - alpha),
        effect_size: Some(effect_size),
        sample_size: Some((n1 as usize) + (n2 as usize)),
        standard_error: Some(std_error),
        mean_difference: Some(p1 - p2),
        sample_means: Some(vec![p1, p2]),
        ..Default::default()
    })
}
