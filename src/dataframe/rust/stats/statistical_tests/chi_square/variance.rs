use super::super::super::core::{TailType, TestResult, TestType, calculate_chi2_ci, calculate_p};
use statrs::distribution::ChiSquared;
use std::f64;

/// Perform a Chi-Square Test for Variance.

pub fn variance<I, T>(
    data: I,
    pop_variance: f64,
    tail: TailType,
    alpha: f64,
) -> Result<TestResult, String>
where
    I: IntoIterator<Item = T>,
    T: Into<f64>,
{
    // Collect data into Vec<f64>
    let sample_data: Vec<f64> = data.into_iter().map(|x| x.into()).collect();

    let n = sample_data.len();

    if n < 2 {
        return Err("Sample size must be at least 2.".to_string());
    }

    if !pop_variance.is_finite() || pop_variance <= 0.0 {
        return Err("Population variance must be a positive finite number.".to_string());
    }

    let mean = sample_data.iter().sum::<f64>() / n as f64;
    let sample_variance =
        sample_data.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n as f64 - 1.0);

    let test_statistic = (n as f64 - 1.0) * sample_variance / pop_variance;
    let df = n as f64 - 1.0;
    let chi_distribution = ChiSquared::new(df).map_err(|e| format!("Chi-squared error: {e}"))?;

    let p_value = calculate_p(test_statistic, tail.clone(), &chi_distribution);
    let reject_null = p_value < alpha;

    let confidence_interval = calculate_chi2_ci(pop_variance, alpha, &chi_distribution);

    let alt_hypothesis = match tail {
        TailType::Two => format!("Ha: σ² ≠ {pop_variance}"),
        TailType::Left => format!("Ha: σ² < {pop_variance}"),
        TailType::Right => format!("Ha: σ² > {pop_variance}"),
    };

    // Calculate effect size as the ratio of sample variance to population variance
    // This gives us a measure of how much the sample variance deviates from the expected
    let effect_size = if pop_variance > 0.0 {
        (sample_variance / pop_variance - 1.0).abs()
    } else {
        0.0
    };

    Ok(TestResult {
        test_type: TestType::ChiSquareIndependence,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        effect_size: Some(effect_size),
        degrees_of_freedom: Some(df),
        sample_size: Some(n),
        sample_std_devs: Some(vec![sample_variance.sqrt()]),
        ..Default::default()
    })
}
