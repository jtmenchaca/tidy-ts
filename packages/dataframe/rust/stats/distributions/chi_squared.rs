//! Chi-squared distribution wrapper using statrs

use rand::Rng;
use statrs::distribution::{ChiSquared, Continuous, ContinuousCDF};

/// Chi-squared density — delegates to dgamma(x, df/2, scale=2) per R's dchisq.c
pub fn dchisq(x: f64, df: f64, give_log: bool) -> f64 {
    if df < 0.0 {
        return f64::NAN;
    }
    // R: dchisq(x, df) = dgamma(x, df/2, scale=2)
    // Handle df=0 as point mass at 0 (from R's dgamma: shape==0 → x==0 ? Inf : 0)
    if df == 0.0 {
        if x < 0.0 {
            return if give_log { f64::NEG_INFINITY } else { 0.0 };
        }
        if x == 0.0 {
            return f64::INFINITY;
        }
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }
    let dist = ChiSquared::new(df).expect("validated parameters: df > 0");
    if give_log {
        dist.ln_pdf(x)
    } else {
        dist.pdf(x)
    }
}

pub fn pchisq(x: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    if df < 0.0 {
        return f64::NAN;
    }
    // df=0: point mass at 0
    // R: pchisq(x, df=0) = 0 for x <= 0, 1 for x > 0
    if df == 0.0 {
        let p: f64 = if x > 0.0 {
            if lower_tail { 1.0 } else { 0.0 }
        } else {
            if lower_tail { 0.0 } else { 1.0 }
        };
        return if log_p { p.ln() } else { p };
    }
    let dist = ChiSquared::new(df).expect("validated parameters: df > 0");
    let cdf = if lower_tail { dist.cdf(x) } else { 1.0 - dist.cdf(x) };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qchisq(p: f64, df: f64, lower_tail: bool, log_p: bool) -> f64 {
    if df <= 0.0 {
        return f64::NAN;
    }
    // Chi-squared is Gamma(df/2, 1/2)
    // R uses: qgamma(p, shape = df/2, scale = 2)
    // Our qgamma uses rate parameterization, so rate = 1/scale = 1/2 = 0.5
    super::gamma::qgamma(p, 0.5 * df, 0.5, lower_tail, log_p)
}

pub fn rchisq<R: Rng>(df: f64, rng: &mut R) -> f64 {
    if df <= 0.0 {
        return f64::NAN;
    }
    let dist = ChiSquared::new(df).expect("validated parameters: df > 0");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dchisq() {
        // Test with df=3
        let expected = 0.24197072451914337; // dchisq(1, 3) in R
        assert!((dchisq(1.0, 3.0, false) - expected).abs() < 1e-10);

        // Test log version
        assert!((dchisq(1.0, 3.0, true) - dchisq(1.0, 3.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_pchisq() {
        // Test with df=3
        let expected = 0.1987480430987992; // pchisq(1, 3, lower.tail=TRUE) in R
        assert!((pchisq(1.0, 3.0, true, false) - expected).abs() < 1e-10);

        // Test upper tail
        let expected_upper = 0.8012519569012008; // pchisq(1, 3, lower.tail=FALSE) in R
        assert!((pchisq(1.0, 3.0, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qchisq() {
        // Test with df=3
        let expected = 1.0; // qchisq(0.198748, 3) in R
        assert!((qchisq(0.1987480430987992, 3.0, true, false) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rchisq() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rchisq(3.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dchisq(1.0, -1.0, false).is_nan());
        assert!(pchisq(1.0, -1.0, true, false).is_nan());
        assert!(qchisq(0.5, -1.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rchisq(-1.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qchisq_log() {
        let p = (0.1987480430987992f64).ln();
        let expected = 1.0;
        assert!((qchisq(p, 3.0, true, true) - expected).abs() < 1e-6);
    }
}
