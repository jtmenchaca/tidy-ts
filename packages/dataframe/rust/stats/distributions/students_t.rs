//! Student's t-distribution functions
//!
//! This module provides Student's t-distribution functions used by t-tests and other statistical tests.
//! It wraps the statrs StudentsT distribution to provide a consistent interface.

use super::super::core::{TailType, calculate_ci, calculate_p};
use super::normal::TestResultData;
use rand::Rng;
use statrs::distribution::{Continuous, ContinuousCDF, StudentsT};

/// Creates a Student's t-distribution with specified parameters
///
/// # Arguments
/// * `location` - The location parameter (usually 0.0)
/// * `scale` - The scale parameter (usually 1.0)
/// * `freedom` - The degrees of freedom (must be positive)
///
/// # Returns
/// A StudentsT distribution
pub fn students_t(location: f64, scale: f64, freedom: f64) -> StudentsT {
    StudentsT::new(location, scale, freedom).unwrap()
}

/// Creates a standard Student's t-distribution (location=0, scale=1)
///
/// # Arguments
/// * `freedom` - The degrees of freedom (must be positive)
///
/// # Returns
/// A StudentsT distribution
pub fn standard_students_t(freedom: f64) -> StudentsT {
    students_t(0.0, 1.0, freedom)
}

/// Performs a t-test using the Student's t-distribution
///
/// This is a convenience function that combines the t-distribution creation
/// with the test calculation, used by t-tests.
///
/// # Arguments
/// * `test_statistic` - The t-test statistic
/// * `df` - The degrees of freedom
/// * `tail` - The type of tail (left, right, or two)
/// * `sample_mean` - The sample mean for confidence interval calculation
/// * `std_error` - The standard error for confidence interval calculation
/// * `alpha` - The significance level
///
/// # Returns
/// A TestResult with p-value and confidence interval
pub fn t_test_result(
    test_statistic: f64,
    df: f64,
    tail: TailType,
    sample_mean: f64,
    std_error: f64,
    alpha: f64,
) -> TestResultData {
    let t_dist = standard_students_t(df);

    let p_value = calculate_p(test_statistic, tail.clone(), &t_dist);
    let confidence_interval = calculate_ci(sample_mean, std_error, alpha, &t_dist, tail);

    TestResultData {
        p_value,
        confidence_interval,
    }
}

/// Calculates the inverse CDF (quantile function) for the Student's t-distribution
///
/// # Arguments
/// * `p` - Probability (must be between 0 and 1)
/// * `df` - Degrees of freedom (must be positive)
///
/// # Returns
/// The quantile value
pub fn students_t_inverse_cdf(p: f64, df: f64) -> f64 {
    if p < 0.0 || p > 1.0 {
        return f64::NAN;
    }

    if df <= 0.0 {
        return f64::NAN;
    }

    let t_dist = standard_students_t(df);
    t_dist.inverse_cdf(p)
}

/// Calculates the required sample size for a t-test
///
/// This function computes the necessary sample size to detect a minimum detectable effect size
/// for a given alpha, power, and standard deviation using the t-distribution.
///
/// # Arguments
/// * `effect_size` - The minimum detectable effect size
/// * `alpha` - The significance level (e.g., 0.05 for a 95% confidence interval)
/// * `power` - The desired statistical power (e.g., 0.80 for 80% power)
/// * `std_dev` - The population standard deviation (or a reasonable estimate)
/// * `tail` - The type of tail (left, right, or two) for the test
///
/// # Returns
/// The estimated sample size required to achieve the specified power and significance level
pub fn t_sample_size(
    effect_size: f64,
    alpha: f64,
    power: f64,
    std_dev: f64,
    tail: TailType,
) -> f64 {
    // Use a large df approximation for initial calculation
    let df = 1e6;
    let t_dist = standard_students_t(df);

    let alpha_value = match tail {
        TailType::Two => alpha / 2.0, // Two-tailed
        _ => alpha,                   // One-tailed (left or right)
    };

    let t_alpha = t_dist.inverse_cdf(1.0 - alpha_value);
    let t_beta = t_dist.inverse_cdf(power);

    // Formula: n = ((t_alpha + t_beta) * std_dev / effect_size)^2
    let n = ((t_alpha + t_beta) * std_dev / effect_size).powi(2);
    n.ceil() // Rounds up to the next whole sample size
}

