use super::super::super::core::{
    AlternativeType,
    types::{
        ConfidenceInterval, EffectSize, EffectSizeType, PearsonCorrelationTestResult,
        TestStatistic, TestStatisticName,
    },
};
use super::super::super::distributions::students_t;

/// Calculate Pearson correlation coefficient
fn pearson_correlation(x: &[f64], y: &[f64]) -> f64 {
    let n = x.len() as f64;
    let sum_x: f64 = x.iter().sum();
    let sum_y: f64 = y.iter().sum();
    let sum_xy: f64 = x.iter().zip(y.iter()).map(|(&xi, &yi)| xi * yi).sum();
    let sum_x2: f64 = x.iter().map(|&xi| xi * xi).sum();
    let sum_y2: f64 = y.iter().map(|&yi| yi * yi).sum();

    let num = n * sum_xy - sum_x * sum_y;
    let den = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)).sqrt();

    if den == 0.0 { 0.0 } else { num / den }
}

/// Pearson correlation test
pub fn pearson_test(
    x: &[f64],
    y: &[f64],
    alternative: AlternativeType,
    alpha: f64,
) -> Result<PearsonCorrelationTestResult, String> {
    if x.len() != y.len() {
        return Err("x and y must have the same length".to_string());
    }

    let n = x.len();
    if n < 3 {
        return Err("Not enough observations (need at least 3)".to_string());
    }

    // Calculate correlation
    let r_raw = pearson_correlation(x, y);
    // Clamp to avoid exactly +/-1 which produces infinite t
    let eps = 1e-15;
    let r = r_raw.max(-1.0 + eps).min(1.0 - eps);

    // Calculate test statistic
    let df = (n - 2) as f64;
    let t = r * (df / (1.0 - r * r)).sqrt();

    // Calculate p-value using students_t distribution
    let p_value = match alternative {
        AlternativeType::TwoSided => 2.0 * students_t::pt(t.abs(), df, false, false),
        AlternativeType::Greater => students_t::pt(t, df, false, false),
        AlternativeType::Less => students_t::pt(t, df, true, false),
    };

    Ok(PearsonCorrelationTestResult {
        test_statistic: TestStatistic {
            value: t,
            name: TestStatisticName::TStatistic.as_str().to_string(),
        },
        p_value,
        test_name: "Pearson correlation test".to_string(),
        alpha,
        error_message: None,
        confidence_interval: ConfidenceInterval {
            lower: f64::NAN, // TODO: Implement CI for correlation
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: df,
        effect_size: EffectSize {
            value: r,
            effect_type: EffectSizeType::PearsonsR.as_str().to_string(),
        },
    })
}
