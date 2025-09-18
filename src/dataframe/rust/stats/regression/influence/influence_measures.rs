//! Comprehensive influence measures and analysis
//! 
//! This module provides comprehensive influence measures and analysis
//! equivalent to R's influence_measures.R module.

use super::influence_core::{LinearModel, InfluenceResult, lm_influence};
use super::influence_diagnostics::{dfbetas_lm, dffits, covratio, cooks_distance_lm};
use std::f64;

/// Comprehensive influence measures result
#[derive(Debug, Clone)]
pub struct InfluenceMeasuresResult {
    /// Influence matrix with all measures
    pub infmat: Vec<Vec<f64>>,
    /// Logical matrix indicating influential observations
    pub is_inf: Vec<Vec<bool>>,
    /// Model call information
    pub call: String,
}

/// Check if observations are influential
///
/// This internal function identifies potentially influential observations
/// based on various thresholds.
///
/// # Arguments
///
/// * `infmat` - Influence matrix
/// * `n` - Number of observations with hat > 0
///
/// # Returns
///
/// Logical matrix indicating influential observations
fn is_influential(infmat: &[Vec<f64>], n: usize) -> Result<Vec<Vec<bool>>, &'static str> {
    if infmat.is_empty() {
        return Ok(vec![]);
    }
    
    let k = infmat[0].len() - 4; // Number of dfbetas columns
    if n <= k {
        return Err("too few cases with h_ii > 0");
    }
    
    let mut is_inf = Vec::new();
    
    for row in infmat {
        let mut row_inf = Vec::new();
        
        // Check dfbetas > 1
        for j in 0..k {
            row_inf.push(row[j].abs() > 1.0);
        }
        
        // Check dffits > 3 * sqrt(k/(n-k))
        let dffits_threshold = 3.0 * (k as f64 / (n as f64 - k as f64)).sqrt();
        row_inf.push(row[k].abs() > dffits_threshold);
        
        // Check |1 - cov.ratio| > (3*k)/(n-k)
        let cov_threshold = (3.0 * k as f64) / (n as f64 - k as f64);
        row_inf.push((1.0 - row[k + 1]).abs() > cov_threshold);
        
        // Check Cook's distance (simplified threshold)
        row_inf.push(row[k + 2] > 0.5);
        
        // Check hat > (3*k)/n
        let hat_threshold = (3.0 * k as f64) / n as f64;
        row_inf.push(row[k + 3] > hat_threshold);
        
        is_inf.push(row_inf);
    }
    
    Ok(is_inf)
}

/// Comprehensive influence measures
///
/// This function computes all major influence measures and identifies
/// potentially influential observations.
///
/// # Arguments
///
/// * `model` - Linear model object
/// * `infl` - Influence result (optional)
///
/// # Returns
///
/// Comprehensive influence measures result
pub fn influence_measures(
    model: &LinearModel,
    infl: Option<&InfluenceResult>,
) -> Result<InfluenceMeasuresResult, &'static str> {
    let influence_result = match infl {
        Some(infl) => infl.clone(),
        None => lm_influence(model, true)?,
    };
    
    let p = model.rank;
    let n = model.n;
    
    // Calculate all influence measures
    let dfbetas_vals = dfbetas_lm(model, Some(&influence_result))?;
    let dffits_vals = dffits(model, Some(&influence_result), None)?;
    let cov_ratios = covratio(model, Some(&influence_result), None)?;
    let cooks_vals = cooks_distance_lm(model, Some(&influence_result), None, None, None)?;
    
    // Combine into influence matrix
    let mut infmat = Vec::new();
    for i in 0..n {
        let mut row = Vec::new();
        // Add dfbetas
        for j in 0..p {
            row.push(dfbetas_vals[i][j]);
        }
        // Add other measures
        row.push(dffits_vals[i]);
        row.push(cov_ratios[i]);
        row.push(cooks_vals[i]);
        row.push(influence_result.hat[i]);
        infmat.push(row);
    }
    
    // Identify influential observations
    let n_pos = influence_result.hat.iter().filter(|&&h| h > 0.0).count();
    let is_inf = is_influential(&infmat, n_pos)?;
    
    Ok(InfluenceMeasuresResult {
        infmat,
        is_inf,
        call: "lm.influence".to_string(),
    })
}

