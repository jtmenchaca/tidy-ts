use super::super::super::core::{
    AlternativeType, effect_sizes::cohens_h,
    types::{OneSampleProportionTestResult, TestStatistic, TestStatisticName},
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
) -> Result<OneSampleProportionTestResult, String>
where
    I: IntoIterator<Item = T>,
    T: Into<f64>,
{
    // Convert AlternativeType to TailType for internal calculations
    let tail = alternative.to_tail_type();

    if !(0.0..=1.0).contains(&pop_proportion) {
        return Err(format!(
            "Population proportion must be between 0 and 1, got: {pop_proportion}"
        ));
    }

    let sample: Vec<f64> = data.into_iter().map(|x| x.into()).collect();

    if sample.is_empty() {
        return Err("Sample data cannot be empty".to_string());
    }

    let n = sample.len() as f64;
    let successes: f64 = sample.iter().sum();
    let sample_proportion = successes / n;

    let std_error = (pop_proportion * (1.0 - pop_proportion) / n).sqrt();

    if std_error == 0.0 {
        return Err("Standard error is zero; cannot compute test statistic".to_string());
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

    let p_value = test_result.p_value;
    let confidence_interval = test_result.confidence_interval;
    let _reject_null = p_value < alpha;

    let _null_hypothesis = match alternative {
        AlternativeType::Less => format!("H0: p >= {pop_proportion}"),
        AlternativeType::Greater => format!("H0: p <= {pop_proportion}"),
        AlternativeType::TwoSided => format!("H0: p = {pop_proportion}"),
    };

    let _alt_hypothesis = match alternative {
        AlternativeType::Less => format!("Ha: p < {pop_proportion}"),
        AlternativeType::Greater => format!("Ha: p > {pop_proportion}"),
        AlternativeType::TwoSided => format!("Ha: p ≠ {pop_proportion}"),
    };

    // Calculate Cohen's h effect size
    let _effect_size = cohens_h(sample_proportion, pop_proportion);

    Ok(OneSampleProportionTestResult {
        test_statistic: TestStatistic {
            value: test_statistic,
            name: TestStatisticName::ZStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "One-sample proportion test".to_string(),
        alpha,
        error_message: None,
        sample_proportion,
        confidence_interval: crate::stats::core::types::ConfidenceInterval {
            lower: confidence_interval.0,
            upper: confidence_interval.1,
            confidence_level: 1.0 - alpha,
        },
    })
}
