//! Model builder tests

use super::builder_types::ModelBuilder;
use super::builder_utils::{
    extract_predictors, extract_response, quick_model_matrix, validate_model_matrix,
};
use crate::stats::regression::contrasts::ContrastType;
use crate::stats::regression::model::c::formula::terms;
use crate::stats::regression::model::c::model_frame::create_model_frame;
use crate::stats::regression::model::c::model_frame::model_frame_types::ModelFrame;
use crate::stats::regression::model::{ModelMatrix, NaAction, Variable};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_builder_basic() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]), // y
            Variable::Numeric(vec![4.0, 5.0, 6.0]), // x1
            Variable::Numeric(vec![7.0, 8.0, 9.0]), // x2
        ];
        let names = vec!["y".to_string(), "x1".to_string(), "x2".to_string()];

        let result = ModelBuilder::new("y ~ x1 + x2")
            .data(variables, names)
            .build()
            .unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 3); // intercept + x1 + x2
        assert_eq!(result.matrix.column_names, vec!["(Intercept)", "x1", "x2"]);
    }

    #[test]
    fn test_model_builder_with_factor() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Factor {
                values: vec![1, 2, 1],
                levels: vec!["A".to_string(), "B".to_string()],
                ordered: false,
            },
        ];
        let names = vec!["y".to_string(), "group".to_string()];

        let result = ModelBuilder::new("y ~ group")
            .data(variables, names)
            .contrasts(vec![ContrastType::Treatment])
            .build()
            .unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 2); // intercept + groupB
    }

    #[test]
    fn test_quick_model_matrix() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]), // y
            Variable::Numeric(vec![4.0, 5.0, 6.0]), // x1
            Variable::Numeric(vec![7.0, 8.0, 9.0]), // x2
        ];
        let names = vec!["y".to_string(), "x1".to_string(), "x2".to_string()];

        let result = quick_model_matrix("y ~ x1 + x2", variables, names, None).unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 3);
    }

    #[test]
    fn test_validate_model_matrix() {
        let matrix = ModelMatrix {
            matrix: vec![1.0, 2.0, 3.0, 4.0],
            n_rows: 2,
            n_cols: 2,
            column_names: vec!["col1".to_string(), "col2".to_string()],
            term_assignments: vec![1, 2],
            row_names: None,
        };

        assert!(validate_model_matrix(&matrix).is_ok());
    }

    #[test]
    fn test_model_builder_complex_formula() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0, 4.0]),
            Variable::Numeric(vec![2.0, 4.0, 6.0, 8.0]),
            Variable::Factor {
                values: vec![1, 2, 1, 2],
                levels: vec!["A".to_string(), "B".to_string()],
                ordered: false,
            },
        ];
        let names = vec!["y".to_string(), "x1".to_string(), "group".to_string()];

        let result = ModelBuilder::new("y ~ x1 * group")
            .data(variables, names)
            .contrasts(vec![ContrastType::Treatment])
            .build()
            .unwrap();

        assert_eq!(result.matrix.n_rows, 4);
        assert!(result.matrix.n_cols >= 3); // intercept + x1 + group + interaction
    }

    #[test]
    fn test_model_builder_with_na_action() {
        let variables = vec![
            Variable::Numeric(vec![1.0, f64::NAN, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string()];

        // Test with Omit (should work)
        let result = ModelBuilder::new("y ~ x1")
            .data(variables.clone(), names.clone())
            .na_action(NaAction::Omit)
            .build()
            .unwrap();

        assert_eq!(result.matrix.n_rows, 2); // Row with NaN removed

        // Test with Fail (should error)
        let result = ModelBuilder::new("y ~ x1")
            .data(variables, names)
            .na_action(NaAction::Fail)
            .build();

        assert!(result.is_err());
    }

    #[test]
    fn test_model_builder_with_subset() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0, 4.0, 5.0]),
            Variable::Numeric(vec![2.0, 4.0, 6.0, 8.0, 10.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string()];

        let result = ModelBuilder::new("y ~ x1")
            .data(variables, names)
            .subset(vec![0, 2, 4]) // Keep rows 0, 2, 4
            .build()
            .unwrap();

        assert_eq!(result.matrix.n_rows, 3);
    }

    #[test]
    fn test_model_builder_with_row_names() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string()];
        let row_names = vec!["obs1".to_string(), "obs2".to_string(), "obs3".to_string()];

        let result = ModelBuilder::new("y ~ x1")
            .data(variables, names)
            .row_names(row_names.clone())
            .build()
            .unwrap();

        assert_eq!(result.matrix.row_names.as_ref().unwrap(), &row_names);
    }

    #[test]
    fn test_model_builder_from_model_frame() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let result = ModelBuilder::new("y ~ x1")
            .model_frame(model_frame)
            .build()
            .unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 2);
    }

    #[test]
    fn test_model_builder_error_cases() {
        // Builder without data
        let result = ModelBuilder::new("y ~ x1").build();
        assert!(result.is_err());

        // Invalid formula
        let variables = vec![Variable::Numeric(vec![1.0, 2.0])];
        let names = vec!["y".to_string()];
        let result = ModelBuilder::new("invalid formula")
            .data(variables, names)
            .build();
        assert!(result.is_err());
    }

    #[test]
    fn test_extract_response() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula_terms = terms("y ~ x1").unwrap();
        let result = ModelBuilder::new("y ~ x1")
            .model_frame(model_frame.clone())
            .build()
            .unwrap();

        let response = extract_response(&model_frame, &formula_terms).unwrap();
        match response {
            Variable::Numeric(values) => assert_eq!(values, vec![1.0, 2.0, 3.0]),
            _ => panic!("Expected numeric response"),
        }

        // Test error case: no response
        let no_response_terms = terms("~ x1").unwrap();
        assert!(extract_response(&model_frame, &no_response_terms).is_err());
    }

    #[test]
    fn test_extract_predictors() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
            Variable::Numeric(vec![7.0, 8.0, 9.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string(), "x2".to_string()];

        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula_terms = terms("y ~ x1 + x2").unwrap();
        let result = ModelBuilder::new("y ~ x1 + x2")
            .model_frame(model_frame.clone())
            .build()
            .unwrap();

        let predictors = extract_predictors(&model_frame, &formula_terms).unwrap();
        assert_eq!(predictors.len(), 2); // x1 and x2

        // Test with no response
        let no_response_terms = terms("~ x1 + x2").unwrap();
        let predictors_no_response = extract_predictors(&model_frame, &no_response_terms).unwrap();
        assert_eq!(predictors_no_response.len(), 3); // All variables
    }

    #[test]
    fn test_validate_model_matrix_error_cases() {
        // Empty matrix
        let empty_matrix = ModelMatrix {
            matrix: vec![],
            n_rows: 0,
            n_cols: 0,
            column_names: vec![],
            term_assignments: vec![],
            row_names: None,
        };
        assert!(validate_model_matrix(&empty_matrix).is_err());

        // Matrix with NaN
        let nan_matrix = ModelMatrix {
            matrix: vec![1.0, f64::NAN, 3.0, 4.0],
            n_rows: 2,
            n_cols: 2,
            column_names: vec!["col1".to_string(), "col2".to_string()],
            term_assignments: vec![1, 2],
            row_names: None,
        };
        assert!(validate_model_matrix(&nan_matrix).is_err());

        // Matrix with infinite values
        let inf_matrix = ModelMatrix {
            matrix: vec![1.0, f64::INFINITY, 3.0, 4.0],
            n_rows: 2,
            n_cols: 2,
            column_names: vec!["col1".to_string(), "col2".to_string()],
            term_assignments: vec![1, 2],
            row_names: None,
        };
        assert!(validate_model_matrix(&inf_matrix).is_err());

        // Mismatched dimensions
        let mismatch_matrix = ModelMatrix {
            matrix: vec![1.0, 2.0, 3.0, 4.0],
            n_rows: 2,
            n_cols: 2,
            column_names: vec!["col1".to_string()], // Wrong number of names
            term_assignments: vec![1, 2],
            row_names: None,
        };
        assert!(validate_model_matrix(&mismatch_matrix).is_err());
    }

    #[test]
    fn test_builder_chaining() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0, 4.0]),
            Variable::Factor {
                values: vec![1, 2, 1, 2],
                levels: vec!["Low".to_string(), "High".to_string()],
                ordered: false,
            },
        ];
        let names = vec!["y".to_string(), "treatment".to_string()];

        // Test method chaining
        let result = ModelBuilder::new("y ~ treatment")
            .data(variables, names)
            .contrasts(vec![ContrastType::Sum])
            .na_action(NaAction::Pass)
            .subset(vec![0, 1, 2])
            .build()
            .unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 2); // intercept + treatment contrast
    }
}
