//! Model matrix tests

use super::model_matrix_core::create_model_matrix;
use super::model_matrix_utils::{get_column, get_columns, get_matrix_2d};
use crate::stats::regression::model::c::formula::{parse_formula, terms};
use crate::stats::regression::model::c::model_frame::create_model_frame;
use crate::stats::regression::{
    ContrastType, ModelFrame, NaAction, Terms, Variable, create_contrasts,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_model_matrix() {
        // Create model frame
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]), // y
            Variable::Numeric(vec![4.0, 5.0, 6.0]), // x1
            Variable::Numeric(vec![7.0, 8.0, 9.0]), // x2
        ];
        let names = vec!["y".to_string(), "x1".to_string(), "x2".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        // Parse formula
        let formula = parse_formula("y ~ x1 + x2").unwrap();
        let terms = terms("y ~ x1 + x2").unwrap();

        // Create model matrix
        let result = create_model_matrix(&terms, &model_frame, &[]).unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 3); // intercept + x1 + x2 (excluding response y)
        assert_eq!(result.matrix.column_names, vec!["(Intercept)", "x1", "x2"]);
    }

    #[test]
    fn test_factor_model_matrix() {
        // Create model frame with factor
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Factor {
                values: vec![1, 2, 1],
                levels: vec!["A".to_string(), "B".to_string()],
                ordered: false,
            },
        ];
        let names = vec!["y".to_string(), "group".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        // Parse formula
        let formula = parse_formula("y ~ group").unwrap();
        let terms = terms("y ~ group").unwrap();

        // Create contrasts
        let contrast = create_contrasts(
            &["A".to_string(), "B".to_string()],
            &ContrastType::Treatment,
        )
        .unwrap();
        let contrasts = vec![None, Some(contrast)];

        // Create model matrix
        let result = create_model_matrix(&terms, &model_frame, &contrasts).unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 2); // intercept + groupB
        assert_eq!(result.matrix.column_names, vec!["(Intercept)", "groupB"]);
    }

    #[test]
    fn test_model_matrix_with_interactions() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![2.0, 4.0, 6.0]),
            Variable::Numeric(vec![1.0, 3.0, 5.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string(), "x2".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula = parse_formula("y ~ x1 * x2").unwrap();
        let terms = terms("y ~ x1 * x2").unwrap();
        let result = create_model_matrix(&terms, &model_frame, &[]).unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 4); // intercept + x1 + x2 + x1:x2
        assert_eq!(
            result.matrix.column_names,
            vec!["(Intercept)", "x1", "x1:x2", "x2"]
        );
    }

    #[test]
    fn test_model_matrix_no_intercept() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula = parse_formula("y ~ x1 - 1").unwrap();
        let terms = terms("y ~ x1 - 1").unwrap();
        let result = create_model_matrix(&terms, &model_frame, &[]).unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 1); // x1 only, no intercept
        assert_eq!(result.matrix.column_names, vec!["x1"]);
    }

    #[test]
    fn test_model_matrix_with_logical() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Logical(vec![true, false, true]),
        ];
        let names = vec!["y".to_string(), "flag".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula = parse_formula("y ~ flag").unwrap();
        let terms = terms("y ~ flag").unwrap();
        let result = create_model_matrix(&terms, &model_frame, &[]).unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 2); // intercept + flag

        // Check logical encoding (true=1, false=0)
        let flag_column = get_column(&result.matrix, 1).unwrap();
        assert_eq!(flag_column, vec![1.0, 0.0, 1.0]);
    }

    #[test]
    fn test_model_matrix_multiple_factors() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0, 4.0]),
            Variable::Factor {
                values: vec![1, 2, 1, 2],
                levels: vec!["A".to_string(), "B".to_string()],
                ordered: false,
            },
            Variable::Factor {
                values: vec![1, 1, 2, 2],
                levels: vec!["X".to_string(), "Y".to_string()],
                ordered: false,
            },
        ];
        let names = vec!["y".to_string(), "group1".to_string(), "group2".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula = parse_formula("y ~ group1 + group2").unwrap();
        let terms = terms("y ~ group1 + group2").unwrap();

        // Create contrasts for both factors (skip response variable)
        let contrast1 = create_contrasts(
            &["A".to_string(), "B".to_string()],
            &ContrastType::Treatment,
        )
        .unwrap();
        let contrast2 = create_contrasts(
            &["X".to_string(), "Y".to_string()],
            &ContrastType::Treatment,
        )
        .unwrap();
        let contrasts = vec![None, Some(contrast1), Some(contrast2)];

        let result = create_model_matrix(&terms, &model_frame, &contrasts).unwrap();

        assert_eq!(result.matrix.n_rows, 4);
        assert_eq!(result.matrix.n_cols, 3); // intercept + group1B + group2Y
        assert_eq!(
            result.matrix.column_names,
            vec!["(Intercept)", "group1B", "group2Y"]
        );
    }

    #[test]
    fn test_model_matrix_sum_contrasts() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Factor {
                values: vec![1, 2, 3],
                levels: vec!["Low".to_string(), "Medium".to_string(), "High".to_string()],
                ordered: false,
            },
        ];
        let names = vec!["y".to_string(), "level".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula = parse_formula("y ~ level").unwrap();
        let terms = terms("y ~ level").unwrap();

        let contrast = create_contrasts(
            &["Low".to_string(), "Medium".to_string(), "High".to_string()],
            &ContrastType::Sum,
        )
        .unwrap();
        let contrasts = vec![None, Some(contrast)];

        let result = create_model_matrix(&terms, &model_frame, &contrasts).unwrap();

        assert_eq!(result.matrix.n_rows, 3);
        assert_eq!(result.matrix.n_cols, 3); // intercept + levelLow + levelMedium
        assert_eq!(
            result.matrix.column_names,
            vec!["(Intercept)", "levelLow", "levelMedium"]
        );
    }

    #[test]
    fn test_model_matrix_error_cases() {
        // Empty model frame
        let empty_frame = ModelFrame {
            variables: vec![],
            variable_names: vec![],
            row_names: None,
            n_rows: 0,
            n_cols: 0,
        };
        let formula = parse_formula("y ~ x").unwrap();
        let terms_result = terms("y ~ x").unwrap();
        assert!(create_model_matrix(&terms_result, &empty_frame, &[]).is_err());

        // Terms with empty variables
        let variables = vec![Variable::Numeric(vec![1.0, 2.0])];
        let names = vec!["x".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let empty_terms = Terms {
            variables: vec![],
            terms: vec![],
            intercept: true,
            response: false,
            order: vec![],
        };
        assert!(create_model_matrix(&empty_terms, &model_frame, &[]).is_err());

        // Character variables (should be converted to factors first)
        let char_variables = vec![
            Variable::Numeric(vec![1.0, 2.0]),
            Variable::Character(vec!["a".to_string(), "b".to_string()]),
        ];
        let char_names = vec!["y".to_string(), "text".to_string()];
        let char_frame = create_model_frame(char_variables, char_names, None, None, NaAction::Pass)
            .unwrap()
            .frame;
        let char_formula = parse_formula("y ~ text").unwrap();
        let char_terms = terms("y ~ text").unwrap();
        assert!(create_model_matrix(&char_terms, &char_frame, &[]).is_err());
    }

    #[test]
    fn test_model_matrix_utility_functions() {
        let variables = vec![
            Variable::Numeric(vec![1.0, 2.0, 3.0]),
            Variable::Numeric(vec![4.0, 5.0, 6.0]),
            Variable::Numeric(vec![7.0, 8.0, 9.0]),
        ];
        let names = vec!["y".to_string(), "x1".to_string(), "x2".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula = parse_formula("y ~ x1 + x2").unwrap();
        let terms = terms("y ~ x1 + x2").unwrap();
        let result = create_model_matrix(&terms, &model_frame, &[]).unwrap();

        // Test get_column
        let col0 = get_column(&result.matrix, 0).unwrap();
        assert_eq!(col0, vec![1.0, 1.0, 1.0]); // Intercept column

        let col1 = get_column(&result.matrix, 1).unwrap();
        assert_eq!(col1, vec![4.0, 5.0, 6.0]); // x1 column

        // Test get_columns
        let cols = get_columns(&result.matrix, &[0, 2]).unwrap();
        assert_eq!(cols.len(), 2);
        assert_eq!(cols[0], vec![1.0, 1.0, 1.0]); // Intercept
        assert_eq!(cols[1], vec![7.0, 8.0, 9.0]); // x2

        // Test get_matrix_2d
        let matrix_2d = get_matrix_2d(&result.matrix);
        assert_eq!(matrix_2d.len(), 3); // 3 rows
        assert_eq!(matrix_2d[0].len(), 3); // 3 columns
        assert_eq!(matrix_2d[0], vec![1.0, 4.0, 7.0]); // First row

        // Test error cases
        assert!(get_column(&result.matrix, 10).is_err()); // Out of bounds
    }

    #[test]
    fn test_large_model_matrix() {
        // Test performance with larger data
        let n = 1000;
        let variables = vec![
            Variable::Numeric((0..n).map(|i| i as f64).collect()),
            Variable::Numeric((0..n).map(|i| (i * 2) as f64).collect()),
        ];
        let names = vec!["y".to_string(), "x".to_string()];
        let model_frame = create_model_frame(variables, names, None, None, NaAction::Pass)
            .unwrap()
            .frame;

        let formula = parse_formula("y ~ x").unwrap();
        let terms = terms("y ~ x").unwrap();
        let result = create_model_matrix(&terms, &model_frame, &[]).unwrap();

        assert_eq!(result.matrix.n_rows, n);
        assert_eq!(result.matrix.n_cols, 2); // intercept + x
        assert_eq!(result.matrix.matrix.len(), n * 2);
    }
}
