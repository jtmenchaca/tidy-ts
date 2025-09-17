//! Model construction and formula processing
//!
//! This module provides Rust implementations of R's model construction
//! functionality including formula parsing, model frame creation, and
//! design matrix construction.

pub mod c;

// Re-export main types from submodules
pub use c::formula::{Term, Terms};
pub use c::model_frame::{ModelFrame, NaAction, Variable};
pub use c::model_matrix::ModelMatrix;
