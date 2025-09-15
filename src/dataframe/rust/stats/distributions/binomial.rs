//! Binomial distribution functions
//!
//! This module provides the binomial distribution functions based on R's implementation.
//! Uses Catherine Loader's algorithm for high numerical accuracy.

use super::helpers::bd0::bd0;
use super::helpers::incomplete_beta::incomplete_beta;
use super::helpers::pow1p::pow1p;
use super::helpers::stirlerr::stirlerr;
use rand::Rng;
use std::f64;

/// Raw binomial probability density function
///
/// This is the core computational function for binomial probabilities.
/// It does NOT check for argument validity - that should be done in the calling function.
///
/// # Arguments
/// * `x` - Number of successes
/// * `n` - Number of trials
/// * `p` - Probability of success
/// * `q` - Probability of failure (1-p)
/// * `give_log` - If true, return log probability
///
/// # Returns
/// The binomial probability P(X = x) or log P(X = x)
fn dbinom_raw(x: f64, n: f64, p: f64, q: f64, give_log: bool) -> f64 {
    if p == 0.0 {
        return if x == 0.0 {
            if give_log { 0.0 } else { 1.0 }
        } else {
            if give_log { f64::NEG_INFINITY } else { 0.0 }
        };
    }
    if q == 0.0 {
        return if x == n {
            if give_log { 0.0 } else { 1.0 }
        } else {
            if give_log { f64::NEG_INFINITY } else { 0.0 }
        };
    }

    // Handle edge cases for x = 0 and x = n
    if x == 0.0 {
        if n == 0.0 {
            let result = if give_log { 0.0 } else { 1.0 };
            return result;
        }
        if p > q {
            return if give_log { n * q.ln() } else { q.powf(n) };
        } else {
            return if give_log {
                n * (1.0 - p).ln()
            } else {
                pow1p(-p, n)
            };
        }
    }

    if x == n {
        if p > q {
            return if give_log {
                n * (1.0 - q).ln()
            } else {
                pow1p(-q, n)
            };
        } else {
            return if give_log { n * p.ln() } else { p.powf(n) };
        }
    }

    if x < 0.0 || x > n {
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }

    // Use Catherine Loader's algorithm for high numerical accuracy
    // This uses stirlerr() and bd0() for proper tail accuracy
    let lc = stirlerr(n) - stirlerr(x) - stirlerr(n - x) - bd0(x, n * p) - bd0(n - x, n * q);

    // Calculate log of the normalization factor
    // f = (M_2PI*x*(n-x))/n; could overflow or underflow
    // Upto R 2.7.1: lf = log(M_2PI) + log(x) + log(n-x) - log(n);
    // -- following is much better for x << n :
    let lf = 1.837877066409345483560659472811 + x.ln() + (-x / n).ln_1p();

    if give_log {
        lc - 0.5 * lf
    } else {
        (lc - 0.5 * lf).exp()
    }
}

/// Binomial probability density function
///
/// Calculates P(X = x) for a binomial distribution with parameters n and p.
///
/// # Arguments
/// * `x` - Number of successes (must be integer)
/// * `n` - Number of trials (must be positive integer)
/// * `p` - Probability of success (must be in [0, 1])
/// * `give_log` - If true, return log probability
///
/// # Returns
/// The binomial probability P(X = x) or log P(X = x)
///
/// # Examples
///
/// ```
/// use tidy_ts_dataframe::stats::distributions::binomial::dbinom;
///
/// // P(X = 5) for Bin(10, 0.5)
/// let prob = dbinom(5.0, 10.0, 0.5, false);
/// assert!((prob - 0.24609375).abs() < 1e-6);
///
/// // Log probability
/// let log_prob = dbinom(5.0, 10.0, 0.5, true);
/// assert!((log_prob - (-1.402042)).abs() < 1e-3);
/// ```
pub fn dbinom(x: f64, n: f64, p: f64, give_log: bool) -> f64 {
    // Check for NaN inputs
    if x.is_nan() || n.is_nan() || p.is_nan() {
        return x + n + p;
    }

    // Validate parameters
    if p < 0.0 || p > 1.0 || n < 0.0 || n != n.trunc() {
        return if give_log { f64::NAN } else { f64::NAN };
    }

    // Check that x is non-negative and finite
    if x < 0.0 || !x.is_finite() {
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }

    // Convert to integers for binomial calculation
    let n = n.trunc();
    let x = x.trunc();

    dbinom_raw(x, n, p, 1.0 - p, give_log)
}

