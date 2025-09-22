//! Model utilities tests

use super::model_utilities_types::*;
use super::model_utilities_extractors::*;
use super::model_utilities_validation::*;
use crate::stats::regression::model_utilities::{ModelFrame, Variable};
use std::collections::HashMap;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_weights() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![],
                variable_names: vec![],
                row_names: None,
                n_rows: 0,
                n_cols: 0,
            },
            weights: Some(vec![1.0, 2.0, 3.0]),
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        let weights = model_weights(&model);
        assert_eq!(weights, Some(vec![1.0, 2.0, 3.0]));
    }

    #[test]
    fn test_model_offset() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![],
                variable_names: vec![],
                row_names: None,
                n_rows: 0,
                n_cols: 0,
            },
            weights: None,
            offset: Some(vec![0.1, 0.2, 0.3]),
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        let offset = model_offset(&model);
        assert_eq!(offset, Some(vec![0.1, 0.2, 0.3]));
    }

    #[test]
    fn test_is_empty_model() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![],
                variable_names: vec![],
                row_names: None,
                n_rows: 0,
                n_cols: 0,
            },
            weights: None,
            offset: None,
            response: None,
            terms: Some(TermsObject {
                terms: vec![],
                variables: vec![],
                response: None,
                intercept: false,
                factors: vec![],
                offset: None,
            }),
            attributes: HashMap::new(),
        };

        assert!(crate::stats::regression::model_utilities::model_utilities_validation::is_empty_model(&model.terms));
    }

    #[test]
    fn test_get_all_vars() {
        let variables = get_all_vars("y ~ x1 + x2", None).unwrap();
        assert!(variables.contains(&"y".to_string()));
        assert!(variables.contains(&"x1".to_string()));
        assert!(variables.contains(&"x2".to_string()));
    }

    #[test]
    fn test_validate_model_object() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![Variable::Numeric(vec![1.0, 2.0, 3.0])],
                variable_names: vec!["x".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 1,
            },
            weights: Some(vec![1.0, 1.0, 1.0]),
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        assert!(validate_model_object(&model).is_ok());
    }

    #[test]
    fn test_validate_model_object_invalid_weights() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![Variable::Numeric(vec![1.0, 2.0, 3.0])],
                variable_names: vec!["x".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 1,
            },
            weights: Some(vec![1.0, -1.0, 1.0]), // Negative weight
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        assert!(validate_model_object(&model).is_err());
    }

    #[test]
    fn test_has_weights() {
        let model_with_weights = ModelObject {
            model_frame: ModelFrame {
                variables: vec![],
                variable_names: vec![],
                row_names: None,
                n_rows: 0,
                n_cols: 0,
            },
            weights: Some(vec![1.0, 2.0, 3.0]),
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        let model_without_weights = ModelObject {
            model_frame: ModelFrame {
                variables: vec![],
                variable_names: vec![],
                row_names: None,
                n_rows: 0,
                n_cols: 0,
            },
            weights: None,
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        assert!(has_weights(&model_with_weights));
        assert!(!has_weights(&model_without_weights));
    }

    #[test]
    fn test_has_offset() {
        let model_with_offset = ModelObject {
            model_frame: ModelFrame {
                variables: vec![],
                variable_names: vec![],
                row_names: None,
                n_rows: 0,
                n_cols: 0,
            },
            weights: None,
            offset: Some(vec![0.1, 0.2, 0.3]),
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        let model_without_offset = ModelObject {
            model_frame: ModelFrame {
                variables: vec![],
                variable_names: vec![],
                row_names: None,
                n_rows: 0,
                n_cols: 0,
            },
            weights: None,
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        assert!(has_offset(&model_with_offset));
        assert!(!has_offset(&model_without_offset));
    }

    #[test]
    fn test_has_response() {
        let model_with_response = ModelObject {
            model_frame: ModelFrame {
                variables: vec![Variable::Numeric(vec![1.0, 2.0, 3.0])],
                variable_names: vec!["y".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 1,
            },
            weights: None,
            offset: None,
            response: Some(Variable::Numeric(vec![1.0, 2.0, 3.0])),
            terms: None,
            attributes: HashMap::new(),
        };

        let model_without_response = ModelObject {
            model_frame: ModelFrame {
                variables: vec![],
                variable_names: vec![],
                row_names: None,
                n_rows: 0,
                n_cols: 0,
            },
            weights: None,
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        assert!(has_response(&model_with_response));
        assert!(!has_response(&model_without_response));
    }

    #[test]
    fn test_get_model_dimensions() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![
                    Variable::Numeric(vec![1.0, 2.0, 3.0]),
                    Variable::Numeric(vec![4.0, 5.0, 6.0]),
                ],
                variable_names: vec!["x1".to_string(), "x2".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 2,
            },
            weights: None,
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        let (n_rows, n_cols) = get_model_dimensions(&model);
        assert_eq!(n_rows, 3);
        assert_eq!(n_cols, 2);
    }

    #[test]
    fn test_get_nobs() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![Variable::Numeric(vec![1.0, 2.0, 3.0])],
                variable_names: vec!["x".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 1,
            },
            weights: None,
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        assert_eq!(get_nobs(&model), 3);
    }

    #[test]
    fn test_get_nvars() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![
                    Variable::Numeric(vec![1.0, 2.0, 3.0]),
                    Variable::Numeric(vec![4.0, 5.0, 6.0]),
                ],
                variable_names: vec!["x1".to_string(), "x2".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 2,
            },
            weights: None,
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        assert_eq!(get_nvars(&model), 2);
    }

    #[test]
    fn test_is_complete_model() {
        let complete_model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![Variable::Numeric(vec![1.0, 2.0, 3.0])],
                variable_names: vec!["x".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 1,
            },
            weights: None,
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        let incomplete_model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![Variable::Numeric(vec![1.0, f64::NAN, 3.0])],
                variable_names: vec!["x".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 1,
            },
            weights: None,
            offset: None,
            response: None,
            terms: None,
            attributes: HashMap::new(),
        };

        assert!(is_complete_model(&complete_model));
        assert!(!is_complete_model(&incomplete_model));
    }

    #[test]
    fn test_get_model_summary() {
        let model = ModelObject {
            model_frame: ModelFrame {
                variables: vec![Variable::Numeric(vec![1.0, 2.0, 3.0])],
                variable_names: vec!["x".to_string()],
                row_names: None,
                n_rows: 3,
                n_cols: 1,
            },
            weights: Some(vec![1.0, 1.0, 1.0]),
            offset: None,
            response: Some(Variable::Numeric(vec![1.0, 2.0, 3.0])),
            terms: None,
            attributes: HashMap::new(),
        };

        let summary = get_model_summary(&model);
        assert_eq!(summary.get("n_obs").unwrap(), "3");
        assert_eq!(summary.get("n_vars").unwrap(), "1");
        assert_eq!(summary.get("has_weights").unwrap(), "true");
        assert_eq!(summary.get("has_offset").unwrap(), "false");
        assert_eq!(summary.get("has_response").unwrap(), "true");
        assert_eq!(summary.get("is_complete").unwrap(), "true");
        assert_eq!(summary.get("is_empty").unwrap(), "false");
    }

    #[test]
    fn test_make_predict_call() {
        let numeric_var = Variable::Numeric(vec![1.0, 2.0, 3.0]);
        let factor_var = Variable::Factor {
            values: vec![1, 2, 1],
            levels: vec!["A".to_string(), "B".to_string()],
            ordered: false,
        };

        assert_eq!(make_predict_call(&numeric_var, "model").unwrap(), "predict(model)");
        assert_eq!(make_predict_call(&factor_var, "model").unwrap(), "predict(model, type='class')");
    }
}
