//! Wilcoxon distribution wrapper using custom implementation
//!
//! This module provides the exact Wilcoxon distribution functions based on R's implementation.
//! The Wilcoxon rank-sum test (Mann-Whitney U test) uses this distribution for exact p-values.

use std::collections::HashMap;
use std::f64;
use std::sync::Mutex;
use std::sync::Once;

/// Cache for storing computed Wilcoxon probabilities
/// This follows R's approach of caching results to avoid recomputation
static WILCOX_CACHE: Mutex<Option<HashMap<(usize, usize, usize), f64>>> = Mutex::new(None);
static INIT: Once = Once::new();

/// Initialize the Wilcoxon cache
fn init_cache() {
    INIT.call_once(|| {
        if let Ok(mut cache) = WILCOX_CACHE.lock() {
            if cache.is_none() {
                *cache = Some(HashMap::new());
            }
        }
    });
}

/// Clear the Wilcoxon cache
pub fn wilcox_free() {
    if let Ok(mut cache) = WILCOX_CACHE.lock() {
        *cache = None;
    }
}

/// Count the number of ways to get Wilcoxon statistic = k with sample sizes m and n
///
/// This is the core function that implements the exact Wilcoxon distribution.
/// It follows R's cwilcox function exactly.
///
/// # Arguments
/// * `k` - The Wilcoxon statistic value
/// * `m` - Size of first sample
/// * `n` - Size of second sample
///
/// # Returns
/// The number of ways to achieve statistic k
fn cwilcox(k: usize, m: usize, n: usize) -> f64 {
    if k > m * n {
        return 0.0;
    }

    let u = m * n;
    let c = u / 2;

    // Use symmetry: cwilcox(k, m, n) = cwilcox(u-k, m, n)
    let k = if k > c { u - k } else { k };

    // Ensure m <= n for efficiency
    let (i, j) = if m < n { (m, n) } else { (n, m) };

    if j == 0 {
        return if k == 0 { 1.0 } else { 0.0 };
    }

    // Optimization: if k < j, we can reduce the problem
    if j > 0 && k < j {
        return cwilcox(k, i, k);
    }

    // Check cache first
    init_cache();
    if let Ok(cache) = WILCOX_CACHE.lock() {
        if let Some(ref cache_map) = *cache {
            if let Some(&count) = cache_map.get(&(i, j, k)) {
                return count;
            }
        }
    }

    // Compute recursively
    let count = if j == 0 {
        if k == 0 { 1.0 } else { 0.0 }
    } else {
        cwilcox(k.saturating_sub(j), i.saturating_sub(1), j) + cwilcox(k, i, j.saturating_sub(1))
    };

    // Cache the result
    if let Ok(mut cache) = WILCOX_CACHE.lock() {
        if let Some(ref mut cache_map) = *cache {
            cache_map.insert((i, j, k), count);
        }
    }

    count
}

/// Binomial coefficient (n choose k)
///
/// Calculates the number of ways to choose k items from n items.
/// This is used in the Wilcoxon distribution calculations.
fn choose(n: usize, k: usize) -> f64 {
    if k > n {
        return 0.0;
    }
    if k == 0 || k == n {
        return 1.0;
    }

    // Use symmetry for efficiency
    let k = if k > n - k { n - k } else { k };

    let mut result = 1.0;
    for i in 0..k {
        result = result * (n - i) as f64 / (i + 1) as f64;
    }
    result
}

/// Wilcoxon probability density function
///
/// Calculates P(W = x) for the Wilcoxon rank-sum distribution.
/// This follows R's dwilcox function.
///
/// # Arguments
/// * `x` - The Wilcoxon statistic value
/// * `m` - Size of first sample
/// * `n` - Size of second sample
/// * `give_log` - If true, return log probability
///
/// # Returns
/// The probability density or log probability density
pub fn dwilcox(x: f64, m: f64, n: f64, give_log: bool) -> f64 {
    // Check for NaN inputs
    if x.is_nan() || m.is_nan() || n.is_nan() {
        return x + m + n;
    }

    // Validate parameters
    if m <= 0.0 || n <= 0.0 {
        return if give_log { f64::NAN } else { f64::NAN };
    }

    // Check that x is non-negative and finite
    if x < 0.0 || !x.is_finite() {
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }

    let m = m.trunc() as usize;
    let n = n.trunc() as usize;
    let x = x.trunc() as usize;

    if x > m * n {
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }

    let count = cwilcox(x, m, n);
    let total = choose(m + n, n);
    let prob = count / total;

    if give_log {
        if prob <= 0.0 {
            f64::NEG_INFINITY
        } else {
            prob.ln()
        }
    } else {
        prob
    }
}

