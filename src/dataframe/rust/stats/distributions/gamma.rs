//! Gamma distribution wrapper using statrs
//! 
//! Simple implementation following the pattern of normal.rs

use rand::Rng;
use statrs::distribution::{Continuous, ContinuousCDF, Gamma};

/// Gamma probability density function
///
/// # Arguments
/// * `x` - Value at which to evaluate density  
/// * `shape` - Shape parameter (α > 0)
/// * `rate` - Rate parameter (β > 0)
/// * `give_log` - If true, return log density
///
/// # Returns
/// The gamma density or log density
pub fn dgamma(x: f64, shape: f64, rate: f64, give_log: bool) -> f64 {
    if shape <= 0.0 || rate <= 0.0 {
        return f64::NAN;
    }
    // statrs::Gamma uses shape and rate parameters
    let dist = Gamma::new(shape, rate).expect("validated parameters: shape > 0, rate > 0");
    if give_log {
        dist.ln_pdf(x)
    } else {
        dist.pdf(x)
    }
}

/// Gamma cumulative distribution function
///
/// # Arguments
/// * `x` - Value at which to evaluate CDF
/// * `shape` - Shape parameter (α > 0)
/// * `rate` - Rate parameter (β > 0)
/// * `lower_tail` - If true, return P(X ≤ x), otherwise P(X > x)
/// * `log_p` - If true, return log probability
///
/// # Returns
/// The cumulative probability or log cumulative probability
pub fn pgamma(x: f64, shape: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    if shape <= 0.0 || rate <= 0.0 {
        return f64::NAN;
    }
    let dist = Gamma::new(shape, rate).expect("validated parameters: shape > 0, rate > 0");
    let cdf = if lower_tail { dist.cdf(x) } else { 1.0 - dist.cdf(x) };
    if log_p { cdf.ln() } else { cdf }
}

/// Gamma quantile function
///
/// # Arguments
/// * `p` - Probability
/// * `shape` - Shape parameter (α > 0)
/// * `rate` - Rate parameter (β > 0)
/// * `lower_tail` - If true, p is P(X ≤ x), otherwise P(X > x)
/// * `log_p` - If true, p is log probability
///
/// # Returns
/// The quantile value
pub fn qgamma(p: f64, shape: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    if shape <= 0.0 || rate <= 0.0 {
        return f64::NAN;
    }
    let dist = Gamma::new(shape, rate).expect("validated parameters: shape > 0, rate > 0");
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = super::helpers::clamp_unit(p_val);
    dist.inverse_cdf(p_val)
}

/// Gamma random number generation
///
/// # Arguments
/// * `shape` - Shape parameter (α > 0)
/// * `rate` - Rate parameter (β > 0)
/// * `rng` - Random number generator
///
/// # Returns
/// A random sample from the gamma distribution
pub fn rgamma<R: Rng>(shape: f64, rate: f64, rng: &mut R) -> f64 {
    if shape <= 0.0 || rate <= 0.0 {
        return f64::NAN;
    }
    let dist = Gamma::new(shape, rate).expect("validated parameters: shape > 0, rate > 0");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dgamma() {
        // Note: statrs::Gamma(shape, rate) but rate means 1/scale!
        // R: dgamma(x, shape, rate) where rate = 1/scale
        // statrs: Gamma(shape, 1/scale)
        
        // Test: dgamma(2, shape=2, rate=1) in R
        // This means shape=2, scale=1 for statrs
        let expected = 0.2706705664732254;
        
        // Since statrs uses Gamma(shape, scale), we need to pass 1/rate as second param
        // For rate=1, we pass scale=1
        assert!((dgamma(2.0, 2.0, 1.0, false) - expected).abs() < 1e-6);
        
        // Test log version
        assert!((dgamma(2.0, 2.0, 1.0, true) - dgamma(2.0, 2.0, 1.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_pgamma() {
        // Test with shape=2, rate=1
        let expected = 0.5939941502901619; // pgamma(2, 2, 1, lower.tail=TRUE) in R
        assert!((pgamma(2.0, 2.0, 1.0, true, false) - expected).abs() < 1e-10);
        
        // Test upper tail
        let expected_upper = 0.406005849709838; // pgamma(2, 2, 1, lower.tail=FALSE) in R
        assert!((pgamma(2.0, 2.0, 1.0, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qgamma() {
        // Test with shape=2, rate=1
        let expected = 2.0; // qgamma(0.593994, 2, 1) in R
        assert!((qgamma(0.5939941502901619, 2.0, 1.0, true, false) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rgamma() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rgamma(2.0, 1.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dgamma(1.0, -1.0, 1.0, false).is_nan());
        assert!(pgamma(1.0, 1.0, -1.0, true, false).is_nan());
        assert!(qgamma(0.5, -1.0, 1.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rgamma(-1.0, 1.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qgamma_log() {
        let p = (0.5939941502901619f64).ln();
        let expected = 2.0;
        assert!((qgamma(p, 2.0, 1.0, true, true) - expected).abs() < 1e-6);
    }
}