// Fisher's exact test implementation - pure computational functions
// WASM binding is handled in wasm_bindings.rs

use crate::stats::core::{AlternativeType, TestResult, TestType};
use crate::stats::helpers::create_error_result;

/// Fisher's exact test result structure
pub struct FisherResult {
    pub p_value: f64,
    pub odds_ratio_estimate: f64,
    pub method: String,
}

/// Fisher's exact test for 2x2 contingency tables

pub fn fishers_exact_test(
    table: &[f64],
    alternative: &str,
    odds_ratio: f64,
    alpha: f64,
) -> TestResult {
    let alternative_type = AlternativeType::from_str(alternative);
    if table.len() != 4 {
        return create_error_result(
            "Fisher's exact test",
            "Fisher's exact test requires a 2x2 contingency table (4 values)",
        );
    }

    // Extract table values
    let a = table[0] as i32;
    let b = table[1] as i32;
    let c = table[2] as i32;
    let d = table[3] as i32;

    // Validate input
    if [a, b, c, d].iter().any(|&x| x < 0) {
        return create_error_result(
            "Fisher's exact test",
            "All table entries must be non-negative",
        );
    }

    // Hypergeometric parameters
    let m = a + c; // row 1 total
    let n = b + d; // row 2 total
    let k = a + b; // column 1 total
    let x = a; // observed count in cell (1,1)

    let lo = std::cmp::max(0, k - n);
    let hi = std::cmp::min(k, m);

    // Calculate p-value based on alternative hypothesis
    let p_value = match alternative_type {
        AlternativeType::Less => pnhyper(x, m, n, k, odds_ratio, false), // P(X <= x)
        AlternativeType::Greater => pnhyper(x, m, n, k, odds_ratio, true), // P(X >= x)
        AlternativeType::TwoSided => {
            if odds_ratio == 0.0 {
                if x == lo { 1.0 } else { 0.0 }
            } else if odds_ratio.is_infinite() {
                if x == hi { 1.0 } else { 0.0 }
            } else {
                // Two-sided test: sum probabilities of outcomes as or more extreme
                // R uses 10^(-7) as relative error
                let rel_err = 1.0 + 1e-7;
                let obs_prob = dnhyper(x, m, n, k, odds_ratio);

                let mut sum = 0.0;
                for i in lo..=hi {
                    let prob = dnhyper(i, m, n, k, odds_ratio);
                    if prob <= obs_prob * rel_err {
                        sum += prob;
                    }
                }
                sum
            }
        }
    };

    // Calculate odds ratio estimate (MLE) - following R's approach
    let estimate = mle_odds_ratio(x, m, n, k);

    TestResult {
        test_type: TestType::ChiSquareIndependence, // Closest available type
        test_statistic: Some(estimate), // Using odds ratio as test statistic
        p_value: Some(p_value.max(0.0).min(1.0)),
        confidence_interval_lower: Some(f64::NAN),
        confidence_interval_upper: Some(f64::NAN),
        effect_size: Some(estimate), // Effect size is the odds ratio
        odds_ratio: Some(estimate),
        exact_p_value: Some(p_value.max(0.0).min(1.0)),
        sample_size: Some((a + b + c + d) as usize),
        ..Default::default()
    }
}

/// Log factorial helper function
fn log_factorial(n: f64) -> f64 {
    if n <= 1.0 {
        0.0
    } else {
        (1..=(n as i32)).map(|i| (i as f64).ln()).sum()
    }
}

/// Log hypergeometric probability density function
/// P(X = x) where X ~ Hypergeometric(m, n, k)
fn dhyper_log(x: i32, m: i32, n: i32, k: i32) -> f64 {
    if x < 0 || x > k || x > m || (k - x) > n {
        f64::NEG_INFINITY
    } else {
        log_combination(m, x) + log_combination(n, k - x) - log_combination(m + n, k)
    }
}

/// Log combination function: log(n choose k)
fn log_combination(n: i32, k: i32) -> f64 {
    if k < 0 || k > n {
        f64::NEG_INFINITY
    } else if k == 0 || k == n {
        0.0
    } else {
        let k = std::cmp::min(k, n - k);
        log_factorial(n as f64) - log_factorial(k as f64) - log_factorial((n - k) as f64)
    }
}

/// Non-central hypergeometric probability density function
fn dnhyper(x: i32, m: i32, n: i32, k: i32, ncp: f64) -> f64 {
    let lo = std::cmp::max(0, k - n);
    let hi = std::cmp::min(k, m);

    if ncp == 0.0 {
        return if x == lo { 1.0 } else { 0.0 };
    }
    if ncp.is_infinite() {
        return if x == hi { 1.0 } else { 0.0 };
    }

    // Compute log densities for all support points
    let mut log_densities = Vec::new();
    let mut max_log_density = f64::NEG_INFINITY;

    for i in lo..=hi {
        let log_d = dhyper_log(i, m, n, k) + ncp.ln() * i as f64;
        log_densities.push(log_d);
        max_log_density = max_log_density.max(log_d);
    }

    // Convert to probabilities with numerical stability
    let mut sum = 0.0;
    let mut densities = Vec::new();
    for log_d in log_densities {
        let d = (log_d - max_log_density).exp();
        densities.push(d);
        sum += d;
    }

    // Normalize and return density for x
    let idx = (x - lo) as usize;
    if idx < densities.len() && sum > 0.0 {
        densities[idx] / sum
    } else {
        0.0
    }
}

