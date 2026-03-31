//! B-spline basis evaluation — faithful port of R's `splines.c`
//!
//! Ported from `r-source-trunk/src/library/splines/src/splines.c`
//! (Copyright (C) 1998 Douglas M. Bates and William N. Venables,
//!  Copyright (C) 1999-2017 The R Core Team, GPL-2+)
//!
//! This implements the de Boor recursion for B-spline basis functions,
//! including derivative evaluation. Used by `ns()` and `bs()`.

/// Spline state — equivalent to C `spl_struct`
struct SplineState {
    order: usize,
    ordm1: usize,
    nknots: usize,
    curs: isize, // can be -1 (sentinel)
    boundary: bool,
    ldel: Vec<f64>,
    rdel: Vec<f64>,
    a: Vec<f64>,
}

impl SplineState {
    fn new(order: usize, nknots: usize) -> Self {
        let ordm1 = order - 1;
        SplineState {
            order,
            ordm1,
            nknots,
            curs: -1,
            boundary: false,
            ldel: vec![0.0; ordm1],
            rdel: vec![0.0; ordm1],
            a: vec![0.0; order],
        }
    }

    /// Set cursor to the index of the first knot position >= x, with boundary handling.
    /// Matches C `set_cursor` exactly.
    fn set_cursor(&mut self, knots: &[f64], x: f64) -> isize {
        self.curs = -1; // Wall sentinel
        self.boundary = false;

        for i in 0..self.nknots {
            if knots[i] >= x {
                self.curs = i as isize;
            }
            if knots[i] > x {
                break;
            }
        }

        if self.curs > (self.nknots as isize - self.order as isize) {
            let last_legit = self.nknots - self.order;
            if x == knots[last_legit] {
                self.boundary = true;
                self.curs = last_legit as isize;
            }
        }

        self.curs
    }

    /// Compute left and right knot differences. Matches C `diff_table`.
    fn diff_table(&mut self, knots: &[f64], x: f64, ndiff: usize) {
        let curs = self.curs as usize;
        for i in 0..ndiff {
            self.rdel[i] = knots[curs + i] - x;
            self.ldel[i] = x - knots[curs - (i + 1)];
        }
    }

    /// Fast evaluation of basis functions (no derivatives). Matches C `basis_funcs`.
    fn basis_funcs(&mut self, knots: &[f64], x: f64, b: &mut [f64]) {
        self.diff_table(knots, x, self.ordm1);
        b[0] = 1.0;
        for j in 1..=self.ordm1 {
            let mut saved = 0.0;
            for r in 0..j {
                let den = self.rdel[r] + self.ldel[j - 1 - r];
                if den != 0.0 {
                    let term = b[r] / den;
                    b[r] = saved + self.rdel[r] * term;
                    saved = self.ldel[j - 1 - r] * term;
                } else {
                    if r != 0 || self.rdel[r] != 0.0 {
                        b[r] = saved;
                    }
                    saved = 0.0;
                }
            }
            b[j] = saved;
        }
    }

}

/// Evaluate the de Boor recursion loop (the second while loop in C's `evaluate`).
/// Separated out because the pointer arithmetic is tricky to get right inline.
fn de_boor_eval(a: &mut [f64], ldel: &[f64], rdel: &[f64], mut outer: usize) {
    while outer > 0 {
        outer -= 1;
        // C: for(apt = sp->a, lpt = sp->ldel + outer, rpt = sp->rdel, inner = outer + 1;
        //        inner--; lpt--, rpt++, apt++)
        //     *apt = (*(apt + 1) * *lpt + *apt * *rpt)/(*rpt + *lpt);
        for i in 0..=outer {
            let lpt = ldel[outer - i];
            let rpt = rdel[i];
            a[i] = (a[i + 1] * lpt + a[i] * rpt) / (rpt + lpt);
        }
    }
}

/// Result of `spline_basis` — the raw output before assembly into a full design matrix.
pub struct SplineBasisRaw {
    /// Non-zero basis values, stored column-major: `values[i * order + j]`
    /// for x-value `i`, basis function `j` within the non-zero window.
    pub values: Vec<f64>,
    /// Offset for each x-value: the column index of the first non-zero basis function.
    pub offsets: Vec<isize>,
    /// Spline order
    pub order: usize,
    /// Number of x-values
    pub nx: usize,
}

