/// Shared binomial variance calculation with epsilon clamping
/// 
/// Calculates mu * (1 - mu) with numerical stability protection.
/// This matches R's approach for handling boundary values.
#[inline]
pub fn binomial_variance_safe(mu: f64) -> f64 {
    // Apply epsilon clamping to prevent exactly 0 variance at boundaries
    // This matches R's approach for numerical stability
    let eps = 10.0 * 2.220446e-16; // R uses: eps <- 10*.Machine$double.eps
    let mu_clamped = mu.max(eps).min(1.0 - eps);
    mu_clamped * (1.0 - mu_clamped)
}