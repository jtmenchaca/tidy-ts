//! Extreme Value Type 1 (Gumbel maximum) distribution
//!
//! PDF:  f(x) = (1/β) exp(-(z + exp(-z)))  where z = (x - μ) / β
//! CDF:  F(x) = exp(-exp(-z))
//! QF:   Q(p) = μ - β ln(-ln(p))

use rand::Rng;

pub fn dev1(x: f64, location: f64, scale: f64, give_log: bool) -> f64 {
    if scale <= 0.0 {
        return f64::NAN;
    }
    let z = (x - location) / scale;
    let log_density = -(z + (-z).exp()) - scale.ln();
    if give_log { log_density } else { log_density.exp() }
}

pub fn pev1(x: f64, location: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    if scale <= 0.0 {
        return f64::NAN;
    }
    let z = (x - location) / scale;
    // CDF = exp(-exp(-z))
    let neg_exp_neg_z = -(-z).exp();

    if lower_tail {
        if log_p { neg_exp_neg_z } else { neg_exp_neg_z.exp() }
    } else {
        let p = 1.0 - neg_exp_neg_z.exp();
        if log_p { p.ln() } else { p }
    }
}

pub fn qev1(p: f64, location: f64, scale: f64, lower_tail: bool, log_p: bool) -> f64 {
    if scale <= 0.0 {
        return f64::NAN;
    }
    let mut p_val = if log_p { p.exp() } else { p };
    if p_val < 0.0 || p_val > 1.0 {
        return f64::NAN;
    }
    if !lower_tail {
        p_val = 1.0 - p_val;
    }
    if p_val == 0.0 {
        return f64::NEG_INFINITY;
    }
    if p_val == 1.0 {
        return f64::INFINITY;
    }
    // Q(p) = μ - β * ln(-ln(p))
    location - scale * (-p_val.ln()).ln()
}

pub fn rev1<R: Rng>(location: f64, scale: f64, rng: &mut R) -> f64 {
    if scale <= 0.0 {
        return f64::NAN;
    }
    let u: f64 = rng.gen_range(0.0..1.0);
    location - scale * (-u.ln()).ln()
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dev1_standard() {
        // f(0; 0, 1) = exp(-(0 + exp(0))) = exp(-1) ≈ 0.3678794
        let d = dev1(0.0, 0.0, 1.0, false);
        assert!((d - 0.3678794).abs() < 1e-6);
    }

    #[test]
    fn test_pev1_standard() {
        // F(0; 0, 1) = exp(-exp(0)) = exp(-1) ≈ 0.3678794
        let p = pev1(0.0, 0.0, 1.0, true, false);
        assert!((p - 0.3678794).abs() < 1e-6);
    }

    #[test]
    fn test_qev1_roundtrip() {
        let x = 1.5;
        let p = pev1(x, 0.0, 1.0, true, false);
        let q = qev1(p, 0.0, 1.0, true, false);
        assert!((q - x).abs() < 1e-10);
    }

    #[test]
    fn test_rev1() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rev1(0.0, 1.0, &mut rng);
        assert!(sample.is_finite());
    }

    #[test]
    fn test_invalid_scale() {
        assert!(dev1(0.0, 0.0, 0.0, false).is_nan());
        assert!(dev1(0.0, 0.0, -1.0, false).is_nan());
    }
}
