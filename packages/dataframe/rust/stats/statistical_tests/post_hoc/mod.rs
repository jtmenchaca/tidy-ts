//! Post-hoc tests for multiple comparisons
//!
//! This module contains implementations of various post-hoc tests
//! used after significant ANOVA or Kruskal-Wallis results.

pub mod dunn;
pub mod games_howell;
pub mod tukey_hsd;
pub mod types;
pub mod wasm;

// Re-export main functions
pub use dunn::dunn_test;
pub use games_howell::games_howell;
pub use tukey_hsd::{ptukey_exact, tukey_hsd};
pub use types::{DunnTestResult, GamesHowellTestResult, PairwiseComparison, TukeyHsdTestResult};
