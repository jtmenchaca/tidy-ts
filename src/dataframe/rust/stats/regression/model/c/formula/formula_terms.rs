//! Formula terms expansion and manipulation

use super::formula_types::{Formula, FormulaError, FormulaExpr, Term, Terms};
use std::collections::HashSet;

/// Expand a formula into terms
pub fn terms(formula: &str) -> Result<Terms, FormulaError> {
    let mut parser = super::formula_parser::FormulaParser::new(formula);
    let formula = parser.parse()?;
    expand_terms(&formula)
}

/// Expand formula expression into terms
fn expand_terms(formula: &Formula) -> Result<Terms, FormulaError> {
    let mut variables = HashSet::new();
    let mut terms = Vec::new();
    let mut order = Vec::new();
    let mut has_response = false;
    let mut has_intercept = true;

    match &formula.expr {
        FormulaExpr::Tilde(rhs) => {
            expand_expression(
                rhs,
                &mut variables,
                &mut terms,
                &mut order,
                &mut has_intercept,
            )?;
        }
        FormulaExpr::Formula(lhs, rhs) => {
            has_response = true;
            expand_expression(
                lhs,
                &mut variables,
                &mut terms,
                &mut order,
                &mut has_intercept,
            )?;
            expand_expression(
                rhs,
                &mut variables,
                &mut terms,
                &mut order,
                &mut has_intercept,
            )?;
        }
        _ => {
            return Err(FormulaError::ParseError(
                "Invalid formula structure".to_string(),
            ));
        }
    }

    // Remove duplicates and sort
    let mut unique_terms = Vec::new();
    for term in terms {
        if !unique_terms
            .iter()
            .any(|t: &Term| t.variables == term.variables)
        {
            unique_terms.push(term);
        }
    }

    // Sort by order
    unique_terms.sort_by_key(|t| t.order);

    Ok(Terms {
        variables: variables.into_iter().collect(),
        response: has_response,
        intercept: has_intercept,
        terms: unique_terms,
        order,
    })
}

/// Expand an expression into terms
fn expand_expression(
    expr: &FormulaExpr,
    variables: &mut HashSet<String>,
    terms: &mut Vec<Term>,
    order: &mut Vec<usize>,
    has_intercept: &mut bool,
) -> Result<(), FormulaError> {
    match expr {
        FormulaExpr::Variable(name) => {
            variables.insert(name.clone());
            terms.push(Term {
                variables: vec![name.clone()],
                order: 1,
            });
            order.push(1);
        }
        FormulaExpr::BinaryOp(left, op, right) => {
            match op {
                super::formula_types::BinaryOperator::Plus => {
                    expand_expression(left, variables, terms, order, has_intercept)?;
                    expand_expression(right, variables, terms, order, has_intercept)?;
                }
                super::formula_types::BinaryOperator::Minus => {
                    if let FormulaExpr::Variable(name) = right.as_ref() {
                        // Remove variable from terms
                        terms.retain(|t| !t.variables.contains(name));
                        variables.remove(name);
                    } else if let FormulaExpr::Number(n) = right.as_ref() {
                        if *n == 1.0 {
                            *has_intercept = false;
                        }
                    }
                    expand_expression(left, variables, terms, order, has_intercept)?;
                }
                super::formula_types::BinaryOperator::Times => {
                    // Expand interaction
                    let mut left_terms = Vec::new();
                    let mut left_vars = HashSet::new();
                    expand_expression(left, &mut left_vars, &mut left_terms, order, has_intercept)?;

                    let mut right_terms = Vec::new();
                    let mut right_vars = HashSet::new();
                    expand_expression(
                        right,
                        &mut right_vars,
                        &mut right_terms,
                        order,
                        has_intercept,
                    )?;

                    // Create all combinations
                    for left_term in &left_terms {
                        for right_term in &right_terms {
                            let mut combined_vars = left_term.variables.clone();
                            combined_vars.extend(right_term.variables.clone());
                            combined_vars.sort();
                            combined_vars.dedup();

                            variables.extend(combined_vars.clone());
                            terms.push(Term {
                                variables: combined_vars,
                                order: left_term.order + right_term.order,
                            });
                        }
                    }
                }
                super::formula_types::BinaryOperator::Colon => {
                    // Interaction only
                    let mut left_vars = Vec::new();
                    collect_variables(left, &mut left_vars)?;
                    let mut right_vars = Vec::new();
                    collect_variables(right, &mut right_vars)?;

                    let mut combined_vars = left_vars;
                    combined_vars.extend(right_vars);
                    combined_vars.sort();
                    combined_vars.dedup();

                    variables.extend(combined_vars.clone());
                    terms.push(Term {
                        variables: combined_vars,
                        order: 2,
                    });
                }
                super::formula_types::BinaryOperator::Power => {
                    if let FormulaExpr::Number(n) = right.as_ref() {
                        let mut vars = Vec::new();
                        collect_variables(left, &mut vars)?;

                        for _ in 0..(*n as usize) {
                            variables.extend(vars.clone());
                            terms.push(Term {
                                variables: vars.clone(),
                                order: *n as usize,
                            });
                        }
                    }
                }
                super::formula_types::BinaryOperator::Divide => {
                    // A / B means A + A:B
                    expand_expression(left, variables, terms, order, has_intercept)?;

                    let mut left_vars = Vec::new();
                    collect_variables(left, &mut left_vars)?;
                    let mut right_vars = Vec::new();
                    collect_variables(right, &mut right_vars)?;

                    let mut combined_vars = left_vars;
                    combined_vars.extend(right_vars);
                    combined_vars.sort();
                    combined_vars.dedup();

                    variables.extend(combined_vars.clone());
                    terms.push(Term {
                        variables: combined_vars,
                        order: 2,
                    });
                }
            }
        }
        FormulaExpr::Paren(inner) => {
            expand_expression(inner, variables, terms, order, has_intercept)?;
        }
        FormulaExpr::Number(n) => {
            if *n == 1.0 {
                *has_intercept = true;
            } else if *n == 0.0 {
                *has_intercept = false;
            }
        }
        FormulaExpr::Intercept => {
            *has_intercept = true;
        }
        FormulaExpr::Dot => {
            // Dot means all variables - this would need context
            return Err(FormulaError::ParseError(
                "Dot notation not supported without context".to_string(),
            ));
        }
        FormulaExpr::Call(_, _) => {
            return Err(FormulaError::ParseError(
                "Function calls not supported".to_string(),
            ));
        }
        FormulaExpr::Tilde(_) => {
            return Err(FormulaError::ParseError(
                "Nested tilde not supported".to_string(),
            ));
        }
        FormulaExpr::Formula(_, _) => {
            return Err(FormulaError::ParseError(
                "Nested formula not supported".to_string(),
            ));
        }
    }

    Ok(())
}

/// Collect variable names from an expression
fn collect_variables(expr: &FormulaExpr, vars: &mut Vec<String>) -> Result<(), FormulaError> {
    match expr {
        FormulaExpr::Variable(name) => {
            vars.push(name.clone());
        }
        FormulaExpr::BinaryOp(left, _, right) => {
            collect_variables(left, vars)?;
            collect_variables(right, vars)?;
        }
        FormulaExpr::Paren(inner) => {
            collect_variables(inner, vars)?;
        }
        _ => {} // Other expressions don't contain variables
    }
    Ok(())
}
