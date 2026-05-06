//! Poisson distribution — uses statrs for dpois/ppois, custom qpois ported from R's qpois.c

use rand::Rng;
use statrs::distribution::{Discrete, DiscreteCDF, Poisson};

pub fn dpois(x: f64, lambda: f64, give_log: bool) -> f64 {
    if x.is_nan() || lambda.is_nan() {
        return x + lambda;
    }
    if lambda < 0.0 {
        return f64::NAN;
    }
    // R: dpois(x, 0) = if x==0 then 1 else 0
    if lambda == 0.0 {
        return if x == 0.0 {
            if give_log { 0.0 } else { 1.0 }
        } else {
            if give_log { f64::NEG_INFINITY } else { 0.0 }
        };
    }
    if x < 0.0 || !x.is_finite() {
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }
    let x_int = match super::helpers::validate_integer(x) {
        Some(xi) => xi,
        None => return if give_log { f64::NEG_INFINITY } else { 0.0 },
    };
    let dist = Poisson::new(lambda).expect("validated parameters: lambda > 0");
    if give_log {
        dist.ln_pmf(x_int)
    } else {
        dist.pmf(x_int)
    }
}

pub fn ppois(x: f64, lambda: f64, lower_tail: bool, log_p: bool) -> f64 {
    if x.is_nan() || lambda.is_nan() {
        return x + lambda;
    }
    if lambda < 0.0 {
        return f64::NAN;
    }
    if x < 0.0 {
        let p: f64 = if lower_tail { 0.0 } else { 1.0 };
        return if log_p { p.ln() } else { p };
    }
    if lambda == 0.0 {
        let p: f64 = if lower_tail { 1.0 } else { 0.0 };
        return if log_p { p.ln() } else { p };
    }
    if !x.is_finite() {
        let p: f64 = if lower_tail { 1.0 } else { 0.0 };
        return if log_p { p.ln() } else { p };
    }
    let x_floor = (x + 1e-7).floor();
    let x_int = x_floor as u64;
    let dist = Poisson::new(lambda).expect("validated parameters: lambda > 0");
    let cdf = if lower_tail {
        dist.cdf(x_int)
    } else {
        1.0 - dist.cdf(x_int)
    };
    if log_p { cdf.ln() } else { cdf }
}

/// Poisson quantile function — ported from R's qpois.c
///
/// Uses Cornish-Fisher expansion for initial approximation,
/// then discrete search via ppois to refine.
pub fn qpois(p: f64, lambda: f64, lower_tail: bool, log_p: bool) -> f64 {
    if p.is_nan() || lambda.is_nan() {
        return p + lambda;
    }
    if !lambda.is_finite() || lambda < 0.0 {
        return f64::NAN;
    }
    // R_Q_P01_check
    if (log_p && p > 0.0) || (!log_p && (p < 0.0 || p > 1.0)) {
        return f64::NAN;
    }
    if lambda == 0.0 {
        return 0.0;
    }
    // Boundary checks
    if log_p {
        if p == f64::NEG_INFINITY {
            return if lower_tail { 0.0 } else { f64::INFINITY };
        }
        if p == 0.0 {
            return if lower_tail { f64::INFINITY } else { 0.0 };
        }
    } else {
        if p == 0.0 {
            return if lower_tail { 0.0 } else { f64::INFINITY };
        }
        if p == 1.0 {
            return if lower_tail { f64::INFINITY } else { 0.0 };
        }
    }

    let mu = lambda;
    let sigma = lambda.sqrt();
    let gamma = 1.0 / sigma; // skewness = mu^-0.5

    // Cornish-Fisher initial approximation: use qnorm for z
    use statrs::distribution::{Normal, ContinuousCDF as ContCDF};
    let norm = Normal::new(0.0, 1.0).unwrap();

    let z = if log_p {
        if lower_tail {
            // qnorm(exp(p))
            let p_val = p.exp();
            if p_val <= 0.0 { f64::NEG_INFINITY } else { norm.inverse_cdf(p_val) }
        } else {
            // qnorm(1 - exp(p)) = -qnorm(exp(p)) ... approximately
            let p_val = (-p).exp_m1().abs(); // = 1 - exp(p) when p < 0
            if p_val >= 1.0 { f64::INFINITY } else { norm.inverse_cdf(p_val) }
        }
    } else {
        if lower_tail {
            norm.inverse_cdf(p)
        } else {
            norm.inverse_cdf(1.0 - p)
        }
    };

    let mut y = (mu + sigma * (z + gamma * (z * z - 1.0) / 6.0)).round();
    if y < 0.0 {
        y = 0.0;
    }

    // Fuzz p for left-continuity (from qDiscrete_search.h)
    let p_adj = if log_p {
        let e = 2.0 * f64::EPSILON;
        if lower_tail && p > f64::MIN {
            p * (1.0 + e)
        } else {
            p * (1.0 - e)
        }
    } else {
        let e = 8.0 * f64::EPSILON;
        if lower_tail {
            p * (1.0 - e)
        } else if 1.0 - p > 4.0 * e {
            p * (1.0 + e)
        } else {
            p
        }
    };

    // Compute ppois at initial guess
    let mut z_val = ppois(y, lambda, lower_tail, log_p);

    // Simple discrete search for y < 4096
    if y < 4096.0 {
        return do_search_pois(y, &mut z_val, p_adj, lambda, 1.0, lower_tail, log_p);
    }

    // Large y: use decreasing increments
    let mut incr = (y * (1.0 / 64.0)).floor();
    loop {
        let old_incr = incr;
        y = do_search_pois(y, &mut z_val, p_adj, lambda, incr, lower_tail, log_p);
        z_val = ppois(y, lambda, lower_tail, log_p);
        incr = (incr / 8.0).floor().max(1.0);
        if old_incr <= 1.0 || incr <= y * 1e-15 {
            break;
        }
    }
    y
}

