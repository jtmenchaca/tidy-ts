//! Model builder types and structures

use crate::stats::regression::contrasts::ContrastType;
use crate::stats::regression::model::{ModelFrame, NaAction, Variable};

/// Builder for constructing statistical models
///
/// This struct provides a fluent interface for building models step by step.
/// It coordinates formula parsing, data preparation, and design matrix construction.
///
/// # Example
///
/// ```rust
/// use tidy_ts::stats::model::ModelBuilder;
///
/// let model = ModelBuilder::new("y ~ x1 + x2")
///     .data(data_frame)
///     .contrasts(vec![ContrastType::Treatment, ContrastType::Sum])
///     .na_action(NaAction::Omit)
///     .build()?;
/// ```
pub struct ModelBuilder {
    /// The model formula
    pub formula: String,
    /// Variables for the model frame
    pub variables: Option<Vec<Variable>>,
    /// Variable names
    pub variable_names: Option<Vec<String>>,
    /// Row names (optional)
    pub row_names: Option<Vec<String>>,
    /// Contrast specifications for factors
    pub contrasts: Vec<ContrastType>,
    /// How to handle missing values
    pub na_action: NaAction,
    /// Subset of rows to include
    pub subset: Option<Vec<usize>>,
}