/// Non-central hypergeometric cumulative distribution function
/// Matches R's pnhyper implementation
fn pnhyper(q: i32, m: i32, n: i32, k: i32, ncp: f64, upper_tail: bool) -> f64 {
    let lo = std::cmp::max(0, k - n);
    let hi = std::cmp::min(k, m);

    // Handle central hypergeometric case (ncp = 1)
    if ncp == 1.0 {
        return if upper_tail {
            // P(X >= q) = phyper(q-1, m, n, k, lower.tail = FALSE) = 1 - P(X <= q-1)
            1.0 - phyper_central(q - 1, m, n, k, false)
        } else {
            // P(X <= q) = phyper(q, m, n, k, lower.tail = TRUE)
            phyper_central(q, m, n, k, false)
        };
    }

    // Handle boundary cases
    if ncp == 0.0 {
        return if upper_tail {
            if q <= lo { 1.0 } else { 0.0 }
        } else {
            if q >= lo { 1.0 } else { 0.0 }
        };
    }

    if ncp.is_infinite() {
        return if upper_tail {
            if q <= hi { 1.0 } else { 0.0 }
        } else {
            if q >= hi { 1.0 } else { 0.0 }
        };
    }

    // Sum densities for appropriate range
    let mut sum = 0.0;
    for x in lo..=hi {
        let include = if upper_tail { x >= q } else { x <= q };
        if include {
            sum += dnhyper(x, m, n, k, ncp);
        }
    }

    sum.max(0.0).min(1.0)
}

/// Central hypergeometric cumulative distribution function
fn phyper_central(q: i32, m: i32, n: i32, k: i32, upper_tail: bool) -> f64 {
    let lo = std::cmp::max(0, k - n);
    let hi = std::cmp::min(k, m);

    if upper_tail {
        if q >= hi {
            return 0.0;
        }
        if q < lo {
            return 1.0;
        }
    } else {
        if q >= hi {
            return 1.0;
        }
        if q < lo {
            return 0.0;
        }
    }

    let mut sum = 0.0;
    if upper_tail {
        for x in (q + 1)..=hi {
            sum += dhyper_central(x, m, n, k);
        }
    } else {
        for x in lo..=q {
            sum += dhyper_central(x, m, n, k);
        }
    }

    sum.max(0.0).min(1.0)
}

/// Central hypergeometric probability density function
fn dhyper_central(x: i32, m: i32, n: i32, k: i32) -> f64 {
    dhyper_log(x, m, n, k).exp()
}

/// Calculate expectation of non-central hypergeometric distribution
/// E(X) where X ~ NonCentralHypergeometric(m, n, k, ncp)
fn expectation_nhyper(m: i32, n: i32, k: i32, ncp: f64) -> f64 {
    let lo = std::cmp::max(0, k - n);
    let hi = std::cmp::min(k, m);

    if ncp == 0.0 {
        return lo as f64;
    }
    if ncp.is_infinite() {
        return hi as f64;
    }

    let mut sum = 0.0;
    for x in lo..=hi {
        sum += (x as f64) * dnhyper(x, m, n, k, ncp);
    }
    sum
}

/// Calculate MLE for odds ratio using R's approach
/// Solves E(X) = x by finding ncp such that expectation equals observed value
fn mle_odds_ratio(x: i32, m: i32, n: i32, k: i32) -> f64 {
    let lo = std::cmp::max(0, k - n);
    let hi = std::cmp::min(k, m);

    // Handle boundary cases
    if x == lo {
        return 0.0;
    }
    if x == hi {
        return f64::INFINITY;
    }

    // Check if ncp = 1 gives the right expectation
    let mu = expectation_nhyper(m, n, k, 1.0);
    let x_f = x as f64;

    if (mu - x_f).abs() < 1e-10 {
        return 1.0;
    }

    // Use a simple search to find ncp such that E(X) = x
    // This is a simplified version of R's uniroot approach
    if mu > x_f {
        // Search in (0, 1)
        binary_search_mle(m, n, k, x_f, 0.0001, 1.0)
    } else {
        // Search in (1, large_value), using 1/ncp parameterization
        let result = binary_search_mle(m, n, k, x_f, 1.0, 1000.0);
        result
    }
}

/// Binary search to find MLE odds ratio
fn binary_search_mle(m: i32, n: i32, k: i32, target: f64, mut low: f64, mut high: f64) -> f64 {
    const MAX_ITER: usize = 50;
    const TOL: f64 = 1e-6;

    for _ in 0..MAX_ITER {
        let mid = (low + high) / 2.0;
        let exp = expectation_nhyper(m, n, k, mid);

        if (exp - target).abs() < TOL {
            return mid;
        }

        if exp > target {
            high = mid;
        } else {
            low = mid;
        }

        if (high - low) < TOL {
            break;
        }
    }

    (low + high) / 2.0
}
