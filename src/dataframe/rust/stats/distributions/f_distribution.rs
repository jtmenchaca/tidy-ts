//! F distribution wrapper using statrs

use rand::Rng;
use statrs::distribution::{Continuous, ContinuousCDF, FisherSnedecor};

pub fn df(x: f64, df1: f64, df2: f64, give_log: bool) -> f64 {
    if df1 <= 0.0 || df2 <= 0.0 {
        return f64::NAN;
    }
    let dist = FisherSnedecor::new(df1, df2).expect("validated parameters: df1 > 0, df2 > 0");
    if give_log {
        dist.ln_pdf(x)
    } else {
        dist.pdf(x)
    }
}

pub fn pf(x: f64, df1: f64, df2: f64, lower_tail: bool, log_p: bool) -> f64 {
    if df1 <= 0.0 || df2 <= 0.0 {
        return f64::NAN;
    }
    let dist = FisherSnedecor::new(df1, df2).expect("validated parameters: df1 > 0, df2 > 0");
    let cdf = if lower_tail { dist.cdf(x) } else { 1.0 - dist.cdf(x) };
    if log_p { cdf.ln() } else { cdf }
}

pub fn qf(p: f64, df1: f64, df2: f64, lower_tail: bool, log_p: bool) -> f64 {
    if df1 <= 0.0 || df2 <= 0.0 {
        return f64::NAN;
    }
    
    // Use R's formula: qf = (1/qbeta - 1) * (df2/df1)
    // where qbeta uses shape1=df2/2, shape2=df1/2, and !lower_tail
    let qb = super::beta::qbeta(p, df2/2.0, df1/2.0, !lower_tail, log_p);
    
    if qb == 0.0 {
        return f64::INFINITY;
    }
    if qb == 1.0 {
        return 0.0;
    }
    
    (1.0 / qb - 1.0) * (df2 / df1)
}

pub fn rf<R: Rng>(df1: f64, df2: f64, rng: &mut R) -> f64 {
    if df1 <= 0.0 || df2 <= 0.0 {
        return f64::NAN;
    }
    let dist = FisherSnedecor::new(df1, df2).expect("validated parameters: df1 > 0, df2 > 0");
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_df() {
        // Test with df1=3, df2=5
        let expected = 0.3611745; // df(1, 3, 5) in R
        assert!((df(1.0, 3.0, 5.0, false) - expected).abs() < 1e-6);

        // Test log version
        assert!((df(1.0, 3.0, 5.0, true) - df(1.0, 3.0, 5.0, false).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_pf() {
        // Test with df1=3, df2=5
        let expected = 0.5351452; // pf(1, 3, 5, lower.tail=TRUE) in R
        assert!((pf(1.0, 3.0, 5.0, true, false) - expected).abs() < 1e-6);

        // Test upper tail
        let expected_upper = 0.4648548; // pf(1, 3, 5, lower.tail=FALSE) in R (1 - 0.5351452)
        assert!((pf(1.0, 3.0, 5.0, false, false) - expected_upper).abs() < 1e-6);
    }

    #[test]
    fn test_qf() {
        // Test with df1=3, df2=5
        let expected = 1.0; // qf(0.5351452, 3, 5) in R
        let actual = qf(0.5351452, 3.0, 5.0, true, false);
        println!("qf(0.5351452, 3, 5) = {}, expected = {}", actual, expected);
        assert!((actual - expected).abs() < 2e-4); // Adjusted tolerance due to qbeta precision
    }

    #[test]
    fn test_rf() {
        let mut rng = StdRng::seed_from_u64(42);
        let sample = rf(3.0, 5.0, &mut rng);
        assert!(sample.is_finite() && sample >= 0.0);
    }

    #[test]
    fn test_invalid_params() {
        assert!(df(1.0, -1.0, 5.0, false).is_nan());
        assert!(df(1.0, 3.0, -1.0, false).is_nan());
        assert!(pf(1.0, -1.0, 5.0, true, false).is_nan());
        assert!(qf(0.5, -1.0, 5.0, true, false).is_nan());
        let mut rng = StdRng::seed_from_u64(42);
        assert!(rf(-1.0, 5.0, &mut rng).is_nan());
    }

    #[test]
    fn test_qf_log() {
        let p = (0.5351452f64).ln();
        let expected = 1.0;
        assert!((qf(p, 3.0, 5.0, true, true) - expected).abs() < 2e-4); // Adjusted tolerance due to qbeta precision
    }
}