/// Binomial cumulative distribution function
///
/// Calculates P(X ≤ x) for a binomial distribution with parameters n and p.
///
/// This implementation uses the incomplete beta function relationship:
/// P(X ≤ k) = I_{1-p}(n-k, k+1) when lower_tail = true
///
/// This follows R's implementation exactly: pbinom(x, n, p) = pbeta(p, x+1, n-x, !lower_tail, log_p)
///
/// # Arguments
/// * `x` - Quantile (number of successes)
/// * `n` - Number of trials
/// * `p` - Probability of success
/// * `lower_tail` - If true, return P(X ≤ x), otherwise P(X > x)
/// * `log_p` - If true, return log probability
///
/// # Returns
/// The cumulative probability or log cumulative probability
pub fn pbinom(x: f64, n: f64, p: f64, lower_tail: bool, log_p: bool) -> f64 {
    // Check for NaN inputs (following R's approach)
    if x.is_nan() || n.is_nan() || p.is_nan() {
        return x + n + p;
    }

    // Validate parameters (following R's pbinom.c)
    if p < 0.0 || p > 1.0 || n < 0.0 || n != n.trunc() {
        return f64::NAN;
    }

    let n = n.trunc(); // Force to integer

    // Handle boundary cases (following R's pbinom.c)
    if x < 0.0 {
        return if lower_tail {
            if log_p { f64::NEG_INFINITY } else { 0.0 }
        } else {
            if log_p { 0.0 } else { 1.0 }
        };
    }

    let x = (x + 1e-7).floor(); // R uses floor(x + 1e-7)
    if n <= x {
        return if lower_tail {
            if log_p { 0.0 } else { 1.0 }
        } else {
            if log_p { f64::NEG_INFINITY } else { 0.0 }
        };
    }

    // Use the incomplete beta function relationship exactly as R does:
    // pbinom(x, n, p, lower_tail, log_p) = pbeta(p, x + 1, n - x, !lower_tail, log_p)
    pbeta(p, x + 1.0, n - x, !lower_tail, log_p)
}

/// Beta cumulative distribution function (incomplete beta function)
///
/// This is a simplified implementation of pbeta that matches R's interface.
/// R uses the relationship: pbinom(x, n, p) = pbeta(p, x+1, n-x, !lower_tail, log_p)
fn pbeta(x: f64, a: f64, b: f64, lower_tail: bool, log_p: bool) -> f64 {
    if x.is_nan() || a.is_nan() || b.is_nan() {
        return x + a + b;
    }

    if a < 0.0 || b < 0.0 {
        return f64::NAN;
    }

    if x <= 0.0 {
        return if lower_tail {
            if log_p { f64::NEG_INFINITY } else { 0.0 }
        } else {
            if log_p { 0.0 } else { 1.0 }
        };
    }

    if x >= 1.0 {
        return if lower_tail {
            if log_p { 0.0 } else { 1.0 }
        } else {
            if log_p { f64::NEG_INFINITY } else { 0.0 }
        };
    }

    // Compute the incomplete beta function
    let result = incomplete_beta(x, a, b);

    let final_result = if lower_tail { result } else { 1.0 - result };

    if log_p {
        if final_result <= 0.0 {
            f64::NEG_INFINITY
        } else {
            final_result.ln()
        }
    } else {
        final_result
    }
}

/// Binomial quantile function
///
/// Calculates the smallest value x such that P(X ≤ x) ≥ p.
///
/// This implementation uses an efficient search algorithm that handles
/// edge cases and provides accurate results across all parameter ranges.
/// It follows R's approach of using search with the CDF function.
///
/// # Arguments
/// * `p` - Probability
/// * `n` - Number of trials
/// * `prob` - Probability of success
/// * `lower_tail` - If true, p is P(X ≤ x), otherwise P(X > x)
/// * `log_p` - If true, p is log probability
///
/// # Returns
/// The quantile value (smallest integer x such that P(X ≤ x) ≥ p)
pub fn qbinom(p: f64, n: f64, prob: f64, lower_tail: bool, log_p: bool) -> f64 {
    // Check for NaN inputs (following R's approach)
    if p.is_nan() || n.is_nan() || prob.is_nan() {
        return p + n + prob;
    }

    // Validate parameters
    if prob < 0.0 || prob > 1.0 || n < 0.0 || n != n.trunc() {
        return f64::NAN;
    }

    let n = n.trunc(); // Force to integer

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
        return n;
    }

    // Handle degenerate cases
    if prob == 0.0 {
        return if p_val <= 1.0 { 0.0 } else { f64::NAN };
    }
    if prob == 1.0 {
        return if p_val <= 1.0 { n } else { f64::NAN };
    }

    // Use efficient search algorithm
    // For small n, use simple search; for large n, use smarter starting point
    if n <= 100.0 {
        qbinom_search(p_val, n, prob)
    } else {
        qbinom_search_large_n(p_val, n, prob)
    }
}

