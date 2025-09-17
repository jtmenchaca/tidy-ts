//! Contrast tests

use super::contrasts_types::*;
use super::contrasts_core::*;
use super::contrasts_utils::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_treatment_contrasts() {
        let levels = vec!["A".to_string(), "B".to_string(), "C".to_string()];
        let contrasts = create_contrasts(&levels, &ContrastType::Treatment).unwrap();

        assert_eq!(contrasts.n_levels, 3);
        assert_eq!(contrasts.n_contrasts, 2);
        assert_eq!(contrasts.column_names, vec!["B", "C"]);

        // Check matrix structure (column-major order)
        assert_eq!(contrasts.matrix[0], 0.0); // A level, B contrast
        assert_eq!(contrasts.matrix[1], 0.0); // A level, C contrast
        assert_eq!(contrasts.matrix[2], 1.0); // B level, B contrast
        assert_eq!(contrasts.matrix[3], 0.0); // B level, C contrast
        assert_eq!(contrasts.matrix[4], 0.0); // C level, B contrast
        assert_eq!(contrasts.matrix[5], 1.0); // C level, C contrast
    }

    #[test]
    fn test_sum_contrasts() {
        let levels = vec!["A".to_string(), "B".to_string(), "C".to_string()];
        let contrasts = create_contrasts(&levels, &ContrastType::Sum).unwrap();

        assert_eq!(contrasts.n_levels, 3);
        assert_eq!(contrasts.n_contrasts, 2);

        // Check that coefficients sum to zero
        for col in 0..contrasts.n_contrasts {
            let sum: f64 = (0..contrasts.n_levels)
                .map(|row| contrasts.matrix[row * contrasts.n_contrasts + col])
                .sum();
            assert!((sum.abs() < 1e-10));
        }
    }

    #[test]
    fn test_apply_contrasts() {
        let levels = vec!["A".to_string(), "B".to_string(), "C".to_string()];
        let contrasts = create_contrasts(&levels, &ContrastType::Treatment).unwrap();

        let factor_values = vec![1, 2, 3, 1, 2]; // A, B, C, A, B
        let result = apply_contrasts(&factor_values, &contrasts).unwrap();

        assert_eq!(result.len(), 10); // 5 rows * 2 contrasts

        // First row (A): should be [0, 0]
        assert_eq!(result[0], 0.0);
        assert_eq!(result[1], 0.0);

        // Second row (B): should be [1, 0]
        assert_eq!(result[2], 1.0);
        assert_eq!(result[3], 0.0);

        // Third row (C): should be [0, 1]
        assert_eq!(result[4], 0.0);
        assert_eq!(result[5], 1.0);
    }

    #[test]
    fn test_custom_contrasts() {
        let levels = vec!["A".to_string(), "B".to_string(), "C".to_string()];
        let custom_matrix = vec![
            vec![1.0, 0.0, -1.0], // A vs C
            vec![0.0, 1.0, -1.0], // B vs C
        ];

        let contrasts = create_contrasts(&levels, &ContrastType::Custom(custom_matrix)).unwrap();

        assert_eq!(contrasts.n_levels, 3);
        assert_eq!(contrasts.n_contrasts, 2);
        assert_eq!(contrasts.column_names, vec!["C1", "C2"]);
    }

    #[test]
    fn test_helmert_contrasts() {
        let levels = vec!["A".to_string(), "B".to_string(), "C".to_string(), "D".to_string()];
        let contrasts = create_contrasts(&levels, &ContrastType::Helmert).unwrap();

        assert_eq!(contrasts.n_levels, 4);
        assert_eq!(contrasts.n_contrasts, 3);
        assert_eq!(contrasts.column_names, vec!["A", "B", "C"]);

        // Check structure: first level gets 1, subsequent levels get negative weights
        assert_eq!(contrasts.matrix[0], 1.0); // A in first contrast
        assert!(contrasts.matrix[3] < 0.0); // B in first contrast (negative, column-major)
    }

    #[test]
    fn test_polynomial_contrasts() {
        let levels = vec!["1".to_string(), "2".to_string(), "3".to_string(), "4".to_string()];
        let contrasts = create_contrasts(&levels, &ContrastType::Polynomial).unwrap();

        assert_eq!(contrasts.n_levels, 4);
        assert_eq!(contrasts.n_contrasts, 3);
        assert_eq!(contrasts.column_names, vec!["L1", "L2", "L3"]);

        // Linear contrast should have evenly spaced values
        let linear_contrast: Vec<f64> = (0..4)
            .map(|i| contrasts.matrix[i * 3])
            .collect();
        
        // Check that linear contrast has some structure
        assert!(linear_contrast[1] > linear_contrast[0]);
        assert!(linear_contrast[2] > linear_contrast[1]);
    }

    #[test]
    fn test_contrasts_error_cases() {
        // Empty levels
        assert!(create_contrasts(&[], &ContrastType::Treatment).is_err());

        // Single level (insufficient for contrasts)
        let single_level = vec!["A".to_string()];
        assert!(create_contrasts(&single_level, &ContrastType::Treatment).is_err());

        // Invalid custom matrix (wrong dimensions)
        let levels = vec!["A".to_string(), "B".to_string()];
        let invalid_custom = vec![vec![1.0, 0.0, 0.0]]; // Wrong length
        assert!(create_contrasts(&levels, &ContrastType::Custom(invalid_custom)).is_err());

        // Empty custom matrix
        let empty_custom: Vec<Vec<f64>> = vec![];
        assert!(create_contrasts(&levels, &ContrastType::Custom(empty_custom)).is_err());
    }

    #[test]
    fn test_apply_contrasts_error_cases() {
        let levels = vec!["A".to_string(), "B".to_string()];
        let contrasts = create_contrasts(&levels, &ContrastType::Treatment).unwrap();

        // Factor values out of range
        let invalid_values = vec![0, 1, 3]; // 0 and 3 are out of range
        assert!(apply_contrasts(&invalid_values, &contrasts).is_err());

        // Empty factor values
        let empty_values: Vec<i32> = vec![];
        let result = apply_contrasts(&empty_values, &contrasts).unwrap();
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn test_all_contrast_types_consistency() {
        let levels = vec!["Low".to_string(), "Medium".to_string(), "High".to_string()];
        
        // Test all contrast types produce expected dimensions
        for contrast_type in [
            ContrastType::Treatment,
            ContrastType::Sum,
            ContrastType::Helmert,
            ContrastType::Polynomial,
        ] {
            let contrasts = create_contrasts(&levels, &contrast_type).unwrap();
            assert_eq!(contrasts.n_levels, 3);
            assert_eq!(contrasts.n_contrasts, 2); // n_levels - 1
            assert_eq!(contrasts.level_names, levels);
            assert_eq!(contrasts.matrix.len(), 6); // n_levels * n_contrasts
        }
    }

    #[test]
    fn test_large_factor_performance() {
        // Test with larger number of levels
        let levels: Vec<String> = (0..20).map(|i| format!("Level_{}", i)).collect();
        let contrasts = create_contrasts(&levels, &ContrastType::Treatment).unwrap();
        
        assert_eq!(contrasts.n_levels, 20);
        assert_eq!(contrasts.n_contrasts, 19);
        
        // Test applying contrasts
        let factor_values: Vec<i32> = (1..=20).cycle().take(100).collect();
        let result = apply_contrasts(&factor_values, &contrasts).unwrap();
        assert_eq!(result.len(), 100 * 19); // 100 rows * 19 contrasts
    }

    #[test]
    fn test_contrast_utility_functions() {
        let levels = vec!["A".to_string(), "B".to_string(), "C".to_string()];
        let contrasts = create_contrasts(&levels, &ContrastType::Treatment).unwrap();

        // Test get_contrast_names
        let names = get_contrast_names(&contrasts);
        assert_eq!(names, &["B", "C"]);

        // Test get_level_names
        let level_names = get_level_names(&contrasts);
        assert_eq!(level_names, &["A", "B", "C"]);

        // Test get_contrast_dimensions
        let (n_levels, n_contrasts) = get_contrast_dimensions(&contrasts);
        assert_eq!(n_levels, 3);
        assert_eq!(n_contrasts, 2);

        // Test validate_contrast_matrix
        assert!(validate_contrast_matrix(&contrasts).is_ok());

        // Test contrast_matrix_to_2d
        let matrix_2d = contrast_matrix_to_2d(&contrasts);
        assert_eq!(matrix_2d.len(), 3);
        assert_eq!(matrix_2d[0].len(), 2);
        assert_eq!(matrix_2d[0], vec![0.0, 0.0]); // A level
        assert_eq!(matrix_2d[1], vec![1.0, 0.0]); // B level
        assert_eq!(matrix_2d[2], vec![0.0, 1.0]); // C level

        // Test get_contrast_values_for_level
        let level_0_values = get_contrast_values_for_level(&contrasts, 0).unwrap();
        assert_eq!(level_0_values, vec![0.0, 0.0]); // A level

        let level_1_values = get_contrast_values_for_level(&contrasts, 1).unwrap();
        assert_eq!(level_1_values, vec![1.0, 0.0]); // B level

        // Test get_contrast_values_for_contrast
        let contrast_0_values = get_contrast_values_for_contrast(&contrasts, 0).unwrap();
        assert_eq!(contrast_0_values, vec![0.0, 1.0, 0.0]); // First contrast (B)

        let contrast_1_values = get_contrast_values_for_contrast(&contrasts, 1).unwrap();
        assert_eq!(contrast_1_values, vec![0.0, 0.0, 1.0]); // Second contrast (C)
    }

    #[test]
    fn test_contrast_validation_errors() {
        let levels = vec!["A".to_string(), "B".to_string()];
        let mut contrasts = create_contrasts(&levels, &ContrastType::Treatment).unwrap();

        // Test invalid dimensions
        contrasts.n_levels = 0;
        assert!(validate_contrast_matrix(&contrasts).is_err());

        // Test invalid matrix size
        contrasts.n_levels = 2;
        contrasts.matrix = vec![1.0, 2.0]; // Wrong size
        assert!(validate_contrast_matrix(&contrasts).is_err());

        // Test invalid column names length
        contrasts.matrix = vec![1.0, 2.0, 3.0, 4.0];
        contrasts.column_names = vec!["C1".to_string()]; // Wrong length
        assert!(validate_contrast_matrix(&contrasts).is_err());

        // Test invalid level names length
        contrasts.column_names = vec!["C1".to_string(), "C2".to_string()];
        contrasts.level_names = vec!["A".to_string()]; // Wrong length
        assert!(validate_contrast_matrix(&contrasts).is_err());

        // Test NaN values
        contrasts.level_names = vec!["A".to_string(), "B".to_string()];
        contrasts.matrix = vec![1.0, f64::NAN, 3.0, 4.0];
        assert!(validate_contrast_matrix(&contrasts).is_err());
    }
}
