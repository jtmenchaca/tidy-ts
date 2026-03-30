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
pub mod concordance;
pub mod cox_baseline_hazard;
pub mod cox_baseline_hazard_ms;
pub mod cholesky;
pub mod clustering;
pub mod cox_event_detail;
pub mod cox_exact;
pub mod cox_regression;
pub mod cox_residuals;
pub mod cox_residuals_derived;
pub mod cox_score_residuals;
pub mod cox_survival_efron;
pub mod cox_survival_kp;
pub mod data_splitting;
pub mod interpolation;
pub mod kaplan_meier;
pub mod logrank_test;
pub mod numerical_safety;
pub mod proportional_hazards_test;
pub mod survfit_residuals;
pub mod survival_object;
pub mod wald_test;

#[cfg(feature = "wasm")]
pub mod wasm;

pub use ag_cox_regression::*;
pub use ag_cox_residuals::*;
pub use concordance::*;
pub use cox_baseline_hazard::*;
pub use cox_baseline_hazard_ms::*;
pub use cholesky::*;
pub(crate) use clustering::*;
pub use cox_event_detail::*;
pub use cox_exact::*;
pub use cox_regression::*;
pub use cox_residuals::*;
pub use cox_residuals_derived::*;
pub use cox_score_residuals::*;
pub use cox_survival_efron::*;
pub use cox_survival_kp::*;
pub use data_splitting::*;
pub use interpolation::*;
pub use kaplan_meier::*;
pub use logrank_test::*;
pub(crate) use numerical_safety::*;
pub use proportional_hazards_test::*;
pub use survfit_residuals::*;
pub use survival_object::*;
pub use wald_test::*;
