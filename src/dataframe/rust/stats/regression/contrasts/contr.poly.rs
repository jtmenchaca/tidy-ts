//! Orthogonal polynomial contrasts for factors
//!
//! This module provides functionality equivalent to R's `contr.poly()` function,
//! which creates orthogonal polynomial contrasts for ordered factors.
//!
//! Polynomial contrasts are used when you want to test for linear, quadratic,
//! cubic, etc. trends in ordered categorical data.

use crate::stats::model::contrasts::ContrastMatrix;

/// Creates orthogonal polynomial contrasts
///
/// # Arguments
///
/// * `n` - Number of levels or vector of level names
/// * `scores` - Scores for the levels (default: 1:n)
/// * `contrasts` - Whether to return contrasts (true) or full matrix (false)
/// * `sparse` - Whether to return sparse matrix (not implemented yet)
///
/// # Returns
///
/// A `ContrastMatrix` with orthogonal polynomial contrasts
pub fn contr_poly(
    n: usize,
    scores: Option<Vec<f64>>,
    contrasts: bool,
    _sparse: bool,
) -> Result<ContrastMatrix, &'static str> {
    if n < 2 {
        return Err("contrasts not defined for less than 2 levels");
    }

    if n > 95 {
        return Err(
            "orthogonal polynomials cannot be represented accurately enough for more than 95 levels",
        );
    }

    let scores = scores.unwrap_or_else(|| (1..=n).map(|i| i as f64).collect());

    if scores.len() != n {
        return Err("scores argument has wrong length");
    }

    if !scores.iter().all(|&x| x.is_finite()) {
        return Err("scores must all be finite numbers");
    }

    // Check for duplicates
    let mut sorted_scores = scores.clone();
    sorted_scores.sort_by(|a, b| a.partial_cmp(b).unwrap());
    for i in 1..sorted_scores.len() {
        if (sorted_scores[i] - sorted_scores[i - 1]).abs() < 1e-10 {
            return Err("scores must all be different numbers");
        }
    }

    let poly_matrix = make_poly(n, &scores)?;

    let level_names: Vec<String> = (1..=n).map(|i| i.to_string()).collect();
    let column_names = if contrasts {
        // Use standard names: .L, .Q, .C for linear, quadratic, cubic
        let mut names = Vec::new();
        for i in 1..n {
            let name = match i {
                1 => ".L".to_string(),
                2 => ".Q".to_string(),
                3 => ".C".to_string(),
                _ => format!("^{}", i),
            };
            names.push(name);
        }
        names
    } else {
        // Include intercept term
        let mut names = vec!["^0".to_string()];
        for i in 1..n {
            names.push(format!("^{}", i));
        }
        names
    };

    let matrix = if contrasts {
        // Remove first column (intercept) for contrasts
        let mut result = Vec::new();
        for i in 1..n {
            for j in 0..n {
                result.push(poly_matrix[j * n + i]);
            }
        }
        result
    } else {
        // Set first column to 1 for full matrix
        let mut result = poly_matrix.clone();
        for j in 0..n {
            result[j * n] = 1.0;
        }
        result
    };

    Ok(ContrastMatrix {
        matrix,
        n_levels: n,
        n_contrasts: if contrasts { n - 1 } else { n },
        column_names,
        level_names,
    })
}

/// Creates orthogonal polynomial matrix using QR decomposition
fn make_poly(n: usize, scores: &[f64]) -> Result<Vec<f64>, &'static str> {
    // Center the scores
    let mean_score = scores.iter().sum::<f64>() / n as f64;
    let y: Vec<f64> = scores.iter().map(|&x| x - mean_score).collect();

    // Create Vandermonde matrix: outer(y, 0:(n-1), "^")
    let mut x = vec![0.0; n * n];
    for i in 0..n {
        for j in 0..n {
            x[i * n + j] = y[i].powi(j as i32);
        }
    }

    // QR decomposition
    let (q, r) = qr_decomposition(&x, n, n)?;

    // Extract diagonal of R
    let mut z = vec![0.0; n * n];
    for i in 0..n {
        for j in 0..n {
            if i == j {
                z[i * n + j] = r[i * n + j];
            }
        }
    }

    // Compute Q * z
    let raw = matrix_multiply(&q, &z, n, n, n)?;

    // Normalize columns
    let mut result = vec![0.0; n * n];
    for j in 0..n {
        let norm = (0..n)
            .map(|i| raw[i * n + j] * raw[i * n + j])
            .sum::<f64>()
            .sqrt();

        if norm > 1e-10 {
            for i in 0..n {
                result[i * n + j] = raw[i * n + j] / norm;
            }
        }
    }

    Ok(result)
}

