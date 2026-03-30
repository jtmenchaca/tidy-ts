//! Safe numerical functions for survival analysis
//!
//! Port of `coxsafe.c` from R's survival package (Terry Therneau).
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/coxsafe.c`
//!
//! ## Purpose
//!
//! A very few pathologic cases can cause the Newton-Raphson iteration
//! path in coxph to generate a horrific argument to exp(). Since all these
//! calls to exp result in (essentially) relative risks we choose a
//! fixed value of LARGE on biological grounds: any number less than
//! 1/(population of the earth) is essentially a zero, that is, an exponent
//! outside the range of +-23.
//!
//! The argument does not have to get large enough to have any single
//! exponential overflow. In (start, stop] data we keep a running sum of
//! scores exp(x[i]*beta), which involves both adding subjects in and
//! subtracting them out. An outlier x value that enters and then leaves
//! can erase all the digits of accuracy. Most machines have about 16
//! digits of accuracy and exp(21) uses up about 9 of them, leaving
//! enough that the routine doesn't fall on its face.
//!
//! When beta-hat is infinite and x well behaved, the loglik usually
//! converges before xbeta gets to 15, so this protection should not
//! harm the iteration path of even edge cases; only fix those that
//! truly go astray.
//!
//! The truncation turns out not to be necessary for small values, since
//! a risk score of exp(-50) or exp(-1000) or 0 all give essentially the
//! same effect. We only cut these off enough to avoid underflow.

/// Upper bound for coxsafe: exp(22) ≈ 3.6e9
const LARGE: f64 = 22.0;

/// Lower bound for coxsafe: exp(-200) ≈ 1.4e-87
const SMALL: f64 = -200.0;

/// Clamp a value to the safe range for exponentiation in Cox models.
///
/// Equivalent to R's `coxsafe()` function. Clamps the input to
/// `[SMALL, LARGE]` = `[-200, 22]` to prevent overflow/underflow
/// when computing `exp(x)` in partial likelihood calculations.
///
/// # Arguments
///
/// * `x` - The value to clamp (typically a linear predictor Xβ)
///
/// # Returns
///
/// The clamped value, guaranteed to be in `[-200.0, 22.0]`.
#[inline]
pub(crate) fn coxsafe(x: f64) -> f64 {
    if x < SMALL {
        SMALL
    } else if x > LARGE {
        LARGE
    } else {
        x
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coxsafe_passthrough() {
        assert_eq!(coxsafe(0.0), 0.0);
        assert_eq!(coxsafe(10.0), 10.0);
        assert_eq!(coxsafe(-50.0), -50.0);
        assert_eq!(coxsafe(21.0), 21.0);
        assert_eq!(coxsafe(-199.0), -199.0);
    }

    #[test]
    fn test_coxsafe_clamp_large() {
        assert_eq!(coxsafe(22.0), 22.0);
        assert_eq!(coxsafe(23.0), 22.0);
        assert_eq!(coxsafe(1000.0), 22.0);
        assert_eq!(coxsafe(f64::INFINITY), 22.0);
    }

    #[test]
    fn test_coxsafe_clamp_small() {
        assert_eq!(coxsafe(-200.0), -200.0);
        assert_eq!(coxsafe(-201.0), -200.0);
        assert_eq!(coxsafe(-1000.0), -200.0);
        assert_eq!(coxsafe(f64::NEG_INFINITY), -200.0);
    }

    #[test]
    fn test_coxsafe_nan() {
        // NaN comparisons are false, so NaN passes through (matches C behavior)
        assert!(coxsafe(f64::NAN).is_nan());
    }
}
