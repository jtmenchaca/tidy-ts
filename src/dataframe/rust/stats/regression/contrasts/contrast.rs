//! Contrast coding for factors
//!
//! This module provides functionality equivalent to R's `contrasts()` function
//! and related contrast coding functions like `contr.treatment()`, `contr.sum()`,
//! `contr.helmert()`, etc.

use crate::stats::model::contrasts::{ContrastMatrix, ContrastType};

/// Gets or sets contrasts for a factor
///
/// This is equivalent to R's `contrasts()` function.
pub fn contrasts(
    x: &[i32],
    levels: &[String],
    contrast_type: Option<ContrastType>,
    sparse: bool,
) -> Result<ContrastMatrix, &'static str> {
    if levels.is_empty() {
        return Err("factor must have at least one level");
    }

    if sparse {
        // For now, sparse matrices are not implemented
        return Err("sparse contrasts not yet implemented");
    }

    let contrast_type = contrast_type.unwrap_or(ContrastType::Treatment);

    match contrast_type {
        ContrastType::Treatment => contr_treatment(levels.len(), 1, true, false),
        ContrastType::Sum => contr_sum(levels.len(), true, false),
        ContrastType::Helmert => contr_helmert(levels.len(), true, false),
        ContrastType::Polynomial => contr_poly(levels.len(), None, true, false),
        ContrastType::Custom(_) => Err("custom contrasts not supported in this function"),
    }
}

/// Treatment contrasts (dummy coding)
///
/// This is equivalent to R's `contr.treatment()` function.
pub fn contr_treatment(
    n: usize,
    base: usize,
    contrasts: bool,
    sparse: bool,
) -> Result<ContrastMatrix, &'static str> {
    if n < 2 {
        return Err("contrasts not defined for less than 2 levels");
    }

    if base < 1 || base > n {
        return Err("baseline group number out of range");
    }

    if sparse {
        return Err("sparse contrasts not yet implemented");
    }

    let level_names: Vec<String> = (1..=n).map(|i| i.to_string()).collect();

    if contrasts {
        let n_contrasts = n - 1;
        let mut matrix = vec![0.0; n * n_contrasts];
        let mut column_names = Vec::new();

        let mut col_idx = 0;
        for i in 1..=n {
            if i != base {
                // Set this level to 1
                matrix[(i - 1) * n_contrasts + col_idx] = 1.0;
                column_names.push(i.to_string());
                col_idx += 1;
            }
        }

        Ok(ContrastMatrix {
            matrix,
            n_levels: n,
            n_contrasts,
            column_names,
            level_names,
        })
    } else {
        // Full matrix (identity)
        let mut matrix = vec![0.0; n * n];
        for i in 0..n {
            matrix[i * n + i] = 1.0;
        }

        Ok(ContrastMatrix {
            matrix,
            n_levels: n,
            n_contrasts: n,
            column_names: level_names.clone(),
            level_names,
        })
    }
}

/// Sum contrasts (deviation coding)
///
/// This is equivalent to R's `contr.sum()` function.
pub fn contr_sum(n: usize, contrasts: bool, sparse: bool) -> Result<ContrastMatrix, &'static str> {
    if n < 2 {
        return Err("contrasts not defined for less than 2 levels");
    }

    if sparse {
        return Err("sparse contrasts not yet implemented");
    }

    let level_names: Vec<String> = (1..=n).map(|i| i.to_string()).collect();

    if contrasts {
        let n_contrasts = n - 1;
        let mut matrix = vec![0.0; n * n_contrasts];
        let mut column_names = Vec::new();

        for j in 0..n_contrasts {
            // Set current level to 1
            matrix[j * n_contrasts + j] = 1.0;
            // Set last level to -1
            matrix[(n - 1) * n_contrasts + j] = -1.0;
            column_names.push((j + 1).to_string());
        }

        Ok(ContrastMatrix {
            matrix,
            n_levels: n,
            n_contrasts,
            column_names,
            level_names,
        })
    } else {
        // Full matrix (identity)
        let mut matrix = vec![0.0; n * n];
        for i in 0..n {
            matrix[i * n + i] = 1.0;
        }

        Ok(ContrastMatrix {
            matrix,
            n_levels: n,
            n_contrasts: n,
            column_names: level_names.clone(),
            level_names,
        })
    }
}

