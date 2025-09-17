//! Formula types and structures

use std::fmt;

/// Represents a parsed model formula with terms and metadata
#[derive(Debug, Clone)]
pub struct Formula {
    /// The parsed formula expression
    pub expr: FormulaExpr,
    /// Environment for the formula
    pub environment: Option<String>,
}

/// Formula expression types
#[derive(Debug, Clone)]
pub enum FormulaExpr {
    /// Simple formula: ~ rhs
    Tilde(Box<FormulaExpr>),
    /// Formula with response: lhs ~ rhs
    Formula(Box<FormulaExpr>, Box<FormulaExpr>),
    /// Variable reference
    Variable(String),
    /// Number literal
    Number(f64),
    /// Function call
    Call(String, Vec<FormulaExpr>),
    /// Binary operation
    BinaryOp(Box<FormulaExpr>, BinaryOperator, Box<FormulaExpr>),
    /// Parenthesized expression
    Paren(Box<FormulaExpr>),
    /// Dot (all variables)
    Dot,
    /// Intercept term
    Intercept,
}

/// Binary operators in formulas
#[derive(Debug, Clone, PartialEq)]
pub enum BinaryOperator {
    Plus,    // +
    Minus,   // -
    Times,   // *
    Colon,   // :
    Power,   // ^
    Divide,  // /
}

/// Terms object representing expanded formula terms
#[derive(Debug, Clone)]
pub struct Terms {
    /// All variables in the formula
    pub variables: Vec<String>,
    /// Whether the formula has a response variable
    pub response: bool,
    /// Whether the formula includes an intercept
    pub intercept: bool,
    /// List of terms in the formula
    pub terms: Vec<Term>,
    /// Order of terms
    pub order: Vec<usize>,
}

/// Individual term in a formula
#[derive(Debug, Clone)]
pub struct Term {
    /// Variables in this term
    pub variables: Vec<String>,
    /// Order of the term
    pub order: usize,
}

/// Formula parsing errors
#[derive(Debug, Clone)]
pub enum FormulaError {
    InvalidCharacter(char, usize),
    UnexpectedToken(String, usize),
    MismatchedParentheses,
    EmptyFormula,
    InvalidOperator(String),
    ParseError(String),
}

impl fmt::Display for FormulaError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            FormulaError::InvalidCharacter(c, pos) => {
                write!(f, "Invalid character '{}' at position {}", c, pos)
            }
            FormulaError::UnexpectedToken(token, pos) => {
                write!(f, "Unexpected token '{}' at position {}", token, pos)
            }
            FormulaError::MismatchedParentheses => {
                write!(f, "Mismatched parentheses in formula")
            }
            FormulaError::EmptyFormula => {
                write!(f, "Empty formula")
            }
            FormulaError::InvalidOperator(op) => {
                write!(f, "Invalid operator: {}", op)
            }
            FormulaError::ParseError(msg) => {
                write!(f, "Parse error: {}", msg)
            }
        }
    }
}

impl std::error::Error for FormulaError {}

impl From<FormulaError> for String {
    fn from(err: FormulaError) -> String {
        format!("{}", err)
    }
}
