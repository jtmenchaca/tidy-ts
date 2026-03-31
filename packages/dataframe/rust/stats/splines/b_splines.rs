//! B-spline basis — faithful port of R's `bs()` from `splines.R`
//!
//! Ported from `r-source-trunk/src/library/splines/R/splines.R` lines 19–106
//! (Copyright (C) 1995-2023 The R Core Team, GPL-2+)

use super::spline_design::spline_design;
use super::natural_splines::quantile;

/// Result of `bs()` — B-spline basis matrix with metadata.
pub struct BSplineBasis {
    /// The basis matrix: `basis[i][j]` is row i, column j
    pub basis: Vec<Vec<f64>>,
    /// Spline degree
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

/// Compute B-spline basis matrix.
///
/// Faithful port of R's `bs()` function.
///
/// # Arguments
/// * `x` - Data values (NaN values are passed through)
/// * `df` - Degrees of freedom. Mutually exclusive with `knots`.
/// * `knots` - Interior knot positions. If None, computed from `df`.
/// * `degree` - Spline degree (default 3 for cubic)
/// * `intercept` - Include intercept column (default false)
/// * `boundary_knots` - Boundary knots. If None, uses range of x.
pub fn bs(
    x: &[f64],
    df: Option<usize>,
    knots: Option<&[f64]>,
    degree: usize,
    intercept: bool,
    boundary_knots: Option<[f64; 2]>,
) -> Result<BSplineBasis, String> {
    let order = degree + 1;
    if order < 2 {
        return Err("'degree' must be integer >= 1".to_string());
    }

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
            if x_clean.is_empty() {
                return Err("need at least one non-NA value".to_string());
            }
            let min = x_clean.iter().copied().fold(f64::INFINITY, f64::min);
            let max = x_clean.iter().copied().fold(f64::NEG_INFINITY, f64::max);
            [min, max]
        }
    };

    // Determine outside values
    let outside: Vec<bool> = x_clean
        .iter()
        .map(|&v| v < boundary_knots[0] || v > boundary_knots[1])
        .collect();

    // Determine interior knots
    let mut interior_knots: Vec<f64>;
    let mk_knots = df.is_some() && knots.is_none();

    if mk_knots {
        let df_val = df.unwrap();
        // nIknots = df - ord + (1 - intercept)
        let n_iknots = if df_val + (1 - intercept as usize) >= order {
            df_val - order + (1 - intercept as usize)
        } else {
            0
        };

        if n_iknots > 0 {
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

    // Shove interior knots matching boundary knots to inside (R lines 49-66)
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
            if !all_match {
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
        }

        if lr_eq[1] {
            let piv = boundary_knots[1];
            let all_match = interior_knots.iter().all(|&k| k == piv);
            if !all_match {
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
    }

    // Build augmented knot vector: boundary repeated `order` times + interior knots
    let mut aknots = Vec::with_capacity(2 * order + interior_knots.len());
    for _ in 0..order {
        aknots.push(boundary_knots[0]);
    }
    aknots.extend_from_slice(&interior_knots);
    for _ in 0..order {
        aknots.push(boundary_knots[1]);
    }
    aknots.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    // Compute basis
    let mut basis = if outside.iter().any(|&o| o) {
        // Handle outside values with polynomial extrapolation
        let ncoef = aknots.len() - order;
        let n = x_clean.len();
        let mut basis = vec![vec![0.0; ncoef]; n];

        let ol: Vec<bool> = x_clean.iter().map(|&v| v < boundary_knots[0]).collect();
        let or: Vec<bool> = x_clean.iter().map(|&v| v > boundary_knots[1]).collect();

        let e = 0.25; // R: e <- 1/4

        // Derivatives for extrapolation: 0, 1, ..., degree
        let derivs: Vec<usize> = (0..=degree).collect();
        // Scale factors: factorials 1, 1, 2, 6, ...
        let scalef: Vec<f64> = (1..=order).map(|i| gamma_factorial(i)).collect();

        if ol.iter().any(|&v| v) {
            // Left pivot: (1-e)*boundary[0] + e*aknots[order]
            let k_pivot =
                (1.0 - e) * boundary_knots[0] + e * aknots[order];

            let pivot_vals: Vec<f64> = (0..order).map(|_| k_pivot).collect();
            let tt = spline_design(&aknots, &pivot_vals, order, &derivs, true)?;

            for i in 0..n {
                if ol[i] {
                    let dx = x_clean[i] - k_pivot;
                    // xl = cbind(1, outer(dx, 1:degree, `^`))
                    // basis = xl %*% (tt/scalef)
                    for col in 0..ncoef {
                        let mut val = 0.0;
                        for d in 0..order {
                            let power = if d == 0 {
                                1.0
                            } else {
                                dx.powi(d as i32)
                            };
                            val += power * tt[d][col] / scalef[d];
                        }
                        basis[i][col] = val;
                    }
                }
            }
        }

        if or.iter().any(|&v| v) {
            // Right pivot: (1-e)*boundary[1] + e*aknots[len-order-1]
            let k_pivot =
                (1.0 - e) * boundary_knots[1] + e * aknots[aknots.len() - order - 1];

            let pivot_vals: Vec<f64> = (0..order).map(|_| k_pivot).collect();
            let tt = spline_design(&aknots, &pivot_vals, order, &derivs, true)?;

            for i in 0..n {
                if or[i] {
                    let dx = x_clean[i] - k_pivot;
                    for col in 0..ncoef {
                        let mut val = 0.0;
                        for d in 0..order {
                            let power = if d == 0 {
                                1.0
                            } else {
                                dx.powi(d as i32)
                            };
                            val += power * tt[d][col] / scalef[d];
                        }
                        basis[i][col] = val;
                    }
                }
            }
        }

        // Inside values
        let inside_x: Vec<f64> = x_clean
            .iter()
            .zip(outside.iter())
            .filter(|(_, out)| !**out)
            .map(|(v, _)| *v)
            .collect();

        if !inside_x.is_empty() {
            let inside_basis = spline_design(&aknots, &inside_x, order, &[0], true)?;
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
        spline_design(&aknots, &x_clean, order, &[0], true)?
    };

    // Remove intercept column if !intercept
    if !intercept {
        for row in basis.iter_mut() {
            row.remove(0);
        }
    }

    let ncol = if basis.is_empty() {
        0
    } else {
        basis[0].len()
    };

    // Handle NaN pass-through
    let final_basis = if has_nas {
        let n_total = x.len();
        let mut full = vec![vec![f64::NAN; ncol]; n_total];
        let mut clean_idx = 0;
        for i in 0..n_total {
            if !nax[i] {
                full[i] = basis[clean_idx].clone();
                clean_idx += 1;
            }
        }
        full
    } else {
        basis
    };

    Ok(BSplineBasis {
        ncol,
        basis: final_basis,
        degree,
        knots: interior_knots,
        boundary_knots,
        intercept,
    })
}

/// Gamma function for small positive integers (factorial of n-1).
/// R's `gamma(1:ord)` = `[1, 1, 2, 6, 24, ...]`
fn gamma_factorial(n: usize) -> f64 {
    match n {
        0 => f64::INFINITY, // gamma(0) = Inf
        1 => 1.0,           // gamma(1) = 0! = 1
        2 => 1.0,           // gamma(2) = 1! = 1
        3 => 2.0,           // gamma(3) = 2! = 2
        4 => 6.0,           // gamma(4) = 3! = 6
        5 => 24.0,          // gamma(5) = 4! = 24
        6 => 120.0,
        7 => 720.0,
        _ => {
            let mut f = 1.0;
            for i in 2..n {
                f *= i as f64;
            }
            f
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bs_basic() {
        // bs(1:10, df=4) should produce a 10×4 matrix
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = bs(&x, Some(4), None, 3, false, None).unwrap();
        assert_eq!(result.basis.len(), 10);
        assert_eq!(result.ncol, 4);
        assert_eq!(result.degree, 3);
    }

    #[test]
    fn test_bs_partition_of_unity() {
        // B-spline basis with intercept should sum to 1 at each point
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = bs(&x, Some(5), None, 3, true, None).unwrap();
        for (i, row) in result.basis.iter().enumerate() {
            let sum: f64 = row.iter().sum();
            assert!(
                (sum - 1.0).abs() < 1e-10,
                "row {}: sum = {} (expected 1.0)",
                i,
                sum
            );
        }
    }

    #[test]
    fn test_bs_with_knots() {
        let x: Vec<f64> = (1..=20).map(|i| i as f64).collect();
        let result = bs(&x, None, Some(&[5.0, 10.0, 15.0]), 3, false, None).unwrap();
        // 3 interior knots, degree 3, no intercept → ncol = 3 + 3 + 1 - 1 = 6
        assert_eq!(result.ncol, 6);
    }

    #[test]
    fn test_bs_nan_passthrough() {
        let x = vec![1.0, f64::NAN, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        let result = bs(&x, Some(4), None, 3, false, None).unwrap();
        assert_eq!(result.basis.len(), 10);
        assert!(result.basis[1].iter().all(|v| v.is_nan()));
        assert!(result.basis[0].iter().all(|v| v.is_finite()));
    }

    #[test]
    fn test_bs_linear() {
        let x = vec![0.0, 0.25, 0.5, 0.75, 1.0];
        let result = bs(&x, None, Some(&[]), 1, false, Some([0.0, 1.0])).unwrap();
        assert_eq!(result.ncol, 1);
        for (i, row) in result.basis.iter().enumerate() {
            assert!(
                (row[0] - x[i]).abs() < 1e-12,
                "linear bs at x={}: got {}, expected {}",
                x[i],
                row[0],
                x[i]
            );
        }
    }

    /// Validate against R: bs(1:10, df=4)
    #[test]
    fn test_bs_vs_r() {
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = bs(&x, Some(4), None, 3, false, None).unwrap();

        // R output (10 decimal places)
        let expected: Vec<Vec<f64>> = vec![
            vec![0.0, 0.0, 0.0, 0.0],
            vec![0.463648834, 0.0631001372, 0.0027434842, 0.0],
            vec![0.598079561, 0.2085048011, 0.0219478738, 0.0],
            vec![0.5185185185, 0.3703703704, 0.0740740741, 0.0],
            vec![0.3401920439, 0.4828532236, 0.1755829904, 0.0],
            vec![0.1755829904, 0.4828532236, 0.3401920439, 0.0013717421],
            vec![0.0740740741, 0.3703703704, 0.5185185185, 0.037037037],
            vec![0.0219478738, 0.2085048011, 0.598079561, 0.1714677641],
            vec![0.0027434842, 0.0631001372, 0.463648834, 0.4705075446],
            vec![0.0, 0.0, 0.0, 1.0],
        ];

        let tol = 1e-6;
        for (i, (row, exp_row)) in result.basis.iter().zip(expected.iter()).enumerate() {
            for (j, (&v, &e)) in row.iter().zip(exp_row.iter()).enumerate() {
                assert!(
                    (v - e).abs() < tol,
                    "bs(df=4)[{},{}]: got {}, expected {} (R), diff={}",
                    i, j, v, e, (v - e).abs()
                );
            }
        }
    }

    /// Validate against R: bs(1:10, df=5, intercept=TRUE) — partition of unity
    #[test]
    fn test_bs_intercept_vs_r() {
        let x: Vec<f64> = (1..=10).map(|i| i as f64).collect();
        let result = bs(&x, Some(5), None, 3, true, None).unwrap();

        // R output row 1: 1, 0, 0, 0, 0
        let tol = 1e-6;
        assert!((result.basis[0][0] - 1.0).abs() < tol);
        for j in 1..5 {
            assert!(result.basis[0][j].abs() < tol);
        }

        // R output row 10: 0, 0, 0, 0, 1
        for j in 0..4 {
            assert!(result.basis[9][j].abs() < tol);
        }
        assert!((result.basis[9][4] - 1.0).abs() < tol);

        // All rows sum to 1
        for (i, row) in result.basis.iter().enumerate() {
            let sum: f64 = row.iter().sum();
            assert!(
                (sum - 1.0).abs() < tol,
                "bs(intercept=TRUE) row {}: sum = {} (expected 1.0)",
                i, sum
            );
        }
    }
}
