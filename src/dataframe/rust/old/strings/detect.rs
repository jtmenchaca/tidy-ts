//! String pattern detection functionality
//!
//! Provides functions to detect patterns in strings, similar to R's str_detect.

use regex::Regex;

/// Detect if a pattern exists in a string
///
/// # Arguments
/// * `string` - The input string to search in
/// * `pattern` - The pattern to search for (can be literal or regex)
/// * `negate` - If true, returns the opposite result
///
/// # Returns
/// * `true` if pattern is found (or not found if negate=true), `false` otherwise
pub fn str_detect(string: &str, pattern: &str, negate: bool) -> bool {
    let result = if pattern.starts_with('^')
        || pattern.contains('[')
        || pattern.contains('*')
        || pattern.contains('+')
        || pattern.contains('?')
        || pattern.contains('|')
        || pattern.contains('(')
        || pattern.contains("\\d")
        || pattern.contains("\\w")
        || pattern.contains("\\s")
        || pattern.contains("\\b")
        || pattern.contains('{')
        || pattern.contains('}')
    {
        // Treat as regex
        match Regex::new(pattern) {
            Ok(re) => re.is_match(string),
            Err(_) => false, // Invalid regex returns false
        }
    } else {
        // Treat as literal string
        string.contains(pattern)
    };

    if negate { !result } else { result }
}

/// Detect patterns in multiple strings
///
/// # Arguments
/// * `strings` - Vector of strings to search in
/// * `pattern` - The pattern to search for
/// * `negate` - If true, returns the opposite results
///
/// # Returns
/// * Vector of boolean results
pub fn str_detect_vectorized(strings: &[String], pattern: &str, negate: bool) -> Vec<bool> {
    strings
        .iter()
        .map(|s| str_detect(s, pattern, negate))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_literal_detection() {
        assert_eq!(str_detect("hello world", "hello", false), true);
        assert_eq!(str_detect("hello world", "xyz", false), false);
    }

    #[test]
    fn test_regex_detection() {
        assert_eq!(str_detect("hello123", r"\d+", false), true);
        assert_eq!(str_detect("hello", r"\d+", false), false);
        assert_eq!(
            str_detect("test@email.com", r"^[\w\.-]+@[\w\.-]+\.\w+$", false),
            true
        );
    }

    #[test]
    fn test_negate() {
        assert_eq!(str_detect("hello world", "hello", true), false);
        assert_eq!(str_detect("hello world", "xyz", true), true);
    }

    #[test]
    fn test_vectorized() {
        let strings = vec![
            "apple".to_string(),
            "banana".to_string(),
            "cherry".to_string(),
        ];
        let results = str_detect_vectorized(&strings, "a", false);
        assert_eq!(results, vec![true, true, false]);
    }
}
