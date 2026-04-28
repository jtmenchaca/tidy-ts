//! Tidy-TS Dataframe: High-performance data manipulation operations
//!
//! This module provides comprehensive data frame operations including:
//! - Sorting and arranging data
//! - Filtering and subsetting
//! - Joining operations (inner, left, right, outer, cross)
//! - Statistical functions (median, quantiles, IQR)
//! - Aggregation functions (sum, count, unique)
//!
//! All operations are optimized for WebAssembly and provide TypeScript/JavaScript bindings.

// Shared types for WASM exports
#[path = "dataframe/shared-types.wasm.rs"]
pub mod shared_types;

#[path = "dataframe/quantile-core.wasm.rs"]
pub(crate) mod quantile_core;

// Core join helper functions (used by join modules)
#[path = "dataframe/join-helpers.wasm.rs"]
pub mod join_helpers;

// Full join+gather in Rust (napi fast path)
#[path = "dataframe/join-gather.wasm.rs"]
pub mod join_gather;

// New standardized WASM exports
#[path = "dataframe/aggregates.wasm.rs"]
pub mod aggregates;
#[path = "dataframe/arrange.wasm.rs"]
#[allow(dead_code)]
pub mod arrange;
#[path = "dataframe/count.wasm.rs"]
pub mod count;
#[path = "dataframe/cross-join.wasm.rs"]
pub mod cross_join;
#[path = "dataframe/distinct.wasm.rs"]
pub mod distinct;
#[path = "dataframe/filter.wasm.rs"]
pub mod filter_wasm;
#[path = "dataframe/grouping.wasm.rs"]
pub mod grouping;
#[path = "dataframe/inner-join.wasm.rs"]
#[allow(dead_code)]
pub mod inner_join;
#[path = "dataframe/iqr.wasm.rs"]
pub mod iqr;
#[path = "dataframe/left-join.wasm.rs"]
#[allow(dead_code)]
pub mod left_join;
#[path = "dataframe/median.wasm.rs"]
pub mod median;
#[path = "dataframe/outer-join.wasm.rs"]
pub mod outer_join;
#[path = "dataframe/pivot.wasm.rs"]
pub mod pivot;
#[path = "dataframe/pivot_longer.wasm.rs"]
pub mod pivot_longer;
#[path = "dataframe/pivot_wider.wasm.rs"]
pub mod pivot_wider;
#[path = "dataframe/quantile.wasm.rs"]
pub mod quantile;
#[path = "dataframe/right-join.wasm.rs"]
pub mod right_join;
#[path = "dataframe/sum.wasm.rs"]
pub mod sum;
#[path = "dataframe/unique.wasm.rs"]
pub mod unique;
#[path = "dataframe/variance.wasm.rs"]
pub mod variance;

// Statistics module
#[path = "stats/mod.rs"]
pub mod stats;

// Re-export shared types
#[cfg(feature = "wasm")]
pub use shared_types::*;

// Re-export WASM functions (only when wasm feature is enabled)
#[cfg(feature = "wasm")]
pub use arrange::*;
#[cfg(feature = "wasm")]
pub use count::*;
#[cfg(feature = "wasm")]
pub use cross_join::*;
#[cfg(feature = "wasm")]
pub use distinct::*;
#[cfg(feature = "wasm")]
pub use filter_wasm::*;
#[cfg(feature = "wasm")]
pub use inner_join::*;
#[cfg(feature = "wasm")]
pub use iqr::*;
#[cfg(feature = "wasm")]
pub use left_join::*;
#[cfg(feature = "wasm")]
pub use median::*;
#[cfg(feature = "wasm")]
pub use outer_join::*;
#[cfg(feature = "wasm")]
pub use pivot::*;
#[cfg(feature = "wasm")]
pub use pivot_longer::*;
#[cfg(feature = "wasm")]
pub use quantile::*;
#[cfg(feature = "wasm")]
pub use right_join::*;
#[cfg(feature = "wasm")]
pub use stats::distributions::distributions_wasm::*;
#[cfg(feature = "wasm")]
pub use stats::statistical_tests::*;
#[cfg(feature = "wasm")]
pub use sum::*;
#[cfg(feature = "wasm")]
pub use unique::*;
#[cfg(feature = "wasm")]
pub use variance::*;

// Re-export NAPI functions (only when napi-rs feature is enabled)
#[cfg(feature = "napi-rs")]
pub use aggregates::*;
#[cfg(feature = "napi-rs")]
pub use arrange::*;
#[cfg(feature = "napi-rs")]
pub use count::*;
#[cfg(feature = "napi-rs")]
pub use cross_join::*;
#[cfg(feature = "napi-rs")]
pub use distinct::*;
#[cfg(feature = "napi-rs")]
pub use filter_wasm::*;
#[cfg(feature = "napi-rs")]
pub use grouping::*;
#[cfg(feature = "napi-rs")]
pub use inner_join::*;
#[cfg(feature = "napi-rs")]
pub use iqr::*;
#[cfg(feature = "napi-rs")]
pub use left_join::*;
#[cfg(feature = "napi-rs")]
pub use median::*;
#[cfg(feature = "napi-rs")]
pub use outer_join::*;
#[cfg(feature = "napi-rs")]
pub use pivot_longer::*;
#[cfg(feature = "napi-rs")]
pub use pivot_wider::*;
#[cfg(feature = "napi-rs")]
pub use quantile::*;
#[cfg(feature = "napi-rs")]
pub use right_join::*;
#[cfg(feature = "napi-rs")]
pub use stats::distributions::distributions_wasm::*;
#[cfg(feature = "napi-rs")]
pub use stats::statistical_tests::*;
#[cfg(feature = "napi-rs")]
pub use stats::regression::glm::wasm::*;
#[cfg(feature = "napi-rs")]
pub use stats::regression::gee::wasm::*;
#[cfg(feature = "napi-rs")]
pub use stats::regression::glmm::wasm::*;
#[cfg(feature = "napi-rs")]
pub use stats::survival::wasm::*;
#[cfg(feature = "napi-rs")]
pub use stats::target_trial::wasm::*;
#[cfg(feature = "napi-rs")]
pub use join_gather::*;
#[cfg(feature = "napi-rs")]
pub use sum::*;
#[cfg(feature = "napi-rs")]
pub use unique::*;
#[cfg(feature = "napi-rs")]
pub use variance::*;
