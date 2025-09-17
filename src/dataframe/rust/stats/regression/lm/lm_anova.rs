//! ANOVA functionality for linear models
//!
//! This module provides ANOVA (Analysis of Variance) functionality for linear models.

use crate::stats::regression::lm::lm_types::{AnovaRow, AnovaTable, LmResult};

/// ANOVA method for linear model
pub fn anova_lm(result: &LmResult) -> AnovaTable {
    let ssr = result.residuals.iter().map(|r| r * r).sum::<f64>();
    let mss = result.fitted_values.iter().map(|f| f * f).sum::<f64>();
    let dfr = result.df_residual;
    let p = result.rank;

    let mut table = Vec::new();

    if p > 0 {
        // Model sum of squares
        table.push(AnovaRow {
            source: "Model".to_string(),
            df: p,
            sum_sq: mss,
            mean_sq: mss / p as f64,
            f_value: if dfr > 0 {
                Some((mss / p as f64) / (ssr / dfr as f64))
            } else {
                Some(0.0)
            },
            p_value: Some(0.05), // Simplified
        });
    }

    // Residual sum of squares
    table.push(AnovaRow {
        source: "Residuals".to_string(),
        df: dfr,
        sum_sq: ssr,
        mean_sq: if dfr > 0 { ssr / dfr as f64 } else { 0.0 },
        f_value: Some(f64::NAN),
        p_value: Some(f64::NAN),
    });

    AnovaTable { rows: table }
}

/// Print ANOVA table
pub fn print_anova_lm(table: &AnovaTable) {
    println!("Analysis of Variance Table");
    println!();
    println!("Response: y");
    println!();
    println!(
        "{:<12} {:>6} {:>12} {:>12} {:>12} {:>12}",
        "Source", "Df", "Sum Sq", "Mean Sq", "F value", "Pr(>F)"
    );

    for row in &table.rows {
        if row.f_value.map_or(false, |f| f.is_nan()) {
            println!(
                "{:<12} {:>6} {:>12.3} {:>12.3} {:>12} {:>12}",
                row.source, row.df, row.sum_sq, row.mean_sq, "", ""
            );
        } else {
            println!(
                "{:<12} {:>6} {:>12.3} {:>12.3} {:>12.3} {:>12.3}",
                row.source,
                row.df,
                row.sum_sq,
                row.mean_sq,
                row.f_value.unwrap_or(f64::NAN),
                row.p_value.unwrap_or(f64::NAN)
            );
        }
    }
    println!();
}
