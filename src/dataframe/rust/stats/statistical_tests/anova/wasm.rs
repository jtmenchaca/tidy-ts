//! WASM bindings for ANOVA tests

#![cfg(feature = "wasm")]

use super::{
    anova, anova_two_way as anova_two_way_impl, anova_two_way_factor_a, anova_two_way_factor_b,
    anova_two_way_interaction, welch_anova,
};
use crate::stats::core::types::{OneWayAnovaTestResult, TwoWayAnovaTestResult};
use wasm_bindgen::prelude::*;

/// WASM export for one-way ANOVA
#[wasm_bindgen]
pub fn anova_one_way(data: &[f64], group_sizes: &[usize], alpha: f64) -> OneWayAnovaTestResult {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return OneWayAnovaTestResult {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: crate::stats::core::types::TestStatisticName::FStatistic
                        .as_str()
                        .to_string(),
                },
                p_value: 1.0,
                test_name: "One-way ANOVA".to_string(),
                alpha,
                error_message: Some("Group sizes exceed data length".to_string()),
                degrees_of_freedom: 0.0,
                effect_size: crate::stats::core::types::EffectSize {
                    value: 0.0,
                    effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                        .as_str()
                        .to_string(),
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

    match anova(&groups, alpha) {
        Ok(result) => result,
        Err(error_msg) => OneWayAnovaTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: 0.0,
                name: crate::stats::core::types::TestStatisticName::FStatistic
                    .as_str()
                    .to_string(),
            },
            p_value: 1.0,
            test_name: "One-way ANOVA".to_string(),
            alpha,
            error_message: Some(error_msg),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                    .as_str()
                    .to_string(),
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

/// WASM export for two-way ANOVA factor A
#[wasm_bindgen]
pub fn anova_two_way_factor_a_wasm(
    data: &[f64],
    a_levels: usize,
    b_levels: usize,
    cell_sizes: &[usize],
    alpha: f64,
) -> OneWayAnovaTestResult {
    // Convert flattened data to 2D format
    let mut two_way_data = Vec::new();
    let mut start = 0;
    for i in 0..a_levels {
        let mut a_level = Vec::new();
        for j in 0..b_levels {
            let cell_size = cell_sizes[i * b_levels + j];
            let cell_data: Vec<f64> = data[start..start + cell_size].to_vec();
            a_level.push(cell_data);
            start += cell_size;
        }
        two_way_data.push(a_level);
    }

    match anova_two_way_factor_a(&two_way_data, alpha) {
        Ok(result) => result,
        Err(error_msg) => OneWayAnovaTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: 0.0,
                name: crate::stats::core::types::TestStatisticName::FStatistic
                    .as_str()
                    .to_string(),
            },
            p_value: 1.0,
            test_name: "Two-way ANOVA (Factor A)".to_string(),
            alpha,
            error_message: Some(error_msg),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                    .as_str()
                    .to_string(),
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

/// WASM export for two-way ANOVA factor B
#[wasm_bindgen]
pub fn anova_two_way_factor_b_wasm(
    data: &[f64],
    a_levels: usize,
    b_levels: usize,
    cell_sizes: &[usize],
    alpha: f64,
) -> OneWayAnovaTestResult {
    // Convert flattened data to 2D format
    let mut two_way_data = Vec::new();
    let mut start = 0;
    for i in 0..a_levels {
        let mut a_level = Vec::new();
        for j in 0..b_levels {
            let cell_size = cell_sizes[i * b_levels + j];
            let cell_data: Vec<f64> = data[start..start + cell_size].to_vec();
            a_level.push(cell_data);
            start += cell_size;
        }
        two_way_data.push(a_level);
    }

    match anova_two_way_factor_b(&two_way_data, alpha) {
        Ok(result) => result,
        Err(error_msg) => OneWayAnovaTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: 0.0,
                name: crate::stats::core::types::TestStatisticName::FStatistic
                    .as_str()
                    .to_string(),
            },
            p_value: 1.0,
            test_name: "Two-way ANOVA (Factor B)".to_string(),
            alpha,
            error_message: Some(error_msg),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                    .as_str()
                    .to_string(),
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

/// WASM export for two-way ANOVA interaction
#[wasm_bindgen]
pub fn anova_two_way_interaction_wasm(
    data: &[f64],
    a_levels: usize,
    b_levels: usize,
    cell_sizes: &[usize],
    alpha: f64,
) -> OneWayAnovaTestResult {
    // Convert flattened data to 2D format
    let mut two_way_data = Vec::new();
    let mut start = 0;
    for i in 0..a_levels {
        let mut a_level = Vec::new();
        for j in 0..b_levels {
            let cell_size = cell_sizes[i * b_levels + j];
            let cell_data: Vec<f64> = data[start..start + cell_size].to_vec();
            a_level.push(cell_data);
            start += cell_size;
        }
        two_way_data.push(a_level);
    }

    match anova_two_way_interaction(&two_way_data, alpha) {
        Ok(result) => result,
        Err(error_msg) => OneWayAnovaTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: 0.0,
                name: crate::stats::core::types::TestStatisticName::FStatistic
                    .as_str()
                    .to_string(),
            },
            p_value: 1.0,
            test_name: "Two-way ANOVA (Interaction)".to_string(),
            alpha,
            error_message: Some(error_msg),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                    .as_str()
                    .to_string(),
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

/// WASM export for two-way ANOVA
/// Takes flattened data with group information to reconstruct 2D factorial design
#[wasm_bindgen]
pub fn anova_two_way(
    data: &[f64],
    a_levels: usize,
    b_levels: usize,
    cell_sizes: &[usize],
    alpha: f64,
) -> TwoWayAnovaTestResult {
    if cell_sizes.len() != a_levels * b_levels {
        return TwoWayAnovaTestResult {
            factor_a: crate::stats::core::types::AnovaTestComponent {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: crate::stats::core::types::TestStatisticName::FStatistic
                        .as_str()
                        .to_string(),
                },
                p_value: 1.0,
                degrees_of_freedom: 0.0,
                effect_size: crate::stats::core::types::EffectSize {
                    value: 0.0,
                    effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                        .as_str()
                        .to_string(),
                },
                mean_square: 0.0,
                sum_of_squares: 0.0,
            },
            factor_b: crate::stats::core::types::AnovaTestComponent {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: crate::stats::core::types::TestStatisticName::FStatistic
                        .as_str()
                        .to_string(),
                },
                p_value: 1.0,
                degrees_of_freedom: 0.0,
                effect_size: crate::stats::core::types::EffectSize {
                    value: 0.0,
                    effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                        .as_str()
                        .to_string(),
                },
                mean_square: 0.0,
                sum_of_squares: 0.0,
            },
            interaction: crate::stats::core::types::AnovaTestComponent {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: crate::stats::core::types::TestStatisticName::FStatistic
                        .as_str()
                        .to_string(),
                },
                p_value: 1.0,
                degrees_of_freedom: 0.0,
                effect_size: crate::stats::core::types::EffectSize {
                    value: 0.0,
                    effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                        .as_str()
                        .to_string(),
                },
                mean_square: 0.0,
                sum_of_squares: 0.0,
            },
            test_name: "Two-way ANOVA".to_string(),
            alpha,
            error_message: Some(
                "Cell sizes array length must equal a_levels * b_levels".to_string(),
            ),
            sample_size: 0,
            sample_means: vec![],
            sample_std_devs: vec![],
            sum_of_squares: vec![],
            grand_mean: 0.0,
        };
    }

    // Convert groups to the expected format for two-way ANOVA
    let mut two_way_data = Vec::new();
    let mut start = 0;
    for i in 0..a_levels {
        let mut a_level = Vec::new();
        for j in 0..b_levels {
            let cell_size = cell_sizes[i * b_levels + j];
            if start + cell_size > data.len() {
                return TwoWayAnovaTestResult {
                    factor_a: crate::stats::core::types::AnovaTestComponent {
                        test_statistic: crate::stats::core::types::TestStatistic {
                            value: 0.0,
                            name: crate::stats::core::types::TestStatisticName::FStatistic
                                .as_str()
                                .to_string(),
                        },
                        p_value: 1.0,
                        degrees_of_freedom: 0.0,
                        effect_size: crate::stats::core::types::EffectSize {
                            value: 0.0,
                            effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                                .as_str()
                                .to_string(),
                        },
                        mean_square: 0.0,
                        sum_of_squares: 0.0,
                    },
                    factor_b: crate::stats::core::types::AnovaTestComponent {
                        test_statistic: crate::stats::core::types::TestStatistic {
                            value: 0.0,
                            name: crate::stats::core::types::TestStatisticName::FStatistic
                                .as_str()
                                .to_string(),
                        },
                        p_value: 1.0,
                        degrees_of_freedom: 0.0,
                        effect_size: crate::stats::core::types::EffectSize {
                            value: 0.0,
                            effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                                .as_str()
                                .to_string(),
                        },
                        mean_square: 0.0,
                        sum_of_squares: 0.0,
                    },
                    interaction: crate::stats::core::types::AnovaTestComponent {
                        test_statistic: crate::stats::core::types::TestStatistic {
                            value: 0.0,
                            name: crate::stats::core::types::TestStatisticName::FStatistic
                                .as_str()
                                .to_string(),
                        },
                        p_value: 1.0,
                        degrees_of_freedom: 0.0,
                        effect_size: crate::stats::core::types::EffectSize {
                            value: 0.0,
                            effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                                .as_str()
                                .to_string(),
                        },
                        mean_square: 0.0,
                        sum_of_squares: 0.0,
                    },
                    test_name: "Two-way ANOVA".to_string(),
                    alpha,
                    error_message: Some("Cell sizes exceed data length".to_string()),
                    sample_size: 0,
                    sample_means: vec![],
                    sample_std_devs: vec![],
                    sum_of_squares: vec![],
                    grand_mean: 0.0,
                };
            }
            let cell_data: Vec<f64> = data[start..start + cell_size].to_vec();
            a_level.push(cell_data);
            start += cell_size;
        }
        two_way_data.push(a_level);
    }

    match anova_two_way_impl(&two_way_data, alpha) {
        Ok(result) => result,
        Err(error_msg) => TwoWayAnovaTestResult {
            factor_a: crate::stats::core::types::AnovaTestComponent {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: crate::stats::core::types::TestStatisticName::FStatistic
                        .as_str()
                        .to_string(),
                },
                p_value: 1.0,
                degrees_of_freedom: 0.0,
                effect_size: crate::stats::core::types::EffectSize {
                    value: 0.0,
                    effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                        .as_str()
                        .to_string(),
                },
                mean_square: 0.0,
                sum_of_squares: 0.0,
            },
            factor_b: crate::stats::core::types::AnovaTestComponent {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: crate::stats::core::types::TestStatisticName::FStatistic
                        .as_str()
                        .to_string(),
                },
                p_value: 1.0,
                degrees_of_freedom: 0.0,
                effect_size: crate::stats::core::types::EffectSize {
                    value: 0.0,
                    effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                        .as_str()
                        .to_string(),
                },
                mean_square: 0.0,
                sum_of_squares: 0.0,
            },
            interaction: crate::stats::core::types::AnovaTestComponent {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: crate::stats::core::types::TestStatisticName::FStatistic
                        .as_str()
                        .to_string(),
                },
                p_value: 1.0,
                degrees_of_freedom: 0.0,
                effect_size: crate::stats::core::types::EffectSize {
                    value: 0.0,
                    effect_type: crate::stats::core::types::EffectSizeType::EtaSquared
                        .as_str()
                        .to_string(),
                },
                mean_square: 0.0,
                sum_of_squares: 0.0,
            },
            test_name: "Two-way ANOVA".to_string(),
            alpha,
            error_message: Some(error_msg),
            sample_size: 0,
            sample_means: vec![],
            sample_std_devs: vec![],
            sum_of_squares: vec![],
            grand_mean: 0.0,
        },
    }
}