/// Simple QR decomposition using Gram-Schmidt process
fn qr_decomposition(a: &[f64], m: usize, n: usize) -> Result<(Vec<f64>, Vec<f64>), &'static str> {
    let mut q = vec![0.0; m * n];
    let mut r = vec![0.0; n * n];

    for j in 0..n {
        // Copy j-th column of A to Q
        for i in 0..m {
            q[i * n + j] = a[i * n + j];
        }

        // Orthogonalize against previous columns
        for k in 0..j {
            let dot_product = (0..m).map(|i| q[i * n + j] * q[i * n + k]).sum::<f64>();

            r[k * n + j] = dot_product;

            for i in 0..m {
                q[i * n + j] -= r[k * n + j] * q[i * n + k];
            }
        }

        // Normalize
        let norm = (0..m)
            .map(|i| q[i * n + j] * q[i * n + j])
            .sum::<f64>()
            .sqrt();

        if norm > 1e-10 {
            r[j * n + j] = norm;
            for i in 0..m {
                q[i * n + j] /= norm;
            }
        } else {
            return Err("matrix is rank deficient");
        }
    }

    Ok((q, r))
}

/// Matrix multiplication: C = A * B
fn matrix_multiply(
    a: &[f64],
    b: &[f64],
    m: usize,
    n: usize,
    p: usize,
) -> Result<Vec<f64>, &'static str> {
    let mut c = vec![0.0; m * p];

    for i in 0..m {
        for j in 0..p {
            for k in 0..n {
                c[i * p + j] += a[i * n + k] * b[k * p + j];
            }
        }
    }

    Ok(c)
}

/// Creates polynomial terms for a variable
///
/// This is equivalent to R's `poly()` function for creating polynomial terms.
pub fn poly(
    x: &[f64],
    degree: usize,
    coefs: Option<PolyCoefs>,
    raw: bool,
    simple: bool,
) -> Result<PolyResult, &'static str> {
    if degree < 1 {
        return Err("degree must be at least 1");
    }

    if x.iter().any(|&val| val.is_nan()) {
        return Err("missing values are not allowed in poly");
    }

    let unique_count = {
        let mut sorted_x = x.to_vec();
        sorted_x.sort_by(|a, b| a.partial_cmp(b).unwrap());
        sorted_x.dedup_by(|a, b| (a - b).abs() < 1e-10);
        sorted_x.len()
    };

    if degree >= unique_count {
        return Err("degree must be less than number of unique points");
    }

    if raw {
        // Raw polynomial terms
        let mut z = vec![0.0; x.len() * degree];
        for i in 0..x.len() {
            for j in 0..degree {
                z[i * degree + j] = x[i].powi((j + 1) as i32);
            }
        }

        let column_names: Vec<String> = (1..=degree).map(|i| i.to_string()).collect();

        Ok(PolyResult {
            matrix: z,
            n_rows: x.len(),
            n_cols: degree,
            column_names,
            degree: (1..=degree).collect(),
            coefs: None,
        })
    } else {
        // Orthogonal polynomial terms
        let (z, alpha, norm2) = if let Some(coefs) = coefs {
            // Prediction mode
            predict_poly(x, degree, &coefs)?
        } else {
            // Fitting mode
            fit_poly(x, degree)?
        };

        let column_names: Vec<String> = (1..=degree).map(|i| i.to_string()).collect();

        Ok(PolyResult {
            matrix: z,
            n_rows: x.len(),
            n_cols: degree,
            column_names,
            degree: (1..=degree).collect(),
            coefs: if simple {
                None
            } else {
                Some(PolyCoefs { alpha, norm2 })
            },
        })
    }
}

/// Fits orthogonal polynomial terms
fn fit_poly(x: &[f64], degree: usize) -> Result<(Vec<f64>, Vec<f64>, Vec<f64>), &'static str> {
    let xbar = x.iter().sum::<f64>() / x.len() as f64;
    let x_centered: Vec<f64> = x.iter().map(|&val| val - xbar).collect();

    // Create Vandermonde matrix
    let mut x_matrix = vec![0.0; x.len() * (degree + 1)];
    for i in 0..x.len() {
        for j in 0..=degree {
            x_matrix[i * (degree + 1) + j] = x_centered[i].powi(j as i32);
        }
    }

    // QR decomposition
    let (q, r) = qr_decomposition(&x_matrix, x.len(), degree + 1)?;

    // Check rank
    let rank = (0..=degree)
        .filter(|&j| (r[j * (degree + 1) + j]).abs() > 1e-10)
        .count();

    if rank < degree {
        return Err("degree must be less than number of unique points");
    }

    // Extract diagonal of R
    let mut z = vec![0.0; (degree + 1) * (degree + 1)];
    for i in 0..=degree {
        for j in 0..=degree {
            if i == j {
                z[i * (degree + 1) + j] = r[i * (degree + 1) + j];
            }
        }
    }

    // Compute Q * z
    let raw = matrix_multiply(&q, &z, x.len(), degree + 1, degree + 1)?;

    // Normalize columns
    let mut norm2 = Vec::new();
    let mut z_final = vec![0.0; x.len() * degree];

    for j in 1..=degree {
        let norm = (0..x.len())
            .map(|i| raw[i * (degree + 1) + j] * raw[i * (degree + 1) + j])
            .sum::<f64>()
            .sqrt();

        norm2.push(norm);

        for i in 0..x.len() {
            z_final[i * degree + (j - 1)] = raw[i * (degree + 1) + j] / norm;
        }
    }

    // Compute alpha coefficients
    let mut alpha = Vec::new();
    for j in 0..degree {
        let alpha_j = (0..x.len())
            .map(|i| x_centered[i] * z_final[i * degree + j] * z_final[i * degree + j])
            .sum::<f64>()
            / norm2[j]
            + xbar;
        alpha.push(alpha_j);
    }

    Ok((z_final, alpha, norm2))
}

