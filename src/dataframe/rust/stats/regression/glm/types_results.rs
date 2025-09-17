//! GLM result types
//!
//! This file contains the main result structures for GLM fitting.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::types_control::GlmControl;
use crate::stats::regression::family::GlmFamily;
use crate::stats::regression::model::{ModelFrame, ModelMatrix};

/// GLM fit result
pub struct GlmResult {
    /// Fitted coefficients
    pub coefficients: Vec<f64>,
    /// Residuals
    pub residuals: Vec<f64>,
    /// Fitted values
    pub fitted_values: Vec<f64>,
    /// Linear predictors
    pub linear_predictors: Vec<f64>,
    /// Working residuals
    pub working_residuals: Vec<f64>,
    /// Response residuals
    pub response_residuals: Vec<f64>,
    /// Deviance residuals
    pub deviance_residuals: Vec<f64>,
    /// Pearson residuals
    pub pearson_residuals: Vec<f64>,
    /// Effects from QR decomposition
    pub effects: Option<Vec<f64>>,
    /// R matrix from QR decomposition
    pub r_matrix: Option<Vec<Vec<f64>>>,
    /// QR decomposition result
    pub qr: Option<QrResult>,
    /// Model rank
    pub rank: usize,
    /// QR rank
    pub qr_rank: usize,
    /// Pivot indices
    pub pivot: Vec<i32>,
    /// Tolerance used in QR decomposition
    pub tol: f64,
    /// Whether pivoting was used
    pub pivoted: bool,
    /// Family used in the fit
    pub family: Box<dyn GlmFamily>,
    /// Deviance
    pub deviance: f64,
    /// AIC
    pub aic: f64,
    /// Null deviance
    pub null_deviance: f64,
    /// Number of iterations
    pub iter: usize,
    /// Working weights
    pub weights: Vec<f64>,
    /// Prior weights
    pub prior_weights: Vec<f64>,
    /// Degrees of freedom for residuals
    pub df_residual: usize,
    /// Degrees of freedom for null model
    pub df_null: usize,
    /// Response variable
    pub y: Vec<f64>,
    /// Whether the algorithm converged
    pub converged: bool,
    /// Whether the algorithm stopped at boundary
    pub boundary: bool,
    /// Model frame (if requested)
    pub model: Option<ModelFrame>,
    /// Design matrix (if requested)
    pub x: Option<ModelMatrix>,
    /// Call information
    pub call: Option<String>,
    /// Formula
    pub formula: Option<String>,
    /// Terms
    pub terms: Option<String>,
    /// Data
    pub data: Option<String>,
    /// Offset
    pub offset: Option<Vec<f64>>,
    /// Control parameters used
    pub control: GlmControl,
    /// Method used
    pub method: String,
    /// Contrasts used
    pub contrasts: Option<HashMap<String, String>>,
    /// X levels for factors
    pub xlevels: Option<HashMap<String, Vec<String>>>,
    /// NA action
    pub na_action: Option<String>,
    /// Dispersion parameter
    pub dispersion: f64,
}

impl Clone for GlmResult {
    fn clone(&self) -> Self {
        GlmResult {
            coefficients: self.coefficients.clone(),
            residuals: self.residuals.clone(),
            fitted_values: self.fitted_values.clone(),
            linear_predictors: self.linear_predictors.clone(),
            working_residuals: self.working_residuals.clone(),
            response_residuals: self.response_residuals.clone(),
            deviance_residuals: self.deviance_residuals.clone(),
            pearson_residuals: self.pearson_residuals.clone(),
            effects: self.effects.clone(),
            r_matrix: self.r_matrix.clone(),
            qr: self.qr.clone(),
            rank: self.rank,
            qr_rank: self.qr_rank,
            pivot: self.pivot.clone(),
            tol: self.tol,
            pivoted: self.pivoted,
            family: self.family.as_ref().clone_box(),
            deviance: self.deviance,
            aic: self.aic,
            null_deviance: self.null_deviance,
            iter: self.iter,
            weights: self.weights.clone(),
            prior_weights: self.prior_weights.clone(),
            df_residual: self.df_residual,
            df_null: self.df_null,
            y: self.y.clone(),
            converged: self.converged,
            boundary: self.boundary,
            model: self.model.clone(),
            x: self.x.clone(),
            data: self.data.clone(),
            offset: self.offset.clone(),
            control: self.control.clone(),
            method: self.method.clone(),
            contrasts: self.contrasts.clone(),
            xlevels: self.xlevels.clone(),
            na_action: self.na_action.clone(),
            dispersion: self.dispersion,
        }
    }
}

/// QR decomposition result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrResult {
    /// QR matrix
    pub qr: Vec<f64>,
    /// QR auxiliary information
    pub qraux: Vec<f64>,
    /// Pivot indices
    pub pivot: Vec<i32>,
    /// Tolerance
    pub tol: f64,
    /// Rank
    pub rank: usize,
}

