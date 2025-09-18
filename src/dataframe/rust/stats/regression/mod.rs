//! Model construction and formula processing for statistical modeling
//!
//! This module provides Rust implementations of R's model matrix construction
//! and formula processing functionality, equivalent to R's `model.matrix()`,
//! `model.frame()`, and `terms()` functions.
//!
//! ## Architecture
//!
//! The module is organized into focused components:
//!
//! - **`model_frame`**: Data preparation and validation
//! - **`model_matrix`**: Design matrix construction
//! - **`formula`**: Formula parsing and term expansion
//! - **`contrasts`**: Factor contrast coding
//! - **`builder`**: High-level API coordination
//!
//! ## Usage Example
//!
//! ```rust
//! use tidy_ts::stats::model::ModelBuilder;
//!
//! let model = ModelBuilder::new("y ~ x1 + x2")
//!     .data(data_frame)
//!     .contrasts(vec![Treatment, Sum])
//!     .build()?;
//! ```

pub mod builder;
pub mod contrasts;
pub mod family;
pub mod glm;
pub mod lm;
pub mod model;
// pub mod lm_influence; // TODO: Implement
pub mod model_utilities;
pub mod shared;

// Influence diagnostics
pub mod influence;

// Re-export main types for convenience
pub use builder::ModelBuilder;
pub use contrasts::{ContrastMatrix, ContrastType, create_contrasts};
pub use model::{ModelFrame, ModelMatrix, NaAction, Term, Terms, Variable};
// pub use lm_influence::{
//     InfluenceResult, LinearModel, hat, weighted_residuals, lm_influence,
//     dffits, dfbeta, dfbetas, covratio, cooks_distance, rstandard, rstudent,
//     influence_measures, InfluenceMeasuresResult
// };
pub use lm::lm_influence_modular::{
    InfluenceMeasuresResult, InfluenceResult, LinearModel, QrLsResult, analyze_influence,
    cooks_distance, covratio, dfbeta, dfbetas, dffits, hat, hatvalues, influence, lm_influence,
    quick_influence_check, rstandard, rstudent, weighted_residuals,
};
pub use model_utilities::{
    ModelObject, TermsObject, get_all_vars, get_xlevels, is_empty_model, make_predict_call,
    model_extract, model_offset, model_response, model_weights,
};
