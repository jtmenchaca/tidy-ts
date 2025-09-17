//! Formula tests

use super::formula_types::*;
use super::formula_utils::*;
use super::formula_terms::terms;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_formula() {
        let formula = formula("y ~ x1 + x2").unwrap();
        assert!(matches!(formula.expr, FormulaExpr::Formula(_, _)));
    }

    #[test]
    fn test_parse_terms() {
        let terms = terms("y ~ x1 + x2").unwrap();
        assert_eq!(terms.variables, vec!["y", "x1", "x2"]);
        assert_eq!(terms.response, true);
        assert_eq!(terms.intercept, true);
        assert_eq!(terms.terms.len(), 3); // intercept + x1 + x2
    }

    #[test]
    fn test_parse_interaction_formula() {
        let terms = terms("y ~ x1 * x2").unwrap();
        assert_eq!(terms.variables, vec!["y", "x1", "x2"]);
        assert_eq!(terms.terms.len(), 4); // intercept + x1 + x2 + x1:x2
    }

    #[test]
    fn test_parse_no_intercept() {
        let terms = terms("y ~ x1 + x2 - 1").unwrap();
        assert_eq!(terms.intercept, false);
        assert_eq!(terms.terms.len(), 2); // x1 + x2
    }

    #[test]
    fn test_parse_power_formula() {
        let terms = terms("y ~ x1^2").unwrap();
        assert_eq!(terms.variables, vec!["y", "x1"]);
        assert_eq!(terms.terms.len(), 2); // intercept + x1^2
    }

    #[test]
    fn test_parse_complex_interaction() {
        let terms = terms("y ~ x1 * x2 * x3").unwrap();
        assert_eq!(terms.variables, vec!["y", "x1", "x2", "x3"]);
        assert!(terms.terms.len() >= 7); // intercept + main effects + 2-way + 3-way
    }

    #[test]
    fn test_parse_nested_formula() {
        let terms = terms("y ~ x1 / x2").unwrap();
        assert_eq!(terms.variables, vec!["y", "x1", "x2"]);
        assert!(terms.terms.len() >= 2);
    }

    #[test]
    fn test_parse_colon_interaction() {
        let terms = terms("y ~ x1 : x2").unwrap();
        assert_eq!(terms.variables, vec!["y", "x1", "x2"]);
        assert_eq!(terms.terms.len(), 2); // intercept + x1:x2 interaction only
    }

    #[test]
    fn test_parse_formula_with_parentheses() {
        let terms = terms("y ~ (x1 + x2) * x3").unwrap();
        assert_eq!(terms.variables, vec!["y", "x1", "x2", "x3"]);
        assert!(terms.terms.len() >= 5); // intercept + x1 + x2 + x3 + interactions
    }

    #[test]
    fn test_parse_formula_no_response() {
        let terms = terms("~ x1 + x2").unwrap();
        assert_eq!(terms.variables, vec!["x1", "x2"]);
        assert_eq!(terms.response, false);
        assert_eq!(terms.terms.len(), 3); // intercept + x1 + x2
    }

    #[test]
    fn test_parse_formula_subtract_term() {
        let terms = terms("y ~ x1 + x2 - x2").unwrap();
        assert_eq!(terms.variables, vec!["y", "x1", "x2"]);
        assert_eq!(terms.terms.len(), 2); // intercept + x1 (x2 subtracted)
    }

    #[test]
    fn test_parse_formula_error_cases() {
        // Invalid characters
        assert!(formula("y ~ x1 & x2").is_err());
        
        // Mismatched parentheses
        assert!(formula("y ~ (x1 + x2").is_err());
    }

    #[test]
    fn test_update_formula() {
        let old_terms = terms("y ~ x1").unwrap();
        let new_terms = update_formula(&old_terms, "y ~ x1 + x2").unwrap();
        assert_eq!(new_terms.variables, vec!["y", "x1", "x2"]);
        assert_eq!(new_terms.terms.len(), 3); // intercept + x1 + x2
    }

    #[test]
    fn test_df2formula() {
        let columns = vec!["x1".to_string(), "x2".to_string()];
        let formula = df2formula(&columns).unwrap();
        assert!(matches!(formula.expr, FormulaExpr::Tilde(_)));
    }

    #[test]
    fn test_reformulate() {
        let termlabels = vec!["x1".to_string(), "x2".to_string()];
        let formula = reformulate(&termlabels, Some("y"), true).unwrap();
        assert!(matches!(formula.expr, FormulaExpr::Formula(_, _)));
    }

    #[test]
    fn test_formula_display() {
        let formula = formula("y ~ x1 + x2").unwrap();
        let display = format!("{}", formula);
        assert!(display.contains("y ~ x1 + x2"));
    }

    #[test]
    fn test_complex_formula_display() {
        let formula = formula("y ~ (x1 + x2) * x3").unwrap();
        let display = format!("{}", formula);
        assert!(display.contains("y ~ (x1 + x2) * x3"));
    }
}
