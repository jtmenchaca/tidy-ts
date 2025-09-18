//! Formula parser tests module
//!
//! This file contains tests for the formula parser functions.

// Unused imports removed

#[cfg(test)]
mod tests {
    use crate::stats::regression::glm::formula_parser_core::parse_formula;
    use crate::stats::regression::glm::formula_parser_matrix::create_design_matrix;
    use crate::stats::regression::glm::formula_parser_model_frame::create_model_frame;
    use std::collections::HashMap;

    #[test]
    fn test_parse_formula_simple() {
        let formula = parse_formula("y ~ x").unwrap();
        assert_eq!(formula.response, "y");
        assert_eq!(formula.predictors, vec!["x"]);
        assert!(formula.has_intercept);
    }

    #[test]
    fn test_parse_formula_multiple() {
        let formula = parse_formula("y ~ x1 + x2 + x3").unwrap();
        assert_eq!(formula.response, "y");
        assert_eq!(formula.predictors, vec!["x1", "x2", "x3"]);
        assert!(formula.has_intercept);
    }

    #[test]
    fn test_parse_formula_no_intercept() {
        let formula = parse_formula("y ~ 0 + x1 + x2").unwrap();
        assert_eq!(formula.response, "y");
        assert_eq!(formula.predictors, vec!["x1", "x2"]);
        assert!(!formula.has_intercept);
    }

    #[test]
    fn test_parse_formula_invalid() {
        assert!(parse_formula("y ~").is_err());
        assert!(parse_formula("~ x").is_err());
        assert!(parse_formula("y ~ x ~ z").is_err());
    }

    #[test]
    fn test_create_design_matrix() {
        let mut data = HashMap::new();
        data.insert("y".to_string(), vec![1.0, 2.0, 3.0]);
        data.insert("x1".to_string(), vec![1.0, 2.0, 3.0]);
        data.insert("x2".to_string(), vec![0.5, 1.5, 2.5]);

        let formula = parse_formula("y ~ x1 + x2").unwrap();
        let (x, y, names) = create_design_matrix(&formula, &data).unwrap();

        assert_eq!(x.len(), 3); // n observations
        assert_eq!(x[0].len(), 3); // p predictors (intercept + x1 + x2)
        assert_eq!(y, vec![1.0, 2.0, 3.0]);
        assert_eq!(names, vec!["(Intercept)", "x1", "x2"]);
    }

    #[test]
    fn test_create_model_frame() {
        let mut data = HashMap::new();
        data.insert("y".to_string(), vec![1.0, 2.0, 3.0]);
        data.insert("x".to_string(), vec![1.0, 2.0, 3.0]);

        let formula = parse_formula("y ~ x").unwrap();
        let model_frame = create_model_frame(&formula, &data, None, None).unwrap();

        assert!(model_frame.variables.contains_key("y"));
        assert!(model_frame.variables.contains_key("x"));
        assert_eq!(model_frame.response_name, Some("y".to_string()));
        assert_eq!(model_frame.predictor_names, Some(vec!["x".to_string()]));
    }
}
