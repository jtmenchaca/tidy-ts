use super::super::super::core::{
    AlternativeType,
    types::{
        ConfidenceInterval, EffectSize, EffectSizeType, SpearmanCorrelationTestResult,
        TestStatistic,
    },
};
use super::super::super::distributions::students_t;
use super::utils::rank;

/// Calculate Pearson correlation coefficient (used for Spearman)
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

/// Factorial function for small integers
fn factorial(n: usize) -> usize {
    if n <= 1 { 1 } else { n * factorial(n - 1) }
}

/// Exact p-value for Spearman test (small samples, no ties)
fn exact_spearman_p_value(n: usize, rho_observed: f64, alternative: &AlternativeType) -> f64 {
    if n > 9 {
        // Fall back to asymptotic method for larger samples
        let df = (n - 2) as f64;
        let t = rho_observed * (df / (1.0 - rho_observed * rho_observed)).sqrt();
        return match alternative {
            AlternativeType::TwoSided => 2.0 * students_t::pt(t.abs(), df, false, false),
            AlternativeType::Greater => students_t::pt(t, df, false, false),
            AlternativeType::Less => students_t::pt(t, df, true, false),
        };
    }

    // For perfect correlation cases, use exact formula
    let abs_rho = rho_observed.abs();
    if (abs_rho - 1.0).abs() < 1e-10 {
        // Perfect correlation: only 2 permutations out of n! give ρ = ±1
        let total_perms = factorial(n) as f64;
        let extreme_perms = 2.0; // One for +1, one for -1
        let one_sided_p = extreme_perms / total_perms;

        return match alternative {
            AlternativeType::TwoSided => one_sided_p, // Already accounts for both tails
            AlternativeType::Greater if rho_observed > 0.0 => one_sided_p / 2.0, // Only +1 tail
            AlternativeType::Less if rho_observed < 0.0 => one_sided_p / 2.0, // Only -1 tail
            _ => 1.0 - one_sided_p / 2.0,             // Opposite tail
        };
    }

    // For non-perfect correlations, fall back to asymptotic
    let df = (n - 2) as f64;
    let t = rho_observed * (df / (1.0 - rho_observed * rho_observed)).sqrt();
    match alternative {
        AlternativeType::TwoSided => 2.0 * students_t::pt(t.abs(), df, false, false),
        AlternativeType::Greater => students_t::pt(t, df, false, false),
        AlternativeType::Less => students_t::pt(t, df, true, false),
    }
}

/// Spearman rank correlation test
pub fn spearman_test(
    x: &[f64],
    y: &[f64],
    alternative: AlternativeType,
    alpha: f64,
) -> Result<SpearmanCorrelationTestResult, String> {
    if x.len() != y.len() {
        return Err("x and y must have the same length".to_string());
    }

    let n = x.len();
    if n < 2 {
        return Err("Not enough observations (need at least 2)".to_string());
    }

    // Convert to ranks
    let rank_x = rank(x);
    let rank_y = rank(y);

    // Calculate correlation of ranks
    let rho_raw = pearson_correlation(&rank_x, &rank_y);
    // Clamp to avoid exactly +/-1 which produces infinite t
    let eps = 1e-15;
    let rho = rho_raw.max(-1.0 + eps).min(1.0 - eps);

    // Calculate S statistic (sum of squared rank differences) - used for old approach
    let _s = calculate_s_statistic(&rank_x, &rank_y);

    // Check for ties upfront for test statistic naming
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

    // Follow R's approach: always return S statistic and calculate p-value accordingly
    // R: q <- (n^3 - n) * (1 - r) / 6
    let n_f = n as f64;
    let s_statistic = (n_f.powi(3) - n_f) * (1.0 - rho) / 6.0;

    let p_value = if n <= 9 && !has_ties {
        // Use exact permutation test for small samples without ties
        exact_spearman_p_value(n, rho_raw, &alternative)
    } else {
        // Large sample or ties: use t-approximation
        let df = (n - 2) as f64;
        let t = rho * (df / (1.0 - rho * rho)).sqrt();
        match alternative {
            AlternativeType::TwoSided => 2.0 * students_t::pt(t.abs(), df, false, false),
            AlternativeType::Greater => students_t::pt(t, df, false, false),
            AlternativeType::Less => students_t::pt(t, df, true, false),
        }
    };

    // Always return S statistic to match R's cor.test()
    let (test_statistic_name, test_statistic_value) = ("S".to_string(), s_statistic);

    Ok(SpearmanCorrelationTestResult {
        test_name: "Spearman's rank correlation rho".to_string(), // Match R's method name
        p_value,
        effect_size: EffectSize {
            value: rho,
            name: EffectSizeType::SpearmansRho.as_str().to_string(),
        },
        test_statistic: TestStatistic {
            value: test_statistic_value,
            name: test_statistic_name,
        },
        confidence_interval: ConfidenceInterval {
            lower: f64::NAN, // TODO: Implement CI for correlation
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: (n - 2) as f64, // Always n-2 for consistency
        alpha,
        error_message: None,
    })
}
