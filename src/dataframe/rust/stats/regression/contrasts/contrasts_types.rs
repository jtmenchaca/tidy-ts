//! Contrast types and structures

/// Types of contrasts available for factor variables
#[derive(Debug, Clone)]
pub enum ContrastType {
    /// Treatment contrasts (dummy coding) - reference level is first
    Treatment,
    /// Sum contrasts - coefficients sum to zero
    Sum,
    /// Helmert contrasts - compare each level to the mean of subsequent levels
    Helmert,
    /// Polynomial contrasts - for ordered factors
    Polynomial,
    /// Custom contrast matrix
    Custom(Vec<Vec<f64>>),
}

/// A contrast matrix for a factor variable
#[derive(Debug, Clone)]
pub struct ContrastMatrix {
    /// The contrast matrix (n_levels x n_contrasts)
    pub matrix: Vec<f64>,
    /// Number of factor levels
    pub n_levels: usize,
    /// Number of contrast columns
    pub n_contrasts: usize,
    /// Names of the contrast columns
    pub column_names: Vec<String>,
    /// Names of the factor levels
    pub level_names: Vec<String>,
}