/// Wilcoxon cumulative distribution function
///
/// Calculates P(W ≤ q) for the Wilcoxon rank-sum distribution with sample sizes m and n.
/// This follows R's pwilcox function exactly.
///
/// # Arguments
/// * `q` - Quantile (Wilcoxon statistic)
/// * `m` - Size of first sample
/// * `n` - Size of second sample
/// * `lower_tail` - If true, return P(W ≤ q), otherwise P(W > q)
/// * `log_p` - If true, return log probability
///
/// # Returns
/// The cumulative probability or log cumulative probability
pub fn pwilcox(q: f64, m: f64, n: f64, lower_tail: bool, log_p: bool) -> f64 {
    // Check for NaN inputs (following R's approach)
    if q.is_nan() || m.is_nan() || n.is_nan() {
        return q + m + n;
    }

    // Validate parameters
    if !m.is_finite() || !n.is_finite() || m <= 0.0 || n <= 0.0 {
        return f64::NAN;
    }

    let m = m.trunc() as usize;
    let n = n.trunc() as usize;
    let q = (q + 1e-7).floor() as usize; // R uses floor(q + 1e-7)

    // q is usize, so it can't be negative, but we keep this for completeness
    // and to match R's interface exactly

    if q >= m * n {
        return if lower_tail {
            if log_p { 0.0 } else { 1.0 }
        } else {
            if log_p { f64::NEG_INFINITY } else { 0.0 }
        };
    }

    // Calculate total number of possible combinations
    let total = choose(m + n, n);

    // Use summation of probs over the shorter range (R's optimization)
    let p = if q <= (m * n / 2) {
        let mut sum = 0.0;
        for i in 0..=q {
            sum += cwilcox(i, m, n) / total;
        }
        sum
    } else {
        let q_sym = m * n - q;
        let mut sum = 0.0;
        for i in 0..q_sym {
            sum += cwilcox(i, m, n) / total;
        }
        1.0 - sum
    };

    // Handle upper tail and log probability
    let final_p = if lower_tail { p } else { 1.0 - p };

    if log_p {
        if final_p <= 0.0 {
            f64::NEG_INFINITY
        } else {
            final_p.ln()
        }
    } else {
        final_p
    }
}

/// Wilcoxon quantile function
///
/// Calculates the smallest value x such that P(W ≤ x) ≥ p.
/// This follows R's qwilcox function.
///
/// # Arguments
/// * `p` - Probability
/// * `m` - Size of first sample
/// * `n` - Size of second sample
/// * `lower_tail` - If true, p is P(W ≤ x), otherwise P(W > x)
/// * `log_p` - If true, p is log probability
///
/// # Returns
/// The quantile value
pub fn qwilcox(p: f64, m: f64, n: f64, lower_tail: bool, log_p: bool) -> f64 {
    // Check for NaN inputs
    if p.is_nan() || m.is_nan() || n.is_nan() {
        return p + m + n;
    }

    // Validate parameters
    if !m.is_finite() || !n.is_finite() || m <= 0.0 || n <= 0.0 {
        return f64::NAN;
    }

    let m = m.trunc() as usize;
    let n = n.trunc() as usize;

    // Handle log probability
    let mut p_val = if log_p { p.exp() } else { p };

    // Handle upper tail
    if !lower_tail {
        p_val = 1.0 - p_val;
    }

    // Validate probability range
    if p_val < 0.0 || p_val > 1.0 {
        return f64::NAN;
    }

    // Handle boundary cases
    if p_val == 0.0 {
        return 0.0;
    }
    if p_val == 1.0 {
        return (m * n) as f64;
    }

    // Search for the quantile
    let total = choose(m + n, n);
    let mut cum_prob = 0.0;

    if p_val <= 0.5 {
        // Search from 0 upward
        for q in 0..=m * n {
            cum_prob += cwilcox(q, m, n) / total;
            if cum_prob >= p_val {
                return q as f64;
            }
        }
    } else {
        // Search from maximum downward (more efficient for p > 0.5)
        p_val = 1.0 - p_val;
        for q in 0..=m * n {
            cum_prob += cwilcox(q, m, n) / total;
            if cum_prob > p_val {
                return (m * n - q) as f64;
            }
        }
    }

    (m * n) as f64
}

