//! Linear and step-function interpolation
//!
//! ## Source
//!
//! `r-source-trunk/src/library/stats/src/approx.c`
//!
//! Port of R's `approx()` / `approxfun()`. Needed by baseline hazard,
//! survival curve extraction, and quantile.survfit.

/// Interpolation method
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum InterpolationMethod {
    /// Linear interpolation between points
    Linear,
    /// Constant (step function) interpolation with blending factor f:
    /// result = (1-f)*y[i] + f*y[j] where x[i] <= v <= x[j]
    Constant { f: f64 },
}

/// Rule for handling out-of-range values
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ExtrapolationRule {
    /// Return NaN for out-of-range values (R's rule=1)
    NaN,
    /// Extend the boundary value (R's rule=2)
    Extend,
    /// Use specified values for left/right boundaries
    Values { yleft: f64, yright: f64 },
}

/// Interpolation configuration, matching R's `approx()` / `approxfun()`.
#[allow(dead_code)]
pub struct Interpolator {
    method: InterpolationMethod,
    ylow: f64,
    yhigh: f64,
}

#[allow(dead_code)]
impl Interpolator {
    /// Create an interpolator.
    ///
    /// # Arguments
    ///
    /// * `method` - Interpolation method (linear or constant)
    /// * `rule` - How to handle out-of-range values
    pub(crate) fn new(method: InterpolationMethod, rule: ExtrapolationRule) -> Self {
        let (ylow, yhigh) = match rule {
            ExtrapolationRule::NaN => (f64::NAN, f64::NAN),
            ExtrapolationRule::Extend => (f64::NEG_INFINITY, f64::INFINITY), // sentinel
            ExtrapolationRule::Values { yleft, yright } => (yleft, yright),
        };
        Interpolator {
            method,
            ylow,
            yhigh,
        }
    }

    /// Interpolate a single value.
    ///
    /// Direct port of `approx1()` from R's `approx.c`.
    ///
    /// # Arguments
    ///
    /// * `v` - The x-value to interpolate at
    /// * `x` - Known x-values (must be sorted ascending)
    /// * `y` - Known y-values
    ///
    /// # Returns
    ///
    /// Interpolated y-value
    pub(crate) fn approx1(&self, v: f64, x: &[f64], y: &[f64]) -> f64 {
        let n = x.len();
        if n == 0 {
            return f64::NAN;
        }

        // Handle out-of-domain
        if v < x[0] {
            return if self.ylow == f64::NEG_INFINITY {
                y[0]
            } else {
                self.ylow
            };
        }
        if v > x[n - 1] {
            return if self.yhigh == f64::INFINITY {
                y[n - 1]
            } else {
                self.yhigh
            };
        }

        // Bisection to find interval [i, j] where x[i] <= v <= x[j]
        let mut i = 0_usize;
        let mut j = n - 1;
        while i < j - 1 {
            let ij = (i + j) / 2;
            if v < x[ij] {
                j = ij;
            } else {
                i = ij;
            }
        }

        // Exact match
        if v == x[j] {
            return y[j];
        }
        if v == x[i] {
            return y[i];
        }

        // Interpolate
        match self.method {
            InterpolationMethod::Linear => {
                y[i] + (y[j] - y[i]) * ((v - x[i]) / (x[j] - x[i]))
            }
            InterpolationMethod::Constant { f } => {
                let f1 = 1.0 - f;
                let mut result = 0.0;
                if f1 != 0.0 {
                    result += y[i] * f1;
                }
                if f != 0.0 {
                    result += y[j] * f;
                }
                result
            }
        }
    }

