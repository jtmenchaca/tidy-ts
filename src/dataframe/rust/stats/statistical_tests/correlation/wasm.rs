use super::kendall_correlation_test::kendall_test;
use super::pearson_correlation_test::pearson_test;
use super::spearman_correlation_test::spearman_test;
use crate::stats::core::{
    AlternativeType,
    types::{
        KendallCorrelationTestResult, PearsonCorrelationTestResult, SpearmanCorrelationTestResult,
    },
};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn pearson_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> PearsonCorrelationTestResult {
    let alt_type = match alternative {
        "two.sided" => AlternativeType::TwoSided,
        "greater" => AlternativeType::Greater,
        "less" => AlternativeType::Less,
        _ => AlternativeType::TwoSided,
    };
    pearson_test(x, y, alt_type, alpha).unwrap_or_else(|e| PearsonCorrelationTestResult {
        test_statistic: crate::stats::core::types::TestStatistic {
            value: f64::NAN,
            name: "T-Statistic".to_string(),
        },
        p_value: f64::NAN,
        test_name: "Pearson correlation test".to_string(),
        alpha,
        error_message: Some(e),
        confidence_interval: crate::stats::core::types::ConfidenceInterval {
            lower: f64::NAN,
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: f64::NAN,
        effect_size: crate::stats::core::types::EffectSize {
            value: f64::NAN,
            name: "Pearson's R".to_string(),
        },
    })
}

#[wasm_bindgen]
pub fn spearman_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> SpearmanCorrelationTestResult {
    let alt_type = match alternative {
        "two.sided" => AlternativeType::TwoSided,
        "greater" => AlternativeType::Greater,
        "less" => AlternativeType::Less,
        _ => AlternativeType::TwoSided,
    };
    spearman_test(x, y, alt_type, alpha).unwrap_or_else(|e| SpearmanCorrelationTestResult {
        test_name: "Spearman rank correlation test".to_string(),
        p_value: f64::NAN,
        effect_size: crate::stats::core::types::EffectSize {
            value: f64::NAN,
            name: "Spearman's Rho".to_string(),
        },
        test_statistic: crate::stats::core::types::TestStatistic {
            value: f64::NAN,
            name: "T-Statistic".to_string(),
        },
        confidence_interval: crate::stats::core::types::ConfidenceInterval {
            lower: f64::NAN,
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        degrees_of_freedom: f64::NAN,
        alpha,
        error_message: Some(e),
    })
}

#[wasm_bindgen]
pub fn kendall_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> KendallCorrelationTestResult {
    let alt_type = match alternative {
        "two.sided" => AlternativeType::TwoSided,
        "greater" => AlternativeType::Greater,
        "less" => AlternativeType::Less,
        _ => AlternativeType::TwoSided,
    };
    kendall_test(x, y, alt_type, alpha).unwrap_or_else(|e| KendallCorrelationTestResult {
        test_statistic: crate::stats::core::types::TestStatistic {
            value: f64::NAN,
            name: "Z-Statistic".to_string(),
        },
        p_value: f64::NAN,
        test_name: "Kendall rank correlation test".to_string(),
        alpha,
        error_message: Some(e),
        confidence_interval: crate::stats::core::types::ConfidenceInterval {
            lower: f64::NAN,
            upper: f64::NAN,
            confidence_level: 1.0 - alpha,
        },
        effect_size: crate::stats::core::types::EffectSize {
            value: f64::NAN,
            name: "Kendall's Tau".to_string(),
        },
    })
}
