//! # Kruskal-Wallis Test
//!
//! The `kruskal_wallis` module provides functionality for performing the Kruskal-Wallis test.
//!
//! The Kruskal-Wallis test is a non-parametric method for testing whether samples originate from the same distribution.
//! It is used for comparing two or more independent samples of equal or different sample sizes.
//!
//! ## Exports
//!
//! The following functions are made available for use:
//!
//! - `kruskal_wallis_test`: Performs the Kruskal-Wallis test on multiple groups.
//!
//! ## Example
//! ```rust
//! use tidy_ts_dataframe::stats::statistical_tests::kruskal_wallis::kruskal_wallis_test;
//! ```

pub mod kruskal_wallis;
pub mod wasm;

pub use kruskal_wallis::kruskal_wallis_test;
