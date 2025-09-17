//! Model matrix types and structures

use crate::stats::regression::contrasts::ContrastMatrix;

/// A design matrix for statistical modeling
#[derive(Debug, Clone)]
pub struct ModelMatrix {
    /// The design matrix (column-major order, n_rows x n_cols)
    pub matrix: Vec<f64>,
    /// Number of observations (rows)
    pub n_rows: usize,
    /// Number of predictor variables (columns)
    pub n_cols: usize,
    /// Names of the columns
    pub column_names: Vec<String>,
    /// Assignment of columns to model terms
    pub term_assignments: Vec<i32>,
    /// Row names (optional)
    pub row_names: Option<Vec<String>>,
}

/// Result of model matrix creation
#[derive(Debug, Clone)]
pub struct ModelMatrixResult {
    /// The model matrix
    pub matrix: ModelMatrix,
    /// Number of columns per term
    pub columns_per_term: Vec<usize>,
    /// Contrast matrices used (for factors)
    pub contrasts: Vec<Option<ContrastMatrix>>,
}
