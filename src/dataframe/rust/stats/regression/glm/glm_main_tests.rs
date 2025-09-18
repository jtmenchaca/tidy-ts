//! GLM main tests module
//!
//! This file contains tests for the GLM main functions.

// Unused imports removed
use super::glm_main::{glm, glm_gaussian};
use std::collections::HashMap;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_glm_basic() {
        let data = HashMap::new();
        let result = glm(
            "y ~ x".to_string(),
            None,
            Some(data),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        );
        // This will fail until we implement proper model frame creation
        assert!(result.is_err());
    }

    #[test]
    fn test_glm_validation() {
        let data = HashMap::new();

        // Test negative weights
        let weights = vec![1.0, -1.0];
        let result = glm(
            "y ~ x".to_string(),
            None,
            Some(data),
            Some(weights),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_glm_gaussian() {
        let data = HashMap::new();
        let result = glm_gaussian(
            "y ~ x".to_string(),
            Some(data),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        );
        // This will fail until we implement proper model frame creation
        assert!(result.is_err());
    }
}
