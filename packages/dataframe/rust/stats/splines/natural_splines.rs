//! Natural spline basis — faithful port of R's `ns()` from `splines.R`
//!
//! Ported from `r-source-trunk/src/library/splines/R/splines.R` lines 108–194
//! (Copyright (C) 1995-2023 The R Core Team, GPL-2+)
//!
//! A natural cubic spline basis enforces linearity beyond boundary knots
//! by projecting a B-spline basis onto the null space of a second-derivative
//! constraint at the boundaries (via QR decomposition).

use super::spline_design::spline_design;

/// Result of `ns()` — natural spline basis matrix with metadata.
pub struct NaturalSplineBasis {
    /// The basis matrix: `basis[i][j]` is row i, column j
    pub basis: Vec<Vec<f64>>,
    /// Degree (always 3 for natural splines)
    pub degree: usize,
    /// Interior knots used
    pub knots: Vec<f64>,
    /// Boundary knots (2 values)
    pub boundary_knots: [f64; 2],
    /// Whether intercept column was included
    pub intercept: bool,
    /// Number of columns in the basis
    pub ncol: usize,
}

/// Compute quantiles of a slice (simple linear interpolation, matching R's type 7).
pub fn quantile(data: &[f64], probs: &[f64]) -> Vec<f64> {
    if data.is_empty() {
        return vec![f64::NAN; probs.len()];
    }
    let mut sorted = data.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let n = sorted.len();

    probs
        .iter()
        .map(|&p| {
            if n == 1 {
                return sorted[0];
            }
            // R's quantile type 7: h = (n-1)*p + 1, but 0-indexed: index = (n-1)*p
            let index = (n as f64 - 1.0) * p;
            let lo = index.floor() as usize;
            let hi = lo + 1;
            let frac = index - lo as f64;
            if hi >= n {
                sorted[n - 1]
            } else {
                sorted[lo] * (1.0 - frac) + sorted[hi] * frac
            }
        })
        .collect()
}

