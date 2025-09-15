use super::super::super::core::{TailType, TestResult, TestType, calculate_p};
use super::super::super::helpers::create_error_result;
use statrs::distribution::ChiSquared;
use std::f64;

/// Perform a Chi-Square Test for Independence using a contingency table.

pub fn independence(contingency_table: &[Vec<f64>], alpha: f64) -> TestResult {
    let num_rows = contingency_table.len();
    if num_rows < 2 {
        return create_error_result("Chi-square independence", "At least two rows required");
    }

    let num_cols = contingency_table[0].len();
    if num_cols < 2 || !contingency_table.iter().all(|row| row.len() == num_cols) {
        return create_error_result(
            "Chi-square independence",
            "All rows must have equal and ≥2 columns",
        );
    }

    let total: f64 = contingency_table.iter().flatten().sum();
    if total == 0.0 {
        return create_error_result(
            "Chi-square independence",
            "Total frequency must be greater than zero",
        );
    }

    let mut expected = vec![vec![0.0; num_cols]; num_rows];
    let row_totals: Vec<f64> = contingency_table
        .iter()
        .map(|row| row.iter().sum())
        .collect();
    let col_totals: Vec<f64> = (0..num_cols)
        .map(|j| contingency_table.iter().map(|row| row[j]).sum())
        .collect();

    for i in 0..num_rows {
        for j in 0..num_cols {
            expected[i][j] = row_totals[i] * col_totals[j] / total;
        }
    }

    let test_statistic = contingency_table
        .iter()
        .enumerate()
        .map(|(i, row)| {
            row.iter()
                .enumerate()
                .map(|(j, &obs)| {
                    let exp = expected[i][j];
                    if exp == 0.0 {
                        0.0
                    } else {
                        // Apply Yates' continuity correction for 2x2 tables
                        let corrected_diff = if num_rows == 2 && num_cols == 2 {
                            let diff = (obs - exp).abs() - 0.5;
                            if diff < 0.0 { 0.0 } else { diff }
                        } else {
                            (obs - exp).abs()
                        };
                        corrected_diff.powi(2) / exp
                    }
                })
                .sum::<f64>()
        })
        .sum::<f64>();

    let df = (num_rows - 1) * (num_cols - 1);
    let chi_distribution = match ChiSquared::new(df as f64) {
        Ok(dist) => dist,
        Err(e) => {
            return create_error_result(
                "Chi-square independence",
                &format!("Chi-squared distribution error: {e}"),
            );
        }
    };
    let p_value = calculate_p(test_statistic, TailType::Right, &chi_distribution);
    let reject_null = p_value < alpha;

    // Calculate Cramér's V effect size
    let n = contingency_table.iter().flatten().sum::<f64>();
    let min_dim = (num_rows - 1).min(num_cols - 1) as f64;
    let cramers_v = if min_dim == 0.0 || n == 0.0 {
        0.0
    } else {
        (test_statistic / (n * min_dim)).sqrt()
    };

    // Calculate expected frequencies as a flat vector
    let expected_flat: Vec<f64> = expected.iter().flatten().cloned().collect();
    
    // Calculate residuals
    let residuals: Vec<f64> = contingency_table
        .iter()
        .enumerate()
        .flat_map(|(i, row)| {
            row.iter()
                .enumerate()
                .map(|(j, &obs)| {
                    let exp = expected[i][j];
                    if exp == 0.0 {
                        0.0
                    } else {
                        (obs - exp) / exp.sqrt()
                    }
                })
                .collect::<Vec<f64>>()
        })
        .collect();

    // Calculate phi coefficient for 2x2 tables
    let phi = if num_rows == 2 && num_cols == 2 {
        Some((test_statistic / n).sqrt())
    } else {
        None
    };

    TestResult {
        test_type: TestType::ChiSquareIndependence,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        degrees_of_freedom: Some(df as f64),
        sample_size: Some(n as usize),
        effect_size: Some(cramers_v),
        cramers_v: Some(cramers_v),
        phi_coefficient: phi,
        chi_square_expected: Some(expected_flat),
        residuals: Some(residuals),
        ..Default::default()
    }
}

/// Perform a Chi-Square Goodness of Fit Test.
///
/// This test evaluates whether an observed frequency distribution matches an expected distribution.
///
/// # Arguments
///
/// * `observed` - An iterator of observed frequencies.
/// * `expected` - An iterator of expected frequencies (must be same length as `observed`).
/// * `alpha` - Significance level (commonly 0.05).
///
/// # Returns
///
/// Returns a `Result<TestResult, StatError>`, where:
/// - `TestResult` contains:
///     - `test_statistic`: The calculated chi-square statistic.
///     - `p_value`: The p-value associated with the statistic.
///     - `reject_null`: Whether the null hypothesis is rejected.
///     - `null_hypothesis`: "H0: Observed distribution matches expected distribution".
///     - `alt_hypothesis`: "Ha: Observed distribution does not match expected distribution".
///     - `confidence_interval`: Not applicable; returns `(NaN, NaN)`.
///
/// # Errors
/// Returns `StatError` if:
/// - Inputs have different lengths or contain fewer than two categories.
/// - Invalid values are detected (e.g., expected = 0).
///
pub fn goodness_of_fit<O, E, T, U>(observed: O, expected: E, alpha: f64) -> TestResult
where
    O: IntoIterator<Item = T>,
    E: IntoIterator<Item = U>,
    T: Into<f64>,
    U: Into<f64>,
{
    let observed: Vec<f64> = observed.into_iter().map(|x| x.into()).collect();
    let expected: Vec<f64> = expected.into_iter().map(|x| x.into()).collect();

    if observed.len() != expected.len() {
        return create_error_result(
            "Chi-square goodness of fit",
            "Observed and expected lengths must match",
        );
    }
    if observed.len() < 2 {
        return create_error_result(
            "Chi-square goodness of fit",
            "At least two categories required",
        );
    }

    let test_statistic: f64 = observed
        .iter()
        .zip(expected.iter())
        .map(|(&obs, &exp)| {
            if exp == 0.0 {
                0.0
            } else {
                (obs - exp).powi(2) / exp
            }
        })
        .sum();

    let df = (observed.len() - 1) as f64;
    let chi_distribution = match ChiSquared::new(df) {
        Ok(dist) => dist,
        Err(e) => {
            return create_error_result(
                "Chi-square goodness of fit",
                &format!("Chi-squared distribution error: {e}"),
            );
        }
    };
    let p_value = calculate_p(test_statistic, TailType::Right, &chi_distribution);
    let reject_null = p_value < alpha;

    // Calculate effect size (Cramér's V for goodness of fit)
    let n: f64 = observed.iter().sum();
    let effect_size = if n > 0.0 && test_statistic > 0.0 {
        (test_statistic / n).sqrt()
    } else {
        0.0
    };

    TestResult {
        test_type: TestType::ChiSquareIndependence,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        degrees_of_freedom: Some(df),
        sample_size: Some(observed.len()),
        effect_size: Some(effect_size),
        chi_square_expected: Some(expected.clone()),
        ..Default::default()
    }
}
