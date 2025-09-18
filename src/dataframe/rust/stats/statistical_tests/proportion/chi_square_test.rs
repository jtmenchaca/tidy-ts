use super::super::super::core::{
    AlternativeType,
    types::{
        ConfidenceInterval, OneSampleProportionTestResult, TestStatistic,
        TwoSampleProportionTestResult,
    },
};
use super::super::super::distributions::{chi_squared, normal};

/// One-sample proportion test using chi-square statistic (matches R's prop.test)
pub fn chi_square_test_one_sample(
    x: f64,
    n: f64,
    p0: f64,
    alternative: AlternativeType,
    alpha: f64,
    correct: bool,
) -> Result<OneSampleProportionTestResult, String> {
    if x < 0.0 || x > n || n <= 0.0 {
        return Err("Invalid counts: x must be between 0 and n, n must be positive".to_string());
    }

    if !(0.0..=1.0).contains(&p0) {
        return Err("Population proportion must be between 0 and 1".to_string());
    }

    let sample_proportion = x / n;

    // Expected counts under null hypothesis
    let expected_success = n * p0;
    let expected_failure = n * (1.0 - p0);

    // Check if chi-square approximation is valid
    if expected_success < 5.0 || expected_failure < 5.0 {
        // Could emit warning here like R does
    }

    // Yates continuity correction
    let yates = if correct { 0.5 } else { 0.0 };

    // Observed counts
    let observed_success = x;
    let observed_failure = n - x;

    // Chi-square statistic: sum((|observed - expected| - yates)^2 / expected)
    let chi_square_stat = ((observed_success - expected_success).abs() - yates).powi(2)
        / expected_success
        + ((observed_failure - expected_failure).abs() - yates).powi(2) / expected_failure;

    // Calculate p-value
    let p_value = match alternative {
        AlternativeType::TwoSided => {
            // Two-sided test uses chi-square distribution
            chi_squared::pchisq(chi_square_stat, 1.0, false, false)
        }
        AlternativeType::Less | AlternativeType::Greater => {
            // One-sided tests use normal approximation
            let z = if sample_proportion < p0 {
                -chi_square_stat.sqrt()
            } else {
                chi_square_stat.sqrt()
            };

            match alternative {
                AlternativeType::Less => normal::pnorm(z, 0.0, 1.0, true, false),
                AlternativeType::Greater => normal::pnorm(z, 0.0, 1.0, false, false),
                _ => unreachable!(),
            }
        }
    };

    // Calculate confidence interval (Wilson score interval with continuity correction)
    let z_crit = if alternative == AlternativeType::TwoSided {
        normal::qnorm((1.0 + (1.0 - alpha)) / 2.0, 0.0, 1.0, true, false)
    } else {
        normal::qnorm(1.0 - alpha, 0.0, 1.0, true, false)
    };

    let z22n = z_crit.powi(2) / (2.0 * n);
    let yates_n = yates / n;

    let p_c_upper = sample_proportion + yates_n;
    let p_upper = if p_c_upper >= 1.0 {
        1.0
    } else {
        (p_c_upper + z22n + z_crit * (p_c_upper * (1.0 - p_c_upper) / n + z22n / (2.0 * n)).sqrt())
            / (1.0 + 2.0 * z22n)
    };

    let p_c_lower = sample_proportion - yates_n;
    let p_lower = if p_c_lower <= 0.0 {
        0.0
    } else {
        (p_c_lower + z22n - z_crit * (p_c_lower * (1.0 - p_c_lower) / n + z22n / (2.0 * n)).sqrt())
            / (1.0 + 2.0 * z22n)
    };

    let (ci_lower, ci_upper) = match alternative {
        AlternativeType::TwoSided => (p_lower.max(0.0), p_upper.min(1.0)),
        AlternativeType::Greater => (p_lower.max(0.0), 1.0),
        AlternativeType::Less => (0.0, p_upper.min(1.0)),
    };

    Ok(OneSampleProportionTestResult {
        test_statistic: TestStatistic {
            value: chi_square_stat,
            name: "X-squared".to_string(), // Match R's naming
        },
        p_value,
        test_name: if correct {
            "1-sample proportions test with continuity correction".to_string()
        } else {
            "1-sample proportions test without continuity correction".to_string()
        },
        alpha,
        error_message: None,
        confidence_interval: ConfidenceInterval {
            lower: ci_lower,
            upper: ci_upper,
            confidence_level: 1.0 - alpha,
        },
        sample_proportion,
    })
}