/// Compute natural spline basis matrix.
///
/// Faithful port of R's `ns()` function.
///
/// # Arguments
/// * `x` - Data values (NaN values are passed through)
/// * `df` - Degrees of freedom (if provided, knots are auto-placed). Mutually exclusive with `knots`.
/// * `knots` - Interior knot positions. If None, computed from `df`.
/// * `intercept` - Include intercept column (default false)
/// * `boundary_knots` - Boundary knots. If None, uses range of x.
pub fn ns(
    x: &[f64],
    df: Option<usize>,
    knots: Option<&[f64]>,
    intercept: bool,
    boundary_knots: Option<[f64; 2]>,
) -> Result<NaturalSplineBasis, String> {
    // Handle NaN values
    let nax: Vec<bool> = x.iter().map(|v| v.is_nan()).collect();
    let has_nas = nax.iter().any(|&v| v);
    let x_clean: Vec<f64> = if has_nas {
        x.iter().filter(|v| !v.is_nan()).copied().collect()
    } else {
        x.to_vec()
    };

    // Boundary knots
    let boundary_knots = match boundary_knots {
        Some(mut bk) => {
            if bk[0] > bk[1] {
                bk.swap(0, 1);
            }
            bk
        }
        None => {
            if x_clean.len() == 1 {
                // R special case: symmetrically around x
                [x_clean[0] * 7.0 / 8.0, x_clean[0] * 9.0 / 8.0]
            } else if x_clean.is_empty() {
                return Err("need at least one non-NA value".to_string());
            } else {
                let min = x_clean.iter().copied().fold(f64::INFINITY, f64::min);
                let max = x_clean.iter().copied().fold(f64::NEG_INFINITY, f64::max);
                [min, max]
            }
        }
    };

    // Determine outside values (when boundary_knots explicitly provided)
    let outside: Vec<bool> = x_clean
        .iter()
        .map(|&v| v < boundary_knots[0] || v > boundary_knots[1])
        .collect();

    // Determine interior knots
    let mut interior_knots: Vec<f64>;
    let mk_knots = df.is_some() && knots.is_none();

    if mk_knots {
        let df_val = df.unwrap();
        // df = number(interior knots) + 1 + intercept
        let n_iknots = if df_val >= 1 + intercept as usize {
            df_val - 1 - intercept as usize
        } else {
            0
        };

        if n_iknots > 0 {
            // Quantile-based knot placement using only inside values
            let inside_x: Vec<f64> = x_clean
                .iter()
                .zip(outside.iter())
                .filter(|(_, out)| !**out)
                .map(|(v, _)| *v)
                .collect();

            let probs: Vec<f64> = (1..=n_iknots)
                .map(|i| i as f64 / (n_iknots as f64 + 1.0))
                .collect();
            interior_knots = quantile(&inside_x, &probs);
        } else {
            interior_knots = Vec::new();
        }
    } else if let Some(k) = knots {
        if !k.iter().all(|v| v.is_finite()) {
            return Err("non-finite knots".to_string());
        }
        interior_knots = k.to_vec();
    } else {
        interior_knots = Vec::new();
    }

    // Shove interior knots matching boundary knots to inside (R lines 143-155)
    if mk_knots && !interior_knots.is_empty() {
        let kmin = interior_knots
            .iter()
            .copied()
            .fold(f64::INFINITY, f64::min);
        let kmax = interior_knots
            .iter()
            .copied()
            .fold(f64::NEG_INFINITY, f64::max);

        let lr_eq = [kmin == boundary_knots[0], kmax == boundary_knots[1]];

        if lr_eq[0] {
            let piv = boundary_knots[0];
            let all_match = interior_knots.iter().all(|&k| k == piv);
            if all_match {
                return Err("all interior knots match left boundary knot".to_string());
            }
            let min_above = interior_knots
                .iter()
                .filter(|&&k| k > piv)
                .copied()
                .fold(f64::INFINITY, f64::min);
            for k in interior_knots.iter_mut() {
                if *k == piv {
                    *k += (min_above - piv) / 8.0;
                }
            }
        }

        if lr_eq[1] {
            let piv = boundary_knots[1];
            let all_match = interior_knots.iter().all(|&k| k == piv);
            if all_match {
                return Err("all interior knots match right boundary knot".to_string());
            }
            let max_below = interior_knots
                .iter()
                .filter(|&&k| k < piv)
                .copied()
                .fold(f64::NEG_INFINITY, f64::max);
            for k in interior_knots.iter_mut() {
                if *k == piv {
                    *k -= (piv - max_below) / 8.0;
                }
            }
        }
    }

    let n_iknots = interior_knots.len();

    // Build augmented knot vector: boundary repeated 4 times + interior knots
    let mut aknots = Vec::with_capacity(8 + n_iknots);
    for _ in 0..4 {
        aknots.push(boundary_knots[0]);
    }
    aknots.extend_from_slice(&interior_knots);
    for _ in 0..4 {
        aknots.push(boundary_knots[1]);
    }
    aknots.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    // Compute basis
    let basis_full = if outside.iter().any(|&o| o) {
        // Handle outside values with linear extrapolation
        let ncol = n_iknots + 4; // number of B-spline basis columns
        let n = x_clean.len();
        let mut basis = vec![vec![0.0; ncol]; n];

        let ol: Vec<bool> = x_clean.iter().map(|&v| v < boundary_knots[0]).collect();
        let or: Vec<bool> = x_clean.iter().map(|&v| v > boundary_knots[1]).collect();

        // Left outside: linear extrapolation
        if ol.iter().any(|&v| v) {
            let k_pivot = boundary_knots[0];
            // tt = splineDesign(Aknots, rep(k.pivot, 2), 4, c(0, 1))
            let tt = spline_design(&aknots, &[k_pivot, k_pivot], 4, &[0, 1], true)?;
            for i in 0..n {
                if ol[i] {
                    let dx = x_clean[i] - k_pivot;
                    // xl = cbind(1, dx), basis = xl %*% tt
                    for j in 0..ncol {
                        basis[i][j] = tt[0][j] + dx * tt[1][j];
                    }
                }
            }
        }

        // Right outside: linear extrapolation
        if or.iter().any(|&v| v) {
            let k_pivot = boundary_knots[1];
            let tt = spline_design(&aknots, &[k_pivot, k_pivot], 4, &[0, 1], true)?;
            for i in 0..n {
                if or[i] {
                    let dx = x_clean[i] - k_pivot;
                    for j in 0..ncol {
                        basis[i][j] = tt[0][j] + dx * tt[1][j];
                    }
                }
            }
        }

        // Inside values: normal B-spline basis
        let inside_x: Vec<f64> = x_clean
            .iter()
            .zip(outside.iter())
            .filter(|(_, out)| !**out)
            .map(|(v, _)| *v)
            .collect();

        if !inside_x.is_empty() {
            let inside_basis = spline_design(&aknots, &inside_x, 4, &[0], true)?;
            let mut inside_idx = 0;
            for i in 0..n {
                if !outside[i] {
                    basis[i] = inside_basis[inside_idx].clone();
                    inside_idx += 1;
                }
            }
        }

        basis
    } else {
        spline_design(&aknots, &x_clean, 4, &[0], true)?
    };

    // Apply natural spline constraint via QR
    // const = splineDesign(Aknots, Boundary.knots, ord=4, derivs=c(2,2))
    let constraint = spline_design(
        &aknots,
        &[boundary_knots[0], boundary_knots[1]],
        4,
        &[2, 2],
        true,
    )?;

    let _ncol_full = basis_full[0].len();

    // Remove intercept column before QR if !intercept
    let (basis_trimmed, constraint_trimmed) = if !intercept {
        let b: Vec<Vec<f64>> = basis_full.iter().map(|row| row[1..].to_vec()).collect();
        let c: Vec<Vec<f64>> = constraint.iter().map(|row| row[1..].to_vec()).collect();
        (b, c)
    } else {
        (basis_full, constraint)
    };

    let _p = basis_trimmed[0].len(); // columns after intercept removal

    // QR decomposition of t(const) — const is 2×p, so t(const) is p×2
    // qr.const = qr(t(const))
    // basis = t(qr.qty(qr.const, t(basis)))[, -(1:2)]
    //
    // This projects basis onto the null space of the constraint.
    // Equivalent to: remove the 2 components in the direction of the constraint rows.

    let basis_result = apply_qr_constraint(&basis_trimmed, &constraint_trimmed)?;

    let ncol_result = basis_result[0].len();

    // Handle NaN pass-through
    let final_basis = if has_nas {
        let n_total = x.len();
        let mut full = vec![vec![f64::NAN; ncol_result]; n_total];
        let mut clean_idx = 0;
        for i in 0..n_total {
            if !nax[i] {
                full[i] = basis_result[clean_idx].clone();
                clean_idx += 1;
            }
        }
        full
    } else {
        basis_result
    };

    Ok(NaturalSplineBasis {
        ncol: ncol_result,
        basis: final_basis,
        degree: 3,
        knots: interior_knots,
        boundary_knots,
        intercept,
    })
}