/// Helmert contrasts
///
/// This is equivalent to R's `contr.helmert()` function.
pub fn contr_helmert(
    n: usize,
    contrasts: bool,
    sparse: bool,
) -> Result<ContrastMatrix, &'static str> {
    if n < 2 {
        return Err("contrasts not defined for less than 2 levels");
    }

    if sparse {
        return Err("sparse contrasts not yet implemented");
    }

    let level_names: Vec<String> = (1..=n).map(|i| i.to_string()).collect();

    if contrasts {
        let n_contrasts = n - 1;
        let mut matrix = vec![0.0; n * n_contrasts];
        let mut column_names = Vec::new();

        for j in 0..n_contrasts {
            // Current level gets 1
            matrix[j * n_contrasts + j] = 1.0;

            // Subsequent levels get -1/(n_subsequent)
            let n_subsequent = n - j - 1;
            let weight = -1.0 / n_subsequent as f64;

            for i in (j + 1)..n {
                matrix[i * n_contrasts + j] = weight;
            }

            column_names.push((j + 1).to_string());
        }

        Ok(ContrastMatrix {
            matrix,
            n_levels: n,
            n_contrasts,
            column_names,
            level_names,
        })
    } else {
        // Full matrix (identity)
        let mut matrix = vec![0.0; n * n];
        for i in 0..n {
            matrix[i * n + i] = 1.0;
        }

        Ok(ContrastMatrix {
            matrix,
            n_levels: n,
            n_contrasts: n,
            column_names: level_names.clone(),
            level_names,
        })
    }
}

/// SAS-style treatment contrasts
///
/// This is equivalent to R's `contr.SAS()` function.
pub fn contr_sas(n: usize, contrasts: bool, sparse: bool) -> Result<ContrastMatrix, &'static str> {
    // SAS contrasts are treatment contrasts with last level as baseline
    contr_treatment(n, n, contrasts, sparse)
}

/// Polynomial contrasts (re-export from contr.poly)
pub fn contr_poly(
    n: usize,
    scores: Option<Vec<f64>>,
    contrasts: bool,
    sparse: bool,
) -> Result<ContrastMatrix, &'static str> {
    crate::stats::regression::contr_poly::contr_poly(n, scores, contrasts, sparse)
}

/// Creates a diagonal matrix for levels
///
/// This is equivalent to R's `.Diag()` function.
fn diag_matrix(level_names: &[String], sparse: bool) -> Result<ContrastMatrix, &'static str> {
    if sparse {
        return Err("sparse matrices not yet implemented");
    }

    let n = level_names.len();
    let mut matrix = vec![0.0; n * n];

    // Create identity matrix
    for i in 0..n {
        matrix[i * n + i] = 1.0;
    }

    Ok(ContrastMatrix {
        matrix,
        n_levels: n,
        n_contrasts: n,
        column_names: level_names.to_vec(),
        level_names: level_names.to_vec(),
    })
}

/// Sets contrasts for a factor
///
/// This is equivalent to R's `contrasts<-()` function.
pub fn set_contrasts(
    levels: &[String],
    contrast_type: ContrastType,
    how_many: Option<usize>,
) -> Result<ContrastMatrix, &'static str> {
    if levels.len() < 2 {
        return Err("contrasts can be applied only to factors with 2 or more levels");
    }

    match contrast_type {
        ContrastType::Treatment => contr_treatment(levels.len(), 1, true, false),
        ContrastType::Sum => contr_sum(levels.len(), true, false),
        ContrastType::Helmert => contr_helmert(levels.len(), true, false),
        ContrastType::Polynomial => contr_poly(levels.len(), None, true, false),
        ContrastType::Custom(custom_matrix) => {
            validate_custom_contrasts(&custom_matrix, levels.len(), levels)
        }
    }
}

