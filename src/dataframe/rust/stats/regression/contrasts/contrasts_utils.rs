//! Contrast utility functions

use super::contrasts_types::ContrastMatrix;

/// Apply contrasts to factor values
///
/// # Arguments
///
/// * `factor_values` - Factor values (1-based indices)
/// * `contrasts` - Contrast matrix to apply
///
/// # Returns
///
/// * `Vec<f64>` - Contrast values in row-major order
///
/// # Errors
///
/// * Returns error if factor values are out of range
pub fn apply_contrasts(
    factor_values: &[i32],
    contrasts: &ContrastMatrix,
) -> Result<Vec<f64>, &'static str> {
    let mut result = Vec::new();

    for &factor_value in factor_values {
        if factor_value < 1 || factor_value > contrasts.n_levels as i32 {
            return Err("Factor value out of range");
        }

        let level_idx = (factor_value - 1) as usize;
        
        // Extract contrast values for this level
        for j in 0..contrasts.n_contrasts {
            result.push(contrasts.matrix[level_idx * contrasts.n_contrasts + j]);
        }
    }

    Ok(result)
}

/// Get contrast column names
pub fn get_contrast_names(contrasts: &ContrastMatrix) -> &[String] {
    &contrasts.column_names
}

/// Get factor level names
pub fn get_level_names(contrasts: &ContrastMatrix) -> &[String] {
    &contrasts.level_names
}

/// Get contrast matrix dimensions
pub fn get_contrast_dimensions(contrasts: &ContrastMatrix) -> (usize, usize) {
    (contrasts.n_levels, contrasts.n_contrasts)
}

/// Check if contrast matrix is valid
pub fn validate_contrast_matrix(contrasts: &ContrastMatrix) -> Result<(), &'static str> {
    // Check dimensions
    if contrasts.n_levels == 0 || contrasts.n_contrasts == 0 {
        return Err("Contrast matrix has zero dimensions");
    }

    // Check matrix size
    let expected_size = contrasts.n_levels * contrasts.n_contrasts;
    if contrasts.matrix.len() != expected_size {
        return Err("Contrast matrix size does not match dimensions");
    }

    // Check column names length
    if contrasts.column_names.len() != contrasts.n_contrasts {
        return Err("Number of column names does not match number of contrasts");
    }

    // Check level names length
    if contrasts.level_names.len() != contrasts.n_levels {
        return Err("Number of level names does not match number of levels");
    }

    // Check for NaN or infinite values
    for &value in &contrasts.matrix {
        if value.is_nan() || value.is_infinite() {
            return Err("Contrast matrix contains NaN or infinite values");
        }
    }

    Ok(())
}

/// Convert contrast matrix to 2D format (row-major)
pub fn contrast_matrix_to_2d(contrasts: &ContrastMatrix) -> Vec<Vec<f64>> {
    let mut result = vec![vec![0.0; contrasts.n_contrasts]; contrasts.n_levels];
    
    for i in 0..contrasts.n_levels {
        for j in 0..contrasts.n_contrasts {
            result[i][j] = contrasts.matrix[i * contrasts.n_contrasts + j];
        }
    }
    
    result
}

/// Get contrast values for a specific level
pub fn get_contrast_values_for_level(
    contrasts: &ContrastMatrix,
    level_idx: usize,
) -> Result<Vec<f64>, &'static str> {
    if level_idx >= contrasts.n_levels {
        return Err("Level index out of bounds");
    }

    let start_idx = level_idx * contrasts.n_contrasts;
    let end_idx = start_idx + contrasts.n_contrasts;
    
    Ok(contrasts.matrix[start_idx..end_idx].to_vec())
}

/// Get contrast values for a specific contrast
pub fn get_contrast_values_for_contrast(
    contrasts: &ContrastMatrix,
    contrast_idx: usize,
) -> Result<Vec<f64>, &'static str> {
    if contrast_idx >= contrasts.n_contrasts {
        return Err("Contrast index out of bounds");
    }

    let mut result = Vec::new();
    for i in 0..contrasts.n_levels {
        result.push(contrasts.matrix[i * contrasts.n_contrasts + contrast_idx]);
    }
    
    Ok(result)
}
