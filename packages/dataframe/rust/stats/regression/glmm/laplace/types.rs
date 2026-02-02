//! Types for Laplace approximation
//!
//! This module defines the core types used in Laplace approximation
//! for GLMM marginal likelihood computation.

/// Result of Laplace approximation
#[derive(Debug, Clone)]
pub struct LaplaceResult {
    /// Approximate marginal log-likelihood: log p(y | β, θ)
    pub log_marginal_likelihood: f64,
    /// Mode of random effects (BLUPs): argmax_b log p(b | y, β, θ)
    pub b_mode: Vec<f64>,
    /// Gradient w.r.t. theta (for outer optimization)
    pub grad_theta: Vec<f64>,
    /// Hessian of negative joint likelihood at mode (for standard errors)
    pub hessian_b: Option<Vec<Vec<f64>>>,
    /// Number of Newton iterations for mode finding
    pub inner_iterations: usize,
    /// Whether inner optimization converged
    pub inner_converged: bool,
}

/// Control parameters for Laplace approximation
#[derive(Debug, Clone)]
pub struct LaplaceControl {
    /// Maximum iterations for mode finding
    pub max_iter: usize,
    /// Convergence tolerance (gradient norm)
    pub tol: f64,
    /// Step size damping factor (for stability)
    pub damping: f64,
    /// Whether to compute Hessian for output
    pub compute_hessian: bool,
    /// Minimum variance to add to diagonal for numerical stability
    pub min_variance: f64,
    /// Whether to compute gradient w.r.t. theta (disable to avoid infinite recursion)
    pub compute_gradient: bool,
}

impl Default for LaplaceControl {
    fn default() -> Self {
        Self {
            max_iter: 100,
            tol: 1e-8,
            damping: 1.0,
            compute_hessian: true,
            min_variance: 1e-10,
            compute_gradient: true,
        }
    }
}

impl LaplaceControl {
    /// Create a new LaplaceControl with default values
    pub fn new() -> Self {
        Self::default()
    }

    /// Set maximum iterations
    pub fn with_max_iter(mut self, max_iter: usize) -> Self {
        self.max_iter = max_iter;
        self
    }

    /// Set convergence tolerance
    pub fn with_tol(mut self, tol: f64) -> Self {
        self.tol = tol;
        self
    }

    /// Set damping factor
    pub fn with_damping(mut self, damping: f64) -> Self {
        self.damping = damping;
        self
    }

    /// Set whether to compute Hessian
    pub fn with_compute_hessian(mut self, compute_hessian: bool) -> Self {
        self.compute_hessian = compute_hessian;
        self
    }

    /// Set whether to compute gradient
    pub fn with_compute_gradient(mut self, compute_gradient: bool) -> Self {
        self.compute_gradient = compute_gradient;
        self
    }
}
