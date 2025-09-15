use super::super::super::core::{AlternativeType, TestResult, TestType};
use super::super::super::distributions::normal;
use super::super::super::distributions::students_t;
use super::super::super::helpers::create_error_result;
use std::collections::HashMap;

/// Calculate ranks for an array with tie handling (average ranks for ties)
fn rank(values: &[f64]) -> Vec<f64> {
    let n = values.len();
    let mut indexed: Vec<(f64, usize)> = values.iter().enumerate().map(|(i, &v)| (v, i)).collect();
    indexed.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());

    let mut ranks = vec![0.0; n];
    let mut i = 0;

    while i < n {
        let mut j = i;
        // Find all tied values
        while j < n && indexed[j].0 == indexed[i].0 {
            j += 1;
        }

        // Calculate average rank for tied values (1-based ranking)
        let avg_rank = (i + 1 + j) as f64 / 2.0;

        // Assign average rank to all tied values
        for k in i..j {
            ranks[indexed[k].1] = avg_rank;
        }

        i = j;
    }

    ranks
}

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
pub fn pearson_test(x: &[f64], y: &[f64], alternative: AlternativeType, alpha: f64) -> TestResult {
    if x.len() != y.len() {
        return create_error_result(
            "Pearson correlation test",
            "x and y must have the same length",
        );
    }

    let n = x.len();
    if n < 3 {
        return create_error_result(
            "Pearson correlation test",
            "Not enough observations (need at least 3)",
        );
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

    TestResult {
        test_type: TestType::PearsonCorrelation,
        test_statistic: Some(t),
        p_value: Some(p_value),
        correlation: Some(r),
        degrees_of_freedom: Some(df),
        sample_size: Some(n),
        ..Default::default()
    }
}

/// Spearman rank correlation test
pub fn spearman_test(x: &[f64], y: &[f64], alternative: AlternativeType, alpha: f64) -> TestResult {
    if x.len() != y.len() {
        return create_error_result(
            "Spearman correlation test",
            "x and y must have the same length",
        );
    }

    let n = x.len();
    if n < 2 {
        return create_error_result(
            "Spearman correlation test",
            "Not enough observations (need at least 2)",
        );
    }

    // Convert to ranks
    let rank_x = rank(x);
    let rank_y = rank(y);

    // Calculate correlation of ranks
    let rho_raw = pearson_correlation(&rank_x, &rank_y);
    // Clamp to avoid exactly +/-1 which produces infinite t
    let eps = 1e-15;
    let rho = rho_raw.max(-1.0 + eps).min(1.0 - eps);

    // Calculate S statistic (sum of squared rank differences)
    let s = calculate_s_statistic(&rank_x, &rank_y);

    let (test_statistic, p_value) = if n <= 5 {
        // For small samples, use exact test if no ties
        let unique_x = x
            .iter()
            .map(|&v| format!("{:.10}", v))
            .collect::<std::collections::HashSet<_>>()
            .len();
        let unique_y = y
            .iter()
            .map(|&v| format!("{:.10}", v))
            .collect::<std::collections::HashSet<_>>()
            .len();
        let has_ties = unique_x < n || unique_y < n;

        if !has_ties {
            // Use exact enumeration for small samples without ties
            let p = exact_spearman_p_value(n, s, &alternative);
            (s, p)
        } else {
            // Use t-approximation even for small samples with ties
            let df = (n - 2) as f64;
            let t = rho * (df / (1.0 - rho * rho)).sqrt();
            let p = match alternative {
                AlternativeType::TwoSided => 2.0 * students_t::pt(t.abs(), df, false, false),
                AlternativeType::Greater => students_t::pt(t, df, false, false),
                AlternativeType::Less => students_t::pt(t, df, true, false),
            };
            (t, p)
        }
    } else {
        // For large samples, R uses S statistic with normal approximation
        // Calculate expected value and variance of S under H0
        let n_f = n as f64;
        let expected_s = n_f * (n_f * n_f - 1.0) / 6.0;
        let variance_s = n_f * (n_f * n_f - 1.0) * (n_f + 1.0) / 36.0;

        // Normal approximation
        let z = (s - expected_s) / variance_s.sqrt();
        let p = match alternative {
            AlternativeType::TwoSided => {
                2.0 * (1.0 - normal::pnorm(z.abs(), 0.0, 1.0, true, false))
            }
            AlternativeType::Greater => 1.0 - normal::pnorm(z, 0.0, 1.0, true, false),
            AlternativeType::Less => normal::pnorm(z, 0.0, 1.0, true, false),
        };
        (s, p)
    };

    TestResult {
        test_type: TestType::SpearmanCorrelation,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        correlation: Some(rho),
        sample_size: Some(n),
        ranks: Some(rank_x),
        ..Default::default()
    }
}

/// Calculate S statistic for Spearman test
fn calculate_s_statistic(rank_x: &[f64], rank_y: &[f64]) -> f64 {
    let _n = rank_x.len() as f64;
    rank_x
        .iter()
        .zip(rank_y.iter())
        .map(|(&rx, &ry)| (rx - ry).powi(2))
        .sum::<f64>()
        * 6.0
}

/// Exact p-value for Spearman test (small samples, no ties)
fn exact_spearman_p_value(n: usize, s_observed: f64, alternative: &AlternativeType) -> f64 {
    // For very small samples, we could implement exact enumeration
    // For now, use normal approximation
    let n_f = n as f64;
    let mean = n_f * (n_f * n_f - 1.0) / 6.0;
    let variance = n_f * (n_f * n_f - 1.0) * (n_f + 1.0) / 36.0;
    let z = (s_observed - mean) / variance.sqrt();

    match alternative {
        AlternativeType::TwoSided => 2.0 * (1.0 - normal::pnorm(z.abs(), 0.0, 1.0, true, false)),
        AlternativeType::Greater => 1.0 - normal::pnorm(z, 0.0, 1.0, true, false),
        AlternativeType::Less => normal::pnorm(z, 0.0, 1.0, true, false),
    }
}

/// Count concordant and discordant pairs for Kendall's tau
fn count_pairs(x: &[f64], y: &[f64]) -> (i32, i32, i32, i32, i32) {
    let n = x.len();
    let mut concordant = 0;
    let mut discordant = 0;
    let mut ties_x = 0;
    let mut ties_y = 0;
    let mut ties_xy = 0;

    for i in 0..n - 1 {
        for j in i + 1..n {
            let dx = x[j] - x[i];
            let dy = y[j] - y[i];

            if dx == 0.0 && dy == 0.0 {
                ties_xy += 1;
            } else if dx == 0.0 {
                ties_x += 1;
            } else if dy == 0.0 {
                ties_y += 1;
            } else if dx * dy > 0.0 {
                concordant += 1;
            } else {
                discordant += 1;
            }
        }
    }

    (concordant, discordant, ties_x, ties_y, ties_xy)
}

/// Kendall rank correlation test
pub fn kendall_test(x: &[f64], y: &[f64], alternative: AlternativeType, alpha: f64) -> TestResult {
    if x.len() != y.len() {
        return create_error_result(
            "Kendall correlation test",
            "x and y must have the same length",
        );
    }

    let n = x.len();
    if n < 2 {
        return create_error_result(
            "Kendall correlation test",
            "Not enough observations (need at least 2)",
        );
    }

    // Count concordant and discordant pairs
    let (concordant, discordant, ties_x, ties_y, ties_xy) = count_pairs(x, y);

    // Calculate tau
    let total_pairs = (n * (n - 1) / 2) as f64;
    let tau = (concordant - discordant) as f64
        / ((total_pairs - ties_x as f64 - ties_xy as f64)
            * (total_pairs - ties_y as f64 - ties_xy as f64))
            .sqrt();

    // Calculate S statistic
    let mut s = (concordant - discordant) as f64;

    // Variance with tie corrections
    let n_f = n as f64;
    let v0 = n_f * (n_f - 1.0) * (2.0 * n_f + 5.0);

    // Count tied groups
    let mut tie_groups_x: HashMap<String, i32> = HashMap::new();
    let mut tie_groups_y: HashMap<String, i32> = HashMap::new();

    for &val in x {
        let key = format!("{:.10}", val); // Use string key for floating point
        *tie_groups_x.entry(key).or_insert(0) += 1;
    }
    for &val in y {
        let key = format!("{:.10}", val);
        *tie_groups_y.entry(key).or_insert(0) += 1;
    }

    let mut vt = 0.0;
    let mut vu = 0.0;
    let mut t2_sum = 0.0;
    let mut u2_sum = 0.0;
    let mut t3_sum = 0.0;
    let mut u3_sum = 0.0;

    for &count in tie_groups_x.values() {
        if count > 1 {
            let count_f = count as f64;
            vt += count_f * (count_f - 1.0) * (2.0 * count_f + 5.0);
            let t2 = count_f * (count_f - 1.0);
            t2_sum += t2;
            t3_sum += count_f * (count_f - 1.0) * (count_f - 2.0);
        }
    }

    for &count in tie_groups_y.values() {
        if count > 1 {
            let count_f = count as f64;
            vu += count_f * (count_f - 1.0) * (2.0 * count_f + 5.0);
            let u2 = count_f * (count_f - 1.0);
            u2_sum += u2;
            u3_sum += count_f * (count_f - 1.0) * (count_f - 2.0);
        }
    }

    let mut variance = (v0 - vt - vu) / 18.0;
    if n > 2 {
        variance += (t2_sum * u2_sum) / (2.0 * n_f * (n_f - 1.0));
        variance += (t3_sum * u3_sum) / (9.0 * n_f * (n_f - 1.0) * (n_f - 2.0));
    }

    // Continuity correction
    if s > 0.0 {
        s -= 1.0;
    } else if s < 0.0 {
        s += 1.0;
    }
    let z = s / variance.sqrt();

    // Calculate p-value
    let p_value = match alternative {
        AlternativeType::TwoSided => 2.0 * (1.0 - normal::pnorm(z.abs(), 0.0, 1.0, true, false)),
        AlternativeType::Greater => 1.0 - normal::pnorm(z, 0.0, 1.0, true, false),
        AlternativeType::Less => normal::pnorm(z, 0.0, 1.0, true, false),
    };

    TestResult {
        test_type: TestType::KendallCorrelation,
        test_statistic: Some(z),
        p_value: Some(p_value),
        correlation: Some(tau),
        sample_size: Some(n),
        ..Default::default()
    }
}