/// Random number generation for Wilcoxon distribution (not implemented)
///
/// # Arguments
/// * `m` - First sample size
/// * `n` - Second sample size
/// * `_rng` - Random number generator (unused)
///
/// # Returns
/// Always returns NaN as random generation is not implemented
pub fn rwilcox<R>(_m: f64, _n: f64, _rng: &mut R) -> f64 {
    f64::NAN
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_cwilcox_basic() {
        // Test basic cases
        assert_eq!(cwilcox(0, 1, 1), 1.0);
        assert_eq!(cwilcox(1, 1, 1), 1.0);
        assert_eq!(cwilcox(2, 1, 1), 0.0);

        // Test symmetry
        assert_eq!(cwilcox(0, 2, 2), 1.0);
        assert_eq!(cwilcox(4, 2, 2), 1.0);
    }

    #[test]
    fn test_dwilcox() {
        // Test with m=3, n=4, x=6
        let expected = 0.14285714285714285; // dwilcox(6, 3, 4) in R
        assert!((dwilcox(6.0, 3.0, 4.0, false) - expected).abs() < 1e-10);

        // Test log version
        assert!((dwilcox(6.0, 3.0, 4.0, true) - dwilcox(6.0, 3.0, 4.0, false).ln()).abs() < 1e-10);

        // Test basic probability densities
        assert!((dwilcox(0.0, 1.0, 1.0, false) - 0.5).abs() < 1e-10);
        assert!((dwilcox(1.0, 1.0, 1.0, false) - 0.5).abs() < 1e-10);

        // Test that probabilities sum to 1
        let mut sum = 0.0;
        for i in 0..=4 {
            sum += dwilcox(i as f64, 2.0, 2.0, false);
        }
        assert!((sum - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_pwilcox() {
        // Test with m=3, n=4, q=6
        let expected = 0.5714285714285714; // pwilcox(6, 3, 4, lower.tail=TRUE) in R
        assert!((pwilcox(6.0, 3.0, 4.0, true, false) - expected).abs() < 1e-10);

        // Test upper tail
        let expected_upper = 0.4285714285714286; // pwilcox(6, 3, 4, lower.tail=FALSE) in R
        assert!((pwilcox(6.0, 3.0, 4.0, false, false) - expected_upper).abs() < 1e-10);

        // Test basic cumulative probabilities
        assert!((pwilcox(0.0, 1.0, 1.0, true, false) - 0.5).abs() < 1e-10);
        assert!((pwilcox(1.0, 1.0, 1.0, true, false) - 1.0).abs() < 1e-10);

        // Test symmetry
        let p1 = pwilcox(2.0, 2.0, 2.0, true, false);
        let p2 = pwilcox(2.0, 2.0, 2.0, false, false);
        assert!((p1 + p2 - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_qwilcox() {
        // Test with m=3, n=4
        let expected = 6.0; // qwilcox(0.5714286, 3, 4) in R
        assert!((qwilcox(0.5714285714285714, 3.0, 4.0, true, false) - expected).abs() < 1e-6);

        // Test basic quantiles
        assert_eq!(qwilcox(0.5, 1.0, 1.0, true, false), 0.0);
        assert_eq!(qwilcox(1.0, 1.0, 1.0, true, false), 1.0);
    }

    #[test]
    fn test_rwilcox() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rwilcox(3.0, 4.0, &mut rng);
        // Random generation is not implemented, so it should return NaN
        assert!(sample.is_nan());
    }

    #[test]
    fn test_invalid_params() {
        assert!(dwilcox(6.0, -1.0, 4.0, false).is_nan());
        assert!(dwilcox(6.0, 3.0, -1.0, false).is_nan());
        assert!(pwilcox(6.0, -1.0, 4.0, true, false).is_nan());
        assert!(qwilcox(0.5, -1.0, 4.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rwilcox(-1.0, 4.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qwilcox_log() {
        let p = (0.5714285714285714f64).ln();
        let expected = 6.0;
        assert!((qwilcox(p, 3.0, 4.0, true, true) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_wilcox_vs_r() {
        // Test our implementation against R's exact calculations
        // These values are from R's pwilcox function (one-sided)

        // pwilcox(62.5, 12, 7, lower.tail=TRUE, log.p=FALSE) in R
        let p_r = 0.958442486306263;
        let p_rust = pwilcox(62.5, 12.0, 7.0, true, false);
        println!("R p-value: {:.15}", p_r);
        println!("Rust p-value: {:.15}", p_rust);
        println!("Difference: {:.15}", (p_rust - p_r).abs());
        assert!((p_rust - p_r).abs() < 1e-10);

        // pwilcox(55.0, 8, 8, lower.tail=TRUE, log.p=FALSE) in R
        let p_r2 = 0.9947941;
        let p_rust2 = pwilcox(55.0, 8.0, 8.0, true, false);
        println!("R p-value 2: {:.15}", p_r2);
        println!("Rust p-value 2: {:.15}", p_rust2);
        println!("Difference 2: {:.15}", (p_rust2 - p_r2).abs());
        assert!((p_rust2 - p_r2).abs() < 1e-8); // Slightly relaxed for floating-point precision
    }
}
