//! Weibull distribution wrapper using statrs

use statrs::distribution::{Continuous, ContinuousCDF, Weibull};
use rand::Rng;

pub fn dweibull(x: f64, shape: f64, scale: f64, give_log: bool) -> f64 {
    if shape <= 0.0 || scale <= 0.0 {
        return f64::NAN;
    }
    let dist = Weibull::new(shape, scale).expect("validated parameters: shape > 0, scale > 0");
    if give_log { dist.ln_pdf(x) } else { dist.pdf(x) }
}

pub fn pweibull(x: f64, shape: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    if shape <= 0.0 || scale <= 0.0 {
        return f64::NAN;
    }
    let dist = Weibull::new(shape, scale).expect("validated parameters: shape > 0, scale > 0");
    let cdf = if lower_tail { dist.cdf(x) } else { 1.0 - dist.cdf(x) };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qweibull(p: f64, shape: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    if shape <= 0.0 || scale <= 0.0 {
        return f64::NAN;
    }
    let dist = Weibull::new(shape, scale).expect("validated parameters: shape > 0, scale > 0");
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = super::helpers::clamp_unit(p_val);
    dist.inverse_cdf(p_val)
}

pub fn rweibull<R: Rng>(shape: f64, scale: f64, rng: &mut R) -> f64 {
    if shape <= 0.0 || scale <= 0.0 {
        return f64::NAN;
    }
    let dist = Weibull::new(shape, scale).expect("validated parameters: shape > 0, scale > 0");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dweibull() {
        // Test with shape=2, scale=1
        let expected = 0.7788008; // dweibull(0.5, 2, 1) in R
        assert!((dweibull(0.5, 2.0, 1.0, false) - expected).abs() < 1e-6);
        
        // Test log version
        assert!((dweibull(0.5, 2.0, 1.0, true) - dweibull(0.5, 2.0, 1.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_pweibull() {
        // Test with shape=2, scale=1
        let expected = 0.2211992; // pweibull(0.5, 2, 1, lower.tail=TRUE) in R
        assert!((pweibull(0.5, 2.0, 1.0, true, false) - expected).abs() < 1e-6);
        
        // Test upper tail
        let expected_upper = 0.7788008; // pweibull(0.5, 2, 1, lower.tail=FALSE) in R
        assert!((pweibull(0.5, 2.0, 1.0, false, false) - expected_upper).abs() < 1e-6);
    }

    #[test]
    fn test_qweibull() {
        // Test with shape=2, scale=1
        let expected = 0.5; // qweibull(0.2211992, 2, 1) in R
        let actual = qweibull(0.2211992, 2.0, 1.0, true, false);
        assert!((actual - expected).abs() < 1e-4);
    }

    #[test]
    fn test_rweibull() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rweibull(2.0, 1.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dweibull(0.5, -1.0, 1.0, false).is_nan());
        assert!(dweibull(0.5, 2.0, -1.0, false).is_nan());
        assert!(pweibull(0.5, -1.0, 1.0, true, false).is_nan());
        assert!(qweibull(0.5, -1.0, 1.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rweibull(-1.0, 1.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qweibull_log() {
        let p = (0.2211992f64).ln();
        let expected = 0.5;
        assert!((qweibull(p, 2.0, 1.0, true, true) - expected).abs() < 1e-4);
    }
} 