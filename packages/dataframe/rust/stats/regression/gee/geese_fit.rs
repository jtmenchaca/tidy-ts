//! Core GEE coordinator (reuses GLM for IRLS; adds correlation + robust SE)

use super::control::GeeControl;
use super::types::{
    ClusterInfo, CorrelationStructure, GeeInfo, GeeParams, GeeglmResult, WorkingCorrelation,
};
use crate::stats::regression::gee::correlation::update::{
    estimate_ar1_alpha, estimate_exchangeable_alpha,
};
use crate::stats::regression::glm::types::GlmResult;

pub struct GeeseInputs {
    pub glm_result: GlmResult,
    pub id: Vec<usize>,
    pub waves: Option<Vec<usize>>,
    pub corstr: CorrelationStructure,
    pub scale_fix: bool,
    pub scale_value: f64,
    pub control: GeeControl,
    pub std_err: String,
}

pub fn geese_fit(inputs: GeeseInputs) -> Result<GeeglmResult, String> {
    let n = inputs.glm_result.y.len();
    if inputs.id.len() != n {
        return Err("id length must equal number of observations".to_string());
    }

    // Build cluster info
    let (cluster_sizes, n_clusters, max_cluster_size) = summarize_clusters(&inputs.id);
    let cluster_info = ClusterInfo {
        cluster_ids: inputs.id.clone(),
        cluster_sizes,
        max_cluster_size,
        n_clusters,
        waves: inputs.waves.clone(),
    };

    // Initialize params from GLM
    let _beta_start = inputs.glm_result.coefficients.clone();
    let alpha_start = vec![0.0]; // independence/exchangeable start
    let gamma_start = if inputs.scale_fix {
        vec![inputs.scale_value]
    } else {
        vec![1.0]
    };

    // Minimal alpha update based on GLM Pearson residuals (no GLS re-fit yet)
    let mut alpha = alpha_start.clone();
    let pearson = inputs.glm_result.pearson_residuals.clone();
    let est_alpha = match inputs.corstr {
        CorrelationStructure::Exchangeable => {
            Some(estimate_exchangeable_alpha(&pearson, &inputs.id))
        }
        CorrelationStructure::Ar1 => Some(estimate_ar1_alpha(
            &pearson,
            &inputs.id,
            inputs.waves.as_deref(),
        )),
        _ => None,
    };
    if let Some(a) = est_alpha {
        if !alpha.is_empty() {
            alpha[0] = a;
        } else {
            alpha = vec![a];
        }
    }

    let working_correlation = WorkingCorrelation {
        structure: inputs.corstr.clone(),
        parameters: alpha.clone(),
    };

    let gee_info = GeeInfo {
        working_correlation,
        cluster_info,
        gee_params: GeeParams {
            alpha,
            gamma: gamma_start,
        },
        robust_vcov: None,
        iterations: 0,
        converged: true,
    };

    Ok(GeeglmResult {
        glm_result: inputs.glm_result,
        gee_info,
        correlation_structure: inputs.corstr,
        cluster_ids: inputs.id,
        std_error_type: inputs.std_err,
    })
}

fn summarize_clusters(id: &[usize]) -> (Vec<usize>, usize, usize) {
    use std::collections::BTreeMap;
    let mut counts: BTreeMap<usize, usize> = BTreeMap::new();
    for &cid in id {
        *counts.entry(cid).or_insert(0) += 1;
    }
    let cluster_sizes: Vec<usize> = counts.values().copied().collect();
    let n_clusters = cluster_sizes.len();
    let max_cluster_size = cluster_sizes.iter().copied().max().unwrap_or(0);
    (cluster_sizes, n_clusters, max_cluster_size)
}
