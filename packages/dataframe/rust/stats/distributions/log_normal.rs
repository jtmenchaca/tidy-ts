//! Log-normal distribution wrapper using statrs

use rand::Rng;
use statrs::distribution::{Continuous, ContinuousCDF, LogNormal};

pub fn dlnorm(x: f64, meanlog: f64, sdlog: f64, give_log: bool) -> f64 {
    if sdlog <= 0.0 {
        return f64::NAN;
    }
    let dist = LogNormal::new(meanlog, sdlog).expect("validated parameters: sdlog > 0");
    if give_log {
        dist.ln_pdf(x)
    } else {
        dist.pdf(x)
    }
}

pub fn plnorm(x: f64, meanlog: f64, sdlog: f64, lower_tail: bool, log_p: bool) -> f64 {
    if sdlog <= 0.0 {
        return f64::NAN;
    }
    let dist = LogNormal::new(meanlog, sdlog).expect("validated parameters: sdlog > 0");
    let cdf = if lower_tail { dist.cdf(x) } else { dist.sf(x) };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qlnorm(p: f64, meanlog: f64, sdlog: f64, lower_tail: bool, log_p: bool) -> f64 {
    if sdlog <= 0.0 {
        return f64::NAN;
    }
    let dist = LogNormal::new(meanlog, sdlog).expect("validated parameters: sdlog > 0");
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = super::helpers::clamp_unit(p_val);
    dist.inverse_cdf(p_val)
}

pub fn rlnorm<R: Rng>(meanlog: f64, sdlog: f64, rng: &mut R) -> f64 {
    if sdlog <= 0.0 {
        return f64::NAN;
    }
    let dist = LogNormal::new(meanlog, sdlog).expect("validated parameters: sdlog > 0");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dlnorm() {
        // Test with meanlog=0, sdlog=1
        let expected = 0.3989422804014327; // dlnorm(1, 0, 1) in R
        assert!((dlnorm(1.0, 0.0, 1.0, false) - expected).abs() < 1e-10);

        // Test log version
        assert!((dlnorm(1.0, 0.0, 1.0, true) - dlnorm(1.0, 0.0, 1.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_plnorm() {
        // Test with meanlog=0, sdlog=1
        let expected = 0.5; // plnorm(1, 0, 1, lower.tail=TRUE) in R
        assert!((plnorm(1.0, 0.0, 1.0, true, false) - expected).abs() < 1e-10);

        // Test upper tail
        let expected_upper = 0.5; // plnorm(1, 0, 1, lower.tail=FALSE) in R
        assert!((plnorm(1.0, 0.0, 1.0, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qlnorm() {
        // Test with meanlog=0, sdlog=1
        let expected = 1.0; // qlnorm(0.5, 0, 1) in R
        assert!((qlnorm(0.5, 0.0, 1.0, true, false) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rlnorm() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rlnorm(0.0, 1.0, &mut rng);
        assert!(sample.is_finite() && sample > 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dlnorm(1.0, 0.0, -1.0, false).is_nan());
        assert!(plnorm(1.0, 0.0, -1.0, true, false).is_nan());
        assert!(qlnorm(0.5, 0.0, -1.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rlnorm(0.0, -1.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qlnorm_log() {
        let p = (0.5f64).ln();
        let expected = 1.0;
        assert!((qlnorm(p, 0.0, 1.0, true, true) - expected).abs() < 1e-6);
    }
}