/// Evaluate B-spline basis functions at given x-values.
///
/// Faithful port of R's C function `spline_basis()` from `splines.c`.
///
/// # Arguments
/// * `knots` - Knot vector (will be sorted if not already)
/// * `order` - Spline order (degree + 1; 4 for cubic splines)
/// * `x` - Values at which to evaluate
/// * `derivs` - Derivative orders (recycled to length of x)
///
/// # Returns
/// Raw basis values and offsets, ready for assembly into a design matrix.
pub fn spline_basis(
    knots: &[f64],
    order: usize,
    x: &[f64],
    derivs: &[usize],
) -> Result<SplineBasisRaw, String> {
    if order < 1 {
        return Err("'order' must be a positive integer".to_string());
    }

    let mut sorted_knots;
    let knots = if knots.windows(2).any(|w| w[0] > w[1]) {
        sorted_knots = knots.to_vec();
        sorted_knots.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        &sorted_knots
    } else {
        sorted_knots = Vec::new();
        let _ = &sorted_knots; // suppress unused warning
        knots
    };

    let nk = knots.len();
    let nx = x.len();
    let nd = derivs.len();

    if nd < 1 {
        return Err("empty 'derivs'".to_string());
    }

    let mut sp = SplineState::new(order, nk);
    let mut values = vec![0.0; order * nx];
    let mut offsets = vec![0isize; nx];

    for i in 0..nx {
        sp.set_cursor(knots, x[i]);
        let io = sp.curs - order as isize;
        offsets[i] = io;
        let der_i = derivs[i % nd];

        if io < 0 || io > nk as isize {
            // Outside knot range: fill with NaN
            for j in 0..order {
                values[i * order + j] = f64::NAN;
            }
        } else if der_i > 0 {
            // Slow method for derivatives
            if der_i >= order {
                return Err(format!(
                    "derivs = {} >= ord = {}, but should be in {{0,..,ord-1}}",
                    der_i, order
                ));
            }
            for ii in 0..order {
                // Set up unit vector in sp.a
                for j in 0..order {
                    sp.a[j] = 0.0;
                }
                sp.a[ii] = 1.0;

                // Derivative reduction
                let mut outer = sp.ordm1;
                let curs = sp.curs as usize;
                let mut nder_remaining = der_i;
                while nder_remaining > 0 {
                    nder_remaining -= 1;
                    for inner in 0..outer {
                        let lpt_idx = curs - outer + inner;
                        let den = knots[lpt_idx + outer] - knots[lpt_idx];
                        sp.a[inner] =
                            (outer as f64) * (sp.a[inner + 1] - sp.a[inner]) / den;
                    }
                    outer -= 1;
                }

                // de Boor evaluation
                sp.diff_table(knots, x[i], outer);
                de_boor_eval(&mut sp.a, &sp.ldel, &sp.rdel, outer);

                values[i * order + ii] = sp.a[0];
            }
        } else {
            // Fast method for value (no derivatives)
            sp.basis_funcs(knots, x[i], &mut values[i * order..i * order + order]);
        }
    }

    Ok(SplineBasisRaw {
        values,
        offsets,
        order,
        nx,
    })
}

/// Evaluate a spline at given points using coefficients.
///
/// Faithful port of R's C function `spline_value()` from `splines.c`.
///
/// # Arguments
/// * `knots` - Knot vector
/// * `coeff` - Spline coefficients
/// * `order` - Spline order
/// * `x` - Evaluation points
/// * `deriv` - Derivative order (single value, applied to all x)
pub fn spline_value(
    knots: &[f64],
    coeff: &[f64],
    order: usize,
    x: &[f64],
    deriv: usize,
) -> Result<Vec<f64>, String> {
    if order < 1 {
        return Err("'order' must be a positive integer".to_string());
    }

    let mut sorted_knots;
    let knots = if knots.windows(2).any(|w| w[0] > w[1]) {
        sorted_knots = knots.to_vec();
        sorted_knots.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        &sorted_knots
    } else {
        sorted_knots = Vec::new();
        let _ = &sorted_knots;
        knots
    };

    let nk = knots.len();
    let mut sp = SplineState::new(order, nk);
    let mut result = vec![0.0; x.len()];

    for i in 0..x.len() {
        sp.set_cursor(knots, x[i]);
        if sp.curs < order as isize || sp.curs > (nk as isize - order as isize) {
            result[i] = f64::NAN;
        } else {
            // Copy coefficients into scratch array
            let start = (sp.curs as usize) - order;
            sp.a[..order].copy_from_slice(&coeff[start..start + order]);

            // Derivative reduction
            let mut outer = sp.ordm1;
            let curs = sp.curs as usize;
            let mut nder_remaining = deriv;

            if sp.boundary && deriv == sp.ordm1 {
                result[i] = 0.0;
                continue;
            }

            while nder_remaining > 0 {
                nder_remaining -= 1;
                for inner in 0..outer {
                    let lpt_idx = curs - outer + inner;
                    let den = knots[lpt_idx + outer] - knots[lpt_idx];
                    sp.a[inner] =
                        (outer as f64) * (sp.a[inner + 1] - sp.a[inner]) / den;
                }
                outer -= 1;
            }

            sp.diff_table(knots, x[i], outer);
            de_boor_eval(&mut sp.a, &sp.ldel, &sp.rdel, outer);

            result[i] = sp.a[0];
        }
    }

    Ok(result)
}