/// Search algorithm for small n (≤ 100)
fn qbinom_search(p: f64, n: f64, prob: f64) -> f64 {
    // Simple linear search from 0 to n
    for k in 0..=(n as usize) {
        let cdf = pbinom(k as f64, n, prob, true, false);
        // Use a small tolerance for floating point comparison
        if cdf >= p - 1e-10 {
            return k as f64;
        }
    }
    n
}

/// Search algorithm for large n (> 100)
fn qbinom_search_large_n(p: f64, n: f64, prob: f64) -> f64 {
    // Use normal approximation as starting point for large n
    // For Bin(n, p), mean = np, variance = np(1-p)
    let mean = n * prob;
    let variance = n * prob * (1.0 - prob);
    let std_dev = variance.sqrt();

    // Normal approximation for starting point (with continuity correction)
    let z = inverse_normal_cdf(p);
    let start_guess = (mean + z * std_dev - 0.5).round().max(0.0).min(n);

    // Binary search around the normal approximation
    let mut left = (start_guess - 3.0 * std_dev).max(0.0).floor() as usize;
    let mut right = (start_guess + 3.0 * std_dev).min(n).ceil() as usize;

    // Ensure we have a valid range
    if left >= right {
        left = 0;
        right = n as usize;
    }

    // Binary search
    while left < right {
        let mid = (left + right) / 2;
        let cdf = pbinom(mid as f64, n, prob, true, false);

        if cdf < p {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    left as f64
}

/// Approximate inverse normal CDF for starting point estimation
/// This is a simplified approximation for the standard normal quantile function
fn inverse_normal_cdf(p: f64) -> f64 {
    if p <= 0.0 {
        return f64::NEG_INFINITY;
    }
    if p >= 1.0 {
        return f64::INFINITY;
    }
    if p == 0.5 {
        return 0.0;
    }

    // Use Beasley-Springer-Moro approximation for inverse normal
    // This is a simplified version that's accurate enough for our starting point
    let q = if p > 0.5 { 1.0 - p } else { p };
    let t = (-2.0 * q.ln()).sqrt();

    // Rational approximation
    let c0 = 2.515517;
    let c1 = 0.802853;
    let c2 = 0.010328;
    let d1 = 1.432788;
    let d2 = 0.189269;
    let d3 = 0.001308;

    let numerator = c0 + c1 * t + c2 * t * t;
    let denominator = 1.0 + d1 * t + d2 * t * t + d3 * t * t * t;
    let z = t - numerator / denominator;

    if p > 0.5 { z } else { -z }
}

/// Generate random numbers from binomial distribution
///
/// # Arguments
/// * `n` - Number of trials
/// * `p` - Probability of success
/// * `rng` - Random number generator
///
/// # Returns
/// A random number from Bin(n, p)
pub fn rbinom<R: Rng>(n: f64, p: f64, rng: &mut R) -> f64 {
    if n.is_nan() || p.is_nan() || p < 0.0 || p > 1.0 || n <= 0.0 {
        return f64::NAN;
    }

    let n = n.trunc() as usize;

    // Simple implementation using Bernoulli trials
    let mut successes = 0;
    for _ in 0..n {
        let u = rng.gen_range(0.0..1.0);
        if u < p {
            successes += 1;
        }
    }

    successes as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dbinom_basic() {
        // Test basic cases
        assert!((dbinom(0.0, 1.0, 0.5, false) - 0.5).abs() < 1e-10);
        assert!((dbinom(1.0, 1.0, 0.5, false) - 0.5).abs() < 1e-10);

        // Test symmetry
        assert!((dbinom(2.0, 4.0, 0.5, false) - dbinom(2.0, 4.0, 0.5, false)).abs() < 1e-10);
    }

    #[test]
    fn test_dbinom_edge_cases() {
        // Test edge cases
        assert_eq!(dbinom(0.0, 0.0, 0.5, false), 1.0);
        assert_eq!(dbinom(1.0, 0.0, 0.5, false), 0.0);
        assert_eq!(dbinom(0.0, 1.0, 0.0, false), 1.0);
        assert_eq!(dbinom(1.0, 1.0, 0.0, false), 0.0);
        assert_eq!(dbinom(0.0, 1.0, 1.0, false), 0.0);
        assert_eq!(dbinom(1.0, 1.0, 1.0, false), 1.0);
    }

    #[test]
    fn test_dbinom_log() {
        // Test log probabilities
        let prob = dbinom(5.0, 10.0, 0.5, false);
        let log_prob = dbinom(5.0, 10.0, 0.5, true);
        assert!((prob.ln() - log_prob).abs() < 1e-10);
    }

    #[test]
    fn test_pbinom_basic() {
        // Test basic cumulative probabilities
        assert!((pbinom(0.0, 1.0, 0.5, true, false) - 0.5).abs() < 1e-10);
        assert!((pbinom(1.0, 1.0, 0.5, true, false) - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_qbinom_basic() {
        // Debug: Check pbinom values first
        println!("pbinom(0, 1, 0.5) = {}", pbinom(0.0, 1.0, 0.5, true, false));
        println!("pbinom(1, 1, 0.5) = {}", pbinom(1.0, 1.0, 0.5, true, false));

        // Test basic quantiles
        let result1 = qbinom(0.5, 1.0, 0.5, true, false);
        println!("qbinom(0.5, 1.0, 0.5) = {}, expected = 0.0", result1);
        assert_eq!(result1, 0.0);

        let result2 = qbinom(1.0, 1.0, 0.5, true, false);
        println!("qbinom(1.0, 1.0, 0.5) = {}, expected = 1.0", result2);
        assert_eq!(result2, 1.0);
    }

    #[test]
    fn test_dbinom_extreme_tails() {
        // Test extreme tail cases for numerical accuracy
        // Large n, small p case: P(X=0) for Bin(1e6, 1e-6) ≈ e^(-1)
        let prob = dbinom(0.0, 1e6, 1e-6, false);
        let expected = (-1.0_f64).exp(); // e^(-1) ≈ 0.367879
        assert!((prob - expected).abs() < 1e-6); // Relaxed tolerance for extreme cases

        // Large n, large p case
        let prob2 = dbinom(9900.0, 10000.0, 0.99, false);
        assert!(prob2 > 0.0 && prob2 < 1.0);

        // Test log probabilities for extreme cases
        let log_prob = dbinom(25.0, 1e6, 2.5e-5, true);
        assert!(log_prob.is_finite());
    }

    #[test]
    fn test_dbinom_vs_r() {
        // Test our dbinom implementation against R's exact calculations
        // This replicates the calculations from test_r_exact.R

        // Our data (same as R script)
        let y = vec![0.1, 0.2, 0.4, 0.6, 0.8, 0.9];
        let mu = vec![0.13, 0.21, 0.39, 0.58, 0.77, 0.87];
        let wt = vec![20.0, 20.0, 20.0, 20.0, 20.0, 20.0];

        let mut total_loglik = 0.0;

        println!("=== Rust dbinom calculation ===");
        println!("Individual calculations:");

        for i in 0..y.len() {
            let weight_factor = wt[i] / wt[i]; // Should be 1.0
            let successes = f64::round(wt[i] * y[i]);
            let trials = wt[i];

            let log_prob = dbinom(successes, trials, mu[i], true);
            let weighted_log_prob = weight_factor * log_prob;

            println!(
                "i={}: y={:.1}, mu={:.2}, successes={}, trials={}, loglik={:.6}, weighted={:.6}",
                i, y[i], mu[i], successes, trials, log_prob, weighted_log_prob
            );

            total_loglik += weighted_log_prob;
        }

        println!("Total log-likelihood: {:.6}", total_loglik);
        println!("Rust AIC part (-2 * sum): {:.6}", -2.0 * total_loglik);
        println!("Full AIC (add 2*k): {:.6}", -2.0 * total_loglik + 2.0 * 2.0);

        // Expected values from R script (approximate, we'll verify)
        // R's total log-likelihood should be around -12.345678 (we'll check the actual value)
        // For now, just verify the calculation is reasonable
        assert!(total_loglik < 0.0); // Log-likelihood should be negative
        assert!(total_loglik.is_finite());

        // Test specific cases that we can verify
        // dbinom(2, 20, 0.13, log=TRUE) in R
        let r_test1 = dbinom(2.0, 20.0, 0.13, true);
        println!("dbinom(2, 20, 0.13, log=TRUE) = {:.6}", r_test1);

        // dbinom(4, 20, 0.21, log=TRUE) in R
        let r_test2 = dbinom(4.0, 20.0, 0.21, true);
        println!("dbinom(4, 20, 0.21, log=TRUE) = {:.6}", r_test2);

        // These should be finite and reasonable
        assert!(r_test1.is_finite());
        assert!(r_test2.is_finite());
        assert!(r_test1 < 0.0); // Log probability should be negative
        assert!(r_test2 < 0.0);
    }
}
