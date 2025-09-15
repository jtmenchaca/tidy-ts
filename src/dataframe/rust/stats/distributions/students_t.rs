//! Student's t-distribution functions
//!
//! This module provides Student's t-distribution functions used by t-tests and other statistical tests.
//! It wraps the statrs StudentsT distribution to provide a consistent interface.

use super::super::core::{TailType, TestResult, TestType, calculate_ci, calculate_p};
use rand::Rng;
use statrs::distribution::{Continuous, ContinuousCDF, StudentsT};

/// Creates a Student's t-distribution with specified parameters
///
/// # Arguments
/// * `location` - The location parameter (usually 0.0)
/// * `scale` - The scale parameter (usually 1.0)
/// * `freedom` - The degrees of freedom (must be positive)
///
/// # Returns
/// A StudentsT distribution
pub fn students_t(location: f64, scale: f64, freedom: f64) -> StudentsT {
    StudentsT::new(location, scale, freedom).unwrap()
}

/// Creates a standard Student's t-distribution (location=0, scale=1)
///
/// # Arguments
/// * `freedom` - The degrees of freedom (must be positive)
///
/// # Returns
/// A StudentsT distribution
pub fn standard_students_t(freedom: f64) -> StudentsT {
    students_t(0.0, 1.0, freedom)
}

/// Performs a t-test using the Student's t-distribution
///
/// This is a convenience function that combines the t-distribution creation
/// with the test calculation, used by t-tests.
///
/// # Arguments
/// * `test_statistic` - The t-test statistic
/// * `df` - The degrees of freedom
/// * `tail` - The type of tail (left, right, or two)
/// * `sample_mean` - The sample mean for confidence interval calculation
/// * `std_error` - The standard error for confidence interval calculation
/// * `alpha` - The significance level
///
/// # Returns
/// A TestResult with p-value and confidence interval
pub fn t_test_result(
    test_statistic: f64,
    df: f64,
    tail: TailType,
    sample_mean: f64,
    std_error: f64,
    alpha: f64,
) -> TestResult {
    let t_dist = standard_students_t(df);

    let p_value = calculate_p(test_statistic, tail.clone(), &t_dist);
    let confidence_interval = calculate_ci(sample_mean, std_error, alpha, &t_dist);

    TestResult {
        test_type: TestType::OneSampleTTest, // Default, will be overridden by caller
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        confidence_level: Some(1.0 - alpha),
        degrees_of_freedom: Some(df),
        ..Default::default()
    }
}

/// Calculates the inverse CDF (quantile function) for the Student's t-distribution
///
/// # Arguments
/// * `p` - Probability (must be between 0 and 1)
/// * `df` - Degrees of freedom (must be positive)
///
/// # Returns
/// The quantile value
pub fn students_t_inverse_cdf(p: f64, df: f64) -> f64 {
    if p < 0.0 || p > 1.0 {
        return f64::NAN;
    }

    if df <= 0.0 {
        return f64::NAN;
    }

    let t_dist = standard_students_t(df);
    t_dist.inverse_cdf(p)
}

/// Calculates the required sample size for a t-test
///
/// This function computes the necessary sample size to detect a minimum detectable effect size
/// for a given alpha, power, and standard deviation using the t-distribution.
///
/// # Arguments
/// * `effect_size` - The minimum detectable effect size
/// * `alpha` - The significance level (e.g., 0.05 for a 95% confidence interval)
/// * `power` - The desired statistical power (e.g., 0.80 for 80% power)
/// * `std_dev` - The population standard deviation (or a reasonable estimate)
/// * `tail` - The type of tail (left, right, or two) for the test
///
/// # Returns
/// The estimated sample size required to achieve the specified power and significance level
pub fn t_sample_size(
    effect_size: f64,
    alpha: f64,
    power: f64,
    std_dev: f64,
    tail: TailType,
) -> f64 {
    // Use a large df approximation for initial calculation
    let df = 1e6;
    let t_dist = standard_students_t(df);

    let alpha_value = match tail {
        TailType::Two => alpha / 2.0, // Two-tailed
        _ => alpha,                   // One-tailed (left or right)
    };

    let t_alpha = t_dist.inverse_cdf(1.0 - alpha_value);
    let t_beta = t_dist.inverse_cdf(power);

    // Formula: n = ((t_alpha + t_beta) * std_dev / effect_size)^2
    let n = ((t_alpha + t_beta) * std_dev / effect_size).powi(2);
    n.ceil() // Rounds up to the next whole sample size
}

