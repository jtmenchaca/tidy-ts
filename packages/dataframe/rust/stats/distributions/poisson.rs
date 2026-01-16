//! Poisson distribution wrapper using statrs

use rand::Rng;
use statrs::distribution::{Discrete, DiscreteCDF, Poisson};

pub fn dpois(x: f64, lambda: f64, give_log: bool) -> f64 {
    if lambda <= 0.0 {
        return f64::NAN;
    }
    let x_int = match super::helpers::validate_integer(x) {
        Some(xi) => xi,
        None => return f64::NAN,
    };
    let dist = Poisson::new(lambda).expect("validated parameters: lambda > 0");
    if give_log {
        dist.ln_pmf(x_int)
    } else {
        dist.pmf(x_int)
    }
}

pub fn ppois(x: f64, lambda: f64, lower_tail: bool, log_p: bool) -> f64 {
    if lambda <= 0.0 {
        return f64::NAN;
    }
    let x_int = match super::helpers::validate_integer(x) {
        Some(xi) => xi,
        None => return f64::NAN,
    };
    let dist = Poisson::new(lambda).expect("validated parameters: lambda > 0");
    let cdf = if lower_tail {
        dist.cdf(x_int)
    } else {
        1.0 - dist.cdf(x_int)
    };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qpois(p: f64, lambda: f64, lower_tail: bool, log_p: bool) -> f64 {
    if lambda <= 0.0 {
        return f64::NAN;
    }
    let dist = Poisson::new(lambda).expect("validated parameters: lambda > 0");
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = super::helpers::clamp_unit(p_val);
    dist.inverse_cdf(p_val) as f64
}

pub fn rpois<R: Rng>(lambda: f64, rng: &mut R) -> f64 {
    if lambda <= 0.0 {
        return f64::NAN;
    }
    let dist = Poisson::new(lambda).expect("validated parameters: lambda > 0");
    rng.sample(dist) as f64
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dpois() {
        // Test with lambda=2
        let expected = 0.2706705664732254; // dpois(1, 2) in R
        assert!((dpois(1.0, 2.0, false) - expected).abs() < 1e-10);

        // Test log version
        assert!((dpois(1.0, 2.0, true) - dpois(1.0, 2.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_ppois() {
        // Test with lambda=2
        let expected = 0.4060058497098381; // ppois(1, 2, lower.tail=TRUE) in R
        assert!((ppois(1.0, 2.0, true, false) - expected).abs() < 1e-10);

        // Test upper tail
        let expected_upper = 0.5939941502901619; // ppois(1, 2, lower.tail=FALSE) in R
        assert!((ppois(1.0, 2.0, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qpois() {
        // Test with lambda=2
        let expected = 1.0; // qpois(0.4060058, 2) in R
        assert!((qpois(0.4060058497098381, 2.0, true, false) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rpois() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rpois(2.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dpois(1.0, -1.0, false).is_nan());
        assert!(ppois(1.0, -1.0, true, false).is_nan());
        assert!(qpois(0.5, -1.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rpois(-1.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qpois_log() {
        let p = (0.4060058497098381f64).ln();
        let expected = 1.0;
        assert!((qpois(p, 2.0, true, true) - expected).abs() < 1e-6);
    }
}
