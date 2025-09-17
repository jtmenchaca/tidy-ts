//! Formula display and formatting

use super::formula_types::{Formula, FormulaExpr, BinaryOperator};
use std::fmt;

impl fmt::Display for Formula {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.expr)
    }
}

impl fmt::Display for FormulaExpr {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            FormulaExpr::Tilde(rhs) => write!(f, "~ {}", rhs),
            FormulaExpr::Formula(lhs, rhs) => write!(f, "{} ~ {}", lhs, rhs),
            FormulaExpr::Variable(name) => write!(f, "{}", name),
            FormulaExpr::Number(n) => write!(f, "{}", n),
            FormulaExpr::Call(name, args) => {
                write!(f, "{}(", name)?;
                for (i, arg) in args.iter().enumerate() {
                    if i > 0 {
                        write!(f, ", ")?;
                    }
                    write!(f, "{}", arg)?;
                }
                write!(f, ")")
            }
            FormulaExpr::BinaryOp(left, op, right) => {
                let left_str = if needs_parens(left, op, true) {
                    format!("({})", left)
                } else {
                    format!("{}", left)
                };
                
                let right_str = if needs_parens(right, op, false) {
                    format!("({})", right)
                } else {
                    format!("{}", right)
                };
                
                write!(f, "{} {} {}", left_str, op, right_str)
            }
            FormulaExpr::Paren(inner) => write!(f, "({})", inner),
            FormulaExpr::Dot => write!(f, "."),
            FormulaExpr::Intercept => write!(f, "1"),
        }
    }
}

impl fmt::Display for BinaryOperator {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            BinaryOperator::Plus => write!(f, "+"),
            BinaryOperator::Minus => write!(f, "-"),
            BinaryOperator::Times => write!(f, "*"),
            BinaryOperator::Colon => write!(f, ":"),
            BinaryOperator::Power => write!(f, "^"),
            BinaryOperator::Divide => write!(f, "/"),
        }
    }
}

/// Check if an expression needs parentheses based on operator precedence
fn needs_parens(expr: &FormulaExpr, parent_op: &BinaryOperator, is_left: bool) -> bool {
    match expr {
        FormulaExpr::BinaryOp(_, op, _) => {
            let expr_prec = operator_precedence(op);
            let parent_prec = operator_precedence(parent_op);
            
            if expr_prec < parent_prec {
                true
            } else if expr_prec == parent_prec {
                // For same precedence, left-associative operators need parens on right
                match parent_op {
                    BinaryOperator::Plus | BinaryOperator::Minus | BinaryOperator::Times | BinaryOperator::Divide => {
                        !is_left
                    }
                    BinaryOperator::Colon | BinaryOperator::Power => {
                        false // Right-associative
                    }
                }
            } else {
                false
            }
        }
        _ => false,
    }
}

/// Get operator precedence (higher number = higher precedence)
fn operator_precedence(op: &BinaryOperator) -> usize {
    match op {
        BinaryOperator::Power => 4,
        BinaryOperator::Times | BinaryOperator::Divide => 3,
        BinaryOperator::Colon => 2,
        BinaryOperator::Plus | BinaryOperator::Minus => 1,
    }
}
