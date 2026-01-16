use std::error::Error;
use std::fmt;

/// Custom error type for statistical computations in the hypors library.
///
/// This enum represents various error conditions that can occur during
/// statistical hypothesis testing operations. It implements the standard
/// `Error` and `Display` traits to integrate well with Rust's error handling ecosystem.
///
/// # Variants
///
/// * `EmptyData` - Indicates that no data was provided for analysis
/// * `InsufficientData` - Indicates that not enough data points were provided for the statistical test
/// * `ComputeError` - Indicates a computational error occurred during the statistical analysis
///
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StatError {
    /// Indicates that no data was provided for statistical analysis.
    ///
    /// This error occurs when an empty dataset is passed to a statistical function
    /// that requires at least one data point to perform meaningful calculations.
    ///
    EmptyData,

    /// Indicates that insufficient data was provided for the statistical test.
    ///
    /// This error occurs when the dataset contains some data points but not enough
    /// to perform the requested statistical operation. For example, calculating
    /// sample variance requires at least 2 data points.
    ///
    InsufficientData,

    /// Indicates a computational error occurred during statistical analysis.
    ///
    /// This error wraps specific error messages that describe what went wrong
    /// during the computation, such as numerical instability, invalid parameters,
    /// or mathematical operations that cannot be completed.
    ///
    ComputeError(String),
}

impl fmt::Display for StatError {
    /// Formats the error for display to users.
    ///
    /// This implementation provides human-readable error messages that can be
    /// displayed in console output, logs, or user interfaces.
    ///
    /// # Arguments
    ///
    /// * `f` - The formatter to write the error message to
    ///
    /// # Returns
    ///
    /// A `fmt::Result` indicating whether the formatting was successful
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            StatError::EmptyData => write!(f, "Cannot perform test on empty data"),
            StatError::InsufficientData => write!(f, "Insufficient data for statistical test"),
            StatError::ComputeError(msg) => write!(f, "Computation error: {msg}"),
        }
    }
}

impl Error for StatError {}
