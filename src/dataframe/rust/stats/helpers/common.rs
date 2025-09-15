//! Common helper functions for statistical tests

use crate::stats::core::{TestResult, TestType};

/// Helper function to create error TestResult
pub fn create_error_result(method: &str, error_msg: &str) -> TestResult {
    TestResult::error(method, error_msg)
}
