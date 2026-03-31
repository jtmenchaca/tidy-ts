//! Sequential Trial Emulation (SEQTaRget port)
//!
//! Full pipeline runs in Rust: data expansion, weight computation,
//! model fitting, survival curves, bootstrap, hazard ratios, CI aggregation.

pub mod bootstrap;
pub mod covariates;
pub mod expand;
pub mod glm_helpers;
pub mod hazard;
pub mod outcome_models;
pub mod pipeline;
pub mod risk_comparison;
pub mod survival_curves;
pub mod types;
pub mod weights;

#[cfg(feature = "wasm")]
pub mod wasm;
