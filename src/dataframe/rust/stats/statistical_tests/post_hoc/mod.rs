//! Post-hoc tests for multiple comparisons
//!
//! This module contains implementations of various post-hoc tests
//! used after significant ANOVA or Kruskal-Wallis results.

pub mod tukey_hsd;
pub mod games_howell;
pub mod dunn;
pub mod types;
pub mod wasm;

// Re-export main functions
pub use tukey_hsd::{tukey_hsd, ptukey_exact};
pub use games_howell::games_howell;
pub use dunn::dunn_test;
pub use types::*;