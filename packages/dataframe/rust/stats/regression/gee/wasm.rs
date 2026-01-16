//! WASM bindings for GEE (geeglm)

#![cfg(feature = "wasm")]

use super::control::GeeControl;
use super::geeglm::geeglm;
use super::types::CorrelationStructure;
use crate::stats::regression::family::{self, GlmFamily};
use serde::Deserialize;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn geeglm_fit_wasm(
    formula: &str,
    family_name: &str,
    link_name: &str,
    data_json: &str,
    id_json: &str,
    waves_json: Option<String>,
    corstr: &str,
    std_err: &str,
    options_json: Option<String>,
) -> String {
    match geeglm_fit_wasm_inner(
        formula,
        family_name,
        link_name,
        data_json,
        id_json,
        waves_json,
        corstr,
        std_err,
        options_json,
    ) {
        Ok(v) => v,
        Err(e) => format!("{{\"error\":\"{}\"}}", e.replace('"', "'")),
    }
}

fn geeglm_fit_wasm_inner(
    formula: &str,
    family_name: &str,
    link_name: &str,
    data_json: &str,
    id_json: &str,
    waves_json: Option<String>,
    corstr: &str,
    std_err: &str,
    options_json: Option<String>,
) -> Result<String, String> {
    let data: HashMap<String, Vec<f64>> =
        serde_json::from_str(data_json).map_err(|e| format!("invalid data_json: {}", e))?;
    let id: Vec<usize> =
        serde_json::from_str(id_json).map_err(|e| format!("invalid id_json: {}", e))?;
    let waves: Option<Vec<usize>> = match waves_json {
        Some(w) if !w.is_empty() => {
            Some(serde_json::from_str(&w).map_err(|e| format!("invalid waves_json: {}", e))?)
        }
        _ => None,
    };

    let family = create_family(family_name, link_name)?;
    let corstr = parse_corstr(corstr)?;

    #[derive(Deserialize)]
    struct Opts {
        epsilon: Option<f64>,
        max_iter: Option<usize>,
        trace: Option<bool>,
    }
    let (weights, na_action, control) = if let Some(opts) = options_json {
        // options may include weights and control; for now parse control subset
        let control_opts: Opts = serde_json::from_str(&opts).unwrap_or(Opts {
            epsilon: None,
            max_iter: None,
            trace: None,
        });
        let control = GeeControl {
            epsilon: control_opts.epsilon.unwrap_or(1e-4),
            max_iter: control_opts.max_iter.unwrap_or(25),
            trace: control_opts.trace.unwrap_or(false),
            jack: false,
            j1s: false,
            fij: false,
        };
        (None, None, Some(control))
    } else {
        (None, None, None)
    };

    let result = geeglm(
        formula.to_string(),
        Some(family),
        Some(data),
        weights,
        na_action,
        None, // start
        None, // etastart
        None, // mustart
        None, // offset
        control,
        Some(true),
        Some("glm.fit".to_string()),
        Some(false),
        Some(true),
        Some(true),
        None, // contrasts
        id,
        waves,
        None, // zcor
        Some(corstr),
        Some(false),
        Some(1.0),
        Some(std_err.to_string()),
    )?;

    Ok(serde_json::to_string(&serde_json::json!({
        "coefficients": result.glm_result.coefficients,
        "residuals": result.glm_result.residuals,
        "fitted_values": result.glm_result.fitted_values,
        "cluster_info": {
            "n_clusters": result.gee_info.cluster_info.n_clusters,
            "max_cluster_size": result.gee_info.cluster_info.max_cluster_size,
        },
        "correlation_structure": format!("{:?}", result.correlation_structure),
        "std_err": result.std_error_type,
        "vcov": result.gee_info.robust_vcov,
    }))
    .unwrap())
}

fn parse_corstr(s: &str) -> Result<CorrelationStructure, String> {
    match &s.to_lowercase()[..] {
        "independence" => Ok(CorrelationStructure::Independence),
        "exchangeable" => Ok(CorrelationStructure::Exchangeable),
        "ar1" => Ok(CorrelationStructure::Ar1),
        "unstructured" => Ok(CorrelationStructure::Unstructured),
        "userdefined" => Ok(CorrelationStructure::UserDefined),
        "fixed" => Ok(CorrelationStructure::Fixed),
        _ => Err(format!("unknown corstr: {}", s)),
    }
}

fn create_family(name: &str, link: &str) -> Result<Box<dyn GlmFamily>, String> {
    let lname = link.to_lowercase();
    match &name.to_lowercase()[..] {
        "gaussian" => {
            match &lname[..] {
                "identity" => Ok(Box::new(family::gaussian::GaussianFamily::new(family::links::IdentityLink))),
                "log" => Ok(Box::new(family::gaussian::GaussianFamily::new(family::links::LogLink))),
                "inverse" => Ok(Box::new(family::gaussian::GaussianFamily::new(family::links::InverseLink))),
                _ => Err(format!("unsupported gaussian link: {}", link)),
            }
        },
        "binomial" => {
            match &lname[..] {
                "logit" => Ok(Box::new(family::binomial::BinomialFamily::new(family::links::LogitLink))),
                "probit" => Ok(Box::new(family::binomial::BinomialFamily::new(family::links::ProbitLink))),
                "cauchit" => Ok(Box::new(family::binomial::BinomialFamily::new(family::links::CauchitLink))),
                "cloglog" => Ok(Box::new(family::binomial::BinomialFamily::new(family::links::CloglogLink))),
                "log" => Ok(Box::new(family::binomial::BinomialFamily::new(family::links::LogLink))),
                _ => Err(format!("unsupported binomial link: {}", link)),
            }
        },
        "poisson" => {
            match &lname[..] {
                "log" => Ok(Box::new(family::poisson::PoissonFamily::new(family::links::LogLink))),
                "identity" => Ok(Box::new(family::poisson::PoissonFamily::new(family::links::IdentityLink))),
                "sqrt" => Ok(Box::new(family::poisson::PoissonFamily::new(family::links::SqrtLink))),
                _ => Err(format!("unsupported poisson link: {}", link)),
            }
        },
        "gamma" => {
            match &lname[..] {
                "inverse" => Ok(Box::new(family::gamma::GammaFamily::new(family::links::InverseLink))),
                "identity" => Ok(Box::new(family::gamma::GammaFamily::new(family::links::IdentityLink))),
                "log" => Ok(Box::new(family::gamma::GammaFamily::new(family::links::LogLink))),
                _ => Err(format!("unsupported gamma link: {}", link)),
            }
        },
        "inverse_gaussian" => {
            match &lname[..] {
                "inverse_squared" => Ok(Box::new(family::inverse_gaussian::InverseGaussianFamily::new(family::links::PowerLink(-2.0)))),
                "identity" => Ok(Box::new(family::inverse_gaussian::InverseGaussianFamily::new(family::links::IdentityLink))),
                "log" => Ok(Box::new(family::inverse_gaussian::InverseGaussianFamily::new(family::links::LogLink))),
                _ => Err(format!("unsupported inverse_gaussian link: {}", link)),
            }
        },
        _ => Err(format!("unsupported family: {}", name)),
    }
}