/// Student's t probability density function — ported from R's dt.c (Catherine Loader)
///
/// Uses bd0/stirlerr for numerical stability at all values of x,
/// including extreme x where naive computation overflows.
pub fn dt(x: f64, df: f64, give_log: bool) -> f64 {
    use super::helpers::bd0::bd0;
    use super::helpers::stirlerr::stirlerr;

    if x.is_nan() || df.is_nan() {
        return x + df;
    }
    if df <= 0.0 {
        return f64::NAN;
    }
    if !x.is_finite() {
        return if give_log { f64::NEG_INFINITY } else { 0.0 };
    }
    if !df.is_finite() {
        // df = Inf => normal density
        let norm = statrs::distribution::Normal::new(0.0, 1.0).unwrap();
        return if give_log {
            <statrs::distribution::Normal as Continuous<f64, f64>>::ln_pdf(&norm, x)
        } else {
            <statrs::distribution::Normal as Continuous<f64, f64>>::pdf(&norm, x)
        };
    }

    let n = df;
    let t = -bd0(n / 2.0, (n + 1.0) / 2.0) + stirlerr((n + 1.0) / 2.0) - stirlerr(n / 2.0);
    let x2n = x * x / n; // in [0, Inf]
    let lrg_x2n = x2n > 1.0 / f64::EPSILON;

    let (l_x2n, u) = if lrg_x2n {
        let ax = x.abs();
        let l = ax.ln() - n.ln() / 2.0; // log(x2n)/2
        (l, n * l)
    } else if x2n > 0.2 {
        let l = (1.0 + x2n).ln() / 2.0;
        (l, n * l)
    } else {
        let l = x2n.ln_1p() / 2.0;
        let u = -bd0(n / 2.0, (n + x * x) / 2.0) + x * x / 2.0;
        (l, u)
    };

    const M_LN_SQRT_2PI: f64 = 0.918938533204672741780329736406;
    const M_1_SQRT_2PI: f64 = 0.398942280401432677939946059934;

    if give_log {
        t - u - (M_LN_SQRT_2PI + l_x2n)
    } else {
        let i_sqrt = if lrg_x2n {
            n.sqrt() / x.abs()
        } else {
            (-l_x2n).exp()
        };
        (t - u).exp() * M_1_SQRT_2PI * i_sqrt
    }
}

/// Student's t cumulative distribution function — ported from R's pt.c
///
/// Uses pbeta transformation: pt(x, n) = pbeta(x²/(n+x²), 0.5, n/2)
/// with log-scale asymptotic for extreme tails (x²/n > 1e100).
pub fn pt(x: f64, n: f64, lower_tail: bool, log_p: bool) -> f64 {
    if x.is_nan() || n.is_nan() {
        return x + n;
    }
    if n <= 0.0 {
        return f64::NAN;
    }
    if !x.is_finite() {
        let p: f64 = if x < 0.0 {
            if lower_tail { 0.0 } else { 1.0 }
        } else {
            if lower_tail { 1.0 } else { 0.0 }
        };
        return if log_p { p.ln() } else { p };
    }
    if !n.is_finite() {
        // df = Inf => normal
        use statrs::distribution::{Normal, ContinuousCDF as ContCDF};
        let norm = Normal::new(0.0, 1.0).unwrap();
        let cdf = norm.cdf(x);
        let p = if lower_tail { cdf } else { 1.0 - cdf };
        return if log_p { p.ln() } else { p };
    }

    let nx = 1.0 + (x / n) * x;
    let val;

    if nx > 1e100 {
        // Extreme tail: use Abramowitz & Stegun 26.5.4 asymptotic on log scale
        // pbeta(z, a, b) ~ z^a / (a * B(a,b)) where z = 1/nx, a = n/2, b = 0.5
        let lval = -0.5 * n * (2.0 * x.abs().ln() - n.ln())
            - statrs::function::beta::ln_beta(0.5 * n, 0.5) - (0.5 * n).ln();
        val = if log_p { lval } else { lval.exp() };
    } else {
        // Use pbeta identity: pt relates to incomplete beta
        val = if n > x * x {
            super::beta::pbeta(x * x / (n + x * x), 0.5, n / 2.0, false, log_p)
        } else {
            super::beta::pbeta(1.0 / nx, n / 2.0, 0.5, true, log_p)
        };
    }

    // Use "1 - v" if lower_tail and x > 0 (but not both)
    let lower_tail = if x <= 0.0 { !lower_tail } else { lower_tail };

    if log_p {
        if lower_tail {
            (-0.5 * val.exp()).ln_1p() // log1p(-0.5*exp(val))
        } else {
            val - std::f64::consts::LN_2 // log(0.5 * pbeta(...))
        }
    } else {
        let half_val = val / 2.0;
        // R_D_Cval(val): lower_tail ? (1-val) : val
        if lower_tail { 1.0 - half_val } else { half_val }
    }
}