/// Assemble a full `n × ncoef` design matrix from raw spline basis output.
///
/// This matches the R `splineDesign()` function's matrix assembly logic
/// from `splineClasses.R` (the dense, non-sparse path).
///
/// # Arguments
/// * `raw` - Output from `spline_basis()`
/// * `ncoef` - Number of columns (= nknots - order)
pub fn assemble_design_matrix(raw: &SplineBasisRaw, ncoef: usize) -> Vec<Vec<f64>> {
    let nx = raw.nx;
    let ord = raw.order;
    let mut design = vec![vec![0.0; ncoef]; nx];

    for i in 0..nx {
        let offset = raw.offsets[i];
        for j in 0..ord {
            let col = offset + j as isize; // 0-based column (R uses 1-based jj = outer(1:ord, offsets, +))
            if col >= 0 && (col as usize) < ncoef {
                design[i][col as usize] = raw.values[i * ord + j];
            }
        }
    }

    design
}

/// High-level `splineDesign()` equivalent — matches R's `splineDesign()` function.
///
/// Computes the full design matrix for B-spline basis functions at given x-values.
///
/// # Arguments
/// * `knots` - Full knot vector (including boundary knots repeated `order` times)
/// * `x` - Evaluation points
/// * `order` - Spline order (degree + 1; default 4 for cubic)
/// * `derivs` - Derivative orders per x-value (recycled)
/// * `outer_ok` - Allow x values outside the knot range
pub fn spline_design(
    knots: &[f64],
    x: &[f64],
    order: usize,
    derivs: &[usize],
    outer_ok: bool,
) -> Result<Vec<Vec<f64>>, String> {
    let mut sorted_knots = knots.to_vec();
    sorted_knots.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let knots = &sorted_knots;

    let nk = knots.len();
    if nk == 0 {
        return Err("must have at least 'ord' knots".to_string());
    }
    if order < 1 || order > nk {
        return Err("'ord' must be positive integer, at most the number of knots".to_string());
    }

    let degree = order - 1;

    if !outer_ok {
        // Check that nk >= 2*order - 1
        if nk < 2 * order - 1 {
            return Err(format!(
                "need at least 2*ord -1 (={}) knots",
                2 * order - 1
            ));
        }
        // Check x values are within knot range
        for &xi in x {
            if xi < knots[degree] || xi > knots[nk - order] {
                return Err(format!(
                    "the 'x' data must be in the range {} to {} unless you set 'outer_ok = true'",
                    knots[degree],
                    knots[nk - order]
                ));
            }
        }
    }

    let raw = spline_basis(knots, order, x, derivs)?;
    let ncoef = nk - order;
    Ok(assemble_design_matrix(&raw, ncoef))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cubic_basis_simple() {
        // Simple cubic B-spline with knots 0,0,0,0,1,2,3,4,4,4,4
        // This is a standard clamped knot vector for 7 basis functions
        let knots = vec![0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 3.0, 4.0, 4.0, 4.0, 4.0];
        let x = vec![0.5, 1.5, 2.5, 3.5];
        let derivs = vec![0];

        let result = spline_design(&knots, &x, 4, &derivs, false).unwrap();
        assert_eq!(result.len(), 4); // 4 x-values
        assert_eq!(result[0].len(), 7); // 11 knots - 4 order = 7 basis functions

        // Each row should sum to 1 (partition of unity)
        for row in &result {
            let sum: f64 = row.iter().sum();
            assert!(
                (sum - 1.0).abs() < 1e-12,
                "B-spline partition of unity failed: sum = {}",
                sum
            );
        }
    }

    #[test]
    fn test_basis_at_boundaries() {
        let knots = vec![0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 3.0, 4.0, 4.0, 4.0, 4.0];
        let x = vec![0.0, 4.0]; // exact boundary values
        let derivs = vec![0];

        let result = spline_design(&knots, &x, 4, &derivs, false).unwrap();

        // At left boundary, only first basis function should be 1
        assert!((result[0][0] - 1.0).abs() < 1e-12);
        for j in 1..7 {
            assert!(result[0][j].abs() < 1e-12);
        }

        // At right boundary, only last basis function should be 1
        for j in 0..6 {
            assert!(result[1][j].abs() < 1e-12);
        }
        assert!((result[1][6] - 1.0).abs() < 1e-12);
    }

    #[test]
    fn test_derivative_evaluation() {
        let knots = vec![0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 3.0, 4.0, 4.0, 4.0, 4.0];
        let x = vec![1.5];
        let derivs = vec![1]; // first derivative

        let result = spline_design(&knots, &x, 4, &derivs, false).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].len(), 7);

        // First derivatives should sum to 0 (partition of unity → sum of derivatives = 0)
        let sum: f64 = result[0].iter().sum();
        assert!(
            sum.abs() < 1e-12,
            "Derivative partition of unity failed: sum = {}",
            sum
        );
    }

    #[test]
    fn test_spline_value_simple() {
        // Linear spline (order 2) with knots 0,0,1,1
        // 2 basis functions: B0 = 1-x, B1 = x on [0,1]
        // With coefficients [3, 7], value at x should be 3*(1-x) + 7*x = 3 + 4x
        let knots = vec![0.0, 0.0, 1.0, 1.0];
        let coeff = vec![3.0, 7.0];
        let x = vec![0.0, 0.25, 0.5, 0.75, 1.0];

        let result = spline_value(&knots, &coeff, 2, &x, 0).unwrap();

        let expected = vec![3.0, 4.0, 5.0, 6.0, 7.0];
        for (i, (&r, &e)) in result.iter().zip(expected.iter()).enumerate() {
            assert!(
                (r - e).abs() < 1e-12,
                "spline_value[{}]: got {}, expected {}",
                i,
                r,
                e
            );
        }
    }

    /// Validate against R: splineDesign(c(0,0,0,0,1,2,3,4,4,4,4), c(0.5,1.5,2.5,3.5), ord=4)
    #[test]
    fn test_spline_design_vs_r() {
        let knots = vec![0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 3.0, 4.0, 4.0, 4.0, 4.0];
        let x = vec![0.5, 1.5, 2.5, 3.5];
        let derivs = vec![0];
        let result = spline_design(&knots, &x, 4, &derivs, false).unwrap();

        // R output (10 decimal places)
        let expected: Vec<Vec<f64>> = vec![
            vec![0.125, 0.59375, 0.2604166667, 0.0208333333, 0.0, 0.0, 0.0],
            vec![0.0, 0.03125, 0.46875, 0.4791666667, 0.0208333333, 0.0, 0.0],
            vec![0.0, 0.0, 0.0208333333, 0.4791666667, 0.46875, 0.03125, 0.0],
            vec![0.0, 0.0, 0.0, 0.0208333333, 0.2604166667, 0.59375, 0.125],
        ];

        for (i, (row, exp_row)) in result.iter().zip(expected.iter()).enumerate() {
            for (j, (&v, &e)) in row.iter().zip(exp_row.iter()).enumerate() {
                assert!(
                    (v - e).abs() < 1e-9,
                    "splineDesign[{},{}]: got {}, expected {} (R)",
                    i, j, v, e
                );
            }
        }
    }

    /// Validate derivatives against R: splineDesign(..., x=1.5, derivs=1)
    #[test]
    fn test_spline_design_derivs_vs_r() {
        let knots = vec![0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 3.0, 4.0, 4.0, 4.0, 4.0];
        let x = vec![1.5];
        let derivs = vec![1];
        let result = spline_design(&knots, &x, 4, &derivs, false).unwrap();

        // R output: 0, -0.1875, -0.5625, 0.625, 0.125, 0, 0
        let expected = vec![0.0, -0.1875, -0.5625, 0.625, 0.125, 0.0, 0.0];

        for (j, (&v, &e)) in result[0].iter().zip(expected.iter()).enumerate() {
            assert!(
                (v - e).abs() < 1e-9,
                "splineDesign deriv[0,{}]: got {}, expected {} (R)",
                j, v, e
            );
        }
    }
}
