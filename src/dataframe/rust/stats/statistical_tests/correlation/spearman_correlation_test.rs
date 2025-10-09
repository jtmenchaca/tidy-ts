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

/// P-value for Spearman test using AS 89 algorithm (R's prho.c)
/// This evaluates the probability Pr[S >= is] or Pr[S < is]
/// where is = sum of squared rank differences
/// For n <= 9: uses exact permutation enumeration
/// For n > 9: uses Edgeworth series expansion
fn exact_spearman_p_value(n: usize, is: f64, lower_tail: bool) -> f64 {
    use super::super::super::distributions::normal;

    const N_SMALL: usize = 9;

    // Test admissibility
    if is <= 0.0 {
        return if lower_tail { 0.0 } else { 1.0 };
    }

    // n3 = (n^3 - n)/3 is used as upper bound check
    let n3 = (n as f64) * ((n * n - 1) as f64) / 3.0;
    if is > n3 {
        return if lower_tail { 1.0 } else { 0.0 };
    }

    if n <= N_SMALL {
        // Exact evaluation by enumeration of permutations (for n <= 9)
    let mut nfac = 1;
    for i in 1..=n {
        nfac *= i;
    }

    let mut l: Vec<usize> = (1..=n).collect();

    let ifr = if is == n3 {
        1
    } else {
        let mut count = 0;
        for _m in 0..nfac {
            // Calculate sum of squared rank differences for this permutation
            let mut ise = 0;
            for i in 0..n {
                let n1 = (i + 1) as i32 - l[i] as i32;
                ise += n1 * n1;
            }

            if is <= ise as f64 {
                count += 1;
            }

            // Generate next permutation using R's algorithm
            let mut n1 = n;
            loop {
                let mt = l[0];
                for i in 1..n1 {
                    l[i - 1] = l[i];
                }
                n1 -= 1;
                l[n1] = mt;

                if mt != n1 + 1 || n1 <= 1 {
                    break;
                }
            }
        }
        count
    };

        let pv = if lower_tail {
            (nfac - ifr) as f64 / nfac as f64
        } else {
            ifr as f64 / nfac as f64
        };

        // Clamp like R does
        pv.max(0.0).min(1.0)
    } else {
        // Edgeworth series expansion for n > 9 (R's prho.c lines 128-146)
        // Edgeworth coefficients from AS 89
        const C1: f64 = 0.2274;
        const C2: f64 = 0.2531;
        const C3: f64 = 0.1745;
        const C4: f64 = 0.0758;
        const C5: f64 = 0.1033;
        const C6: f64 = 0.3932;
        const C7: f64 = 0.0879;
        const C8: f64 = 0.0151;
        const C9: f64 = 0.0072;
        const C10: f64 = 0.0831;
        const C11: f64 = 0.0131;
        const C12: f64 = 0.00046;

        let y = n as f64;
        let b = 1.0 / y;
        let x = (6.0 * (is - 1.0) * b / (y * y - 1.0) - 1.0) * (y - 1.0).sqrt();
        // x = rho * sqrt(n-1) == rho / sqrt(var(rho)) ~ N(0,1)

        let y2 = x * x;
        let u = x * b * (C1 + b * (C2 + C3 * b) +
                         y2 * (-C4 + b * (C5 + C6 * b) -
                               y2 * b * (C7 + C8 * b -
                                        y2 * (C9 - C10 * b + y2 * b * (C11 - C12 * y2))
                                   )));
        let y_exp = u / (y2 / 2.0).exp();
        let pv = if lower_tail { -y_exp } else { y_exp } +
                 normal::pnorm(x, 0.0, 1.0, lower_tail, false);

        // Clamp to [0, 1]
        pv.max(0.0).min(1.0)
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
    // Use rho_raw (not clamped) for S statistic to match R exactly
    let n_f = n as f64;
    let s_statistic = (n_f.powi(3) - n_f) * (1.0 - rho_raw) / 6.0;

    // Clamp rho only for t-statistic calculation to avoid division by zero
    let eps = 1e-15;
    let rho = rho_raw.max(-1.0 + eps).min(1.0 - eps);

    let p_value = if n <= 1290 && !has_ties {
        // Use AS 89 algorithm for samples without ties (R uses n <= 1290)
        // For n <= 9: exact permutation enumeration
        // For n > 9: Edgeworth series expansion
        // R calls pspearman which uses C_pRho (prho.c)
        let expected_s = (n_f.powi(3) - n_f) / 6.0;
        match alternative {
            AlternativeType::TwoSided => {
                // R's cor.test.R line 157 adds adjustment: round(q) + 2*lower.tail
                let (adjusted_s, lower_tail) = if s_statistic > expected_s {
                    // Upper tail: lower.tail = FALSE, so add 2*0 = 0
                    (s_statistic.round(), false)
                } else {
                    // Lower tail: lower.tail = TRUE, so add 2*1 = 2
                    (s_statistic.round() + 2.0, true)
                };
                let p = exact_spearman_p_value(n, adjusted_s, lower_tail);
                (2.0 * p).min(1.0)
            }
            AlternativeType::Greater => {
                // R: "greater" = pspearman(q, n, lower.tail = TRUE)
                // This adds 2*TRUE = 2
                let adjusted_s = s_statistic.round() + 2.0;
                exact_spearman_p_value(n, adjusted_s, true)
            }
            AlternativeType::Less => {
                // R: "less" = pspearman(q, n, lower.tail = FALSE)
                // This adds 2*FALSE = 0
                let adjusted_s = s_statistic.round();
                exact_spearman_p_value(n, adjusted_s, false)
            }
        }
    } else {
        // Large sample or ties: use t-approximation (R's cor.test.R lines 158-165)
        // R uses asymptotic t-distribution for large n, not Edgeworth series
        let den = (n_f * (n_f * n_f - 1.0)) / 6.0;
        let r = 1.0 - s_statistic / den;

        // Clamp to avoid division by zero
        let eps = 1e-15;
        let r_clamped = r.max(-1.0 + eps).min(1.0 - eps);

        let df = (n - 2) as f64;
        let t = r_clamped / ((1.0 - r_clamped * r_clamped) / df).sqrt();

        // R: pt(r / sqrt((1 - r^2)/(n-2)), df = n-2, lower.tail = !lower.tail)
        // Note the flipped lower.tail
        match alternative {
            AlternativeType::TwoSided => {
                2.0 * students_t::pt(t.abs(), df, false, false)
            }
            AlternativeType::Greater => {
                // R calls with lower.tail = TRUE, then flips to !TRUE = FALSE (upper tail)
                students_t::pt(t, df, false, false)
            }
            AlternativeType::Less => {
                // R calls with lower.tail = FALSE, then flips to !FALSE = TRUE (lower tail)
                students_t::pt(t, df, true, false)
            }
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
        alternative: alternative.as_str().to_string(),
        alpha,
        error_message: None,
    })
}