/// Validates custom contrast matrix
fn validate_custom_contrasts(
    custom_matrix: &[Vec<f64>],
    n_levels: usize,
    level_names: &[String],
) -> Result<ContrastMatrix, &'static str> {
    if custom_matrix.is_empty() {
        return Err("custom contrast matrix cannot be empty");
    }

    let n_contrasts = custom_matrix.len();

    // Validate dimensions
    for row in custom_matrix {
        if row.len() != n_levels {
            return Err("row has wrong length");
        }
    }

    // Flatten matrix (column-major order)
    let mut matrix = Vec::with_capacity(n_levels * n_contrasts);
    for i in 0..n_levels {
        for j in 0..n_contrasts {
            matrix.push(custom_matrix[j][i]);
        }
    }

    // Generate column names
    let column_names = (0..n_contrasts).map(|i| format!("C{}", i + 1)).collect();

    Ok(ContrastMatrix {
        matrix,
        n_levels,
        n_contrasts,
        column_names,
        level_names: level_names.to_vec(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_contr_treatment() {
        let result = contr_treatment(3, 1, true, false).unwrap();

        assert_eq!(result.n_levels, 3);
        assert_eq!(result.n_contrasts, 2);
        assert_eq!(result.column_names, vec!["2", "3"]);

        // Check matrix structure
        assert_eq!(result.matrix[0], 0.0); // Level 1, contrast 1
        assert_eq!(result.matrix[1], 0.0); // Level 1, contrast 2
        assert_eq!(result.matrix[2], 1.0); // Level 2, contrast 1
        assert_eq!(result.matrix[3], 0.0); // Level 2, contrast 2
        assert_eq!(result.matrix[4], 0.0); // Level 3, contrast 1
        assert_eq!(result.matrix[5], 1.0); // Level 3, contrast 2
    }

    #[test]
    fn test_contr_sum() {
        let result = contr_sum(3, true, false).unwrap();

        assert_eq!(result.n_levels, 3);
        assert_eq!(result.n_contrasts, 2);

        // Check that coefficients sum to zero
        for col in 0..result.n_contrasts {
            let sum: f64 = (0..result.n_levels)
                .map(|row| result.matrix[row * result.n_contrasts + col])
                .sum();
            assert!((sum.abs() < 1e-10));
        }
    }

    #[test]
    fn test_contr_helmert() {
        let result = contr_helmert(4, true, false).unwrap();

        assert_eq!(result.n_levels, 4);
        assert_eq!(result.n_contrasts, 3);

        // Check structure: first level gets 1, subsequent levels get negative weights
        assert_eq!(result.matrix[0], 1.0); // Level 1, contrast 1
        assert!(result.matrix[3] < 0.0); // Level 2, contrast 1 (negative)
    }

    #[test]
    fn test_contr_sas() {
        let result = contr_sas(3, true, false).unwrap();

        assert_eq!(result.n_levels, 3);
        assert_eq!(result.n_contrasts, 2);
        assert_eq!(result.column_names, vec!["1", "2"]); // Last level (3) is baseline
    }

    #[test]
    fn test_contrasts_function() {
        let levels = vec!["A".to_string(), "B".to_string(), "C".to_string()];
        let result = contrasts(&[1, 2, 3], &levels, Some(ContrastType::Treatment), false).unwrap();

        assert_eq!(result.n_levels, 3);
        assert_eq!(result.n_contrasts, 2);
    }

    #[test]
    fn test_set_contrasts() {
        let levels = vec!["Low".to_string(), "Medium".to_string(), "High".to_string()];
        let result = set_contrasts(&levels, ContrastType::Sum, None).unwrap();

        assert_eq!(result.n_levels, 3);
        assert_eq!(result.n_contrasts, 2);
    }

    #[test]
    fn test_error_cases() {
        // Too few levels
        assert!(contr_treatment(1, 1, true, false).is_err());
        assert!(contr_sum(1, true, false).is_err());
        assert!(contr_helmert(1, true, false).is_err());

        // Invalid base
        assert!(contr_treatment(3, 0, true, false).is_err());
        assert!(contr_treatment(3, 4, true, false).is_err());

        // Sparse not implemented
        assert!(contr_treatment(3, 1, true, true).is_err());
    }
}
