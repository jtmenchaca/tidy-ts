//! Helper functions for WASM bindings

#![cfg(feature = "wasm")]

use crate::stats::core::AlternativeType;

/// Helper function to convert string alternative to AlternativeType
pub fn parse_alternative(alternative: &str) -> AlternativeType {
    AlternativeType::from_str(alternative)
}
