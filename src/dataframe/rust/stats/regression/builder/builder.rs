//! High-level model construction API - modularized
//!
//! This module provides a fluent builder interface for constructing statistical models,
//! coordinating the formula parsing, model frame creation, and design matrix construction.
//!
//! The builder pattern makes it easy to create models step by step with clear,
//! readable code.

// Module declarations
pub mod builder;

// Re-export everything from the builder module for backward compatibility
pub use builder::*;
