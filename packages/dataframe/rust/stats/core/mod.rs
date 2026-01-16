//! # Common Utilities
pub mod calc;
pub mod effect_sizes;
pub mod errors;
pub mod types;
pub mod utils;

pub use calc::{
    calculate_chi2_confidence_interval as calculate_chi2_ci,
    calculate_confidence_interval as calculate_ci, calculate_p_value as calculate_p,
};
pub use effect_sizes::{
    cohens_d_independent, cohens_d_independent_from_vars, cohens_d_one_sample, cohens_d_z_test,
    cohens_h, cramers_v, eta_squared, partial_eta_squared,
};
pub use errors::StatError;
pub use types::{AlternativeType, TailType, TestType};

pub use utils::mean_null_hypothesis;
