//! GLM print helper functions
//!
//! This file contains helper functions for GLM printing.

use super::glm_print_core::{format_glm, print_glm};
use super::types_results::GlmResult;

/// Print GLM result with default digits
pub fn print_glm_default(x: &GlmResult) {
    print_glm(x, None);
}

/// Print GLM result with custom digits
pub fn print_glm_digits(x: &GlmResult, digits: usize) {
    print_glm(x, Some(digits));
}

/// Format GLM result with default digits
pub fn format_glm_default(x: &GlmResult) -> String {
    format_glm(x, None)
}

/// Format GLM result with custom digits
pub fn format_glm_digits(x: &GlmResult, digits: usize) -> String {
    format_glm(x, Some(digits))
}
