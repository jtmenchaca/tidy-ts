//! Statistical hypothesis tests
//!
//! This module contains implementations of various statistical tests
//! for comparing groups and testing hypotheses.

#![allow(ambiguous_glob_reexports)]

pub mod anova;
pub mod chi_square;
pub mod correlation;
pub mod fisher_exact;
pub mod kolmogorov_smirnov;
pub mod kruskal_wallis;
pub mod levene;
pub mod mann_whitney;
pub mod post_hoc;
pub mod proportion;
pub mod shapiro_wilk;
pub mod t;
pub mod wilcoxon;
pub mod z;

// Re-export everything in modules to maintain access
// Note: Some items may have conflicting names, access through module path if needed
pub use anova::*;
pub use chi_square::*;
pub use correlation::*;
pub use fisher_exact::*;
pub use kolmogorov_smirnov::*;
pub use kruskal_wallis::*;
pub use levene::*;
pub use mann_whitney::*;
pub use post_hoc::*;
pub use shapiro_wilk::*;
pub use t::*;
pub use wilcoxon::*;
// Only z module renamed to avoid conflicts
pub use proportion::*;
pub use z::{z_test as z_test_fn, z_test_ind as z_test_ind_fn};

// WASM bindings are now in individual test modules
