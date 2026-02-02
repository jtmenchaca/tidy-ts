//! Generalized Linear Mixed Models (GLMM)
//!
//! This module implements GLMMs with support for:
//! - Random intercepts and slopes
//! - Nested and crossed random effects
//! - Multiple grouping factors
//! - All GLM families (Gaussian, Binomial, Poisson, Gamma, InverseGaussian)
//!
//! # Estimation Method
//!
//! Uses Laplace approximation for the marginal likelihood, matching glmmTMB's default.
//! This provides O(1) complexity per random effect vs O(n_quad^q) for adaptive
//! Gauss-Hermite quadrature.
//!
//! # Parameterization
//!
//! Variance components use log-Cholesky parameterization:
//! - Unconstrained optimization (no bounds needed)
//! - theta = [log(sd1), log(sd2), ..., raw_corr1, raw_corr2, ...]
//! - Matches lme4/glmmTMB parameterization
//!
//! # Algorithm Overview
//!
//! 1. **Inner optimization**: Given variance components θ, find optimal (β, b)
//!    - Uses existing IRLS infrastructure for fixed effects
//!    - Newton's method for random effect modes (BLUPs)
//!
//! 2. **Outer optimization**: Optimize θ to maximize (approximate) marginal likelihood
//!    - Profile out fixed effects and random effects
//!    - BFGS or Newton for variance components
//!
//! # Example Usage
//!
//! ```ignore
//! use tidy_ts_dataframe::stats::regression::glmm::{glmm_fit, GlmmControl, RandomEffect};
//!
//! // Fit: y ~ x + (1 | group)
//! let result = glmm_fit(
//!     &y,
//!     &x_matrix,
//!     &[RandomEffect::intercept("group".to_string())],
//!     &group_indices,
//!     "gaussian",
//!     "identity",
//!     GlmmControl::new(),
//! );
//! ```
//!
//! # References
//!
//! - Bates et al. (2015). Fitting Linear Mixed-Effects Models Using lme4
//! - Brooks et al. (2017). glmmTMB Balances Speed and Flexibility
//! - Kristensen et al. (2016). TMB: Automatic Differentiation and Laplace Approximation

pub mod fitting;
pub mod laplace;
pub mod random_effects;
pub mod random_effects_likelihood;
pub mod types;
pub mod variance_components;

// Re-export core types
pub use types::{
    CovarianceType, GlmmControl, GlmmFitSummary, GlmmOptions, GlmmResult, RandomEffect,
    RandomEffectEstimates, VarianceComponent,
};

// Re-export random effects types
pub use random_effects::{
    construct_combined_z_matrix, construct_z_matrix, create_nested_groups,
    create_nested_random_effects, intercept_slope_term_values, intercept_term_values,
    populate_random_effect, validate_nested_structure, SparseMatrix,
};

// Re-export variance components types
pub use variance_components::{
    cholesky_decompose, cholesky_to_vcov, initial_theta, log_jacobian_determinant,
    log_jacobian_determinant_gradient, split_theta, theta_to_cholesky, theta_to_corr,
    theta_to_sd, theta_to_variance_component, theta_to_vcov, theta_to_vcov_jacobian,
    total_theta_params, vcov_to_corr, vcov_to_theta,
};

// Re-export random effects likelihood types
pub use random_effects_likelihood::{
    compute_block_precision_matrices, compute_precision_matrix, log_random_effects_prior,
    log_random_effects_prior_value, RandomEffectsPrior,
};

// Re-export laplace approximation types
pub use laplace::{
    compute_reml_adjustment, compute_weighted_xtx, find_b_mode, invert_symmetric_positive_definite,
    joint_gradient_b, joint_hessian_b, joint_log_likelihood, laplace_approximation,
    laplace_marginal_likelihood, update_beta, LaplaceControl, LaplaceResult,
};

// Re-export fitting types
pub use fitting::{glmm_fit, glmm_fit_simple, OuterOptimizationResult};

// Future submodules (to be implemented):
// #[cfg(feature = "wasm")]
// pub mod wasm;               // WASM bindings
