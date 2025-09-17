//! Model construction and manipulation functions
//!
//! This module contains the Rust implementations of R's model construction functions,
//! originally from model.c. The functions have been modularized for better organization.
//!
//! The original C implementation is preserved in the `c/` subdirectory for reference.

pub mod c;

// Re-export main functions for easy access
pub use c::expand_model_frame::{expand_model_frame, expand_model_frame_formula};
pub use c::formula::{FormulaParser, Term, Terms, parse_formula, update_formula};
pub use c::model_frame::{ModelFrame, ModelFrameResult, NaAction, Variable, create_model_frame};
pub use c::model_matrix::{ContrastMatrix, ModelMatrix, ModelMatrixResult, create_model_matrix};
