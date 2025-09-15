//! WASM bindings for ANOVA tests

#![cfg(feature = "wasm")]

use super::{
    anova, anova_two_way as anova_two_way_impl, anova_two_way_factor_a, anova_two_way_factor_b,
    anova_two_way_interaction,
};
use crate::stats::core::TestResult;
use crate::stats::helpers::create_error_result;
use wasm_bindgen::prelude::*;

/// WASM export for one-way ANOVA
#[wasm_bindgen]
pub fn anova_one_way(data: &[f64], group_sizes: &[usize], alpha: f64) -> TestResult {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return create_error_result("One-way ANOVA", "Group sizes exceed data length");
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    anova(&groups, alpha)
}

/// WASM export for two-way ANOVA factor A
#[wasm_bindgen]
pub fn anova_two_way_factor_a_wasm(
    data: &[f64],
    a_levels: usize,
    b_levels: usize,
    cell_sizes: &[usize],
    alpha: f64,
) -> TestResult {
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

    anova_two_way_factor_a(&two_way_data, alpha)
}

/// WASM export for two-way ANOVA factor B
#[wasm_bindgen]
pub fn anova_two_way_factor_b_wasm(
    data: &[f64],
    a_levels: usize,
    b_levels: usize,
    cell_sizes: &[usize],
    alpha: f64,
) -> TestResult {
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

    anova_two_way_factor_b(&two_way_data, alpha)
}

/// WASM export for two-way ANOVA interaction
#[wasm_bindgen]
pub fn anova_two_way_interaction_wasm(
    data: &[f64],
    a_levels: usize,
    b_levels: usize,
    cell_sizes: &[usize],
    alpha: f64,
) -> TestResult {
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

    anova_two_way_interaction(&two_way_data, alpha)
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
) -> TestResult {
    if cell_sizes.len() != a_levels * b_levels {
        return create_error_result(
            "Two-way ANOVA",
            "Cell sizes array length must equal a_levels * b_levels",
        );
    }

    // Convert groups to the expected format for two-way ANOVA
    let mut two_way_data = Vec::new();
    let mut start = 0;
    for i in 0..a_levels {
        let mut a_level = Vec::new();
        for j in 0..b_levels {
            let cell_size = cell_sizes[i * b_levels + j];
            if start + cell_size > data.len() {
                return create_error_result("Two-way ANOVA", "Cell sizes exceed data length");
            }
            let cell_data: Vec<f64> = data[start..start + cell_size].to_vec();
            a_level.push(cell_data);
            start += cell_size;
        }
        two_way_data.push(a_level);
    }

    anova_two_way_impl(&two_way_data, alpha)
}
