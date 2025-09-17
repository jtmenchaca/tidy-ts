//! Model matrix utility functions

use super::model_matrix_types::ModelMatrix;

/// Get a specific column from the model matrix
///
/// # Arguments
///
/// * `matrix` - The model matrix
/// * `col_idx` - Index of the column to retrieve (0-based)
///
/// # Returns
///
/// * `Vec<f64>` - The column data
///
/// # Errors
///
/// * Returns error if column index is out of bounds
pub fn get_column(matrix: &ModelMatrix, col_idx: usize) -> Result<Vec<f64>, &'static str> {
    if col_idx >= matrix.n_cols {
        return Err("Column index out of bounds");
    }

    let start_idx = col_idx * matrix.n_rows;
    let end_idx = start_idx + matrix.n_rows;
    
    Ok(matrix.matrix[start_idx..end_idx].to_vec())
}

/// Get multiple columns from the model matrix
///
/// # Arguments
///
/// * `matrix` - The model matrix
/// * `col_indices` - Indices of the columns to retrieve (0-based)
///
/// # Returns
///
/// * `Vec<Vec<f64>>` - Vector of column data
///
/// # Errors
///
/// * Returns error if any column index is out of bounds
pub fn get_columns(
    matrix: &ModelMatrix,
    col_indices: &[usize],
) -> Result<Vec<Vec<f64>>, &'static str> {
    let mut columns = Vec::new();
    
    for &col_idx in col_indices {
        columns.push(get_column(matrix, col_idx)?);
    }
    
    Ok(columns)
}

/// Convert model matrix to 2D vector format (row-major)
///
/// # Arguments
///
/// * `matrix` - The model matrix (stored in column-major format)
///
/// # Returns
///
/// * `Vec<Vec<f64>>` - 2D vector in row-major format
pub fn get_matrix_2d(matrix: &ModelMatrix) -> Vec<Vec<f64>> {
    let mut result = vec![vec![0.0; matrix.n_cols]; matrix.n_rows];
    
    for row in 0..matrix.n_rows {
        for col in 0..matrix.n_cols {
            result[row][col] = matrix.matrix[col * matrix.n_rows + row];
        }
    }
    
    result
}
