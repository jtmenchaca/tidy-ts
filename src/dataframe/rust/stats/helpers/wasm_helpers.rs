//! Helper functions for WASM bindings

#![cfg(feature = "wasm")]

// Removed unused import
use crate::stats::core::{AlternativeType, TestResult, TestType};

/// Helper function to convert string alternative to AlternativeType
pub fn parse_alternative(alternative: &str) -> AlternativeType {
    AlternativeType::from_str(alternative)
}

/// Helper function to create TestResult with custom fields
pub fn create_result(
    test_statistic: f64,
    p_value: f64,
    confidence_interval: (f64, f64),
    null_hypothesis: String,
    alt_hypothesis: String,
    reject_null: bool,
    effect_size: f64,
    test_type: TestType,
) -> TestResult {
    TestResult {
        test_type,
        test_statistic: Some(test_statistic),
        p_value: Some(p_value),
        confidence_interval_lower: Some(confidence_interval.0),
        confidence_interval_upper: Some(confidence_interval.1),
        effect_size: Some(effect_size),
        ..Default::default()
    }
}