/// GLM summary result
#[derive(Clone)]
pub struct GlmSummary {
    /// Call information
    pub call: Option<String>,
    /// Terms
    pub terms: Option<String>,
    /// Family
    pub family: Box<dyn GlmFamily>,
    /// Deviance
    pub deviance: f64,
    /// AIC
    pub aic: f64,
    /// Contrasts
    pub contrasts: Option<HashMap<String, String>>,
    /// Degrees of freedom for residuals
    pub df_residual: usize,
    /// Null deviance
    pub null_deviance: f64,
    /// Degrees of freedom for null model
    pub df_null: usize,
    /// Number of iterations
    pub iter: usize,
    /// NA action
    pub na_action: Option<String>,
    /// Deviance residuals
    pub deviance_residuals: Vec<f64>,
    /// Coefficient table
    pub coefficients: Vec<CoefficientInfo>,
    /// Aliased coefficients
    pub aliased: Vec<bool>,
    /// Dispersion parameter
    pub dispersion: f64,
    /// Degrees of freedom
    pub df: (usize, usize, usize), // (rank, df_residual, df_full)
    /// Unscaled covariance matrix
    pub cov_unscaled: Vec<Vec<f64>>,
    /// Scaled covariance matrix
    pub cov_scaled: Vec<Vec<f64>>,
    /// Correlation matrix (if requested)
    pub correlation: Option<Vec<Vec<f64>>>,
    /// Symbolic correlation (if requested)
    pub symbolic_cor: Option<bool>,
    /// Whether the algorithm converged
    pub converged: bool,
    /// Whether the algorithm stopped at boundary
    pub boundary: bool,
}

/// Information about a coefficient
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoefficientInfo {
    /// Coefficient name
    pub name: String,
    /// Estimate
    pub estimate: f64,
    /// Standard error
    pub std_error: f64,
    /// Test statistic (t or z value)
    pub test_statistic: f64,
    /// P-value
    pub p_value: f64,
}

impl std::fmt::Debug for GlmResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GlmResult")
            .field("coefficients", &self.coefficients)
            .field("residuals", &self.residuals)
            .field("fitted_values", &self.fitted_values)
            .field("linear_predictors", &self.linear_predictors)
            .field("working_residuals", &self.working_residuals)
            .field("response_residuals", &self.response_residuals)
            .field("deviance_residuals", &self.deviance_residuals)
            .field("pearson_residuals", &self.pearson_residuals)
            .field("effects", &self.effects)
            .field("r_matrix", &self.r_matrix)
            .field("qr", &self.qr)
            .field("rank", &self.rank)
            .field("qr_rank", &self.qr_rank)
            .field("pivot", &self.pivot)
            .field("tol", &self.tol)
            .field("pivoted", &self.pivoted)
            .field("family", &format!("<family: {}>", self.family.name()))
            .field("deviance", &self.deviance)
            .field("aic", &self.aic)
            .field("null_deviance", &self.null_deviance)
            .field("iter", &self.iter)
            .field("weights", &self.weights)
            .field("prior_weights", &self.prior_weights)
            .field("df_residual", &self.df_residual)
            .field("df_null", &self.df_null)
            .field("y", &self.y)
            .field("converged", &self.converged)
            .field("boundary", &self.boundary)
            .field("model", &self.model)
            .field("x", &self.x)
            .field("call", &self.call)
            .field("formula", &self.formula)
            .field("terms", &self.terms)
            .field("data", &self.data)
            .field("offset", &self.offset)
            .field("control", &self.control)
            .field("method", &self.method)
            .field("contrasts", &self.contrasts)
            .field("xlevels", &self.xlevels)
            .field("na_action", &self.na_action)
            .finish()
    }
}

impl std::fmt::Debug for GlmSummary {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GlmSummary")
            .field("call", &self.call)
            .field("terms", &self.terms)
            .field("family", &format!("<family: {}>", self.family.name()))
            .field("deviance", &self.deviance)
            .field("aic", &self.aic)
            .field("contrasts", &self.contrasts)
            .field("df_residual", &self.df_residual)
            .field("null_deviance", &self.null_deviance)
            .field("df_null", &self.df_null)
            .field("iter", &self.iter)
            .field("na_action", &self.na_action)
            .field("deviance_residuals", &self.deviance_residuals)
            .field("coefficients", &self.coefficients)
            .field("aliased", &self.aliased)
            .field("dispersion", &self.dispersion)
            .field("df", &self.df)
            .field("cov_unscaled", &self.cov_unscaled)
            .field("cov_scaled", &self.cov_scaled)
            .field("correlation", &self.correlation)
            .field("symbolic_cor", &self.symbolic_cor)
            .field("converged", &self.converged)
            .field("boundary", &self.boundary)
            .finish()
    }
}
