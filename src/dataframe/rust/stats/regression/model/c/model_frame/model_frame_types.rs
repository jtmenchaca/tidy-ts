//! Model frame types and structures

/// Represents a model frame containing all variables for model construction
#[derive(Debug, Clone)]
pub struct ModelFrame {
    /// Variables in the model frame
    pub variables: Vec<Variable>,
    /// Names of the variables
    pub variable_names: Vec<String>,
    /// Row names (optional)
    pub row_names: Option<Vec<String>>,
    /// Number of observations
    pub n_rows: usize,
    /// Number of variables
    pub n_cols: usize,
}

/// Represents a variable in the model frame
#[derive(Debug, Clone)]
pub enum Variable {
    /// Numeric variable
    Numeric(Vec<f64>),
    /// Factor variable with levels and labels
    Factor {
        values: Vec<i32>,
        levels: Vec<String>,
        ordered: bool,
    },
    /// Logical/boolean variable
    Logical(Vec<bool>),
    /// Character variable
    Character(Vec<String>),
}

impl Variable {
    /// Get the length (number of observations) of the variable
    pub fn len(&self) -> usize {
        match self {
            Variable::Numeric(data) => data.len(),
            Variable::Factor { values, .. } => values.len(),
            Variable::Logical(data) => data.len(),
            Variable::Character(data) => data.len(),
        }
    }
}

/// Action to take with missing values
#[derive(Debug, Clone)]
pub enum NaAction {
    /// Remove rows with any missing values
    Omit,
    /// Keep missing values as-is
    Pass,
    /// Fail if any missing values are found
    Fail,
}

/// Result of model frame creation
#[derive(Debug, Clone)]
pub struct ModelFrameResult {
    /// The created model frame
    pub frame: ModelFrame,
    /// Rows that were removed due to missing values or subsetting
    pub removed_rows: Vec<usize>,
    /// Number of missing values found
    pub n_missing: usize,
    /// Whether any missing values were found
    pub has_missing: bool,
}
