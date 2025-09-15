//! Uniform distribution wrapper using statrs

use statrs::distribution::{Continuous, ContinuousCDF, Uniform};
use rand::Rng;

pub fn dunif(x: f64, min: f64, max: f64, give_log: bool) -> f64 {
    if min >= max {
        return f64::NAN;
    }
    let dist = Uniform::new(min, max).expect("validated parameters: min < max");
    if give_log { dist.ln_pdf(x) } else { dist.pdf(x) }
}

pub fn punif(x: f64, min: f64, max: f64, lower_tail: bool, log_p: bool) -> f64 {
    if min >= max {
        return f64::NAN;
    }
    let dist = Uniform::new(min, max).expect("validated parameters: min < max");
    let cdf = if lower_tail { dist.cdf(x) } else { dist.sf(x) };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qunif(p: f64, min: f64, max: f64, lower_tail: bool, log_p: bool) -> f64 {
    if min >= max {
        return f64::NAN;
    }
    let dist = Uniform::new(min, max).expect("validated parameters: min < max");
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = super::helpers::clamp_unit(p_val);
    dist.inverse_cdf(p_val)
}

pub fn runif<R: Rng>(min: f64, max: f64, rng: &mut R) -> f64 {
    if min >= max {
        return f64::NAN;
    }
    let dist = Uniform::new(min, max).expect("validated parameters: min < max");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dunif() {
        // Test with min=0, max=1
        let expected = 1.0; // dunif(0.5, 0, 1) in R
        assert!((dunif(0.5, 0.0, 1.0, false) - expected).abs() < 1e-10);
        
        // Test log version
        assert!((dunif(0.5, 0.0, 1.0, true) - dunif(0.5, 0.0, 1.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_punif() {
        // Test with min=0, max=1
        let expected = 0.5; // punif(0.5, 0, 1, lower.tail=TRUE) in R
        assert!((punif(0.5, 0.0, 1.0, true, false) - expected).abs() < 1e-10);
        
        // Test upper tail
        let expected_upper = 0.5; // punif(0.5, 0, 1, lower.tail=FALSE) in R
        assert!((punif(0.5, 0.0, 1.0, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qunif() {
        // Test with min=0, max=1
        let expected = 0.5; // qunif(0.5, 0, 1) in R
        assert!((qunif(0.5, 0.0, 1.0, true, false) - expected).abs() < 1e-10);
    }

    #[test]
    fn test_runif() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = runif(0.0, 1.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0 && sample <= 1.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dunif(0.5, 1.0, 0.0, false).is_nan());
        assert!(punif(0.5, 1.0, 0.0, true, false).is_nan());
        assert!(qunif(0.5, 1.0, 0.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(runif(1.0, 0.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qunif_log() {
        let p = (0.5f64).ln();
        let expected = 0.5;
        assert!((qunif(p, 0.0, 1.0, true, true) - expected).abs() < 1e-10);
    }
} 