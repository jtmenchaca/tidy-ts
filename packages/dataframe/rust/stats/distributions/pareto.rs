//! Pareto distribution using statrs
//!
//! PDF:  f(x) = (α * xm^α) / x^(α+1)  for x >= xm
//! CDF:  F(x) = 1 - (xm/x)^α
//! QF:   Q(p) = xm / (1-p)^(1/α)

use statrs::distribution::{Continuous, ContinuousCDF, Pareto};
use rand::Rng;

pub fn dpareto(x: f64, scale: f64, shape: f64, give_log: bool) -> f64 {
    if scale <= 0.0 || shape <= 0.0 {
        return f64::NAN;
    }
    let dist = Pareto::new(scale, shape).expect("validated parameters");
    if give_log { dist.ln_pdf(x) } else { dist.pdf(x) }
}

pub fn ppareto(x: f64, scale: f64, shape: f64, lower_tail: bool, log_p: bool) -> f64 {
    if scale <= 0.0 || shape <= 0.0 {
        return f64::NAN;
    }
    let dist = Pareto::new(scale, shape).expect("validated parameters");
    let cdf = if lower_tail { dist.cdf(x) } else { dist.sf(x) };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qpareto(p: f64, scale: f64, shape: f64, lower_tail: bool, log_p: bool) -> f64 {
    if scale <= 0.0 || shape <= 0.0 {
        return f64::NAN;
    }
    let mut p_val = if log_p { p.exp() } else { p };
    if p_val < 0.0 || p_val > 1.0 {
        return f64::NAN;
    }
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    // Analytical quantile: Q(p) = xm / (1-p)^(1/α)
    let tail = 1.0 - p_val;
    if tail == 0.0 {
        return f64::INFINITY;
    }
    if tail == 1.0 {
        return scale;
    }
    scale * tail.powf(-1.0 / shape)
}

pub fn rpareto<R: Rng>(scale: f64, shape: f64, rng: &mut R) -> f64 {
    if scale <= 0.0 || shape <= 0.0 {
        return f64::NAN;
    }
    let dist = Pareto::new(scale, shape).expect("validated parameters");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dpareto() {
        // f(2; xm=1, α=3) = 3 * 1^3 / 2^4 = 3/16 = 0.1875
        let d = dpareto(2.0, 1.0, 3.0, false);
        assert!((d - 0.1875).abs() < 1e-10);
    }

    #[test]
    fn test_ppareto() {
        // F(2; xm=1, α=3) = 1 - (1/2)^3 = 0.875
        let p = ppareto(2.0, 1.0, 3.0, true, false);
        assert!((p - 0.875).abs() < 1e-10);
    }

    #[test]
    fn test_qpareto_roundtrip() {
        let x = 2.5;
        let p = ppareto(x, 1.0, 3.0, true, false);
        let q = qpareto(p, 1.0, 3.0, true, false);
        assert!((q - x).abs() < 1e-10);
    }

    #[test]
    fn test_rpareto() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rpareto(1.0, 3.0, &mut rng);
        assert!(sample >= 1.0 && sample.is_finite());
    }

    #[test]
    fn test_invalid_params() {
        assert!(dpareto(1.0, 0.0, 1.0, false).is_nan());
        assert!(dpareto(1.0, 1.0, 0.0, false).is_nan());
    }
}