/// Two-sample proportion test using chi-square statistic (matches R's prop.test)
pub fn chi_square_test_two_sample(
    x1: f64,
    n1: f64,
    x2: f64,
    n2: f64,
    alternative: AlternativeType,
    alpha: f64,
    correct: bool,
) -> Result<TwoSampleProportionTestResult, String> {
    if x1 < 0.0 || x1 > n1 || n1 <= 0.0 {
        return Err(
            "Invalid counts for sample 1: x1 must be between 0 and n1, n1 must be positive"
                .to_string(),
        );
    }

    if x2 < 0.0 || x2 > n2 || n2 <= 0.0 {
        return Err(
            "Invalid counts for sample 2: x2 must be between 0 and n2, n2 must be positive"
                .to_string(),
        );
    }

    let p1 = x1 / n1;
    let p2 = x2 / n2;
    let delta = p1 - p2;

    // Pooled proportion for null hypothesis
    let p_pooled = (x1 + x2) / (n1 + n2);

    // Expected counts under null hypothesis
    let e11 = n1 * p_pooled;
    let e12 = n1 * (1.0 - p_pooled);
    let e21 = n2 * p_pooled;
    let e22 = n2 * (1.0 - p_pooled);

    // Check if chi-square approximation is valid
    if e11 < 5.0 || e12 < 5.0 || e21 < 5.0 || e22 < 5.0 {
        // Could emit warning here like R does
    }

    // Yates continuity correction
    let yates = if correct { 0.5 } else { 0.0 };

    // Chi-square statistic
    let chi_square_stat = ((x1 - e11).abs() - yates).powi(2) / e11
        + ((n1 - x1 - e12).abs() - yates).powi(2) / e12
        + ((x2 - e21).abs() - yates).powi(2) / e21
        + ((n2 - x2 - e22).abs() - yates).powi(2) / e22;

    // Calculate p-value
    let p_value = match alternative {
        AlternativeType::TwoSided => {
            // Two-sided test uses chi-square distribution with 1 df
            chi_squared::pchisq(chi_square_stat, 1.0, false, false)
        }
        AlternativeType::Less | AlternativeType::Greater => {
            // One-sided tests use normal approximation
            let z = if delta < 0.0 {
                -chi_square_stat.sqrt()
            } else {
                chi_square_stat.sqrt()
            };

            match alternative {
                AlternativeType::Less => normal::pnorm(z, 0.0, 1.0, true, false),
                AlternativeType::Greater => normal::pnorm(z, 0.0, 1.0, false, false),
                _ => unreachable!(),
            }
        }
    };

    // Confidence interval for difference in proportions
    let z_crit = if alternative == AlternativeType::TwoSided {
        normal::qnorm((1.0 + (1.0 - alpha)) / 2.0, 0.0, 1.0, true, false)
    } else {
        normal::qnorm(1.0 - alpha, 0.0, 1.0, true, false)
    };

    let se = (p1 * (1.0 - p1) / n1 + p2 * (1.0 - p2) / n2).sqrt();
    let yates_correction = yates * (1.0 / n1 + 1.0 / n2);
    let width = z_crit * se + yates_correction;

    let (ci_lower, ci_upper) = match alternative {
        AlternativeType::TwoSided => ((delta - width).max(-1.0), (delta + width).min(1.0)),
        AlternativeType::Greater => ((delta - width).max(-1.0), 1.0),
        AlternativeType::Less => (-1.0, (delta + width).min(1.0)),
    };

    Ok(TwoSampleProportionTestResult {
        test_statistic: TestStatistic {
            value: chi_square_stat,
            name: "X-squared".to_string(), // Match R's naming
        },
        p_value,
        test_name: if correct {
            "2-sample test for equality of proportions with continuity correction".to_string()
        } else {
            "2-sample test for equality of proportions without continuity correction".to_string()
        },
        alpha,
        error_message: None,
        confidence_interval: ConfidenceInterval {
            lower: ci_lower,
            upper: ci_upper,
            confidence_level: 1.0 - alpha,
        },
        proportion_difference: delta,
    })
}