/// Print influence measures
///
/// This function prints the influence measures in a formatted table.
///
/// # Arguments
///
/// * `result` - Influence measures result
/// * `digits` - Number of decimal places to display
///
/// # Returns
///
/// Formatted string representation
pub fn print_influence_measures(
    result: &InfluenceMeasuresResult,
    digits: Option<usize>,
) -> String {
    let digits = digits.unwrap_or(3);
    let mut output = String::new();
    
    output.push_str(&format!("Influence measures of\n\t{}\n\n", result.call));
    
    // Find observations with any influential measure
    let is_star: Vec<bool> = result.is_inf.iter()
        .map(|row| row.iter().any(|&val| val))
        .collect();
    
    // Print the influence matrix
    for (i, row) in result.infmat.iter().enumerate() {
        let mut row_str = String::new();
        for val in row {
            if val.is_nan() {
                row_str.push_str("NaN ");
            } else {
                row_str.push_str(&format!("{:.1$} ", val, digits));
            }
        }
        
        // Add influence indicator
        if is_star[i] {
            row_str.push_str("*");
        } else {
            row_str.push_str(" ");
        }
        
        output.push_str(&format!("{}\n", row_str));
    }
    
    output
}

/// Summary of influence measures
///
/// This function provides a summary of potentially influential observations.
///
/// # Arguments
///
/// * `result` - Influence measures result
/// * `digits` - Number of decimal places to display
///
/// # Returns
///
/// Summary string
pub fn summary_influence_measures(
    result: &InfluenceMeasuresResult,
    digits: Option<usize>,
) -> String {
    let digits = digits.unwrap_or(2);
    let mut output = String::new();
    
    output.push_str(&format!("Potentially influential observations of\n\t{}:\n", result.call));
    
    // Find observations with any influential measure
    let is_star: Vec<bool> = result.is_inf.iter()
        .map(|row| row.iter().any(|&val| val))
        .collect();
    
    if is_star.iter().any(|&val| val) {
        output.push_str("\n");
        
        // Print influential observations
        for (i, &is_influential) in is_star.iter().enumerate() {
            if is_influential {
                let mut row_str = String::new();
                for val in &result.infmat[i] {
                    if val.is_nan() {
                        row_str.push_str("NaN ");
                    } else {
                        row_str.push_str(&format!("{:.1$} ", val, digits));
                    }
                }
                
                // Add influence indicators
                for (j, &is_inf) in result.is_inf[i].iter().enumerate() {
                    if is_inf {
                        row_str.push_str(&format!("*{}", j));
                    }
                }
                
                output.push_str(&format!("{}\n", row_str));
            }
        }
    } else {
        output.push_str("NONE\n");
    }
    
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::influence::influence_core::LinearModel;

    #[test]
    fn test_influence_measures() {
        let model = LinearModel {
            x: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0], // 3x2
            y: vec![1.0, 2.0, 3.0],
            n: 3,
            p: 2,
            rank: 2,
            weights: None,
            fitted: vec![1.0, 2.0, 3.0],
            residuals: vec![0.0, 0.0, 0.0],
            qr: None,
            na_action: None,
            deviance: 0.0,
            df_residual: 1.0,
        };
        
        let measures = influence_measures(&model, None).unwrap();
        assert_eq!(measures.infmat.len(), 3);
        assert_eq!(measures.is_inf.len(), 3);
    }

    #[test]
    fn test_print_influence_measures() {
        let result = InfluenceMeasuresResult {
            infmat: vec![
                vec![0.1, 0.2, 0.3, 0.4, 0.5],
                vec![0.2, 0.3, 0.4, 0.5, 0.6],
            ],
            is_inf: vec![
                vec![false, false, false, false, false],
                vec![false, false, false, false, false],
            ],
            call: "test".to_string(),
        };
        
        let output = print_influence_measures(&result, Some(2));
        assert!(output.contains("Influence measures of"));
    }
}
