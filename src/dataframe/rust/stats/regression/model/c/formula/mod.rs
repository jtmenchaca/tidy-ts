//! Formula parsing and term expansion for statistical models - modularized
//!
//! This module provides functionality equivalent to R's `formula()` and `terms()` functions,
//! which parse model formulas and expand them into model terms.
//!
//! The formula parser handles operators like `+`, `*`, `:`, `^`, `/`, and `-`,
//! and supports special terms like interactions and nesting.

// Module declarations
pub mod formula_types;
pub mod formula_parser;
pub mod formula_terms;
pub mod formula_utils;
pub mod formula_display;
pub mod formula_tests;

// Re-export main types
pub use formula_types::{
    Formula, FormulaExpr, BinaryOperator, Terms, Term, FormulaError
};

// Re-export main functions
pub use formula_utils::{
    formula, df2formula, update_formula, reformulate
};
pub use formula_terms::terms;
pub use formula_parser::{FormulaParser, parse_formula};
