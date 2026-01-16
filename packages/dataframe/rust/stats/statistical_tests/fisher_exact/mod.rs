//! # Fisher's Exact Test
//!
//! Implementation of Fisher's exact test for 2x2 contingency tables.
//! This test is used to determine if there are nonrandom associations
//! between two categorical variables.
//!
//! Fisher's exact test is particularly useful when sample sizes are small
//! or when the expected frequencies in any cell of a 2x2 contingency table
//! are less than 5.

pub mod fishers_exact;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
pub mod wasm;

pub use fishers_exact::fishers_exact_test;
