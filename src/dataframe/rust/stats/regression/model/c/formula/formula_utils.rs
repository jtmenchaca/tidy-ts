//! Formula utility functions

use super::formula_types::{Formula, FormulaError, FormulaExpr, Terms};
use std::fmt;

/// Parse a formula string
pub fn formula(formula: &str) -> Result<Formula, FormulaError> {
    let mut parser = super::formula_parser::FormulaParser::new(formula);
    parser.parse()
}

/// Convert an object to a formula
///
/// This is equivalent to R's as.formula() function
pub fn as_formula(object: &str, env: Option<String>) -> Result<Formula, FormulaError> {
    // Parse the string as a formula
    let mut parser = super::formula_parser::FormulaParser::new(object);
    let mut formula = parser.parse()?;

    // Set environment if provided
    if let Some(environment) = env {
        formula.environment = Some(environment);
    }

    Ok(formula)
}

/// Print a formula with optional environment display
///
/// This is equivalent to R's print.formula() function
pub fn print_formula(formula: &Formula, show_env: bool) -> String {
    let mut result = format!("{}", formula.expr);

    if show_env {
        if let Some(env) = &formula.environment {
            result.push_str(&format!(" <environment: {}>", env));
        } else {
            result.push_str(" <environment: R_GlobalEnv>");
        }
    }

    result
}

/// Formula indexing/subsetting
///
/// This is equivalent to R's [.formula function
pub fn formula_index(formula: &Formula, indices: &[usize]) -> Result<Formula, FormulaError> {
    // For now, this is a simplified implementation
    // In a full implementation, this would handle complex indexing
    if indices.is_empty() {
        return Err(FormulaError::EmptyFormula);
    }

    // Clone the formula for now (simplified implementation)
    Ok(formula.clone())
}

/// Create a formula from data frame columns
pub fn df2formula(columns: &[String]) -> Result<Formula, FormulaError> {
    if columns.is_empty() {
        return Err(FormulaError::EmptyFormula);
    }

    let mut expr = FormulaExpr::Variable(columns[0].clone());
    for col in &columns[1..] {
        expr = FormulaExpr::BinaryOp(
            Box::new(expr),
            super::formula_types::BinaryOperator::Plus,
            Box::new(FormulaExpr::Variable(col.clone())),
        );
    }

    Ok(Formula {
        expr: FormulaExpr::Tilde(Box::new(expr)),
        environment: None,
    })
}

/// Update an existing formula
pub fn update_formula(old: &Terms, new_formula: &str) -> Result<Terms, FormulaError> {
    // Parse the new formula
    let new_terms = super::formula_terms::terms(new_formula)?;

    // Merge with old terms (simplified implementation)
    Ok(new_terms)
}

/// Reformulate from term labels
pub fn reformulate(
    termlabels: &[String],
    response: Option<&str>,
    intercept: bool,
) -> Result<Formula, FormulaError> {
    if termlabels.is_empty() {
        return Err(FormulaError::EmptyFormula);
    }

    let mut expr = if intercept {
        FormulaExpr::Intercept
    } else {
        FormulaExpr::Variable(termlabels[0].clone())
    };

    for term in &termlabels[1..] {
        expr = FormulaExpr::BinaryOp(
            Box::new(expr),
            super::formula_types::BinaryOperator::Plus,
            Box::new(FormulaExpr::Variable(term.clone())),
        );
    }

    if let Some(resp) = response {
        let response_expr = FormulaExpr::Variable(resp.to_string());
        Ok(Formula {
            expr: FormulaExpr::Formula(Box::new(response_expr), Box::new(expr)),
            environment: None,
        })
    } else {
        Ok(Formula {
            expr: FormulaExpr::Tilde(Box::new(expr)),
            environment: None,
        })
    }
}

/// Check if a formula is valid
pub fn is_valid_formula(formula: &str) -> bool {
    super::formula_parser::FormulaParser::new(formula)
        .parse()
        .is_ok()
}

/// Get formula variables
pub fn formula_variables(formula: &Formula) -> Vec<String> {
    let mut vars = Vec::new();
    extract_variables(&formula.expr, &mut vars);
    vars
}

/// Extract variables from a formula expression
fn extract_variables(expr: &FormulaExpr, vars: &mut Vec<String>) {
    match expr {
        FormulaExpr::Variable(name) => {
            if !vars.contains(name) {
                vars.push(name.clone());
            }
        }
        FormulaExpr::BinaryOp(left, _, right) => {
            extract_variables(left, vars);
            extract_variables(right, vars);
        }
        FormulaExpr::Call(_, args) => {
            for arg in args {
                extract_variables(arg, vars);
            }
        }
        FormulaExpr::Paren(inner) => {
            extract_variables(inner, vars);
        }
        FormulaExpr::Formula(lhs, rhs) => {
            extract_variables(lhs, vars);
            extract_variables(rhs, vars);
        }
        FormulaExpr::Tilde(rhs) => {
            extract_variables(rhs, vars);
        }
        _ => {} // Intercept, Dot, Number don't have variables
    }
}