    /// Interpolate a vector of values.
    ///
    /// Direct port of `R_approxfun()` from R's `approx.c`.
    ///
    /// # Arguments
    ///
    /// * `x` - Known x-values (sorted ascending)
    /// * `y` - Known y-values
    /// * `xout` - X-values at which to interpolate
    ///
    /// # Returns
    ///
    /// Interpolated y-values
    pub(crate) fn approx(&self, x: &[f64], y: &[f64], xout: &[f64]) -> Vec<f64> {
        xout.iter()
            .map(|&v| {
                if v.is_nan() {
                    v
                } else {
                    self.approx1(v, x, y)
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_interpolation() {
        let interp = Interpolator::new(InterpolationMethod::Linear, ExtrapolationRule::NaN);
        let x = vec![0.0, 1.0, 2.0, 3.0];
        let y = vec![0.0, 10.0, 20.0, 30.0];

        assert!((interp.approx1(0.5, &x, &y) - 5.0).abs() < 1e-12);
        assert!((interp.approx1(1.5, &x, &y) - 15.0).abs() < 1e-12);
        assert!((interp.approx1(0.0, &x, &y) - 0.0).abs() < 1e-12);
        assert!((interp.approx1(3.0, &x, &y) - 30.0).abs() < 1e-12);
    }

    #[test]
    fn test_linear_out_of_range_nan() {
        let interp = Interpolator::new(InterpolationMethod::Linear, ExtrapolationRule::NaN);
        let x = vec![1.0, 2.0, 3.0];
        let y = vec![10.0, 20.0, 30.0];

        assert!(interp.approx1(0.5, &x, &y).is_nan());
        assert!(interp.approx1(3.5, &x, &y).is_nan());
    }

    #[test]
    fn test_linear_out_of_range_extend() {
        let interp = Interpolator::new(InterpolationMethod::Linear, ExtrapolationRule::Extend);
        let x = vec![1.0, 2.0, 3.0];
        let y = vec![10.0, 20.0, 30.0];

        assert!((interp.approx1(0.5, &x, &y) - 10.0).abs() < 1e-12);
        assert!((interp.approx1(5.0, &x, &y) - 30.0).abs() < 1e-12);
    }

    #[test]
    fn test_constant_interpolation() {
        // f=0: left-continuous step function (use y[i])
        let interp =
            Interpolator::new(InterpolationMethod::Constant { f: 0.0 }, ExtrapolationRule::NaN);
        let x = vec![1.0, 2.0, 3.0];
        let y = vec![10.0, 20.0, 30.0];

        assert!((interp.approx1(1.5, &x, &y) - 10.0).abs() < 1e-12);
        assert!((interp.approx1(2.5, &x, &y) - 20.0).abs() < 1e-12);
    }

    #[test]
    fn test_constant_interpolation_f1() {
        // f=1: right-continuous step function (use y[j])
        let interp =
            Interpolator::new(InterpolationMethod::Constant { f: 1.0 }, ExtrapolationRule::NaN);
        let x = vec![1.0, 2.0, 3.0];
        let y = vec![10.0, 20.0, 30.0];

        assert!((interp.approx1(1.5, &x, &y) - 20.0).abs() < 1e-12);
        assert!((interp.approx1(2.5, &x, &y) - 30.0).abs() < 1e-12);
    }

    #[test]
    fn test_approx_vector() {
        let interp = Interpolator::new(InterpolationMethod::Linear, ExtrapolationRule::Extend);
        let x = vec![0.0, 1.0, 2.0];
        let y = vec![0.0, 10.0, 20.0];
        let xout = vec![0.0, 0.5, 1.0, 1.5, 2.0, 3.0];

        let result = interp.approx(&x, &y, &xout);
        let expected = vec![0.0, 5.0, 10.0, 15.0, 20.0, 20.0];
        for (r, e) in result.iter().zip(expected.iter()) {
            assert!((r - e).abs() < 1e-12, "{r} vs {e}");
        }
    }

    #[test]
    fn test_approx_nan_input() {
        let interp = Interpolator::new(InterpolationMethod::Linear, ExtrapolationRule::NaN);
        let x = vec![0.0, 1.0];
        let y = vec![0.0, 10.0];
        let xout = vec![0.5, f64::NAN, 0.8];

        let result = interp.approx(&x, &y, &xout);
        assert!((result[0] - 5.0).abs() < 1e-12);
        assert!(result[1].is_nan());
        assert!((result[2] - 8.0).abs() < 1e-12);
    }
}
