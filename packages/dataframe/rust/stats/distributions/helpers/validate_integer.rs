/// Validates that x is an integer value (or close enough with floating point tolerance)
/// Returns None if x is not an integer, Some(x_int) if it is
#[inline]
pub fn validate_integer(x: f64) -> Option<u64> {
    if !x.is_finite() || x < 0.0 {
        return None;
    }
    let x_rounded = x.round();
    // Check if x is approximately an integer (within floating point tolerance)
    if (x - x_rounded).abs() > 1e-10 {
        return None;
    }
    Some(x_rounded as u64)
}