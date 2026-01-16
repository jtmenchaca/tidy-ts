#[cfg(feature = "wasm")]
use super::levene_test;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::stats::core::types::{
    EffectSize, EffectSizeType, OneWayAnovaTestResult, TestStatistic, TestStatisticName,
};

/// WASM wrapper for Levene's test for equality of variances
///
/// Tests whether groups have equal variances using the Brown-Forsythe
/// modification (deviations from medians rather than means).
///
/// # Arguments
/// * `data` - Flattened array of all group data
/// * `group_sizes` - Array of group sizes
/// * `alpha` - Significance level
///
/// # Returns
/// * `OneWayAnovaTestResult` - F-statistic, p-value, degrees of freedom
///   - p < alpha indicates unequal variances (reject null hypothesis)
///   - p >= alpha suggests equal variances (fail to reject null hypothesis)
#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn levene_test_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> OneWayAnovaTestResult {
    // Validate alpha
    if !(0.0..=1.0).contains(&alpha) {
        return OneWayAnovaTestResult {
            test_statistic: TestStatistic {
                value: 0.0,
                name: TestStatisticName::FStatistic.as_str().to_string(),
            },
            p_value: 1.0,
            test_name: "Levene's Test".to_string(),
            alpha,
            error_message: Some("Alpha must be between 0 and 1".to_string()),
            df_between: 0.0,
            df_within: 0.0,
            effect_size: EffectSize {
                value: 0.0,
                name: EffectSizeType::EtaSquared.as_str().to_string(),
            },
            sample_size: 0,
            sample_means: vec![],
            sample_std_devs: vec![],
            sum_of_squares: vec![],
            r_squared: 0.0,
            adjusted_r_squared: 0.0,
        };
    }

    // Reconstruct groups from flat data (inline reconstruction like ANOVA)
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return OneWayAnovaTestResult {
                test_statistic: TestStatistic {
                    value: 0.0,
                    name: TestStatisticName::FStatistic.as_str().to_string(),
                },
                p_value: 1.0,
                test_name: "Levene's Test".to_string(),
                alpha,
                error_message: Some("Group sizes exceed data length".to_string()),
                df_between: 0.0,
            df_within: 0.0,
                effect_size: EffectSize {
                    value: 0.0,
                    name: EffectSizeType::EtaSquared.as_str().to_string(),
                },
                sample_size: 0,
                sample_means: vec![],
                sample_std_devs: vec![],
                sum_of_squares: vec![],
                r_squared: 0.0,
                adjusted_r_squared: 0.0,
            };
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    // Run Levene's test
    match levene_test(&groups, alpha) {
        Ok(result) => result,
        Err(e) => OneWayAnovaTestResult {
            test_statistic: TestStatistic {
                value: 0.0,
                name: TestStatisticName::FStatistic.as_str().to_string(),
            },
            p_value: 1.0,
            test_name: "Levene's Test".to_string(),
            alpha,
            error_message: Some(e),
            df_between: 0.0,
            df_within: 0.0,
            effect_size: EffectSize {
                value: 0.0,
                name: EffectSizeType::EtaSquared.as_str().to_string(),
            },
            sample_size: 0,
            sample_means: vec![],
            sample_std_devs: vec![],
            sum_of_squares: vec![],
            r_squared: 0.0,
            adjusted_r_squared: 0.0,
        },
    }
}
