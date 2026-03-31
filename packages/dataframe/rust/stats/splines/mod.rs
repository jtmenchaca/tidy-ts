//! Spline basis functions for tidy-ts
//!
//! Port of R's `splines` package (R Core Team) to Rust.
//! See `target-trial-port-plan.md` for context.
//!
//! ## Module Organization
//!
//! - `spline_design`: Core B-spline basis evaluation (from `splines.c`)
//! - `natural_splines`: Natural spline basis `ns()` (from `splines.R`)
//! - `b_splines`: B-spline basis `bs()` (from `splines.R`)

pub mod spline_design;
pub mod natural_splines;
pub mod b_splines;

pub use spline_design::*;
pub use natural_splines::*;
pub use b_splines::*;
