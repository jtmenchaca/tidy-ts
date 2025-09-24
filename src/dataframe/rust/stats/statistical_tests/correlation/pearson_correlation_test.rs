use super::super::super::core::{
    AlternativeType,
    types::{
        ConfidenceInterval, EffectSize, EffectSizeType, PearsonCorrelationTestResult,
        TestStatistic, TestStatisticName,
    },
};
use super::super::super::distributions::{students_t, normal};

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
    let r = pearson_correlation(x, y);

    // Handle perfect correlation case
    let (t, p_value) = if r.abs() >= 1.0 - f64::EPSILON {
        // Perfect correlation: t → ∞, p → 0
        (f64::INFINITY.copysign(r), 0.0)
    } else {
        // Normal case: calculate test statistic
        let df = (n - 2) as f64;
        let t_stat = r * (df / (1.0 - r * r)).sqrt();
        
        // Calculate p-value using students_t distribution
        let p = match alternative {
            AlternativeType::TwoSided => 2.0 * students_t::pt(t_stat.abs(), df, false, false),
            AlternativeType::Greater => students_t::pt(t_stat, df, false, false),
            AlternativeType::Less => students_t::pt(t_stat, df, true, false),
        };
        (t_stat, p)
    };

    // Calculate confidence interval using Fisher z-transformation (like R)
    // R: if(n > 3) { ## confidence int.
    let confidence_interval = if r.abs() >= 1.0 - f64::EPSILON {
        // Perfect correlation: CI is exactly [±1, ±1]
        let exact_r = if r >= 0.0 { 1.0 } else { -1.0 };
        ConfidenceInterval {
            lower: exact_r,
            upper: exact_r,
            confidence_level: 1.0 - alpha,
        }
    } else if (n as i32) > 3 {
        // Fisher z-transformation: z = atanh(r)
        let z = r.atanh();
        // Standard error: sigma = 1 / sqrt(n - 3)
        let sigma = 1.0 / (n as f64 - 3.0).sqrt();
        let conf_level = 1.0 - alpha;
        
        let (lower_z, upper_z) = match alternative {
            AlternativeType::Less => {
                // One-sided: (-Inf, z + sigma * qnorm(conf.level))
                let upper_z = z + sigma * normal::qnorm(conf_level, 0.0, 1.0, true, false);
                (f64::NEG_INFINITY, upper_z)
            },
            AlternativeType::Greater => {
                // One-sided: (z - sigma * qnorm(conf.level), Inf)
                let lower_z = z - sigma * normal::qnorm(conf_level, 0.0, 1.0, true, false);
                (lower_z, f64::INFINITY)
            },
            AlternativeType::TwoSided => {
                // Two-sided: z ± sigma * qnorm((1 + conf.level) / 2)
                let margin = sigma * normal::qnorm((1.0 + conf_level) / 2.0, 0.0, 1.0, true, false);
                (z - margin, z + margin)
            }
        };
        
        // Transform back from z-space to correlation space using tanh
        ConfidenceInterval {
            lower: lower_z.tanh(),
            upper: upper_z.tanh(),
            confidence_level: conf_level,
        }
    } else {
        // Not enough observations for CI (n <= 3)
        ConfidenceInterval {
            lower: f64::NAN,
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        }
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
        confidence_interval,
        degrees_of_freedom: (n - 2) as f64,
        effect_size: EffectSize {
            value: r,
            effect_type: EffectSizeType::PearsonsR.as_str().to_string(),
        },
    })
}
