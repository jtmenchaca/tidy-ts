//! String length functionality
//!
//! Provides functions to calculate string lengths, similar to R's str_length.

/// Calculate the length of a string in characters (not bytes)
/// 
/// # Arguments
/// * `string` - The input string
/// 
/// # Returns
/// * Number of Unicode characters in the string
pub fn str_length(string: &str) -> usize {
    string.chars().count()
}

/// Calculate the length of a string in bytes
/// 
/// # Arguments
/// * `string` - The input string
/// 
/// # Returns
/// * Number of bytes in the string's UTF-8 encoding
pub fn str_length_bytes(string: &str) -> usize {
    string.len()
}

/// Calculate character lengths for multiple strings
/// 
/// # Arguments
/// * `strings` - Vector of strings
/// 
/// # Returns
/// * Vector of character counts
pub fn str_length_vectorized(strings: &[String]) -> Vec<usize> {
    strings.iter()
        .map(|s| str_length(s))
        .collect()
}

/// Calculate byte lengths for multiple strings
/// 
/// # Arguments
/// * `strings` - Vector of strings
/// 
/// # Returns
/// * Vector of byte counts
pub fn str_length_bytes_vectorized(strings: &[String]) -> Vec<usize> {
    strings.iter()
        .map(|s| str_length_bytes(s))
        .collect()
}

/// Calculate the width of a string (considering display width)
/// This is a simple approximation - actual display width depends on font and terminal
/// 
/// # Arguments
/// * `string` - The input string
/// 
/// # Returns
/// * Estimated display width
pub fn str_width(string: &str) -> usize {
    string.chars().map(|c| {
        match c {
            // ASCII characters have width 1
            '\x00'..='\x7F' => 1,
            // Most Unicode characters have width 1, but this is a simplification
            // In a full implementation, you'd use a Unicode width table
            _ => 1,
        }
    }).sum()
}

/// Calculate display widths for multiple strings
/// 
/// # Arguments
/// * `strings` - Vector of strings
/// 
/// # Returns
/// * Vector of estimated display widths
pub fn str_width_vectorized(strings: &[String]) -> Vec<usize> {
    strings.iter()
        .map(|s| str_width(s))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_length() {
        assert_eq!(str_length("hello"), 5);
        assert_eq!(str_length(""), 0);
        assert_eq!(str_length("hello world"), 11);
    }

    #[test]
    fn test_unicode_length() {
        assert_eq!(str_length("café"), 4); // é is one character
        assert_eq!(str_length("🦀"), 1); // emoji is one character
        assert_eq!(str_length("नमस्ते"), 6); // Hindi characters
    }

    #[test]
    fn test_bytes_vs_chars() {
        let text = "café";
        assert_eq!(str_length(text), 4); // 4 characters
        assert_eq!(str_length_bytes(text), 5); // 5 bytes (é = 2 bytes)
    }

    #[test]
    fn test_vectorized() {
        let strings = vec![
            "hello".to_string(),
            "world".to_string(),
            "".to_string(),
            "café".to_string(),
        ];
        let results = str_length_vectorized(&strings);
        assert_eq!(results, vec![5, 5, 0, 4]);
    }

    #[test]
    fn test_width() {
        assert_eq!(str_width("hello"), 5);
        assert_eq!(str_width("café"), 4);
        // Note: Real width calculation for emojis and CJK characters would be more complex
    }
}