/// Apply the natural spline QR constraint.
///
/// Given basis matrix B (n×p) and constraint matrix C (2×p),
/// project B onto the null space of C by:
///   1. QR decompose t(C) (p×2)
///   2. Apply Q' to t(B) (p×n)
///   3. Drop first 2 rows (the constrained directions)
///   4. Return t(result) (n×(p-2))
///
/// This matches R's: `t(qr.qty(qr(t(const)), t(basis)))[, -(1:2)]`
fn apply_qr_constraint(
    basis: &[Vec<f64>],
    constraint: &[Vec<f64>],
) -> Result<Vec<Vec<f64>>, String> {
    let n = basis.len();
    if n == 0 {
        return Ok(Vec::new());
    }
    let p = basis[0].len();
    if constraint.len() != 2 || constraint[0].len() != p {
        return Err(format!(
            "constraint must be 2×{}, got {}×{}",
            p,
            constraint.len(),
            if constraint.is_empty() {
                0
            } else {
                constraint[0].len()
            }
        ));
    }
    if p <= 2 {
        return Err("need at least 3 columns for natural spline constraint".to_string());
    }

    // t(constraint) is p×2
    let mut tc = vec![vec![0.0; 2]; p];
    for i in 0..2 {
        for j in 0..p {
            tc[j][i] = constraint[i][j];
        }
    }

    // Householder QR of t(constraint) (p×2)
    // We need Q as p×p orthogonal matrix, but we only need Q' applied to t(basis)
    // So we store Householder vectors and apply them directly.
    let mut r_matrix = tc.clone(); // will be modified in place
    let mut tau = vec![0.0; 2]; // Householder scalars

    for k in 0..2 {
        // Compute Householder vector for column k
        let mut norm_sq = 0.0;
        for i in k..p {
            norm_sq += r_matrix[i][k] * r_matrix[i][k];
        }
        let norm = norm_sq.sqrt();

        if norm < 1e-15 {
            tau[k] = 0.0;
            continue;
        }

        let alpha = if r_matrix[k][k] >= 0.0 { -norm } else { norm };
        let v0 = r_matrix[k][k] - alpha;
        tau[k] = -v0 / alpha;

        // Store Householder vector (normalized) in lower part of r_matrix
        r_matrix[k][k] = alpha;
        for i in (k + 1)..p {
            r_matrix[i][k] /= v0;
        }

        // Apply Householder to remaining columns
        for j in (k + 1)..2 {
            let mut dot = r_matrix[k][j];
            for i in (k + 1)..p {
                dot += r_matrix[i][k] * r_matrix[i][j];
            }
            dot *= tau[k];
            r_matrix[k][j] -= dot;
            for i in (k + 1)..p {
                r_matrix[i][j] -= r_matrix[i][k] * dot;
            }
        }
    }

    // Now apply Q' to t(basis) (p×n)
    // t(basis)[j][i] = basis[i][j]
    // We apply Householder reflections in order k=0,1
    let mut tb = vec![vec![0.0; n]; p];
    for i in 0..n {
        for j in 0..p {
            tb[j][i] = basis[i][j];
        }
    }

    for k in 0..2 {
        if tau[k].abs() < 1e-15 {
            continue;
        }
        // Apply H_k to each column of tb
        for col in 0..n {
            // dot = v' * tb[:,col], where v[k]=1, v[i]=r_matrix[i][k] for i>k
            let mut dot = tb[k][col];
            for i in (k + 1)..p {
                dot += r_matrix[i][k] * tb[i][col];
            }
            dot *= tau[k];
            tb[k][col] -= dot;
            for i in (k + 1)..p {
                tb[i][col] -= r_matrix[i][k] * dot;
            }
        }
    }

    // Drop first 2 rows of Q' * t(basis), then transpose back
    // Result is n × (p-2)
    let result_cols = p - 2;
    let mut result = vec![vec![0.0; result_cols]; n];
    for i in 0..n {
        for j in 0..result_cols {
            result[i][j] = tb[j + 2][i];
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ns_basic() {
        // ns(1:10, df=3) should produce a 10×3 matrix
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = ns(&x, Some(3), None, false, None).unwrap();
        assert_eq!(result.basis.len(), 10);
        assert_eq!(result.ncol, 3);
        assert_eq!(result.basis[0].len(), 3);
        assert_eq!(result.degree, 3);
        assert!(!result.intercept);
    }

    #[test]
    fn test_ns_with_intercept() {
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = ns(&x, Some(3), None, true, None).unwrap();
        // With intercept, df=3 means 3-1-1=1 interior knots, so ncol = 1+2 = 3
        // Actually: df = n_iknots + 1 + intercept → n_iknots = 3 - 1 - 1 = 1
        // B-spline columns = n_iknots + 4 = 5, with intercept kept = 5, minus 2 QR = 3
        assert_eq!(result.basis.len(), 10);
        assert_eq!(result.ncol, 3);
        assert!(result.intercept);
    }

    #[test]
    fn test_ns_with_knots() {
        let x: Vec<f64> = (1..=20).map(|i| i as f64).collect();
        let result = ns(&x, None, Some(&[5.0, 10.0, 15.0]), false, None).unwrap();
        // 3 interior knots → B-spline has 3+4=7 columns, minus intercept=6, minus 2 QR = 4
        assert_eq!(result.ncol, 4); // should be n_iknots + 1
        assert_eq!(result.basis.len(), 20);
    }

    #[test]
    fn test_ns_boundary_knots() {
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = ns(&x, Some(3), None, false, Some([0.0, 11.0])).unwrap();
        assert_eq!(result.boundary_knots, [0.0, 11.0]);
        assert_eq!(result.basis.len(), 10);
    }

    #[test]
    fn test_ns_nan_passthrough() {
        let x = vec![1.0, f64::NAN, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        let result = ns(&x, Some(3), None, false, None).unwrap();
        assert_eq!(result.basis.len(), 10);
        // Row 1 (NaN input) should have NaN outputs
        assert!(result.basis[1].iter().all(|v| v.is_nan()));
        // Other rows should be finite
        assert!(result.basis[0].iter().all(|v| v.is_finite()));
    }

    #[test]
    fn test_partition_of_unity_like_property() {
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = ns(&x, Some(4), None, false, None).unwrap();
        for row in &result.basis {
            for &v in row {
                assert!(v.is_finite(), "non-finite value in ns() basis");
            }
        }
    }

    /// Validate against R: ns(1:10, df=3)
    #[test]
    fn test_ns_vs_r() {
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = ns(&x, Some(3), None, false, None).unwrap();

        // R output (10 decimal places)
        let expected: Vec<Vec<f64>> = vec![
            vec![0.0, 0.0, 0.0],
            vec![-0.0756533021, 0.2454784249, -0.1636522833],
            vec![-0.0981338642, 0.4425497408, -0.2950331605],
            vec![-0.0142689462, 0.5428068386, -0.3618712257],
            vec![0.1974791658, 0.5186736136, -0.3396095696],
            vec![0.432108081, 0.4258979791, -0.23454927],
            vec![0.5529803825, 0.3410588525, -0.0607059017],
            vec![0.4601423356, 0.323276697, 0.1671982514],
            vec![0.2003749348, 0.3618381586, 0.4316140671],
            vec![-0.1428571429, 0.4285714286, 0.7142857143],
        ];

        let tol = 1e-6;
        for (i, (row, exp_row)) in result.basis.iter().zip(expected.iter()).enumerate() {
            for (j, (&v, &e)) in row.iter().zip(exp_row.iter()).enumerate() {
                assert!(
                    (v - e).abs() < tol,
                    "ns(df=3)[{},{}]: got {}, expected {} (R), diff={}",
                    i, j, v, e, (v - e).abs()
                );
            }
        }
    }

    /// Validate against R: ns(1:20, knots=c(5,10,15))
    #[test]
    fn test_ns_with_knots_vs_r() {
        let x: Vec<f64> = (1..=20).map(|i| i as f64).collect();
        let result = ns(&x, None, Some(&[5.0, 10.0, 15.0]), false, None).unwrap();

        assert_eq!(result.ncol, 4);

        // Just check first row, last row, and a middle row
        let tol = 1e-6;

        // Row 0: all zeros
        for &v in &result.basis[0] {
            assert!(v.abs() < tol, "ns(knots)[0]: expected 0, got {}", v);
        }

        // Row 19 (x=20): R output: 0, -0.1428571429, 0.4285714286, 0.7142857143
        let exp_last = vec![0.0, -0.1428571429, 0.4285714286, 0.7142857143];
        for (j, (&v, &e)) in result.basis[19].iter().zip(exp_last.iter()).enumerate() {
            assert!(
                (v - e).abs() < tol,
                "ns(knots)[19,{}]: got {}, expected {} (R)",
                j, v, e
            );
        }

        // Row 9 (x=10): R output: 0.6547619048, 0.1091471396, 0.1725585812, -0.1150390541
        let exp_mid = vec![0.6547619048, 0.1091471396, 0.1725585812, -0.1150390541];
        for (j, (&v, &e)) in result.basis[9].iter().zip(exp_mid.iter()).enumerate() {
            assert!(
                (v - e).abs() < tol,
                "ns(knots)[9,{}]: got {}, expected {} (R)",
                j, v, e
            );
        }
    }
}