/// Discrete search for Poisson quantile (from R's qDiscrete_search.h)
fn do_search_pois(
    mut y: f64,
    z: &mut f64,
    p: f64,
    lambda: f64,
    incr: f64,
    lower_tail: bool,
    log_p: bool,
) -> f64 {
    let left = if lower_tail { *z >= p } else { *z < p };

    if left {
        // search to the left
        loop {
            let mut new_z = -1.0;
            if y > 0.0 {
                new_z = ppois(y - incr, lambda, lower_tail, log_p);
            } else if y < 0.0 {
                y = 0.0;
            }
            if y == 0.0
                || new_z.is_nan()
                || (if lower_tail { new_z < p } else { new_z >= p })
            {
                return y;
            }
            y = (y - incr).max(0.0);
            *z = new_z;
        }
    } else {
        // search to the right
        loop {
            let prev_y = y;
            y += incr;
            let new_z = ppois(y, lambda, lower_tail, log_p);
            if new_z.is_nan() || (if lower_tail { new_z >= p } else { new_z < p }) {
                if incr <= 1.0 {
                    *z = new_z;
                    return y;
                }
                return prev_y;
            }
            *z = new_z;
        }
    }
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
        let expected = 0.2706705664732254;
        assert!((dpois(1.0, 2.0, false) - expected).abs() < 1e-10);
        assert!((dpois(1.0, 2.0, true) - dpois(1.0, 2.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_ppois() {
        let expected = 0.4060058497098381;
        assert!((ppois(1.0, 2.0, true, false) - expected).abs() < 1e-10);
        let expected_upper = 0.5939941502901619;
        assert!((ppois(1.0, 2.0, false, false) - expected_upper).abs() < 1e-10);
    }

    #[test]
    fn test_qpois() {
        let expected = 1.0;
        assert!((qpois(0.4060058497098381, 2.0, true, false) - expected).abs() < 1e-6);
    }

    #[test]
    fn test_qpois_small_lambda() {
        // This was the crash case — lambda=0.5
        let result = qpois(0.5, 0.5, true, false);
        assert!(result.is_finite());
        assert_eq!(result, 0.0); // R: qpois(0.5, 0.5) = 0
    }

    #[test]
    fn test_rpois() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rpois(2.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_dpois_lambda0() {
        assert_eq!(dpois(0.0, 0.0, false), 1.0);
        assert_eq!(dpois(1.0, 0.0, false), 0.0);
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
