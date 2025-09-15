//! Exponential distribution wrapper using statrs

use rand::Rng;
use statrs::distribution::{Continuous, ContinuousCDF, Exp};

pub fn dexp(x: f64, rate: f64, give_log: bool) -> f64 {
    if rate <= 0.0 {
        return f64::NAN;
    }
    let dist = Exp::new(rate).expect("validated parameters: rate > 0");
    if give_log {
        dist.ln_pdf(x)
    } else {
        dist.pdf(x)
    }
}

pub fn pexp(x: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    if rate <= 0.0 {
        return f64::NAN;
    }
    let dist = Exp::new(rate).expect("validated parameters: rate > 0");
    let cdf = if lower_tail { dist.cdf(x) } else { 1.0 - dist.cdf(x) };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qexp(p: f64, rate: f64, lower_tail: bool, log_p: bool) -> f64 {
    if rate <= 0.0 {
        return f64::NAN;
    }
    let dist = Exp::new(rate).expect("validated parameters: rate > 0");
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = super::helpers::clamp_unit(p_val);
    dist.inverse_cdf(p_val)
}

pub fn rexp<R: Rng>(rate: f64, rng: &mut R) -> f64 {
    if rate <= 0.0 {
        return f64::NAN;
    }
    let dist = Exp::new(rate).expect("validated parameters: rate > 0");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dexp() {
        // Test with rate=2
        let expected = 0.2706705664732254; // dexp(1, 2) in R
        assert!((dexp(1.0, 2.0, false) - expected).abs() < 1e-10);

        // Test log version
        assert!((dexp(1.0, 2.0, true) - dexp(1.0, 2.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_pexp() {
        // Test with rate=2
        let expected = 0.8646647167633873; // pexp(1, 2, lower.tail=TRUE) in R
        assert!((pexp(1.0, 2.0, true, false) - expected).abs() < 1e-10);

        // Test upper tail
        let expected_upper = 0.1353352832366127; // pexp(1, 2, lower.tail=FALSE) in R
        assert!((pexp(1.0, 2.0, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qexp() {
        // Test with rate=2
        let expected = 1.0; // qexp(0.8646647, 2) in R
        assert!((qexp(0.8646647167633873, 2.0, true, false) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rexp() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rexp(2.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dexp(1.0, -1.0, false).is_nan());
        assert!(pexp(1.0, -1.0, true, false).is_nan());
        assert!(qexp(0.5, -1.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rexp(-1.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qexp_log() {
        let p = (0.8646647167633873f64).ln();
        let expected = 1.0;
        assert!((qexp(p, 2.0, true, true) - expected).abs() < 1e-6);
    }
}