/// WASM export for Welch's ANOVA (unequal variances)
#[wasm_bindgen]
pub fn welch_anova_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> OneWayAnovaTestResult {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return OneWayAnovaTestResult {
                test_statistic: crate::stats::core::types::TestStatistic {
                    value: 0.0,
                    name: crate::stats::core::types::TestStatisticName::FStatistic
                        .as_str()
                        .to_string(),
                },
                p_value: 1.0,
                test_name: "Welch's ANOVA".to_string(),
                alpha,
                error_message: Some("Group sizes exceed data length".to_string()),
                degrees_of_freedom: 0.0,
                effect_size: crate::stats::core::types::EffectSize {
                    value: 0.0,
                    effect_type: crate::stats::core::types::EffectSizeType::OmegaSquared
                        .as_str()
                        .to_string(),
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

    match welch_anova(&groups, alpha) {
        Ok(result) => result,
        Err(error_msg) => OneWayAnovaTestResult {
            test_statistic: crate::stats::core::types::TestStatistic {
                value: 0.0,
                name: crate::stats::core::types::TestStatisticName::FStatistic
                    .as_str()
                    .to_string(),
            },
            p_value: 1.0,
            test_name: "Welch's ANOVA".to_string(),
            alpha,
            error_message: Some(error_msg),
            degrees_of_freedom: 0.0,
            effect_size: crate::stats::core::types::EffectSize {
                value: 0.0,
                effect_type: crate::stats::core::types::EffectSizeType::OmegaSquared
                    .as_str()
                    .to_string(),
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
