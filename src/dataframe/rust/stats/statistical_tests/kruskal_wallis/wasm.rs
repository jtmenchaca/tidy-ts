//! WASM bindings for Kruskal-Wallis test

#![cfg(feature = "wasm")]

use super::kruskal_wallis::kruskal_wallis_test;
use crate::stats::core::types::{
    EffectSize, EffectSizeType, KruskalWallisTestResult, TestStatistic, TestStatisticName,
};
use wasm_bindgen::prelude::*;

/// WASM export for Kruskal-Wallis test
#[wasm_bindgen]
pub fn kruskal_wallis_test_wasm(
    data: &[f64],
    group_sizes: &[usize],
    alpha: f64,
) -> KruskalWallisTestResult {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return KruskalWallisTestResult {
                test_statistic: TestStatistic {
                    value: f64::NAN,
                    name: TestStatisticName::HStatistic.as_str().to_string(),
                },
                p_value: f64::NAN,
                test_name: "Kruskal-Wallis Test".to_string(),
                alpha,
                error_message: Some("Error: Group sizes exceed data length".to_string()),
                degrees_of_freedom: f64::NAN,
                effect_size: EffectSize {
                    value: f64::NAN,
                    name: EffectSizeType::EtaSquared.as_str().to_string(),
                },
                sample_size: 0,
            };
        }
        groups.push(data[start..start + size].to_vec());
        start += size;
    }

    kruskal_wallis_test(&groups, alpha).unwrap_or_else(|e| KruskalWallisTestResult {
        test_statistic: TestStatistic {
            value: f64::NAN,
            name: TestStatisticName::HStatistic.as_str().to_string(),
        },
        p_value: f64::NAN,
        test_name: "Kruskal-Wallis Test".to_string(),
        alpha,
        error_message: Some(e),
        degrees_of_freedom: f64::NAN,
        effect_size: EffectSize {
            value: f64::NAN,
            name: EffectSizeType::EtaSquared.as_str().to_string(),
        },
        sample_size: 0,
    })
}
