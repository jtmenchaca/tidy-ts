/// Beta function B(a, b) = Γ(a)Γ(b)/Γ(a+b)
///
/// Computes the beta function using the log-gamma function to avoid overflow.
/// This is used in the incomplete beta function for pbinom.
use super::log_gamma::log_gamma;

pub fn beta(a: f64, b: f64) -> f64 {
    if a <= 0.0 || b <= 0.0 {
        return f64::NAN;
    }

    // Use logarithm to avoid overflow: B(a,b) = exp(log(Γ(a)) + log(Γ(b)) - log(Γ(a+b)))
    (log_gamma(a) + log_gamma(b) - log_gamma(a + b)).exp()
}
