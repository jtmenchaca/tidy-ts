//! Zipf distribution (finite support)
//!
//! PMF:  P(k) = 1 / (k^s * H(N,s))  for k = 1, ..., N
//! where H(N,s) = sum_{i=1}^{N} 1/i^s  (generalized harmonic number)

use rand::Rng;

fn harmonic_number(n: u64, s: f64) -> f64 {
    let mut sum = 0.0;
    for i in 1..=n {
        sum += (i as f64).powf(-s);
    }
    sum
}

pub fn dzipf(x: f64, n: f64, s: f64, give_log: bool) -> f64 {
    let n_int = n as u64;
    if n_int < 1 || s <= 0.0 {
        return f64::NAN;
    }

    let k = x.round() as u64;
    if k < 1 || k > n_int {
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }

    let log_h = harmonic_number(n_int, s).ln();
    let log_p = -s * (k as f64).ln() - log_h;

    if give_log { log_p } else { log_p.exp() }
}

pub fn pzipf(x: f64, n: f64, s: f64, lower_tail: bool, log_p: bool) -> f64 {
    let n_int = n as u64;
    if n_int < 1 || s <= 0.0 {
        return f64::NAN;
    }

    let k = x.floor() as i64;

    if k < 1 {
        let p: f64 = if lower_tail { 0.0 } else { 1.0 };
        return if log_p { p.ln() } else { p };
    }
    if k >= n_int as i64 {
        let p: f64 = if lower_tail { 1.0 } else { 0.0 };
        return if log_p { p.ln() } else { p };
    }

    let h = harmonic_number(n_int, s);
    let mut cum_sum = 0.0;
    for i in 1..=(k as u64) {
        cum_sum += (i as f64).powf(-s);
    }
    let p = cum_sum / h;

    let result = if lower_tail { p } else { 1.0 - p };
    if log_p { result.ln() } else { result }
}

pub fn qzipf(p: f64, n: f64, s: f64, lower_tail: bool, log_p: bool) -> f64 {
    let n_int = n as u64;
    if n_int < 1 || s <= 0.0 {
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
        return 0.0;
    }
    if p_val == 1.0 {
        return n;
    }

    let h = harmonic_number(n_int, s);
    let mut cum_sum = 0.0;
    for k in 1..=n_int {
        cum_sum += (k as f64).powf(-s);
        if cum_sum / h >= p_val {
            return k as f64;
        }
    }
    n
}

pub fn rzipf<R: Rng>(n: f64, s: f64, rng: &mut R) -> f64 {
    let u: f64 = rng.gen_range(0.0..1.0);
    qzipf(u, n, s, true, false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_dzipf_n10_s1_5() {
        // P(1) = 1^(-1.5) / H(10, 1.5) = 1/H(10,1.5)
        let h = harmonic_number(10, 1.5);
        let expected = 1.0 / h;
        assert!((dzipf(1.0, 10.0, 1.5, false) - expected).abs() < 1e-10);
    }

    #[test]
    fn test_pzipf_cdf() {
        let p = pzipf(1.0, 10.0, 1.5, true, false);
        let d = dzipf(1.0, 10.0, 1.5, false);
        assert!((p - d).abs() < 1e-10);
    }

    #[test]
    fn test_qzipf_roundtrip() {
        let p = pzipf(3.0, 10.0, 1.5, true, false);
        let q = qzipf(p * (1.0 - 1e-7), 10.0, 1.5, true, false);
        assert!((q - 3.0).abs() < 1e-10);
    }

    #[test]
    fn test_rzipf() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rzipf(10.0, 1.5, &mut rng);
        assert!(sample >= 1.0 && sample <= 10.0);
    }

    #[test]
    fn test_edge_outside_support() {
        assert_eq!(dzipf(0.0, 10.0, 1.5, false), 0.0);
        assert_eq!(dzipf(11.0, 10.0, 1.5, false), 0.0);
    }
}
