//! WASM bindings for Kruskal-Wallis test

#![cfg(feature = "wasm")]

use super::kruskal_wallis::kruskal_wallis_test;
use crate::stats::core::TestResult;
use wasm_bindgen::prelude::*;

/// WASM export for Kruskal-Wallis test
#[wasm_bindgen]
pub fn kruskal_wallis_test_wasm(
    data: &[f64],
    group_sizes: &[usize],
    alpha: f64,
) -> TestResult {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return TestResult {
                test_type: crate::stats::core::TestType::OneWayAnova,
                test_statistic: Some(0.0),
                p_value: Some(1.0),
                confidence_interval_lower: Some(0.0),
                confidence_interval_upper: Some(0.0),
                effect_size: Some(0.0),
                error_message: Some("Error: Group sizes exceed data length".to_string()),
                ..Default::default()
            };
        }
        groups.push(data[start..start + size].to_vec());
        start += size;
    }

    kruskal_wallis_test(&groups, alpha)
}
