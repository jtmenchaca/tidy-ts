/// Incomplete beta function I_x(a, b)
///
/// This is a simplified implementation of the regularized incomplete beta function
/// used by pbinom. For high precision, R uses TOMS 708, but this implementation
/// provides reasonable accuracy for most practical purposes.
///
/// The relationship is: pbinom(k, n, p) = 1 - I_p(k+1, n-k)
/// where I_x(a, b) is the regularized incomplete beta function.
use super::incomplete_beta_continued_fraction::incomplete_beta_continued_fraction;

pub fn incomplete_beta(x: f64, a: f64, b: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }
    if x >= 1.0 {
        return 1.0;
    }
    if a <= 0.0 || b <= 0.0 {
        return f64::NAN;
    }

    // For very small or large parameters, use limiting cases
    if a < 1e-10 {
        return 1.0;
    }
    if b < 1e-10 {
        return 0.0;
    }

    // Use continued fraction expansion for the incomplete beta function
    // This is a simplified version of what R uses internally
    incomplete_beta_continued_fraction(x, a, b)
}
