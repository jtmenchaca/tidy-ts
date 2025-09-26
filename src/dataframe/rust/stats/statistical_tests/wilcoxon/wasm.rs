//! WASM bindings for Wilcoxon tests

#![cfg(feature = "wasm")]

use crate::stats::core::types::{
    EffectSize, EffectSizeType, TestStatistic, TestStatisticName, WilcoxonSignedRankTestResult,
};
use wasm_bindgen::prelude::*;

/// WASM export for Wilcoxon W test (paired)
#[wasm_bindgen]
pub fn wilcoxon_w_test(
    x: &[f64],
    y: &[f64],
    alpha: f64,
    alternative: &str,
) -> WilcoxonSignedRankTestResult {
    use super::wilcoxon_w::WilcoxonWTest;
    WilcoxonWTest::paired(x, y, alpha, alternative).unwrap_or_else(|e| {
        WilcoxonSignedRankTestResult {
            test_statistic: TestStatistic {
                value: f64::NAN,
                name: TestStatisticName::WStatistic.as_str().to_string(),
            },
            p_value: f64::NAN,
            test_name: "Wilcoxon Signed-Rank Test".to_string(),
            method: "Error".to_string(),
            alpha,
            error_message: Some(e),
            effect_size: EffectSize {
                value: f64::NAN,
                name: EffectSizeType::RankBiserialCorrelation.as_str().to_string(),
            },
        }
    })
}