/// Student's t probability density function
///
/// # Arguments
/// * `x` - Value at which to evaluate density
/// * `df` - Degrees of freedom
/// * `give_log` - If true, return log density
///
/// # Returns
/// The t density or log density
pub fn dt(x: f64, df: f64, give_log: bool) -> f64 {
    if df <= 0.0 {
        return f64::NAN;
    }
    let dist = StudentsT::new(0.0, 1.0, df).unwrap();
    if give_log {
        dist.ln_pdf(x)
    } else {
        dist.pdf(x)
    }
}

/// Student's t cumulative distribution function
///
/// # Arguments
/// * `x` - Value at which to evaluate CDF
/// * `df` - Degrees of freedom
/// * `lower_tail` - If true, return P(X ≤ x), otherwise P(X > x)
/// * `log_p` - If true, return log probability
///
/// # Returns
/// The cumulative probability or log cumulative probability
pub fn pt(x: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    if df <= 0.0 {
        return f64::NAN;
    }
    let dist = StudentsT::new(0.0, 1.0, df).unwrap();
    let cdf = if lower_tail { dist.cdf(x) } else { dist.sf(x) };
    if log_p { cdf.ln() } else { cdf }
}

/// Student's t quantile function
///
/// # Arguments
/// * `p` - Probability
/// * `df` - Degrees of freedom
/// * `lower_tail` - If true, p is P(X ≤ x), otherwise P(X > x)
/// * `log_p` - If true, p is log probability
///
/// # Returns
/// The quantile value
pub fn qt(p: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    if df <= 0.0 {
        return f64::NAN;
    }
    let dist = StudentsT::new(0.0, 1.0, df).unwrap();
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = p_val.clamp(0.0, 1.0);
    dist.inverse_cdf(p_val)
}

/// Student's t random number generation
///
/// # Arguments
/// * `df` - Degrees of freedom
/// * `rng` - Random number generator
///
/// # Returns
/// A random sample from the t distribution
pub fn rt<R: Rng>(df: f64, rng: &mut R) -> f64 {
    if df <= 0.0 {
        return f64::NAN;
    }
    let dist = StudentsT::new(0.0, 1.0, df).unwrap();
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_standard_students_t_creation() {
        let dist = standard_students_t(10.0);
        assert_eq!(dist.location(), 0.0);
        assert_eq!(dist.scale(), 1.0);
        assert_eq!(dist.freedom(), 10.0);
    }

    #[test]
    fn test_students_t_creation() {
        let dist = students_t(5.0, 2.0, 15.0);
        assert_eq!(dist.location(), 5.0);
        assert_eq!(dist.scale(), 2.0);
        assert_eq!(dist.freedom(), 15.0);
    }

    #[test]
    fn test_students_t_inverse_cdf() {
        // Test some known values for large df (approaches normal)
        let p50 = students_t_inverse_cdf(0.5, 1000.0);
        assert!((p50 - 0.0).abs() < 1e-2); // Median should be close to 0

        let p975 = students_t_inverse_cdf(0.975, 1000.0);
        assert!((p975 - 1.96).abs() < 1e-2); // 97.5th percentile ≈ 1.96 for large df
    }

    #[test]
    fn test_t_test_result() {
        let result = t_test_result(2.0, 10.0, TailType::Two, 100.0, 1.0, 0.05);
        assert!(result.p_value() < 0.1); // Should be significant
        assert!(result.reject_null());
    }

    #[test]
    fn test_t_sample_size() {
        let sample_size = t_sample_size(0.5, 0.05, 0.80, 1.0, TailType::Two);
        assert!(sample_size > 0.0);
        assert!(sample_size.is_finite());
    }
}
