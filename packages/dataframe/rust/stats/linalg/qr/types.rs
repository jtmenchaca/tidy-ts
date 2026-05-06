//! QR decomposition result type

/// QR decomposition result
#[derive(Debug, Clone)]
pub struct QrLsResult {
    /// Packed QR matrix
    pub qr: Vec<f64>,
    /// Auxiliary QR information
    pub qraux: Vec<f64>,
    /// Coefficients
    pub coefficients: Vec<f64>,
    /// Residuals
    pub residuals: Vec<f64>,
    /// Effects
    pub effects: Vec<f64>,
    /// Rank
    pub rank: usize,
    /// Pivot vector
    pub pivot: Vec<i32>,
    /// Tolerance
    pub tol: f64,
    /// Whether pivoting occurred
    pub pivoted: bool,
}
