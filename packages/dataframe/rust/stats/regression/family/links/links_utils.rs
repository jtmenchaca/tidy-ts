//! Link function utility functions and constants

/// Machine epsilon for numerical stability
pub const INVEPS: f64 = 1.0 / f64::EPSILON;

/// Threshold for numerical stability
pub const MTHRESH: f64 = 30.0;

/// Threshold for numerical stability
pub const THRESH: f64 = 1e-7;

/// Helper function: x / (1 - x)
pub fn x_d_omx(x: f64) -> f64 {
    if x >= 1.0 {
        f64::INFINITY
    } else {
        x / (1.0 - x)
    }
}

/// Helper function: x / (1 + x)
pub fn x_d_opx(x: f64) -> f64 {
    x / (1.0 + x)
}
