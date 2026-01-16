//! Core GEE data structures (extend GLM types, do not duplicate)

use crate::stats::regression::glm::types::GlmResult;

#[derive(Debug, Clone, PartialEq)]
pub enum CorrelationStructure {
    Independence,
    Exchangeable,
    Ar1,
    Unstructured,
    UserDefined,
    Fixed,
}

impl std::fmt::Display for CorrelationStructure {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CorrelationStructure::Independence => write!(f, "independence"),
            CorrelationStructure::Exchangeable => write!(f, "exchangeable"),
            CorrelationStructure::Ar1 => write!(f, "ar1"),
            CorrelationStructure::Unstructured => write!(f, "unstructured"),
            CorrelationStructure::UserDefined => write!(f, "user_defined"),
            CorrelationStructure::Fixed => write!(f, "fixed"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ClusterInfo {
    pub cluster_ids: Vec<usize>,
    pub cluster_sizes: Vec<usize>,
    pub max_cluster_size: usize,
    pub n_clusters: usize,
    pub waves: Option<Vec<usize>>, // optional timing per observation
}

#[derive(Debug, Clone)]
pub struct WorkingCorrelation {
    pub structure: CorrelationStructure,
    pub parameters: Vec<f64>, // alpha parameters
}

#[derive(Debug, Clone)]
pub struct GeeParams {
    pub alpha: Vec<f64>, // correlation params
    pub gamma: Vec<f64>, // scale params (length 1 typical)
}

#[derive(Debug, Clone)]
pub struct GeeInfo {
    pub working_correlation: WorkingCorrelation,
    pub cluster_info: ClusterInfo,
    pub gee_params: GeeParams,
    pub robust_vcov: Option<Vec<Vec<f64>>>, // san.se or jack variants
    pub iterations: usize,
    pub converged: bool,
}

#[derive(Debug, Clone)]
pub struct GeeglmResult {
    pub glm_result: GlmResult, // reuse all GLM outputs
    pub gee_info: GeeInfo,     // attach GEE extras
    pub correlation_structure: CorrelationStructure,
    pub cluster_ids: Vec<usize>,
    pub std_error_type: String, // "san.se" | "jack" | "j1s" | "fij"
}
