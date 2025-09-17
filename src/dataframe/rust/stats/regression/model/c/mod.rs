//! C implementation and Rust ports for model construction
//!
//! This directory contains both the original C implementation and the corresponding
//! Rust translations of R's model construction functions.

pub mod expand_model_frame;
pub mod formula;
pub mod model_frame;
pub mod model_matrix;

// Re-export main functions for easy access
pub use expand_model_frame::{expand_model_frame, expand_model_frame_formula};
pub use formula::{FormulaParser, Term, Terms, parse_formula, update_formula};
pub use model_frame::{ModelFrame, ModelFrameResult, NaAction, Variable, create_model_frame};
pub use model_matrix::{ModelMatrix, ModelMatrixResult, create_model_matrix};
