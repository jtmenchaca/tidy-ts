//! Laplace approximation for GLMM marginal likelihood
//!
//! This module implements the Laplace approximation used for integrating out
//! the random effects in GLMMs. The key steps are:
//!
//! 1. **Joint log-likelihood**: `log p(y | b, β, θ) + log p(b | θ)`
//!    - Data likelihood from GLM family
//!    - Random effects prior from variance components
//!
//! 2. **Mode finding**: Find `b_hat` that maximizes joint likelihood given (β, θ)
//!    - Newton's method with Hessian from Z^T W Z + Σ^{-1}
//!
//! 3. **Laplace approximation**: `log p(y | β, θ) ≈ joint(b_hat) - 0.5 * log|H|`
//!    - H is the Hessian of negative joint likelihood at the mode
//!
//! # Module Structure
//!
//! - [`types`]: Core types (LaplaceResult, LaplaceControl)
//! - [`likelihood`]: Data log-likelihood computation using proper distributions
//! - [`gradient`]: Gradient and Hessian of joint log-likelihood
//! - [`mode_finding`]: Newton's method for random effect modes
//! - [`beta_update`]: IRLS update for fixed effects
//! - [`approximation`]: Main Laplace approximation function
//! - [`reml`]: REML adjustment for variance estimation
//!
//! # References
//!
//! - Kristensen et al. (2016). TMB: Automatic Differentiation and Laplace Approximation
//! - Bates et al. (2015). Fitting Linear Mixed-Effects Models Using lme4

pub mod approximation;
pub mod beta_update;
pub mod gradient;
pub mod likelihood;
pub mod mode_finding;
pub mod reml;
pub mod types;

// Re-export core types
pub use types::{LaplaceControl, LaplaceResult};

// Re-export main functions
pub use approximation::{
    compute_fitted_values, compute_linear_predictor, extract_sigma_from_theta,
    laplace_approximation, laplace_marginal_likelihood,
};
pub use beta_update::update_beta;
pub use gradient::{joint_gradient_b, joint_hessian_b};
pub use likelihood::{compute_data_log_likelihood, joint_log_likelihood, joint_log_likelihood_with_sigma};
pub use mode_finding::find_b_mode;
pub use reml::{compute_reml_adjustment, compute_weighted_xtx};
