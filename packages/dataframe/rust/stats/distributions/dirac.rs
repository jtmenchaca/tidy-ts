//! Dirac delta (point mass / degenerate) distribution
//!
//! PDF:  f(x) = +Infinity if x == location, 0 otherwise
//! CDF:  F(x) = 0 if x < location, 1 if x >= location
//! QF:   Q(p) = location for any p in (0, 1]

use rand::Rng;

pub fn ddirac(x: f64, location: f64, give_log: bool) -> f64 {
    if x == location {
        if give_log { f64::INFINITY } else { f64::INFINITY }
    } else {
        if give_log { f64::NEG_INFINITY } else { 0.0 }
    }
}

pub fn pdirac(x: f64, location: f64, lower_tail: bool, log_p: bool) -> f64 {
    let p = if x < location {
        if lower_tail { 0.0 } else { 1.0 }
    } else {
        if lower_tail { 1.0 } else { 0.0 }
    };

    if log_p {
        if p == 0.0 { f64::NEG_INFINITY } else { 0.0 }
    } else {
        p
    }
}

pub fn qdirac(p: f64, location: f64, lower_tail: bool, log_p: bool) -> f64 {
    let p_val = if log_p { p.exp() } else { p };
    let _ = lower_tail; // quantile is always location for point mass

    if p_val < 0.0 || p_val > 1.0 {
        return f64::NAN;
    }

    location
}

pub fn rdirac<R: Rng>(location: f64, _rng: &mut R) -> f64 {
    location
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_ddirac_at_location() {
        assert_eq!(ddirac(0.0, 0.0, false), f64::INFINITY);
    }

    #[test]
    fn test_ddirac_away() {
        assert_eq!(ddirac(1.0, 0.0, false), 0.0);
    }

    #[test]
    fn test_pdirac() {
        assert_eq!(pdirac(-1.0, 0.0, true, false), 0.0);
        assert_eq!(pdirac(0.0, 0.0, true, false), 1.0);
        assert_eq!(pdirac(1.0, 0.0, true, false), 1.0);
    }

    #[test]
    fn test_qdirac() {
        assert_eq!(qdirac(0.5, 3.0, true, false), 3.0);
    }

    #[test]
    fn test_rdirac() {
        let mut rng = StdRng::seed_from_u64(42);
        assert_eq!(rdirac(5.0, &mut rng), 5.0);
    }
}
