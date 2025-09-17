//! GLM main convenience module
//!
//! This file contains convenience functions for common GLM families.

use super::types::{GlmControl, GlmResult};
use super::glm_main_core::glm;
use std::collections::HashMap;

/// GLM with default Gaussian family - convenience function
pub fn glm_gaussian(
    formula: String,
    data: Option<HashMap<String, Vec<f64>>>,
    weights: Option<Vec<f64>>,
    subset: Option<Vec<bool>>,
    na_action: Option<String>,
    start: Option<Vec<f64>>,
    etastart: Option<Vec<f64>>,
    mustart: Option<Vec<f64>>,
    offset: Option<Vec<f64>>,
    control: Option<GlmControl>,
    model: Option<bool>,
    method: Option<String>,
    x: Option<bool>,
    y: Option<bool>,
    singular_ok: Option<bool>,
    contrasts: Option<HashMap<String, String>>,
) -> Result<GlmResult, String> {
    let family = Box::new(crate::stats::regression::family::gaussian::GaussianFamily::identity());
    glm(
        formula,
        Some(family),
        data,
        weights,
        subset,
        na_action,
        start,
        etastart,
        mustart,
        offset,
        control,
        model,
        method,
        x,
        y,
        singular_ok,
        contrasts,
    )
}

/// GLM with binomial family - convenience function
pub fn glm_binomial(
    formula: String,
    data: Option<HashMap<String, Vec<f64>>>,
    weights: Option<Vec<f64>>,
    subset: Option<Vec<bool>>,
    na_action: Option<String>,
    start: Option<Vec<f64>>,
    etastart: Option<Vec<f64>>,
    mustart: Option<Vec<f64>>,
    offset: Option<Vec<f64>>,
    control: Option<GlmControl>,
    model: Option<bool>,
    method: Option<String>,
    x: Option<bool>,
    y: Option<bool>,
    singular_ok: Option<bool>,
    contrasts: Option<HashMap<String, String>>,
) -> Result<GlmResult, String> {
    let family = Box::new(crate::stats::regression::family::binomial::BinomialFamily::logit());
    glm(
        formula,
        Some(family),
        data,
        weights,
        subset,
        na_action,
        start,
        etastart,
        mustart,
        offset,
        control,
        model,
        method,
        x,
        y,
        singular_ok,
        contrasts,
    )
}

/// GLM with Poisson family - convenience function
pub fn glm_poisson(
    formula: String,
    data: Option<HashMap<String, Vec<f64>>>,
    weights: Option<Vec<f64>>,
    subset: Option<Vec<bool>>,
    na_action: Option<String>,
    start: Option<Vec<f64>>,
    etastart: Option<Vec<f64>>,
    mustart: Option<Vec<f64>>,
    offset: Option<Vec<f64>>,
    control: Option<GlmControl>,
    model: Option<bool>,
    method: Option<String>,
    x: Option<bool>,
    y: Option<bool>,
    singular_ok: Option<bool>,
    contrasts: Option<HashMap<String, String>>,
) -> Result<GlmResult, String> {
    let family = Box::new(crate::stats::regression::family::poisson::PoissonFamily::log());
    glm(
        formula,
        Some(family),
        data,
        weights,
        subset,
        na_action,
        start,
        etastart,
        mustart,
        offset,
        control,
        model,
        method,
        x,
        y,
        singular_ok,
        contrasts,
    )
}
