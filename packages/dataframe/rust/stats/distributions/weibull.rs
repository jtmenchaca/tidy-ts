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

/// Weibull quantile function — ported from R's qweibull.c
///
/// Uses closed-form: scale * (-log(1-p))^(1/shape)
/// R_DT_Clog(p) = log(1-p) accounting for lower_tail/log_p
pub fn qweibull(p: f64, shape: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    if p.is_nan() || shape.is_nan() || scale.is_nan() {
        return p + shape + scale;
    }
    if shape <= 0.0 || scale <= 0.0 {
        return f64::NAN;
    }
    // R_Q_P01_boundaries(p, 0, ML_POSINF)
    if log_p {
        if p > 0.0 { return f64::NAN; }
        if p == 0.0 { return if lower_tail { f64::INFINITY } else { 0.0 }; }
        if p == f64::NEG_INFINITY { return if lower_tail { 0.0 } else { f64::INFINITY }; }
    } else {
        if p < 0.0 || p > 1.0 { return f64::NAN; }
        if p == 0.0 { return if lower_tail { 0.0 } else { f64::INFINITY }; }
        if p == 1.0 { return if lower_tail { f64::INFINITY } else { 0.0 }; }
    }

    // R_DT_Clog(p) = log(1-p) in the quantile function
    // lower_tail ? R_D_LExp(p) : R_D_log(p)
    // R_D_LExp(x) = log_p ? R_Log1_Exp(x) : log1p(-x)
    // R_D_log(p)  = log_p ? p : log(p)
    let clog = if lower_tail {
        // R_D_LExp(p)
        if log_p {
            // R_Log1_Exp(p): log(1 - exp(p))
            if p > -std::f64::consts::LN_2 {
                (-p.exp_m1()).ln() // log(-expm1(p))
            } else {
                (-p.exp()).ln_1p() // log1p(-exp(p))
            }
        } else {
            (-p).ln_1p() // log1p(-p)
        }
    } else {
        // R_D_log(p)
        if log_p { p } else { p.ln() }
    };

    // scale * pow(-clog, 1/shape)
    scale * (-clog).powf(1.0 / shape)
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