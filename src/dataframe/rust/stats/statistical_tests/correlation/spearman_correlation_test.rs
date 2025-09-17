use super::super::super::core::{
    AlternativeType,
    types::{
        ConfidenceInterval, EffectSize, EffectSizeType, SpearmanCorrelationTestResult,
        TestStatistic, TestStatisticName,
    },
};
use super::super::super::distributions::normal;
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
    
    let p_value = if n <= 1290 && !has_ties {
        // Use exact test (R uses .Call(C_pRho, ...))
        // For now, use t-approximation as fallback
        let df = (n - 2) as f64;
        let t = rho * (df / (1.0 - rho * rho)).sqrt();
        match alternative {
            AlternativeType::TwoSided => 2.0 * students_t::pt(t.abs(), df, false, false),
            AlternativeType::Greater => students_t::pt(-t, df, true, false), // Note: negative t for S statistic direction
            AlternativeType::Less => students_t::pt(-t, df, false, false),
        }
    } else {
        // Large sample or ties: use t-approximation (R's asymptotic method)
        let df = (n - 2) as f64;
        let t = rho * (df / (1.0 - rho * rho)).sqrt();
        match alternative {
            AlternativeType::TwoSided => 2.0 * students_t::pt(t.abs(), df, false, false),
            AlternativeType::Greater => students_t::pt(-t, df, true, false), // Note: negative t for S statistic direction
            AlternativeType::Less => students_t::pt(-t, df, false, false),
        }
    };
    
    let test_statistic = s_statistic;

    Ok(SpearmanCorrelationTestResult {
        test_statistic: TestStatistic {
            value: test_statistic,
            name: TestStatisticName::SStatistic.as_str().to_string(), // Always S statistic like R
        },
        p_value,
        test_name: "Spearman's rank correlation rho".to_string(), // Match R's method name
        alpha,
        error_message: None,
        confidence_interval: ConfidenceInterval {
            lower: f64::NAN, // TODO: Implement CI for correlation
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: (n - 2) as f64, // Always n-2 for consistency
        effect_size: EffectSize {
            value: rho,
            effect_type: EffectSizeType::SpearmansRho.as_str().to_string(),
        },
    })
}
