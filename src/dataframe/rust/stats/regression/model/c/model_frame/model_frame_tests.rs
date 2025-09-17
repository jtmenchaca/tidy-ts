//! Model frame tests

use super::model_frame_types::*;
use super::model_frame_core::create_model_frame;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_model_frame_basic() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Character(vec!["a".to_string(), "b".to_string(), "c".to_string()]),
        ];
        let names = vec!["x".to_string(), "y".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Pass).unwrap();

        assert_eq!(result.frame.n_rows, 3);
        assert_eq!(result.frame.n_cols, 2);
        assert_eq!(result.removed_rows.len(), 0);
    }

    #[test]
    fn test_create_model_frame_mismatched_lengths() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0]),
            Variable::Character(vec!["a".to_string()]), // Different length
        ];
        let names = vec!["x".to_string(), "y".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Pass);
        assert!(result.is_err());
    }

    #[test]
    fn test_create_model_frame_subset() {
        let variables = vec![Variable::Numeric(vec![1.0, 2.0, 3.0, 4.0])];
        let names = vec!["x".to_string()];
        let subset = vec![0, 2]; // Keep rows 0 and 2

        let result =
            create_model_frame(variables, names, None, Some(subset), NaAction::Pass).unwrap();

        assert_eq!(result.frame.n_rows, 2);
        assert_eq!(result.removed_rows, vec![1, 3]);
    }

    #[test]
    fn test_create_model_frame_with_missing_values() {
        let variables = vec![
            Variable::Numeric(vec![1.0, f64::NAN, 3.0, 4.0]),
            Variable::Logical(vec![false, true, false, false]),
        ];
        let names = vec!["x".to_string(), "missing".to_string()];

        // Test Omit action
        let result = create_model_frame(variables.clone(), names.clone(), None, None, NaAction::Omit).unwrap();
        assert_eq!(result.frame.n_rows, 3); // Row 1 removed due to NaN and missing
        assert_eq!(result.n_missing, 1); // Only one missing value per row

        // Test Fail action
        let result = create_model_frame(variables.clone(), names.clone(), None, None, NaAction::Fail);
        assert!(result.is_err());

        // Test Pass action
        let result = create_model_frame(variables, names, None, None, NaAction::Pass).unwrap();
        assert_eq!(result.frame.n_rows, 4); // All rows kept
        assert_eq!(result.n_missing, 0); // Not counted in Pass mode
    }

    #[test]
    fn test_create_model_frame_with_factors() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Factor {
                values: vec![1, 2, 1],
                levels: vec!["Low".to_string(), "High".to_string()],
                ordered: true,
            },
            Variable::Character(vec!["a".to_string(), "b".to_string(), "c".to_string()]),
        ];
        let names = vec!["y".to_string(), "group".to_string(), "text".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Pass).unwrap();

        assert_eq!(result.frame.n_rows, 3);
        assert_eq!(result.frame.n_cols, 3);
        
        // Check factor structure is preserved
        match &result.frame.variables[1] {
            Variable::Factor { levels, ordered, .. } => {
                assert_eq!(levels, &vec!["Low".to_string(), "High".to_string()]);
                assert_eq!(*ordered, true);
            }
            _ => panic!("Expected factor variable"),
        }
    }

    #[test]
    fn test_create_model_frame_with_row_names() {
        let variables = vec![Variable::Numeric(vec![1.0, 2.0, 3.0])];
        let names = vec!["x".to_string()];
        let row_names = Some(vec!["obs1".to_string(), "obs2".to_string(), "obs3".to_string()]);

        let result = create_model_frame(variables, names, row_names, None, NaAction::Pass).unwrap();

        assert_eq!(result.frame.row_names.as_ref().unwrap(), &vec!["obs1", "obs2", "obs3"]);
    }

    #[test]
    fn test_create_model_frame_error_cases() {
        // Mismatched variable and name counts
        let variables = vec![Variable::Numeric(vec![1.0, 2.0])];
        let names = vec!["x".to_string(), "y".to_string()]; // Too many names
        assert!(create_model_frame(variables, names, None, None, NaAction::Pass).is_err());

        // Empty variables
        let empty_variables = vec![];
        let empty_names = vec![];
        assert!(create_model_frame(empty_variables, empty_names, None, None, NaAction::Pass).is_err());

        // Subset index out of bounds
        let variables = vec![Variable::Numeric(vec![1.0, 2.0])];
        let names = vec!["x".to_string()];
        let invalid_subset = vec![0, 5]; // Index 5 is out of bounds
        assert!(create_model_frame(variables, names, None, Some(invalid_subset), NaAction::Pass).is_err());
    }

    #[test]
    fn test_create_model_frame_complex_subset_and_na() {
        let variables = vec![
            Variable::Numeric(vec![1.0, f64::NAN, 3.0, 4.0, 5.0]),
            Variable::Logical(vec![false, false, true, false, false]),
        ];
        let names = vec!["x".to_string(), "missing".to_string()];
        let subset = vec![0, 1, 3, 4]; // Exclude index 2

        let result = create_model_frame(variables, names, None, Some(subset), NaAction::Omit).unwrap();
        
        // Should remove row 1 (NaN) and row 2 (missing=true), plus row 2 from subset
        assert_eq!(result.frame.n_rows, 3); // Rows that remain after subset and NA removal
        assert!(result.removed_rows.len() >= 2);
    }

    #[test]
    fn test_variable_length_consistency() {
        // All variables must have same length
        let mismatched_variables = vec![
            Variable::Numeric(vec![1.0, 2.0]),
            Variable::Character(vec!["a".to_string()]), // Different length
        ];
        let names = vec!["x".to_string(), "y".to_string()];
        
        assert!(create_model_frame(mismatched_variables, names, None, None, NaAction::Pass).is_err());
    }

    #[test]
    fn test_large_model_frame() {
        // Test performance with larger data
        let n = 1000;
        let variables = vec![
            Variable::Numeric((0..n).map(|i| i as f64).collect()),
            Variable::Factor {
                values: (1..=3).cycle().take(n).collect(),
                levels: vec!["A".to_string(), "B".to_string(), "C".to_string()],
                ordered: false,
            },
        ];
        let names = vec!["x".to_string(), "group".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Pass).unwrap();
        
        assert_eq!(result.frame.n_rows, n);
        assert_eq!(result.frame.n_cols, 2);
    }

    #[test]
    fn test_na_action_omit() {
        let variables = vec![
            Variable::Numeric(vec![1.0, f64::NAN, 3.0]),
            Variable::Logical(vec![true, false, true]),
        ];
        let names = vec!["x".to_string(), "y".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Omit).unwrap();
        
        assert_eq!(result.frame.n_rows, 2); // Row 1 removed
        assert_eq!(result.n_missing, 1);
        assert!(result.has_missing);
    }

    #[test]
    fn test_na_action_fail() {
        let variables = vec![
            Variable::Numeric(vec![1.0, f64::NAN, 3.0]),
            Variable::Logical(vec![true, false, true]),
        ];
        let names = vec!["x".to_string(), "y".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Fail);
        assert!(result.is_err());
    }

    #[test]
    fn test_na_action_pass() {
        let variables = vec![
            Variable::Numeric(vec![1.0, f64::NAN, 3.0]),
            Variable::Logical(vec![true, false, true]),
        ];
        let names = vec!["x".to_string(), "y".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Pass).unwrap();
        
        assert_eq!(result.frame.n_rows, 3); // All rows kept
        assert_eq!(result.n_missing, 1);
        assert!(result.has_missing);
    }

    #[test]
    fn test_character_missing_values() {
        let variables = vec![
            Variable::Character(vec!["a".to_string(), "".to_string(), "c".to_string()]),
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
        ];
        let names = vec!["text".to_string(), "x".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Omit).unwrap();
        
        assert_eq!(result.frame.n_rows, 2); // Row 1 removed due to empty string
        assert_eq!(result.n_missing, 1);
        assert!(result.has_missing);
    }

    #[test]
    fn test_factor_missing_values() {
        let variables = vec![
            Variable::Factor {
                values: vec![1, 0, 2], // 0 indicates missing
                levels: vec!["A".to_string(), "B".to_string()],
                ordered: false,
            },
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
        ];
        let names = vec!["group".to_string(), "x".to_string()];

        let result = create_model_frame(variables, names, None, None, NaAction::Omit).unwrap();
        
        assert_eq!(result.frame.n_rows, 2); // Row 1 removed due to missing factor
        assert_eq!(result.n_missing, 1);
        assert!(result.has_missing);
    }
}
