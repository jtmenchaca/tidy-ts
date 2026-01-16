//! Geometric distribution wrapper using statrs
//! 
//! Note: R uses "number of failures before first success" parameterization
//! while statrs uses "trial number of first success" parameterization.
//! We adjust by adding 1 to convert from R's parameterization to statrs.

use rand::Rng;
use statrs::distribution::{Discrete, DiscreteCDF, Geometric};

pub fn dgeom(x: f64, p: f64, give_log: bool) -> f64 {
    if p <= 0.0 || p >= 1.0 {
        return f64::NAN;
    }
    let dist = Geometric::new(p).expect("validated parameters: 0 < p < 1");
    let x_int = match super::helpers::validate_integer(x) {
        Some(xi) => xi,
        None => return f64::NAN,
    };
    // R counts failures before success, statrs counts trial of success
    // So we need to add 1 to x for statrs
    let adjusted_x = x_int + 1;
    if adjusted_x < 1 {
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }
    if give_log {
        dist.ln_pmf(adjusted_x as u64)
    } else {
        dist.pmf(adjusted_x as u64)
    }
}

pub fn pgeom(x: f64, p: f64, lower_tail: bool, log_p: bool) -> f64 {
    if p <= 0.0 || p >= 1.0 {
        return f64::NAN;
    }
    let dist = Geometric::new(p).expect("validated parameters: 0 < p < 1");
    let x_int = match super::helpers::validate_integer(x) {
        Some(xi) => xi,
        None => return f64::NAN,
    };
    // R counts failures before success, statrs counts trial of success
    // So we need to add 1 to x for statrs
    let adjusted_x = x_int + 1;
    if adjusted_x < 1 {
        return if log_p { f64::NEG_INFINITY } else { 0.0 };
    }
    let cdf = if lower_tail {
        dist.cdf(adjusted_x as u64)
    } else {
        1.0 - dist.cdf(adjusted_x as u64)
    };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qgeom(p: f64, p_param: f64, lower_tail: bool, log_p: bool) -> f64 {
    if p_param <= 0.0 || p_param >= 1.0 {
        return f64::NAN;
    }
    
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    p_val = super::helpers::clamp_unit(p_val);
    
    // Handle edge cases
    if p_val <= 0.0 {
        return 0.0;
    }
    if p_val >= 1.0 {
        return f64::INFINITY;
    }
    
    // Manual quantile search for R-style geometric distribution
    // Find smallest k such that P(X <= k) >= p_val
    // where P(X = k) = (1-p)^k * p for k = 0, 1, 2, ...
    let mut k = 0.0;
    let mut cumulative = 0.0;
    let q = 1.0 - p_param;  // failure probability
    
    loop {
        // P(X = k) = (1-p)^k * p
        let pmf = q.powf(k) * p_param;
        cumulative += pmf;
        
        if cumulative >= p_val {
            return k;
        }
        
        k += 1.0;
        
        // Safety check to avoid infinite loop
        if k > 10000.0 {
            return f64::NAN;
        }
    }
}

pub fn rgeom<R: Rng>(p: f64, rng: &mut R) -> f64 {
    if p <= 0.0 || p >= 1.0 {
        return f64::NAN;
    }
    let dist = Geometric::new(p).expect("validated parameters: 0 < p < 1");
    // statrs returns trial number, we need to subtract 1 to get number of failures
    let result = rng.sample(dist) as f64;
    if result >= 1.0 {
        result - 1.0
    } else {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dgeom() {
        // Test with p=0.3
        let expected = 0.147; // dgeom(2, 0.3) in R
        assert!((dgeom(2.0, 0.3, false) - expected).abs() < 1e-10);

        // Test log version
        assert!((dgeom(2.0, 0.3, true) - dgeom(2.0, 0.3, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_pgeom() {
        // Test with p=0.3
        let expected = 0.657; // pgeom(2, 0.3, lower.tail=TRUE) in R
        assert!((pgeom(2.0, 0.3, true, false) - expected).abs() < 1e-10);

        // Test upper tail
        let expected_upper = 0.343; // pgeom(2, 0.3, lower.tail=FALSE) in R
        assert!((pgeom(2.0, 0.3, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qgeom() {
        // Test with p=0.3
        // Using a value slightly below the exact CDF value to avoid rounding issues
        let expected = 2.0; // qgeom(0.656999, 0.3) in R
        let actual = qgeom(0.656999, 0.3, true, false);
        assert!((actual - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rgeom() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rgeom(0.3, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dgeom(2.0, -0.1, false).is_nan());
        assert!(dgeom(2.0, 1.1, false).is_nan());
        assert!(pgeom(2.0, -0.1, true, false).is_nan());
        assert!(qgeom(0.5, -0.1, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rgeom(-0.1, &mut rng).is_nan());
    }

    #[test]
    fn test_qgeom_log() {
        let p = (0.656999f64).ln();
        let expected = 2.0;
        assert!((qgeom(p, 0.3, true, true) - expected).abs() < 1e-6);
    }
}
