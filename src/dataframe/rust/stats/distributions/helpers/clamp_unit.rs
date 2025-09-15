/// Clamps a probability value to the unit interval [0, 1]
#[inline]
pub fn clamp_unit(p: f64) -> f64 {
    p.clamp(0.0, 1.0)
}