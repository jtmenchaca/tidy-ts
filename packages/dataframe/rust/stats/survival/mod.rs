//! Survival analysis functions for tidy-ts
//!
//! Port of R's `survival` package (Terry Therneau) to Rust.
//! See `survival-port-plan.md` for the full implementation plan.
//!
//! ## Module Organization
//!
//! - `numerical_safety`: Safe exp/log with overflow prevention (from `coxsafe.c`)
//! - `cholesky`: FDF' Cholesky decomposition, solve, and inversion (from `cholesky2.c`, `chsolve2.c`, `chinv2.c`)
//! - `survival_object`: Survival data representation (right-censored, counting process)
//! - `kaplan_meier`: Kaplan-Meier estimator with Nelson-Aalen cumulative hazard (from `survfitkm.c`)

pub mod ag_cox_regression;
pub mod ag_cox_residuals;
pub mod cholesky;
pub mod cox_regression;
pub mod cox_residuals;
pub mod cox_score_residuals;
pub mod kaplan_meier;
pub mod logrank_test;
pub mod numerical_safety;
pub mod proportional_hazards_test;
pub mod survival_object;

pub use ag_cox_regression::*;
pub use ag_cox_residuals::*;
pub use cholesky::*;
pub use cox_regression::*;
pub use cox_residuals::*;
pub use cox_score_residuals::*;
pub use kaplan_meier::*;
pub use logrank_test::*;
pub use numerical_safety::*;
pub use proportional_hazards_test::*;
pub use survival_object::*;
