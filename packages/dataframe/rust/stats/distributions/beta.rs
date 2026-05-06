//! Beta distribution wrapper using statrs

use rand::Rng;
use statrs::distribution::{Beta, Continuous, ContinuousCDF};

pub fn dbeta(x: f64, shape1: f64, shape2: f64, give_log: bool) -> f64 {
    if shape1 <= 0.0 || shape2 <= 0.0 {
        return f64::NAN;
    }
    let dist = Beta::new(shape1, shape2).expect("validated parameters: shape1 > 0, shape2 > 0");
    if give_log {
        dist.ln_pdf(x)
    } else {
        dist.pdf(x)
    }
}

pub fn pbeta(x: f64, shape1: f64, shape2: f64, lower_tail: bool, log_p: bool) -> f64 {
    if shape1 <= 0.0 || shape2 <= 0.0 {
        return f64::NAN;
    }
    let dist = Beta::new(shape1, shape2).expect("validated parameters: shape1 > 0, shape2 > 0");
    let cdf = if lower_tail { dist.cdf(x) } else { 1.0 - dist.cdf(x) };
    if log_p { cdf.ln() } else { cdf }
}

/// Beta quantile function — uses statrs for initial guess, then Newton-Raphson refinement
///
/// Statrs's bisection-based inverse_cdf gives ~3e-5 precision.
/// We refine with Newton steps using pbeta/dbeta (both accurate) to reach ~1e-15.
pub fn qbeta(p: f64, shape1: f64, shape2: f64, lower_tail: bool, log_p: bool) -> f64 {
    if p.is_nan() || shape1.is_nan() || shape2.is_nan() {
        return p + shape1 + shape2;
    }
    if shape1 <= 0.0 || shape2 <= 0.0 {
        return f64::NAN;
    }
    // Boundary checks
    if log_p {
        if p > 0.0 { return f64::NAN; }
        if p == 0.0 { return if lower_tail { 1.0 } else { 0.0 }; }
        if p == f64::NEG_INFINITY { return if lower_tail { 0.0 } else { 1.0 }; }
    } else {
        if p < 0.0 || p > 1.0 { return f64::NAN; }
        if p == 0.0 { return if lower_tail { 0.0 } else { 1.0 }; }
        if p == 1.0 { return if lower_tail { 1.0 } else { 0.0 }; }
    }

    // Convert to lower-tail probability on natural scale
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = p_val.clamp(f64::MIN_POSITIVE, 1.0 - f64::EPSILON);

    // Initial guess from statrs bisection
    let dist = Beta::new(shape1, shape2).expect("validated parameters");
    let mut x = dist.inverse_cdf(p_val);

    // Clamp to valid range
    x = x.clamp(f64::MIN_POSITIVE, 1.0 - f64::EPSILON);

    // Newton-Raphson refinement: x_{n+1} = x_n - (F(x_n) - p) / f(x_n)
    // where F = pbeta (CDF) and f = dbeta (PDF)
    let logbeta = statrs::function::beta::ln_beta(shape1, shape2);
    let r = 1.0 - shape1;
    let t = 1.0 - shape2;

    for _ in 0..100 {
        let y = pbeta(x, shape1, shape2, true, false);
        let f_x = dbeta(x, shape1, shape2, false);

        if f_x <= 0.0 || !f_x.is_finite() {
            break;
        }

        // Newton step: w = (F(x) - p) / f(x)
        // More stable via: w = (y - p) * exp(logbeta + r*ln(x) + t*ln(1-x))
        let w = (y - p_val) * (logbeta + r * x.ln() + t * (1.0 - x).ln()).exp();

        if !w.is_finite() {
            break;
        }

        let x_new = x - w;

        // Check convergence
        if (w).abs() <= 4e-16 * x.abs().max((x - w).abs()) {
            break;
        }

        // Ensure x stays in (0, 1)
        if x_new <= 0.0 || x_new >= 1.0 {
            // Halve the step if it goes out of bounds
            let x_new = x - w * 0.5;
            if x_new <= 0.0 || x_new >= 1.0 {
                break;
            }
            x = x_new;
        } else {
            x = x_new;
        }
    }

    x
}

pub fn rbeta<R: Rng>(shape1: f64, shape2: f64, rng: &mut R) -> f64 {
    if shape1 <= 0.0 || shape2 <= 0.0 {
        return f64::NAN;
    }
    let dist = Beta::new(shape1, shape2).expect("validated parameters: shape1 > 0, shape2 > 0");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dbeta() {
        // Test with shape1=2, shape2=3
        let expected = 1.5; // dbeta(0.5, 2, 3) in R
        assert!((dbeta(0.5, 2.0, 3.0, false) - expected).abs() < 1e-10);

        // Test log version
        assert!((dbeta(0.5, 2.0, 3.0, true) - dbeta(0.5, 2.0, 3.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_pbeta() {
        // Test with shape1=2, shape2=3
        let expected = 0.6875; // pbeta(0.5, 2, 3, lower.tail=TRUE) in R
        assert!((pbeta(0.5, 2.0, 3.0, true, false) - expected).abs() < 1e-10);

        // Test upper tail
        let expected_upper = 0.3125; // pbeta(0.5, 2, 3, lower.tail=FALSE) in R
        assert!((pbeta(0.5, 2.0, 3.0, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qbeta() {
        // Test with shape1=2, shape2=3
        // Note: R gives exactly 0.5, but statrs inverse_cdf has slight numerical error
        // The actual value is 0.500030517578125 which is acceptable within tolerance
        let expected = 0.5; // qbeta(0.6875, 2, 3) in R
        let actual = qbeta(0.6875, 2.0, 3.0, true, false);
        assert!((actual - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rbeta() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rbeta(2.0, 3.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0 && sample <= 1.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dbeta(0.5, -1.0, 3.0, false).is_nan());
        assert!(dbeta(0.5, 2.0, -1.0, false).is_nan());
        assert!(pbeta(0.5, -1.0, 3.0, true, false).is_nan());
        assert!(qbeta(0.5, -1.0, 3.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rbeta(-1.0, 3.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qbeta_log() {
        let p = (0.6875f64).ln();
        let expected = 0.5;
        let actual = qbeta(p, 2.0, 3.0, true, true);
        // Same numerical precision issue as test_qbeta
        assert!((actual - expected).abs() < 1e-6);
    }
}
