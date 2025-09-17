//! GLM control parameters

use super::types::GlmControl;

/// GLM control function
///
/// This function creates control parameters for GLM fitting.
///
/// # Arguments
///
/// * `epsilon` - Convergence tolerance for the IRLS algorithm (default: 1e-8)
/// * `maxit` - Maximum number of iterations (default: 25)  
/// * `trace` - Whether to print iteration information (default: false)
///
/// # Returns
///
/// A `GlmControl` struct with the specified parameters.
///
/// # Errors
///
/// Returns an error if any parameter is invalid:
/// - `epsilon` must be > 0
/// - `maxit` must be > 0
///
/// # Examples
///
/// ```rust
/// use crate::stats::regression::glm::glm_control::glm_control;
///
/// // Default parameters
/// let control = glm_control(None, None, None).unwrap();
///
/// // Custom parameters
/// let control = glm_control(Some(1e-6), Some(50), Some(true)).unwrap();
/// ```
pub fn glm_control(
    epsilon: Option<f64>,
    maxit: Option<usize>,
    trace: Option<bool>,
) -> Result<GlmControl, String> {
    let epsilon = epsilon.unwrap_or(1e-8);
    let maxit = maxit.unwrap_or(25);
    let trace = trace.unwrap_or(false);

    // Validate parameters
    if !epsilon.is_finite() || epsilon <= 0.0 {
        return Err("value of 'epsilon' must be > 0".to_string());
    }
    if maxit <= 0 {
        return Err("maximum number of iterations must be > 0".to_string());
    }

    Ok(GlmControl {
        epsilon,
        maxit,
        trace,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_glm_control_default() {
        let control = glm_control(None, None, None).unwrap();
        assert_eq!(control.epsilon, 1e-8);
        assert_eq!(control.maxit, 25);
        assert_eq!(control.trace, false);
    }

    #[test]
    fn test_glm_control_custom() {
        let control = glm_control(Some(1e-6), Some(50), Some(true)).unwrap();
        assert_eq!(control.epsilon, 1e-6);
        assert_eq!(control.maxit, 50);
        assert_eq!(control.trace, true);
    }

    #[test]
    fn test_glm_control_validation() {
        // Test invalid epsilon
        assert!(glm_control(Some(0.0), None, None).is_err());
        assert!(glm_control(Some(-1.0), None, None).is_err());
        assert!(glm_control(Some(f64::NAN), None, None).is_err());
        assert!(glm_control(Some(f64::INFINITY), None, None).is_err());

        // Test invalid maxit
        assert!(glm_control(None, Some(0), None).is_err());

        // Test valid parameters
        assert!(glm_control(Some(1e-6), Some(50), Some(true)).is_ok());
    }
}
