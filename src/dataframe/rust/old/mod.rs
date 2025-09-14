//! Data manipulation operations for tidy-ts
//!
//! This module contains high-performance Rust implementations of data frame
//! operations like filtering, joining, grouping, and summarizing.

pub mod array_helpers;
pub mod chop;
pub mod error;
pub mod expand_groups;
pub mod filter;
pub mod funs;
pub mod group_by;
pub mod group_data;
pub mod join;
pub mod mask;
pub mod mutate;
pub mod operations;
pub mod reconstruct;
pub mod slice;
pub mod sort;
pub mod stats;
pub mod strings;
pub mod summarise;
pub mod utils;

// Re-export main functionality
pub use self::array_helpers::*;
pub use self::chop::*;
pub use self::error::*;
pub use self::expand_groups::*;
pub use self::funs::*;
pub use self::join::*;
pub use self::mask::*;
pub use self::mutate::*;
pub use self::operations::*;
pub use self::reconstruct::*;
pub use self::slice::*;
pub use self::sort::*;
pub use self::strings::*;
pub use self::summarise::*;
pub use self::utils::*;

// Export specific functions from group modules to avoid conflicts
pub use self::group_by::{dplyr_rs_group_indices_i32, dplyr_rs_group_keys};
pub use self::group_data::{dplyr_rs_group_indices, dplyr_rs_group_keys_simple};

// WASM bindings are now in their respective modules (filter.rs, sort.rs, etc.)

#[cfg(feature = "wasm")]
pub mod array_helpers_wasm;