/// Predicts polynomial terms using existing coefficients
fn predict_poly(
    x: &[f64],
    degree: usize,
    coefs: &PolyCoefs,
) -> Result<(Vec<f64>, Vec<f64>, Vec<f64>), &'static str> {
    let alpha = &coefs.alpha;
    let norm2 = &coefs.norm2;

    if alpha.len() != degree || norm2.len() != degree {
        return Err("coefficients length mismatch");
    }

    let mut z = vec![0.0; x.len() * degree];

    // First column: x - alpha[0]
    for i in 0..x.len() {
        z[i * degree] = x[i] - alpha[0];
    }

    // Subsequent columns using recurrence relation
    for j in 1..degree {
        for i in 0..x.len() {
            let prev_term = if j == 1 { 1.0 } else { z[i * degree + (j - 2)] };
            z[i * degree + j] =
                (x[i] - alpha[j]) * z[i * degree + (j - 1)] - (norm2[j] / norm2[j - 1]) * prev_term;
        }
    }

    // Normalize
    for j in 0..degree {
        for i in 0..x.len() {
            z[i * degree + j] /= norm2[j].sqrt();
        }
    }

    Ok((z, alpha.clone(), norm2.clone()))
}

/// Polynomial coefficients for prediction
#[derive(Debug, Clone)]
pub struct PolyCoefs {
    pub alpha: Vec<f64>,
    pub norm2: Vec<f64>,
}

/// Result of polynomial term creation
#[derive(Debug, Clone)]
pub struct PolyResult {
    pub matrix: Vec<f64>,
    pub n_rows: usize,
    pub n_cols: usize,
    pub column_names: Vec<String>,
    pub degree: Vec<usize>,
    pub coefs: Option<PolyCoefs>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_contr_poly_basic() {
        let result = contr_poly(3, None, true, false).unwrap();

        assert_eq!(result.n_levels, 3);
        assert_eq!(result.n_contrasts, 2);
        assert_eq!(result.column_names, vec![".L", ".Q"]);
    }

    #[test]
    fn test_contr_poly_with_scores() {
        let scores = vec![1.0, 2.0, 3.0, 4.0];
        let result = contr_poly(4, Some(scores), true, false).unwrap();

        assert_eq!(result.n_levels, 4);
        assert_eq!(result.n_contrasts, 3);
        assert_eq!(result.column_names, vec![".L", ".Q", ".C"]);
    }

    #[test]
    fn test_contr_poly_full_matrix() {
        let result = contr_poly(3, None, false, false).unwrap();

        assert_eq!(result.n_levels, 3);
        assert_eq!(result.n_contrasts, 3); // Includes intercept
        assert_eq!(result.column_names, vec!["^0", "^1", "^2"]);
    }

    #[test]
    fn test_contr_poly_error_cases() {
        // Too few levels
        assert!(contr_poly(1, None, true, false).is_err());

        // Too many levels
        assert!(contr_poly(100, None, true, false).is_err());

        // Wrong scores length
        assert!(contr_poly(3, Some(vec![1.0, 2.0]), true, false).is_err());

        // Duplicate scores
        assert!(contr_poly(3, Some(vec![1.0, 1.0, 2.0]), true, false).is_err());
    }

    #[test]
    fn test_poly_basic() {
        let x = vec![1.0, 2.0, 3.0, 4.0];
        let result = poly(&x, 2, None, false, false).unwrap();

        assert_eq!(result.n_rows, 4);
        assert_eq!(result.n_cols, 2);
        assert_eq!(result.degree, vec![1, 2]);
    }

    #[test]
    fn test_poly_raw() {
        let x = vec![1.0, 2.0, 3.0];
        let result = poly(&x, 2, None, true, false).unwrap();

        assert_eq!(result.n_rows, 3);
        assert_eq!(result.n_cols, 2);
        assert_eq!(result.column_names, vec!["1", "2"]);
    }

    #[test]
    fn test_poly_error_cases() {
        let x = vec![1.0, 2.0, 3.0];

        // Degree too high
        assert!(poly(&x, 3, None, false, false).is_err());

        // Invalid degree
        assert!(poly(&x, 0, None, false, false).is_err());

        // Missing values
        let x_na = vec![1.0, f64::NAN, 3.0];
        assert!(poly(&x_na, 2, None, false, false).is_err());
    }
}
