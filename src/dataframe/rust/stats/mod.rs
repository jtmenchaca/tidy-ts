//! Statistical functions and distributions for tidy-ts
//!
//! This module provides comprehensive statistical functionality including:
//! - Probability distributions (normal, binomial, chi-squared, etc.)
//! - Statistical tests (t-tests, ANOVA, chi-square tests, etc.)
//! - Common statistical utilities and helpers
//!
//! The module is organized into several submodules:
//! - `core`: Core statistical types, utilities, and error handling
//! - `distributions`: Probability distribution functions
//! - `extensions`: Statistical helper functions and data manipulation traits
//! - `statistical_tests`: Hypothesis testing functions
//! - `helpers`: Helper functions for WASM bindings and common operations

pub mod core;
pub mod distributions;
pub mod extensions;
pub mod helpers;
pub mod statistical_tests;
