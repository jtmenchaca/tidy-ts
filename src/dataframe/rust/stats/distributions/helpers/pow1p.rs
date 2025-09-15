/// Compute (1+x)^y accurately also for |x| << 1
///
/// This is a helper function used in binomial calculations to avoid
/// numerical precision issues when computing powers of numbers close to 1.
#[inline]
pub fn pow1p(x: f64, y: f64) -> f64 {
    if y.is_nan() {
        return if x == 0.0 { 1.0 } else { y };
    }

    if 0.0 <= y && y == y.trunc() && y <= 4.0 {
        match y as i32 {
            0 => return 1.0,
            1 => return x + 1.0,
            2 => return x * (x + 2.0) + 1.0,
            3 => return x * (x * (x + 3.0) + 3.0) + 1.0,
            4 => return x * (x * (x * (x + 4.0) + 6.0) + 4.0) + 1.0,
            _ => {}
        }
    }

    // Use optimization barrier to prevent compiler from folding xp1 - 1.0 back to x
    let xp1 = core::hint::black_box(x + 1.0);
    let x_ = xp1 - 1.0;

    if x_ == x || x.abs() > 0.5 || x.is_nan() {
        xp1.powf(y)
    } else {
        // Use ln_1p for better accuracy when |x| is small
        (y * x.ln_1p()).exp()
    }
}
