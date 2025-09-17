//! GLM ANOVA types
//!
//! This file contains types related to ANOVA analysis for GLM.

use serde::{Deserialize, Serialize};

/// GLM ANOVA result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmAnova {
    /// Table of deviance analysis
    pub table: Vec<AnovaRow>,
    /// Column names
    pub column_names: Vec<String>,
    /// Row names
    pub row_names: Vec<String>,
    /// Heading information
    pub heading: Vec<String>,
    /// Class information
    pub class: Vec<String>,
}

/// Row in ANOVA table
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnovaRow {
    /// Degrees of freedom
    pub df: Option<f64>,
    /// Deviance
    pub deviance: Option<f64>,
    /// Residual degrees of freedom
    pub resid_df: f64,
    /// Residual deviance
    pub resid_deviance: f64,
    /// Rao score (if requested)
    pub rao: Option<f64>,
    /// F statistic (if calculated)
    pub f_statistic: Option<f64>,
    /// P-value (if calculated)
    pub p_value: Option<f64>,
}
