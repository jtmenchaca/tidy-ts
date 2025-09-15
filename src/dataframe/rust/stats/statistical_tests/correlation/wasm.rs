use wasm_bindgen::prelude::*;
use crate::stats::core::{AlternativeType, TestResult};
use super::correlation_tests::{pearson_test, spearman_test, kendall_test};

#[wasm_bindgen]
pub fn pearson_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> TestResult {
    let alt_type = match alternative {
        "two.sided" => AlternativeType::TwoSided,
        "greater" => AlternativeType::Greater,
        "less" => AlternativeType::Less,
        _ => AlternativeType::TwoSided,
    };
    pearson_test(x, y, alt_type, alpha)
}

#[wasm_bindgen]
pub fn spearman_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> TestResult {
    let alt_type = match alternative {
        "two.sided" => AlternativeType::TwoSided,
        "greater" => AlternativeType::Greater,
        "less" => AlternativeType::Less,
        _ => AlternativeType::TwoSided,
    };
    spearman_test(x, y, alt_type, alpha)
}

#[wasm_bindgen]
pub fn kendall_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> TestResult {
    let alt_type = match alternative {
        "two.sided" => AlternativeType::TwoSided,
        "greater" => AlternativeType::Greater,
        "less" => AlternativeType::Less,
        _ => AlternativeType::TwoSided,
    };
    kendall_test(x, y, alt_type, alpha)
}