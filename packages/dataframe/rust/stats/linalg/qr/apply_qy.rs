//! Apply Q from Householder QR to a vector (R's `dqrsl`)

/// Apply Q from Householder QR to a vector y.
///
/// Computes Q * y where Q is stored in Householder form.
/// Following R's dqrsl with job code 10000 for computing Q*y.
///
/// The key difference from Q^T*y:
/// - Q^T*y: Apply transforms in FORWARD order (0..ju)
/// - Q*y:   Apply transforms in REVERSE order (ju-1..0)
pub fn apply_qy(qr: &[f64], qraux: &[f64], y: &[f64], n: usize, k: usize) -> Vec<f64> {
    let mut result = y.to_vec();

    let ju = k.min(n.saturating_sub(1));

    for jj in (0..ju).rev() {
        if qraux[jj] != 0.0 {
            let mut t = 0.0;

            t += qraux[jj] * result[jj];

            for i in (jj + 1)..n {
                let idx = i + jj * n;
                if idx < qr.len() {
                    t += qr[idx] * result[i];
                }
            }

            t = -t / qraux[jj];

            result[jj] += t * qraux[jj];

            for i in (jj + 1)..n {
                let idx = i + jj * n;
                if idx < qr.len() {
                    result[i] += t * qr[idx];
                }
            }
        }
    }

    result
}
