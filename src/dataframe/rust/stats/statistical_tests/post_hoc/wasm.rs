//! WASM bindings for post-hoc tests

#![cfg(feature = "wasm")]

use super::types::{DunnTestResult, GamesHowellTestResult, TukeyHsdTestResult};
use super::{dunn_test, games_howell, tukey_hsd};
use wasm_bindgen::prelude::*;

/// WASM export for Tukey HSD test
#[wasm_bindgen]
pub fn tukey_hsd_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> TukeyHsdTestResult {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return TukeyHsdTestResult {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: f64::NAN,
                    name: "Q-Statistic".to_string(),
                },
                p_value: f64::NAN,
                test_name: "Tukey HSD".to_string(),
                alpha,
                error_message: Some("Group sizes exceed data length".to_string()),
                note: None,
                correction_method: "Bonferroni".to_string(),
                n_groups: 0,
                n_total: 0,
                comparisons: Vec::new(),
            };
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    tukey_hsd(&groups, alpha)
}

/// WASM export for Games-Howell test
#[wasm_bindgen]
pub fn games_howell_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> GamesHowellTestResult {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return GamesHowellTestResult {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: f64::NAN,
                    name: "T-Statistic".to_string(),
                },
                p_value: f64::NAN,
                test_name: "Games-Howell".to_string(),
                alpha,
                error_message: Some("Group sizes exceed data length".to_string()),
                note: None,
                correction_method: "Bonferroni".to_string(),
                n_groups: 0,
                n_total: 0,
                comparisons: Vec::new(),
            };
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    games_howell(&groups, alpha)
}

/// WASM export for Dunn's test
#[wasm_bindgen]
pub fn dunn_test_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> DunnTestResult {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return DunnTestResult {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: f64::NAN,
                    name: "Z-Statistic".to_string(),
                },
                p_value: f64::NAN,
                test_name: "Dunn's Test".to_string(),
                alpha,
                error_message: Some("Group sizes exceed data length".to_string()),
                note: None,
                correction_method: "Bonferroni".to_string(),
                n_groups: 0,
                n_total: 0,
                comparisons: Vec::new(),
            };
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    dunn_test(&groups, alpha)
}
