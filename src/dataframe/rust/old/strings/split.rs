//! String splitting functionality
//!
//! Provides functions to split strings by patterns, similar to R's str_split.

use regex::Regex;

/// Split a string by a pattern
/// 
/// # Arguments
/// * `string` - The input string to split
/// * `pattern` - The pattern to split by (can be literal or regex)
/// * `n` - Maximum number of pieces to split into (None for unlimited)
/// 
/// # Returns
/// * Vector of string pieces
pub fn str_split(string: &str, pattern: &str, n: Option<usize>) -> Vec<String> {
    let max_splits = n.map(|x| x.saturating_sub(1));
    
    if pattern.starts_with('^') || pattern.contains('[') || pattern.contains('*') || pattern.contains('+') || pattern.contains('?') || pattern.contains('|') || pattern.contains('(') || pattern.contains("\\d") || pattern.contains("\\w") || pattern.contains("\\s") || pattern.contains("\\b") || pattern.contains('{') || pattern.contains('}') {
        // Treat as regex
        match Regex::new(pattern) {
            Ok(re) => {
                if let Some(limit) = max_splits {
                    re.splitn(string, limit + 1)
                        .map(|s| s.to_string())
                        .collect()
                } else {
                    re.split(string)
                        .map(|s| s.to_string())
                        .collect()
                }
            },
            Err(_) => vec![string.to_string()], // Invalid regex returns original string
        }
    } else {
        // Treat as literal string
        if let Some(limit) = max_splits {
            string.splitn(limit + 1, pattern)
                .map(|s| s.to_string())
                .collect()
        } else {
            string.split(pattern)
                .map(|s| s.to_string())
                .collect()
        }
    }
}

/// Split a string by a fixed pattern into exactly n pieces
/// 
/// # Arguments
/// * `string` - The input string to split
/// * `pattern` - The pattern to split by
/// * `n` - Exact number of pieces to return
/// 
/// # Returns
/// * Vector of exactly n strings (padded with empty strings if needed)
pub fn str_split_fixed(string: &str, pattern: &str, n: usize) -> Vec<String> {
    let mut parts = str_split(string, pattern, Some(n));
    
    // Pad with empty strings if we have fewer than n parts
    while parts.len() < n {
        parts.push(String::new());
    }
    
    // Truncate if we have more than n parts (shouldn't happen with limit, but safety)
    parts.truncate(n);
    
    parts
}

/// Split strings by a pattern (vectorized)
/// 
/// # Arguments
/// * `strings` - Vector of strings to split
/// * `pattern` - The pattern to split by
/// * `n` - Maximum number of pieces to split into (None for unlimited)
/// 
/// # Returns
/// * Vector of vectors with split results
pub fn str_split_vectorized(strings: &[String], pattern: &str, n: Option<usize>) -> Vec<Vec<String>> {
    strings.iter()
        .map(|s| str_split(s, pattern, n))
        .collect()
}

/// Split strings into exactly n pieces (vectorized)
/// 
/// # Arguments
/// * `strings` - Vector of strings to split
/// * `pattern` - The pattern to split by
/// * `n` - Exact number of pieces to return for each string
/// 
/// # Returns
/// * Vector of vectors with exactly n strings each
pub fn str_split_fixed_vectorized(strings: &[String], pattern: &str, n: usize) -> Vec<Vec<String>> {
    strings.iter()
        .map(|s| str_split_fixed(s, pattern, n))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_literal_split() {
        let result = str_split("a,b,c,d", ",", None);
        assert_eq!(result, vec!["a", "b", "c", "d"]);
        
        let result = str_split("a,b,c,d", ",", Some(3));
        assert_eq!(result, vec!["a", "b", "c,d"]);
    }

    #[test]
    fn test_regex_split() {
        let result = str_split("a1b2c3d", r"\d", None);
        assert_eq!(result, vec!["a", "b", "c", "d"]);
        
        let result = str_split("a  b    c", r"\s+", None);
        assert_eq!(result, vec!["a", "b", "c"]);
    }

    #[test]
    fn test_split_fixed() {
        let result = str_split_fixed("a,b,c", ",", 5);
        assert_eq!(result, vec!["a", "b", "c", "", ""]);
        
        let result = str_split_fixed("a,b,c,d,e", ",", 3);
        assert_eq!(result, vec!["a", "b", "c,d,e"]);
    }

    #[test]
    fn test_vectorized() {
        let strings = vec![
            "a,b,c".to_string(),
            "x-y-z".to_string(),
            "single".to_string(),
        ];
        let results = str_split_vectorized(&strings, ",", None);
        assert_eq!(results, vec![
            vec!["a".to_string(), "b".to_string(), "c".to_string()],
            vec!["x-y-z".to_string()],
            vec!["single".to_string()],
        ]);
    }
}