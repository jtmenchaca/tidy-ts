//! Linear model printing and formatting functions

use super::lm_types::{LmResult, LmSummary, AnovaTable};

/// Print linear model result
pub fn print_lm(result: &LmResult, digits: Option<usize>) {
    let digits = digits.unwrap_or(3);
    
    println!("Linear Model Result:");
    println!("Coefficients: {:?}", result.coefficients);
    println!("Residuals: {:?}", result.residuals);
    println!("Fitted Values: {:?}", result.fitted_values);
    println!("Rank: {}", result.rank);
    println!("DF Residual: {}", result.df_residual);
    println!("Tolerance: {:.6}", result.tol);
    println!("Pivoted: {}", result.pivoted);
}

/// Print linear model summary
pub fn print_summary_lm(summary: &LmSummary, digits: Option<usize>) {
    let digits = digits.unwrap_or(3);
    
    println!("Linear Model Summary:");
    println!("Residual standard error: {:.6} on {} degrees of freedom", 
             summary.sigma, summary.df[1]);
    println!("Multiple R-squared: {:.6}, Adjusted R-squared: {:.6}", 
             summary.r_squared, summary.adj_r_squared);
    
    if let Some(fstat) = &summary.fstatistic {
        println!("F-statistic: {:.6} on {} and {} DF, p-value: {:.6}", 
                 fstat.value, fstat.num_df, fstat.den_df, fstat.p_value);
    }
    
    println!("\nCoefficients:");
    println!("{:>12} {:>12} {:>12} {:>12} {:>12}", 
             "Estimate", "Std.Error", "t value", "Pr(>|t|)", "Signif.");
    
    for (i, coef) in summary.coefficients.iter().enumerate() {
        let significance = if coef.p_value < 0.001 {
            "***"
        } else if coef.p_value < 0.01 {
            "**"
        } else if coef.p_value < 0.05 {
            "*"
        } else if coef.p_value < 0.1 {
            "."
        } else {
            " "
        };
        
        println!("{:>12.6} {:>12.6} {:>12.6} {:>12.6} {:>12}", 
                 coef.estimate, coef.std_error, coef.t_value, coef.p_value, significance);
    }
}

/// Print ANOVA table
pub fn print_anova_lm(table: &AnovaTable) {
    println!("Analysis of Variance Table");
    println!();
    println!("{:>12} {:>12} {:>12} {:>12} {:>12} {:>12}", 
             "Df", "Sum Sq", "Mean Sq", "F value", "Pr(>F)", "Source");
    println!("{}", "-".repeat(72));
    
    for row in &table.rows {
        let f_value_str = if let Some(f) = row.f_value {
            format!("{:.6}", f)
        } else {
            "".to_string()
        };
        
        let p_value_str = if let Some(p) = row.p_value {
            format!("{:.6}", p)
        } else {
            "".to_string()
        };
        
        println!("{:>12} {:>12.6} {:>12.6} {:>12} {:>12} {:>12}", 
                 row.df, row.sum_sq, row.mean_sq, f_value_str, p_value_str, row.source);
    }
}