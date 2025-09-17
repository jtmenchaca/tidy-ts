//! Dunn's test for post-hoc comparisons
//!
//! Non-parametric post-hoc test for pairwise comparisons after significant Kruskal-Wallis test.
//! Uses rank sums and the standard normal distribution.

use super::types::{PairwiseComparison, PostHocResult};
use statrs::distribution::{ContinuousCDF, Normal};
use std::collections::HashMap;

/// Performs Dunn's test for multiple comparisons after Kruskal-Wallis
///
/// # Arguments
/// * `groups` - Vector of groups, where each group is a vector of observations
/// * `alpha` - Significance level (default: 0.05)
///
/// # Returns
/// A PostHocResult containing all pairwise comparisons
pub fn dunn_test<T, I>(groups: &[I], alpha: f64) -> (PostHocResult, Vec<PairwiseComparison>)
where
    T: Into<f64> + Copy,
    I: AsRef<[T]>,
{
    let n_groups = groups.len();
    if n_groups < 2 {
        let mut result = PostHocResult::default();
        result.test_name = "Dunn's Test".to_string();
        result.error_message = Some("Dunn's test requires at least 2 groups".to_string());
        return (result, Vec::new());
    }

    // Convert groups to f64 and collect all values for ranking
    let mut group_data: Vec<Vec<f64>> = Vec::new();
    let mut all_values = Vec::new();
    let mut group_sizes = Vec::new();
    let mut total_n = 0usize;
    
    for group in groups {
        let values: Vec<f64> = group.as_ref().iter().copied().map(Into::into).collect();
        if values.is_empty() {
            let mut result = PostHocResult::default();
            result.test_name = "Dunn's Test".to_string();
            result.error_message = Some("Empty group found".to_string());
            return (result, Vec::new());
        }
        
        group_sizes.push(values.len());
        total_n += values.len();
        all_values.extend(&values);
        group_data.push(values);
    }
    
    // Create ranks for all observations
    let mut indexed_values: Vec<(f64, usize)> = all_values.iter().enumerate().map(|(i, &v)| (v, i)).collect();
    indexed_values.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    
    // Assign ranks (handling ties with average ranks)
    let mut ranks = vec![0.0; all_values.len()];
    let mut i = 0;
    
    while i < indexed_values.len() {
        let current_value = indexed_values[i].0;
        let mut j = i;
        
        // Find all tied values
        while j < indexed_values.len() && indexed_values[j].0 == current_value {
            j += 1;
        }
        
        // Calculate average rank for tied values
        let avg_rank = ((i + 1) + j) as f64 / 2.0;
        
        // Assign average rank to all tied values
        for k in i..j {
            ranks[indexed_values[k].1] = avg_rank;
        }
        
        i = j;
    }
    
    // Calculate rank sums for each group
    let mut rank_sums = Vec::new();
    let mut current_idx = 0;
    
    for &size in &group_sizes {
        let rank_sum: f64 = ranks[current_idx..current_idx + size].iter().sum();
        rank_sums.push(rank_sum);
        current_idx += size;
    }
    
    // Calculate tie correction factor
    let mut tie_correction = 0.0;
    let mut value_counts = HashMap::new();
    
    for &value in &all_values {
        *value_counts.entry(value.to_bits()).or_insert(0) += 1;
    }
    
    for &count in value_counts.values() {
        if count > 1 {
            tie_correction += count as f64 * (count as f64 * count as f64 - 1.0);
        }
    }
    
    let variance_factor = (total_n as f64 * (total_n as f64 + 1.0) / 12.0) * (1.0 - tie_correction / (total_n as f64 * (total_n as f64 * total_n as f64 - 1.0)));
    
    // Perform pairwise comparisons
    let mut comparisons = Vec::new();
    let n_comparisons = n_groups * (n_groups - 1) / 2;
    
    let std_normal = Normal::new(0.0, 1.0).unwrap();
    
    for i in 0..n_groups {
        for j in (i + 1)..n_groups {
            let n_i = group_sizes[i] as f64;
            let n_j = group_sizes[j] as f64;
            let r_i = rank_sums[i];
            let r_j = rank_sums[j];
            
            // Mean rank difference
            let mean_rank_i = r_i / n_i;
            let mean_rank_j = r_j / n_j;
            let mean_rank_diff = mean_rank_i - mean_rank_j;
            
            // Standard error for rank difference
            let se = (variance_factor * (1.0 / n_i + 1.0 / n_j)).sqrt();
            
            // Z-statistic
            let z_statistic = mean_rank_diff.abs() / se;
            
            // P-value (two-tailed)
            let p_value = 2.0 * (1.0 - std_normal.cdf(z_statistic));
            
            // Adjust p-value using Bonferroni correction
            let adjusted_p = (p_value * n_comparisons as f64).min(1.0);
            
            // Confidence interval for rank difference
            let critical_z = std_normal.inverse_cdf(1.0 - alpha / (2.0 * n_comparisons as f64));
            let ci_margin = critical_z * se;
            let ci_lower = mean_rank_diff - ci_margin;
            let ci_upper = mean_rank_diff + ci_margin;
            
            let comparison = PairwiseComparison {
                group1: format!("Group_{}", i + 1),
                group2: format!("Group_{}", j + 1),
                mean_difference: Some(mean_rank_diff),
                std_error: Some(se),
                test_statistic: Some(z_statistic),
                p_value: Some(p_value),
                adjusted_p_value: Some(adjusted_p),
                ci_lower: Some(ci_lower),
                ci_upper: Some(ci_upper),
                significant: Some(adjusted_p < alpha),
            };
            
            comparisons.push(comparison);
        }
    }
    
    let result = PostHocResult {
        test_name: "Dunn's Test".to_string(),
        correction_method: Some("Bonferroni".to_string()),
        alpha: Some(alpha),
        n_groups: Some(n_groups),
        n_total: Some(total_n),
        error_message: None,
    };
    
    (result, comparisons)
}