/// Student's t quantile function — ported from R's qt.c (Hill's Algorithm 396)
///
/// Handles all df ranges including df < 1 (bisection), df ≈ 1 (Cauchy),
/// df ≈ 2, and general case with Newton-Taylor refinement.
pub fn qt(p: f64, ndf: f64, lower_tail: bool, log_p: bool) -> f64 {
    use statrs::distribution::{Normal, ContinuousCDF as ContCDF};

    const EPS: f64 = 1e-12;

    if p.is_nan() || ndf.is_nan() {
        return p + ndf;
    }
    // R_Q_P01_boundaries(p, -Inf, +Inf)
    if log_p {
        if p > 0.0 { return f64::NAN; }
        if p == 0.0 { return if lower_tail { f64::INFINITY } else { f64::NEG_INFINITY }; }
        if p == f64::NEG_INFINITY { return if lower_tail { f64::NEG_INFINITY } else { f64::INFINITY }; }
    } else {
        if p < 0.0 || p > 1.0 { return f64::NAN; }
        if p == 0.0 { return if lower_tail { f64::NEG_INFINITY } else { f64::INFINITY }; }
        if p == 1.0 { return if lower_tail { f64::INFINITY } else { f64::NEG_INFINITY }; }
    }
    if ndf <= 0.0 { return f64::NAN; }

    if ndf < 1.0 {
        // Bisection-based inversion of pt()
        let accu = 1e-13;
        let eps_adj = 1e-11;
        let p_val = if log_p { p.exp() } else { p };
        let p_val = if !lower_tail { 1.0 - p_val } else { p_val };
        if p_val > 1.0 - f64::EPSILON { return f64::INFINITY; }
        let pp_hi = (1.0 - f64::EPSILON).min(p_val * (1.0 + eps_adj));
        let mut ux = 1.0;
        while ux < f64::MAX && pt(ux, ndf, true, false) < pp_hi { ux *= 2.0; }
        let pp_lo = p_val * (1.0 - eps_adj);
        let mut lx = -1.0;
        while lx > f64::MIN && pt(lx, ndf, true, false) > pp_lo { lx *= 2.0; }
        let mut iter = 0;
        loop {
            let nx = 0.5 * (lx + ux);
            if pt(nx, ndf, true, false) > p_val { ux = nx; } else { lx = nx; }
            iter += 1;
            if (ux - lx) / nx.abs() <= accu || iter >= 1000 { break; }
        }
        return 0.5 * (lx + ux);
    }

    if ndf > 1e20 {
        let norm = Normal::new(0.0, 1.0).unwrap();
        let p_val = if log_p { p.exp() } else { p };
        let p_val = if !lower_tail { 1.0 - p_val } else { p_val };
        return norm.inverse_cdf(p_val);
    }

    // R_D_qIv(p): get p on probability scale
    let big_p = if log_p { p.exp() } else { p };

    let neg = (!lower_tail || big_p < 0.5) && (lower_tail || big_p > 0.5);
    let is_neg_lower = lower_tail == neg;

    // P = 2 * min(p', 1-p')
    let big_p2 = if neg {
        2.0 * (if log_p {
            if lower_tail { big_p } else { -p.exp_m1() }
        } else {
            if lower_tail { big_p } else { 0.5 - big_p + 0.5 }
        })
    } else {
        2.0 * (if log_p {
            if lower_tail { -p.exp_m1() } else { big_p }
        } else {
            if lower_tail { 0.5 - big_p + 0.5 } else { big_p }
        })
    };

    let mut q;

    if (ndf - 2.0).abs() < EPS {
        // df ≈ 2
        if big_p2 > f64::MIN_POSITIVE {
            if 3.0 * big_p2 < f64::EPSILON {
                q = 1.0 / big_p2.sqrt();
            } else if big_p2 > 0.9 {
                q = (1.0 - big_p2) * (2.0 / (big_p2 * (2.0 - big_p2))).sqrt();
            } else {
                q = (2.0 / (big_p2 * (2.0 - big_p2)) - 2.0).sqrt();
            }
        } else {
            if log_p {
                q = if is_neg_lower { (-p / 2.0).exp() / std::f64::consts::SQRT_2 } else { 1.0 / (-p.exp_m1()).sqrt() };
            } else {
                q = f64::INFINITY;
            }
        }
    } else if (ndf - 1.0).abs() < 1.0 + EPS && ndf >= 1.0 {
        // df ≈ 1 (Cauchy)
        if big_p2 == 1.0 {
            q = 0.0;
        } else if big_p2 > 0.0 {
            // 1/tan(pi*P/2)
            q = 1.0 / (std::f64::consts::PI * big_p2 / 2.0).tan();
        } else {
            if log_p {
                q = if is_neg_lower {
                    std::f64::consts::FRAC_1_PI * (-p).exp()
                } else {
                    -1.0 / (std::f64::consts::PI * p.exp_m1())
                };
            } else {
                q = f64::INFINITY;
            }
        }
    } else {
        // General case
        let a = 1.0 / (ndf - 0.5);
        let b = 48.0 / (a * a);
        let mut c = ((20700.0 * a / b - 98.0) * a - 16.0) * a + 96.36;
        let d = ((94.5 / (b + c) - 3.0) / b + 1.0) * (a * std::f64::consts::FRAC_PI_2).sqrt() * ndf;

        let p_ok1 = big_p2 > f64::MIN_POSITIVE || !log_p;
        let mut y;
        let mut p_ok = p_ok1;

        if p_ok1 {
            y = (d * big_p2).powf(2.0 / ndf);
            p_ok = y >= f64::EPSILON;
        } else {
            y = 0.0; // will be set below
        }

        let mut x;
        if !p_ok {
            let log_p2 = if is_neg_lower {
                if log_p { p } else { p.ln() }
            } else {
                if log_p {
                    if p > -std::f64::consts::LN_2 { (-p.exp_m1()).ln() } else { (-p.exp()).ln_1p() }
                } else {
                    (-big_p).ln_1p()
                }
            };
            x = (d.ln() + std::f64::consts::LN_2 + log_p2) / ndf;
            y = (2.0 * x).exp();
        } else {
            x = 0.0;
        }

        if (ndf < 2.1 && big_p2 > 0.5) || y > 0.05 + a {
            // Asymptotic inverse expansion about normal
            let norm = Normal::new(0.0, 1.0).unwrap();
            if p_ok {
                x = norm.inverse_cdf(0.5 * big_p2);
            } else {
                // log scale: qnorm(log_P2, log=TRUE)
                // We need to handle this carefully
                let log_p2 = if is_neg_lower {
                    if log_p { p } else { p.ln() }
                } else {
                    if log_p {
                        if p > -std::f64::consts::LN_2 { (-p.exp_m1()).ln() } else { (-p.exp()).ln_1p() }
                    } else {
                        (-big_p).ln_1p()
                    }
                };
                // qnorm(exp(log_p2))
                let p2_val = log_p2.exp();
                x = if p2_val <= 0.0 { f64::NEG_INFINITY } else if p2_val >= 1.0 { f64::INFINITY } else { norm.inverse_cdf(p2_val) };
            }

            y = x * x;
            if ndf < 5.0 {
                c += 0.3 * (ndf - 4.5) * (x + 0.6);
            }
            c = (((0.05 * d * x - 5.0) * x - 7.0) * x - 2.0) * x + b + c;
            y = (((((0.4 * y + 6.3) * y + 36.0) * y + 94.5) / c - y - 3.0) / b + 1.0) * x;
            y = (a * y * y).exp_m1();
            q = (ndf * y).sqrt();
        } else if !p_ok && x < -std::f64::consts::LN_2 * (f64::MANTISSA_DIGITS as f64) {
            q = ndf.sqrt() * (-x).exp();
        } else {
            y = ((1.0 / (((ndf + 6.0) / (ndf * y) - 0.089 * d - 0.822)
                * (ndf + 2.0) * 3.0)
                + 0.5 / (ndf + 4.0))
                * y
                - 1.0)
                * (ndf + 1.0)
                / (ndf + 2.0)
                + 1.0 / y;
            q = (ndf * y).sqrt();
        }

        // Newton-Taylor 2-term refinement (Hill 1981)
        // Only refine when p_ok: extreme tails (p_ok=false) have good initial
        // approximations but pt/pbeta can't compute corrections accurately enough
        if p_ok1 && p_ok {
            let m = (f64::MAX / 2.0).sqrt() - ndf;
            let mut it = 0;
            while it < 10 {
                let y_dt = dt(q, ndf, false);
                if y_dt <= 0.0 { break; }
                let x_corr = (pt(q, ndf, false, false) - big_p2 / 2.0) / y_dt;
                if !x_corr.is_finite() || x_corr.abs() <= 1e-14 * q.abs() { break; }
                let f_val = if q.abs() < m {
                    q * (ndf + 1.0) / (2.0 * (q * q + ndf))
                } else {
                    (ndf + 1.0) / (2.0 * (q + ndf / q))
                };
                let del_q = x_corr * (1.0 + x_corr * f_val);
                if del_q.is_finite() && (q + del_q).is_finite() {
                    q += del_q;
                } else if x_corr.is_finite() && (q + x_corr).is_finite() {
                    q += x_corr;
                } else {
                    break;
                }
                it += 1;
            }
        }
    }

    if neg { -q } else { q }
}

