/// Continued fraction expansion for incomplete beta function
///
/// This implements a simplified version of the continued fraction method
/// used in numerical computation of the incomplete beta function.
use super::log_gamma::log_gamma;

pub fn incomplete_beta_continued_fraction(x: f64, a: f64, b: f64) -> f64 {
    const MAX_ITER: usize = 200;
    const EPSILON: f64 = 1e-15;

    // Use symmetry relation if needed: I_x(a,b) = 1 - I_{1-x}(b,a)
    if x > (a + 1.0) / (a + b + 2.0) {
        return 1.0 - incomplete_beta_continued_fraction(1.0 - x, b, a);
    }

    // Compute the logarithm of the beta function normalization factor
    let log_beta_ab = log_gamma(a) + log_gamma(b) - log_gamma(a + b);
    let log_front = a * x.ln() + b * (1.0 - x).ln() - log_beta_ab;

    if log_front < -700.0 {
        return 0.0; // Underflow protection
    }

    let front = log_front.exp();

    // Continued fraction for I_x(a,b)/B(a,b) * x^a * (1-x)^b
    let mut c = 1.0;
    let mut d = 1.0 - (a + b) * x / (a + 1.0);

    if d.abs() < 1e-30 {
        d = 1e-30;
    }
    d = 1.0 / d;
    let mut h = d;

    for m in 1..=MAX_ITER {
        let m_f = m as f64;

        // Even iteration
        let aa = m_f * (b - m_f) * x / ((a + 2.0 * m_f - 1.0) * (a + 2.0 * m_f));
        d = 1.0 + aa * d;
        if d.abs() < 1e-30 {
            d = 1e-30;
        }
        c = 1.0 + aa / c;
        if c.abs() < 1e-30 {
            c = 1e-30;
        }
        d = 1.0 / d;
        h *= d * c;

        // Odd iteration
        let aa = -(a + m_f) * (a + b + m_f) * x / ((a + 2.0 * m_f) * (a + 2.0 * m_f + 1.0));
        d = 1.0 + aa * d;
        if d.abs() < 1e-30 {
            d = 1e-30;
        }
        c = 1.0 + aa / c;
        if c.abs() < 1e-30 {
            c = 1e-30;
        }
        d = 1.0 / d;
        let del = d * c;
        h *= del;

        if (del - 1.0).abs() <= EPSILON {
            break;
        }
    }

    front * h / a
}
