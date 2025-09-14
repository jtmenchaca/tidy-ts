//! String pattern extraction functionality
//!
//! Provides functions to extract patterns from strings, similar to R's str_extract.

use regex::Regex;

/// Extract first match of a pattern from a string
///
/// # Arguments
/// * `string` - The input string to extract from
/// * `pattern` - The pattern to extract (can be literal or regex)
///
/// # Returns
/// * `Some(String)` with the first match, or `None` if no match found
pub fn str_extract(string: &str, pattern: &str) -> Option<String> {
    if pattern.starts_with('^')
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
            Ok(re) => {
                // Try to get captures first (for capture groups)
                if let Some(captures) = re.captures(string) {
                    // If we have capture groups, return the first one (index 1)
                    // Index 0 is the full match, index 1+ are the capture groups
                    if captures.len() > 1 {
                        captures.get(1).map(|m| m.as_str().to_string())
                    } else {
                        // No capture groups, return the full match
                        captures.get(0).map(|m| m.as_str().to_string())
                    }
                } else {
                    // No captures found, try find as fallback
                    re.find(string).map(|m| m.as_str().to_string())
                }
            }
            Err(_) => None, // Invalid regex returns None
        }
    } else {
        // Treat as literal string
        string
            .find(pattern)
            .map(|pos| string[pos..pos + pattern.len()].to_string())
    }
}

/// Extract all matches of a pattern from a string
///
/// # Arguments
/// * `string` - The input string to extract from
/// * `pattern` - The pattern to extract (can be literal or regex)
///
/// # Returns
/// * Vector of all matches found
pub fn str_extract_all(string: &str, pattern: &str) -> Vec<String> {
    if pattern.starts_with('^')
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
            Ok(re) => re
                .find_iter(string)
                .map(|m| m.as_str().to_string())
                .collect(),
            Err(_) => vec![], // Invalid regex returns empty vector
        }
    } else {
        // Treat as literal string - find all occurrences
        let mut matches = Vec::new();
        let mut start = 0;
        while let Some(pos) = string[start..].find(pattern) {
            let actual_pos = start + pos;
            matches.push(string[actual_pos..actual_pos + pattern.len()].to_string());
            start = actual_pos + pattern.len();
        }
        matches
    }
}

/// Extract first match from multiple strings
///
/// # Arguments
/// * `strings` - Vector of strings to extract from
/// * `pattern` - The pattern to extract
///
/// # Returns
/// * Vector of Option<String> with first matches
pub fn str_extract_vectorized(strings: &[String], pattern: &str) -> Vec<Option<String>> {
    strings.iter().map(|s| str_extract(s, pattern)).collect()
}

/// Extract all matches from multiple strings
///
/// # Arguments
/// * `strings` - Vector of strings to extract from
/// * `pattern` - The pattern to extract
///
/// # Returns
/// * Vector of vectors with all matches
pub fn str_extract_all_vectorized(strings: &[String], pattern: &str) -> Vec<Vec<String>> {
    strings
        .iter()
        .map(|s| str_extract_all(s, pattern))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_literal_extract() {
        assert_eq!(
            str_extract("hello world hello", "hello"),
            Some("hello".to_string())
        );
        assert_eq!(str_extract("hello world", "xyz"), None);
    }

    #[test]
    fn test_regex_extract() {
        assert_eq!(
            str_extract("hello123world456", r"\d+"),
            Some("123".to_string())
        );
        assert_eq!(str_extract("hello world", r"\d+"), None);
    }

    #[test]
    fn test_extract_all() {
        let result = str_extract_all("hello123world456", r"\d+");
        assert_eq!(result, vec!["123".to_string(), "456".to_string()]);

        let result = str_extract_all("hello world hello", "hello");
        assert_eq!(result, vec!["hello".to_string(), "hello".to_string()]);
    }

    #[test]
    fn test_vectorized() {
        let strings = vec![
            "apple123".to_string(),
            "banana".to_string(),
            "cherry456".to_string(),
        ];
        let results = str_extract_vectorized(&strings, r"\d+");
        assert_eq!(
            results,
            vec![Some("123".to_string()), None, Some("456".to_string())]
        );
    }
}
