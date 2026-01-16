//! Normal distribution functions
//!
//! This module provides normal distribution functions used by z-tests and other statistical tests.
//! It wraps the statrs Normal distribution to provide a consistent interface.

use super::super::core::{TailType, calculate_ci, calculate_p};

/// Simple test result data structure for distribution calculations
pub struct TestResultData {
    pub p_value: f64,
    pub confidence_interval: (f64, f64),
}
use rand::Rng;
use statrs::distribution::{Continuous, ContinuousCDF, Normal};

/// Creates a standard normal distribution (mean=0, std=1)
///
/// # Returns
/// A Result containing the Normal distribution or a StatError
pub fn standard_normal() -> Normal {
    Normal::new(0.0, 1.0).unwrap()
}

/// Creates a normal distribution with specified parameters
///
/// # Arguments
/// * `mean` - The mean of the distribution
/// * `std` - The standard deviation of the distribution (must be positive)
///
/// # Returns
/// A Result containing the Normal distribution or a StatError
pub fn normal(mean: f64, std: f64) -> Option<Normal> {
    if std <= 0.0 {
        return None;
    }

    Normal::new(mean, std).ok()
}

/// Performs a one-sample z-test using the normal distribution
///
/// This is a convenience function that combines the normal distribution creation
/// with the test calculation, used by z-tests.
///
/// # Arguments
/// * `test_statistic` - The z-test statistic
/// * `tail` - The type of tail (left, right, or two)
/// * `sample_mean` - The sample mean for confidence interval calculation
/// * `std_error` - The standard error for confidence interval calculation
/// * `alpha` - The significance level
///
/// # Returns
/// A TestResult with p-value and confidence interval
pub fn z_test_result(
    test_statistic: f64,
    tail: TailType,
    sample_mean: f64,
    std_error: f64,
    alpha: f64,
) -> TestResultData {
    let z_dist = standard_normal();

    let p_value = calculate_p(test_statistic, tail.clone(), &z_dist);
    let confidence_interval = calculate_ci(sample_mean, std_error, alpha, &z_dist);

    TestResultData {
        p_value,
        confidence_interval,
    }
}

/// Calculates the inverse CDF (quantile function) for the standard normal distribution
///
/// # Arguments
/// * `p` - Probability (must be between 0 and 1)
///
/// # Returns
/// The quantile value
pub fn normal_inverse_cdf(p: f64) -> f64 {
    if p < 0.0 || p > 1.0 {
        return f64::NAN;
    }

    let z_dist = standard_normal();
    z_dist.inverse_cdf(p)
}

/// Normal probability density function
///
/// # Arguments
/// * `x` - Value at which to evaluate density
/// * `mean` - Mean of the distribution
/// * `sd` - Standard deviation of the distribution
/// * `give_log` - If true, return log density
///
/// # Returns
/// The normal density or log density
pub fn dnorm(x: f64, mean: f64, sd: f64, give_log: bool) -> f64 {
    if sd <= 0.0 {
        return f64::NAN;
    }
    let dist = Normal::new(mean, sd).expect("validated parameters: sd > 0");
    if give_log {
        dist.ln_pdf(x)
    } else {
        dist.pdf(x)
    }
}

/// Normal cumulative distribution function
///
/// # Arguments
/// * `x` - Value at which to evaluate CDF
/// * `mean` - Mean of the distribution
/// * `sd` - Standard deviation of the distribution
/// * `lower_tail` - If true, return P(X ≤ x), otherwise P(X > x)
/// * `log_p` - If true, return log probability
///
/// # Returns
/// The cumulative probability or log cumulative probability
pub fn pnorm(x: f64, mean: f64, sd: f64, lower_tail: bool, log_p: bool) -> f64 {
    if sd <= 0.0 {
        return f64::NAN;
    }
    let dist = Normal::new(mean, sd).expect("validated parameters: sd > 0");
    let cdf = if lower_tail { dist.cdf(x) } else { dist.sf(x) };
    if log_p { cdf.ln() } else { cdf }
}

/// Normal quantile function
///
/// # Arguments
/// * `p` - Probability
/// * `mean` - Mean of the distribution
/// * `sd` - Standard deviation of the distribution
/// * `lower_tail` - If true, p is P(X ≤ x), otherwise P(X > x)
/// * `log_p` - If true, p is log probability
///
/// # Returns
/// The quantile value
pub fn qnorm(p: f64, mean: f64, sd: f64, lower_tail: bool, log_p: bool) -> f64 {
    if sd <= 0.0 {
        return f64::NAN;
    }
    let dist = Normal::new(mean, sd).expect("validated parameters: sd > 0");
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = super::helpers::clamp_unit(p_val);
    dist.inverse_cdf(p_val)
}

/// Normal random number generation
///
/// # Arguments
/// * `mean` - Mean of the distribution
/// * `sd` - Standard deviation of the distribution
/// * `rng` - Random number generator
///
/// # Returns
/// A random sample from the normal distribution
pub fn rnorm<R: Rng>(mean: f64, sd: f64, rng: &mut R) -> f64 {
    if sd <= 0.0 {
        return f64::NAN;
    }
    let dist = Normal::new(mean, sd).expect("validated parameters: sd > 0");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use statrs::statistics::Distribution;

    #[test]
    fn test_standard_normal_creation() {
        let dist = standard_normal();
        assert_eq!(dist.mean(), Some(0.0));
        assert_eq!(dist.std_dev(), Some(1.0));
    }

    #[test]
    fn test_normal_creation() {
        let dist = normal(5.0, 2.0).unwrap();
        assert_eq!(dist.mean().unwrap(), 5.0);
        assert_eq!(dist.std_dev().unwrap(), 2.0);
    }

    #[test]
    fn test_normal_invalid_std() {
        let result = normal(0.0, -1.0);
        assert!(result.is_none());
    }

    #[test]
    fn test_normal_inverse_cdf() {
        // Test some known values
        let p50 = normal_inverse_cdf(0.5);
        assert!((p50 - 0.0).abs() < 1e-10); // Median should be 0

        let p975 = normal_inverse_cdf(0.975);
        assert!((p975 - 1.96).abs() < 1e-2); // 97.5th percentile ≈ 1.96
    }

    #[test]
    fn test_z_test_result() {
        let result = z_test_result(1.96, TailType::Two, 100.0, 1.0, 0.05);
        assert!(result.p_value < 0.05);
        assert!(result.p_value < 0.05); // reject_null logic: p_value < alpha
    }
}
