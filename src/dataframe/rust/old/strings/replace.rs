//! String pattern replacement functionality
//!
//! Provides functions to replace patterns in strings, similar to R's str_replace.

use regex::Regex;

/// Replace first occurrence of a pattern in a string
///
/// # Arguments
/// * `string` - The input string
/// * `pattern` - The pattern to replace (can be literal or regex)
/// * `replacement` - The replacement string
///
/// # Returns
/// * New string with first occurrence replaced
pub fn str_replace(string: &str, pattern: &str, replacement: &str) -> String {
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
            Ok(re) => re.replace(string, replacement).into_owned(),
            Err(_) => string.to_string(), // Invalid regex returns original string
        }
    } else {
        // Treat as literal string - replace first occurrence
        if let Some(pos) = string.find(pattern) {
            let mut result = String::with_capacity(string.len() + replacement.len());
            result.push_str(&string[..pos]);
            result.push_str(replacement);
            result.push_str(&string[pos + pattern.len()..]);
            result
        } else {
            string.to_string()
        }
    }
}

/// Replace all occurrences of a pattern in a string
///
/// # Arguments
/// * `string` - The input string
/// * `pattern` - The pattern to replace (can be literal or regex)
/// * `replacement` - The replacement string
///
/// # Returns
/// * New string with all occurrences replaced
pub fn str_replace_all(string: &str, pattern: &str, replacement: &str) -> String {
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
            Ok(re) => re.replace_all(string, replacement).into_owned(),
            Err(_) => string.to_string(), // Invalid regex returns original string
        }
    } else {
        // Treat as literal string - replace all occurrences
        string.replace(pattern, replacement)
    }
}

/// Replace first occurrence in multiple strings
///
/// # Arguments
/// * `strings` - Vector of strings to process
/// * `pattern` - The pattern to replace
/// * `replacement` - The replacement string
///
/// # Returns
/// * Vector of modified strings
pub fn str_replace_vectorized(strings: &[String], pattern: &str, replacement: &str) -> Vec<String> {
    strings
        .iter()
        .map(|s| str_replace(s, pattern, replacement))
        .collect()
}

/// Replace all occurrences in multiple strings
///
/// # Arguments
/// * `strings` - Vector of strings to process
/// * `pattern` - The pattern to replace
/// * `replacement` - The replacement string
///
/// # Returns
/// * Vector of modified strings
pub fn str_replace_all_vectorized(
    strings: &[String],
    pattern: &str,
    replacement: &str,
) -> Vec<String> {
    strings
        .iter()
        .map(|s| str_replace_all(s, pattern, replacement))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_literal_replace() {
        assert_eq!(
            str_replace("hello world hello", "hello", "hi"),
            "hi world hello"
        );
        assert_eq!(
            str_replace_all("hello world hello", "hello", "hi"),
            "hi world hi"
        );
    }

    #[test]
    fn test_regex_replace() {
        assert_eq!(
            str_replace("hello123world456", r"\d+", "NUM"),
            "helloNUMworld456"
        );
        assert_eq!(
            str_replace_all("hello123world456", r"\d+", "NUM"),
            "helloNUMworldNUM"
        );
    }

    #[test]
    fn test_no_match() {
        assert_eq!(str_replace("hello world", "xyz", "abc"), "hello world");
        assert_eq!(str_replace_all("hello world", "xyz", "abc"), "hello world");
    }

    #[test]
    fn test_vectorized() {
        let strings = vec![
            "apple".to_string(),
            "banana".to_string(),
            "cherry".to_string(),
        ];
        let results = str_replace_vectorized(&strings, "a", "X");
        assert_eq!(
            results,
            vec![
                "Xpple".to_string(),
                "bXnana".to_string(),
                "cherry".to_string()
            ]
        );
    }
}
