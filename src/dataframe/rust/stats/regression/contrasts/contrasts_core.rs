//! Core contrast matrix creation functions

use super::contrasts_types::{ContrastType, ContrastMatrix};

/// Creates a contrast matrix for a factor variable
///
/// # Arguments
///
/// * `levels` - The factor levels
/// * `contrast_type` - Type of contrast to create
///
/// # Returns
///
/// A `ContrastMatrix` with the specified contrast coding
pub fn create_contrasts(
    levels: &[String],
    contrast_type: &ContrastType,
) -> Result<ContrastMatrix, &'static str> {
    if levels.is_empty() {
        return Err("No factor levels provided");
    }

    if levels.len() < 2 {
        return Err("At least 2 factor levels required for contrasts");
    }

    let n_levels = levels.len();
    let n_contrasts = n_levels - 1;

    match contrast_type {
        ContrastType::Treatment => create_treatment_contrasts(levels, n_levels, n_contrasts),
        ContrastType::Sum => create_sum_contrasts(levels, n_levels, n_contrasts),
        ContrastType::Helmert => create_helmert_contrasts(levels, n_levels, n_contrasts),
        ContrastType::Polynomial => create_polynomial_contrasts(levels, n_levels, n_contrasts),
        ContrastType::Custom(matrix) => create_custom_contrasts(levels, matrix),
    }
}

/// Creates treatment contrasts (dummy coding)
fn create_treatment_contrasts(
    levels: &[String],
    n_levels: usize,
    n_contrasts: usize,
) -> Result<ContrastMatrix, &'static str> {
    let mut matrix = vec![0.0; n_levels * n_contrasts];
    let mut column_names = Vec::new();

    // Create contrasts for levels 1 through n_levels-1
    for i in 1..n_levels {
        // Set the i-th level to 1 in the i-1-th contrast
        matrix[i * n_contrasts + (i - 1)] = 1.0;
        column_names.push(levels[i].clone());
    }

    Ok(ContrastMatrix {
        matrix,
        n_levels,
        n_contrasts,
        column_names,
        level_names: levels.to_vec(),
    })
}

/// Creates sum contrasts (coefficients sum to zero)
fn create_sum_contrasts(
    levels: &[String],
    n_levels: usize,
    n_contrasts: usize,
) -> Result<ContrastMatrix, &'static str> {
    let mut matrix = vec![0.0; n_levels * n_contrasts];
    let mut column_names = Vec::new();

    // Create contrasts for levels 1 through n_levels-1
    for i in 1..n_levels {
        // Set the i-th level to 1 in the i-1-th contrast
        matrix[i * n_contrasts + (i - 1)] = 1.0;
        // Set the first level to -1 in the i-1-th contrast
        matrix[0 * n_contrasts + (i - 1)] = -1.0;
        column_names.push(levels[i].clone());
    }

    Ok(ContrastMatrix {
        matrix,
        n_levels,
        n_contrasts,
        column_names,
        level_names: levels.to_vec(),
    })
}

/// Creates Helmert contrasts
fn create_helmert_contrasts(
    levels: &[String],
    n_levels: usize,
    n_contrasts: usize,
) -> Result<ContrastMatrix, &'static str> {
    let mut matrix = vec![0.0; n_levels * n_contrasts];
    let mut column_names = Vec::new();

    for i in 0..n_contrasts {
        // First i+1 levels get positive weights
        for j in 0..=i {
            matrix[j * n_contrasts + i] = 1.0;
        }
        // The (i+2)-th level gets negative weight
        if i + 1 < n_levels {
            matrix[(i + 1) * n_contrasts + i] = -(i + 1) as f64;
        }
        column_names.push(levels[i].clone());
    }

    Ok(ContrastMatrix {
        matrix,
        n_levels,
        n_contrasts,
        column_names,
        level_names: levels.to_vec(),
    })
}

/// Creates polynomial contrasts for ordered factors
fn create_polynomial_contrasts(
    levels: &[String],
    n_levels: usize,
    n_contrasts: usize,
) -> Result<ContrastMatrix, &'static str> {
    let mut matrix = vec![0.0; n_levels * n_contrasts];
    let mut column_names = Vec::new();

    // Create polynomial contrasts using orthogonal polynomials
    for i in 0..n_contrasts {
        let degree = i + 1;
        column_names.push(format!("L{}", degree));
        
        // Generate polynomial values for each level
        for j in 0..n_levels {
            let x = j as f64;
            let value = match degree {
                1 => x - (n_levels - 1) as f64 / 2.0, // Linear
                2 => x * x - (n_levels - 1) as f64 * (2.0 * n_levels - 1.0) / 6.0, // Quadratic
                _ => {
                    // Higher order polynomials (simplified)
                    let mut result = 1.0;
                    for k in 0..degree {
                        result *= x - k as f64;
                    }
                    result
                }
            };
            matrix[j * n_contrasts + i] = value;
        }
    }

    Ok(ContrastMatrix {
        matrix,
        n_levels,
        n_contrasts,
        column_names,
        level_names: levels.to_vec(),
    })
}

/// Creates custom contrasts from user-provided matrix
fn create_custom_contrasts(
    levels: &[String],
    custom_matrix: &[Vec<f64>],
) -> Result<ContrastMatrix, &'static str> {
    if custom_matrix.is_empty() {
        return Err("Custom contrast matrix cannot be empty");
    }

    let n_levels = levels.len();
    let n_contrasts = custom_matrix.len();

    // Validate matrix dimensions
    for (i, row) in custom_matrix.iter().enumerate() {
        if row.len() != n_levels {
            return Err("Custom contrast matrix rows must have same length as number of levels");
        }
    }

    // Convert to column-major format
    let mut matrix = vec![0.0; n_levels * n_contrasts];
    for i in 0..n_levels {
        for j in 0..n_contrasts {
            matrix[i * n_contrasts + j] = custom_matrix[j][i];
        }
    }

    let column_names = (1..=n_contrasts).map(|i| format!("C{}", i)).collect();

    Ok(ContrastMatrix {
        matrix,
        n_levels,
        n_contrasts,
        column_names,
        level_names: levels.to_vec(),
    })
}