/// Student's t random number generation
///
/// # Arguments
/// * `df` - Degrees of freedom
/// * `rng` - Random number generator
///
/// # Returns
/// A random sample from the t distribution
pub fn rt<R: Rng>(df: f64, rng: &mut R) -> f64 {
    if df <= 0.0 {
        return f64::NAN;
    }
    let dist = StudentsT::new(0.0, 1.0, df).unwrap();
    rng.sample(dist)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_standard_students_t_creation() {
        let dist = standard_students_t(10.0);
        assert_eq!(dist.location(), 0.0);
        assert_eq!(dist.scale(), 1.0);
        assert_eq!(dist.freedom(), 10.0);
    }

    #[test]
    fn test_students_t_creation() {
        let dist = students_t(5.0, 2.0, 15.0);
        assert_eq!(dist.location(), 5.0);
        assert_eq!(dist.scale(), 2.0);
        assert_eq!(dist.freedom(), 15.0);
    }

    #[test]
    fn test_students_t_inverse_cdf() {
        // Test some known values for large df (approaches normal)
        let p50 = students_t_inverse_cdf(0.5, 1000.0);
        assert!((p50 - 0.0).abs() < 1e-2); // Median should be close to 0

        let p975 = students_t_inverse_cdf(0.975, 1000.0);
        assert!((p975 - 1.96).abs() < 1e-2); // 97.5th percentile ≈ 1.96 for large df
    }

    #[test]
    fn test_t_test_result() {
        let result = t_test_result(2.0, 10.0, TailType::Two, 100.0, 1.0, 0.05);
        assert!(result.p_value < 0.1); // Should be significant
        assert!(result.p_value < 0.05); // reject_null logic: p_value < alpha
    }

    #[test]
    fn test_t_sample_size() {
        let sample_size = t_sample_size(0.5, 0.05, 0.80, 1.0, TailType::Two);
        assert!(sample_size > 0.0);
        assert!(sample_size.is_finite());
    }
}
