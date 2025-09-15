//! Negative Binomial distribution wrapper using statrs

use rand::Rng;
use statrs::distribution::{Discrete, DiscreteCDF, NegativeBinomial};

pub fn dnbinom(x: f64, r: f64, p: f64, give_log: bool) -> f64 {
    if r <= 0.0 || p <= 0.0 || p >= 1.0 {
        return f64::NAN;
    }
    let dist = NegativeBinomial::new(r, p).expect("validated parameters: r > 0, 0 < p < 1");
    let x_int = match super::helpers::validate_integer(x) {
        Some(xi) => xi,
        None => return f64::NAN,
    };
    if give_log {
        dist.ln_pmf(x_int)
    } else {
        dist.pmf(x_int)
    }
}

pub fn pnbinom(x: f64, r: f64, p: f64, lower_tail: bool, log_p: bool) -> f64 {
    if r <= 0.0 || p <= 0.0 || p >= 1.0 {
        return f64::NAN;
    }
    let dist = NegativeBinomial::new(r, p).expect("validated parameters: r > 0, 0 < p < 1");
    let x_int = match super::helpers::validate_integer(x) {
        Some(xi) => xi,
        None => return f64::NAN,
    };
    let cdf = if lower_tail {
        dist.cdf(x_int)
    } else {
        1.0 - dist.cdf(x_int)
    };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qnbinom(p: f64, r: f64, p_param: f64, lower_tail: bool, log_p: bool) -> f64 {
    if r <= 0.0 || p_param <= 0.0 || p_param >= 1.0 {
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
    
    // Manual quantile search for R-style negative binomial distribution
    // Find smallest k such that P(X <= k) >= p_val
    // Use the existing dnbinom function to compute PMF values
    let mut k = 0.0;
    let mut cumulative = 0.0;
    
    loop {
        // Use our own dnbinom function to get P(X = k)
        let pmf = dnbinom(k, r, p_param, false);
        cumulative += pmf;
        
        if cumulative >= p_val - 1e-10 {
            return k;
        }
        
        k += 1.0;
        
        // Safety check to avoid infinite loop
        if k > 10000.0 {
            return f64::NAN;
        }
    }
}

pub fn rnbinom<R: Rng>(r: f64, p: f64, rng: &mut R) -> f64 {
    if r <= 0.0 || p <= 0.0 || p >= 1.0 {
        return f64::NAN;
    }
    let dist = NegativeBinomial::new(r, p).expect("validated parameters: r > 0, 0 < p < 1");
    rng.sample(dist) as f64
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dnbinom() {
        // Test with r=5, p=0.3
        let expected = 0.0178605; // dnbinom(2, 5, 0.3) in R
        let actual = dnbinom(2.0, 5.0, 0.3, false);
        println!("dnbinom(2, 5, 0.3): expected={}, actual={}", expected, actual);
        assert!((actual - expected).abs() < 1e-6);

        // Test log version
        assert!((dnbinom(2.0, 5.0, 0.3, true) - dnbinom(2.0, 5.0, 0.3, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_pnbinom() {
        // Test with r=5, p=0.3
        let expected = 0.0287955; // pnbinom(2, 5, 0.3, lower.tail=TRUE) in R
        assert!((pnbinom(2.0, 5.0, 0.3, true, false) - expected).abs() < 1e-6);

        // Test upper tail
        let expected_upper = 0.9712045; // pnbinom(2, 5, 0.3, lower.tail=FALSE) in R
        assert!((pnbinom(2.0, 5.0, 0.3, false, false) - expected_upper).abs() < 1e-6);
    }

    #[test]
    fn test_qnbinom() {
        // Test with r=5, p=0.3  
        let expected = 6.0; // qnbinom(0.16308, 5, 0.3) in R
        assert!((qnbinom(0.16308, 5.0, 0.3, true, false) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rnbinom() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rnbinom(5.0, 0.3, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dnbinom(2.0, -1.0, 0.3, false).is_nan());
        assert!(dnbinom(2.0, 5.0, -0.1, false).is_nan());
        assert!(dnbinom(2.0, 5.0, 1.1, false).is_nan());
        assert!(pnbinom(2.0, -1.0, 0.3, true, false).is_nan());
        assert!(qnbinom(0.5, -1.0, 0.3, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rnbinom(-1.0, 0.3, &mut rng).is_nan());
    }

    #[test]
    fn test_qnbinom_log() {
        let p = (0.16308f64).ln();
        let expected = 6.0;
        assert!((qnbinom(p, 5.0, 0.3, true, true) - expected).abs() < 1e-6);
    }
}
