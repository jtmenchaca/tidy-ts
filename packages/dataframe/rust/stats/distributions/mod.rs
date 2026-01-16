//! Distribution functions for tidy-ts
//!
//! This module provides probability density, cumulative distribution,
//! quantile, and random number generation functions for various
//! statistical distributions.
//!
//! ## Implementation Status
//!
//! See [CHECKLIST.md](./CHECKLIST.md) for a detailed tracking of implemented
//! distributions and their status.
//!
//! ## Current Implementations
//!
//! - **Statrs Wrappers**: Complete DPQR functions for all major distributions
//! - **Custom Implementations**: Binomial, Wilcoxon, and other specialized distributions
//! - **Helper Functions**: Numerical utilities for high-precision calculations
//!
//! ## Source Material
//!
//! The distribution functions are based on the R statistical computing environment's
//! implementation, specifically:
//!
//! - **R Core Team (2024). R: A Language and Environment for Statistical Computing.**
//!   R Foundation for Statistical Computing, Vienna, Austria.
//!   URL: https://www.R-project.org/
//!
//! - **Source files:**
//!   - `sources/R-4.5.1/nmath/dbinom.c` - Core binomial probability density function
//!   - `sources/R-4.5.1/nmath/wilcox.c` - Wilcoxon distribution functions
//!   - `sources/R-4.5.1/include/Rmath.h0.in` - Function declarations and constants
//!   - `sources/stats/R/distn.R` - R interface wrapper
//!   - `sources/stats/src/distn.c` - C function registration and macros
//!
//! - **Algorithms:**
//!   - Catherine Loader's algorithm for binomial probabilities
//!   - Exact recursive algorithm for Wilcoxon distribution
//!   - Stirling's approximation and other numerical techniques
//!
//! - **References:**
//!   - Loader, C. (2000). Fast and Accurate Computation of Binomial
//!     Probabilities. Technical Report, Bell Laboratories.
//!   - R's nmath library for numerical accuracy and compatibility

// Custom implementations
pub mod binomial;
pub mod gamma;
pub mod helpers;
pub mod normal;
pub mod shapiro_wilk;
pub mod students_t;

// Re-export commonly used helpers for backward compatibility
pub use helpers::{clamp_unit, validate_integer};

// Statrs wrapper implementations
pub mod beta;
pub mod chi_squared;
pub mod exponential;
pub mod f_distribution;
pub mod geometric;
pub mod hypergeometric;
pub mod log_normal;
pub mod negative_binomial;
pub mod poisson;
pub mod uniform;
pub mod weibull;
pub mod wilcoxon;

// Re-export custom implementations
pub use binomial::*;
pub use gamma::*;
pub use normal::*;
pub use shapiro_wilk::*;
pub use students_t::*;

// Re-export statrs wrapper implementations
pub use beta::*;
pub use chi_squared::*;
pub use exponential::*;
pub use f_distribution::*;
pub use geometric::*;
pub use hypergeometric::*;
pub use log_normal::*;
pub use negative_binomial::*;
pub use poisson::*;
pub use uniform::*;
pub use weibull::*;
pub use wilcoxon::*;

// WASM bindings
#[cfg(feature = "wasm")]
pub mod distributions_wasm;
#[cfg(feature = "wasm")]
pub use distributions_wasm::*;
