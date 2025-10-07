use super::super::super::core::{
    AlternativeType, effect_sizes::cohens_h,
    types::{TwoSampleProportionTestResult, TestStatistic, TestStatisticName},
};
use super::super::super::distributions::normal;

/// Performs an independent two-sample Z-test for proportions.

pub fn z_test_ind<I1, I2, T>(
    data1: I1,
    data2: I2,
    alternative: AlternativeType,
    alpha: f64,
    pooled: bool,
) -> Result<TwoSampleProportionTestResult, String>
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
        return Err("Sample data cannot be empty".to_string());
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
        return Err("Standard error is zero; cannot compute test statistic".to_string());
    }

    let test_statistic = (p1 - p2) / std_error;

    // Use the normal distribution from our distributions module
    let test_result =
        normal::z_test_result(test_statistic, tail.clone(), p1 - p2, std_error, alpha);

    let p_value = test_result.p_value;
    let confidence_interval = test_result.confidence_interval;
    let _reject_null = p_value < alpha;

    let _null_hypothesis = match alternative {
        AlternativeType::Less => "H0: p1 >= p2".to_string(),
        AlternativeType::Greater => "H0: p1 <= p2".to_string(),
        AlternativeType::TwoSided => "H0: p1 = p2".to_string(),
    };

    let _alt_hypothesis = match alternative {
        AlternativeType::Less => "Ha: p1 < p2".to_string(),
        AlternativeType::Greater => "Ha: p1 > p2".to_string(),
        AlternativeType::TwoSided => "Ha: p1 ≠ p2".to_string(),
    };

    // Calculate Cohen's h effect size
    let _effect_size = cohens_h(p1, p2);

    Ok(TwoSampleProportionTestResult {
        test_statistic: TestStatistic {
            value: test_statistic,
            name: TestStatisticName::ZStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "Two-sample proportion test".to_string(),
        alpha,
        error_message: None,
        proportion_difference: p1 - p2,
        confidence_interval: crate::stats::core::types::ConfidenceInterval {
            lower: confidence_interval.0,
            upper: confidence_interval.1,
            confidence_level: 1.0 - alpha,
        },
        alternative: alternative.as_str().to_string(),
    })
}
