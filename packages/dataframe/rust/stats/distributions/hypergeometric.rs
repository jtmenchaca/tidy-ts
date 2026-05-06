//! Hypergeometric distribution wrapper using statrs
//!
//! R parameterization: dhyper(x, m, n, k)
//! - Population size: m + n
//! - Success items in population: m  
//! - Sample size: k
//! - Success items in sample: x
//!
//! statrs::Hypergeometric::new(population_size, successes, samples)

use rand::Rng;
use statrs::distribution::{Discrete, DiscreteCDF, Hypergeometric};

pub fn dhyper(x: f64, m: f64, n: f64, k: f64, give_log: bool) -> f64 {
    if m < 0.0 || n < 0.0 || k < 0.0 || k > m + n {
        return f64::NAN;
    }
    // Map R parameters to statrs: (population_size, successes, samples)
    let population_size = (m + n) as u64;
    let successes = m as u64;
    let samples = k as u64;
    
    let dist = Hypergeometric::new(population_size, successes, samples)
        .expect("validated parameters: m >= 0, n >= 0, k >= 0, k <= m + n");
    let x_int = match super::validate_integer(x) {
        Some(xi) => xi,
        None => return f64::NAN,
    };
    if give_log {
        dist.ln_pmf(x_int as u64)
    } else {
        dist.pmf(x_int as u64)
    }
}

pub fn phyper(x: f64, m: f64, n: f64, k: f64, lower_tail: bool, log_p: bool) -> f64 {
    if m < 0.0 || n < 0.0 || k < 0.0 || k > m + n {
        return f64::NAN;
    }
    // Map R parameters to statrs: (population_size, successes, samples)
    let population_size = (m + n) as u64;
    let successes = m as u64;
    let samples = k as u64;
    
    let dist = Hypergeometric::new(population_size, successes, samples)
        .expect("validated parameters: m >= 0, n >= 0, k >= 0, k <= m + n");
    let x_int = match super::validate_integer(x) {
        Some(xi) => xi,
        None => return f64::NAN,
    };
    let cdf = if lower_tail {
        dist.cdf(x_int as u64)
    } else {
        dist.sf(x_int as u64)
    };
    if log_p { cdf.ln() } else { cdf }
}

/// Hypergeometric quantile function — ported from R's qhyper.c
///
/// Finds xr such that phyper(xr, m, n, k) >= p > phyper(xr-1, m, n, k)
/// Uses direct summation of PMF terms with ratio updates.
pub fn qhyper(p: f64, m: f64, n: f64, k: f64, lower_tail: bool, log_p: bool) -> f64 {
    if p.is_nan() || m.is_nan() || n.is_nan() || k.is_nan() {
        return p + m + n + k;
    }
    if !p.is_finite() || !m.is_finite() || !n.is_finite() || !k.is_finite() {
        return f64::NAN;
    }
    let nr = m.trunc(); // NR = number of red (successes in population)
    let nb = n.trunc(); // NB = number of black (failures in population)
    let big_n = nr + nb;
    let nn = k.trunc(); // n = sample size
    if nr < 0.0 || nb < 0.0 || nn < 0.0 || nn > big_n {
        return f64::NAN;
    }

    let xstart = (nn - nb).max(0.0);
    let xend = nn.min(nr);

    // R_Q_P01_boundaries: boundary checks
    let mut p_val = if log_p { p.exp() } else { p };
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    if p_val < 0.0 || p_val > 1.0 {
        return f64::NAN;
    }
    if p_val == 0.0 {
        return xstart;
    }
    if p_val == 1.0 {
        return xend;
    }

    // Fudge factor for left-continuity
    p_val *= 1.0 - 1000.0 * f64::EPSILON;

    let mut xr = xstart;
    let mut xb = nn - xr;

    let small_n = big_n < 1000.0;

    // lfastchoose = lnCombination
    fn lfastchoose(n: f64, k: f64) -> f64 {
        statrs::function::gamma::ln_gamma(n + 1.0)
            - statrs::function::gamma::ln_gamma(k + 1.0)
            - statrs::function::gamma::ln_gamma(n - k + 1.0)
    }

    let mut term = lfastchoose(nr, xr) + lfastchoose(nb, xb) - lfastchoose(big_n, nn);
    if small_n {
        term = term.exp();
    }
    let mut nr_rem = nr - xr;
    let mut nb_rem = nb - xb;

    let mut sum = if small_n { term } else { term.exp() };

    while sum < p_val && xr < xend {
        xr += 1.0;
        nb_rem += 1.0;
        if small_n {
            term *= (nr_rem / xr) * (xb / nb_rem);
        } else {
            term += ((nr_rem / xr) * (xb / nb_rem)).ln();
        }
        sum += if small_n { term } else { term.exp() };
        xb -= 1.0;
        nr_rem -= 1.0;
    }
    xr
}

pub fn rhyper<R: Rng>(m: f64, n: f64, k: f64, rng: &mut R) -> f64 {
    if m < 0.0 || n < 0.0 || k < 0.0 || k > m + n {
        return f64::NAN;
    }
    // Map R parameters to statrs: (population_size, successes, samples)
    let population_size = (m + n) as u64;
    let successes = m as u64;
    let samples = k as u64;
    
    let dist = Hypergeometric::new(population_size, successes, samples)
        .expect("validated parameters: m >= 0, n >= 0, k >= 0, k <= m + n");
    rng.sample(dist) as f64
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dhyper() {
        // Test with m=10, n=5, k=7, x=3
        let expected = 0.09324009; // dhyper(3, 10, 5, 7) in R
        let actual = dhyper(3.0, 10.0, 5.0, 7.0, false);
        assert!((actual - expected).abs() < 1e-6);

        // Test log version
        assert!(
            (dhyper(3.0, 10.0, 5.0, 7.0, true) - dhyper(3.0, 10.0, 5.0, 7.0, false).ln()).abs()
                < 1e-10
        );
    }

    #[test]
    fn test_phyper() {
        // Test with m=10, n=5, k=7, x=3
        let expected = 0.1002331; // phyper(3, 10, 5, 7, lower.tail=TRUE) in R
        assert!((phyper(3.0, 10.0, 5.0, 7.0, true, false) - expected).abs() < 1e-6);

        // Test upper tail
        let expected_upper = 0.8997669; // phyper(3, 10, 5, 7, lower.tail=FALSE) in R
        assert!((phyper(3.0, 10.0, 5.0, 7.0, false, false) - expected_upper).abs() < 1e-6);
    }

    #[test]
    fn test_qhyper() {
        // Test with m=10, n=5, k=7
        let expected = 5.0; // qhyper(0.7412587, 10, 5, 7) in R
        assert!((qhyper(0.7412587, 10.0, 5.0, 7.0, true, false) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_rhyper() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rhyper(10.0, 5.0, 7.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0 && sample <= 7.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(dhyper(3.0, -1.0, 5.0, 7.0, false).is_nan());
        assert!(dhyper(3.0, 10.0, -1.0, 7.0, false).is_nan());
        assert!(dhyper(3.0, 10.0, 5.0, -1.0, false).is_nan());
        assert!(dhyper(3.0, 10.0, 5.0, 20.0, false).is_nan()); // k > m + n
        assert!(phyper(3.0, -1.0, 5.0, 7.0, true, false).is_nan());
        assert!(qhyper(0.5, -1.0, 5.0, 7.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rhyper(-1.0, 5.0, 7.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qhyper_log() {
        let p = (0.7412587f64).ln();
        let expected = 5.0;
        assert!((qhyper(p, 10.0, 5.0, 7.0, true, true) - expected).abs() < 1e-6);
    }
}
