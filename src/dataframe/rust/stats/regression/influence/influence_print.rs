//! Print and summary methods for influence measures
//! 
//! This module provides print and summary methods
//! equivalent to R's influence_print.R module.

use super::influence_measures::InfluenceMeasuresResult;

/// Print influence measures
///
/// This function prints the influence measures in a formatted table,
/// equivalent to R's print.infl() function.
///
/// # Arguments
///
/// * `result` - Influence measures result
/// * `digits` - Number of decimal places to display
///
/// # Returns
///
/// Formatted string representation
pub fn print_infl(
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
/// This function provides a summary of potentially influential observations,
/// equivalent to R's summary.infl() function.
///
/// # Arguments
///
/// * `result` - Influence measures result
/// * `digits` - Number of decimal places to display
///
/// # Returns
///
/// Summary string
pub fn summary_infl(
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

/// Display trait implementation for InfluenceMeasuresResult
impl std::fmt::Display for InfluenceMeasuresResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", print_infl(self, None))
    }
}

// Debug trait implementation is already derived in influence_measures.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_print_infl() {
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
        
        let output = print_infl(&result, Some(2));
        assert!(output.contains("Influence measures of"));
        assert!(output.contains("test"));
    }

    #[test]
    fn test_summary_infl() {
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
        
        let output = summary_infl(&result, Some(2));
        assert!(output.contains("Potentially influential observations"));
        assert!(output.contains("NONE"));
    }

    #[test]
    fn test_display_trait() {
        let result = InfluenceMeasuresResult {
            infmat: vec![
                vec![0.1, 0.2, 0.3, 0.4, 0.5],
            ],
            is_inf: vec![
                vec![false, false, false, false, false],
            ],
            call: "test".to_string(),
        };
        
        let output = format!("{}", result);
        assert!(output.contains("Influence measures of"));
    }
}
