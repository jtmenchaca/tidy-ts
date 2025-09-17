//! WASM bindings for post-hoc tests

#![cfg(feature = "wasm")]

use super::{tukey_hsd, games_howell, dunn_test};
use super::types::{PostHocResult, PairwiseComparison};
use wasm_bindgen::prelude::*;

/// WASM export for Tukey HSD test
#[wasm_bindgen]
pub fn tukey_hsd_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> String {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return format!(r#"[{{"test_name":"Tukey HSD","error_message":"Group sizes exceed data length"}}, []]"#);
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let (result, comparisons) = tukey_hsd(&groups, alpha);
    
    // Manual JSON serialization
    format_post_hoc_result(&result, &comparisons)
}

/// WASM export for Games-Howell test
#[wasm_bindgen]
pub fn games_howell_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> String {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return format!(r#"[{{"test_name":"Games-Howell","error_message":"Group sizes exceed data length"}}, []]"#);
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let (result, comparisons) = games_howell(&groups, alpha);
    
    // Manual JSON serialization
    format_post_hoc_result(&result, &comparisons)
}

/// WASM export for Dunn's test
#[wasm_bindgen]
pub fn dunn_test_wasm(data: &[f64], group_sizes: &[usize], alpha: f64) -> String {
    // Reconstruct groups from flattened data
    let mut groups = Vec::new();
    let mut start = 0;

    for &size in group_sizes {
        if start + size > data.len() {
            return format!(r#"[{{"test_name":"Dunn's Test","error_message":"Group sizes exceed data length"}}, []]"#);
        }
        groups.push(&data[start..start + size]);
        start += size;
    }

    let (result, comparisons) = dunn_test(&groups, alpha);
    
    // Manual JSON serialization
    format_post_hoc_result(&result, &comparisons)
}

/// Safe JSON number formatting to handle inf/NaN
fn format_json_number(value: f64) -> String {
    if value.is_infinite() {
        if value.is_sign_positive() {
            "1e308".to_string()  // Large positive number instead of inf
        } else {
            "-1e308".to_string() // Large negative number instead of -inf
        }
    } else if value.is_nan() {
        "null".to_string()
    } else {
        value.to_string()
    }
}

/// Format post-hoc result as JSON string manually (avoiding serde_json dependency)
fn format_post_hoc_result(result: &PostHocResult, comparisons: &[PairwiseComparison]) -> String {
    let mut json = String::new();
    json.push('[');
    
    // Format PostHocResult
    json.push('{');
    json.push_str(&format!(r#""test_name":"{}""#, result.test_name));
    
    if let Some(ref method) = result.correction_method {
        json.push_str(&format!(r#","correction_method":"{}""#, method));
    }
    
    if let Some(alpha) = result.alpha {
        json.push_str(&format!(r#","alpha":{}"#, format_json_number(alpha)));
    }
    
    if let Some(n_groups) = result.n_groups {
        json.push_str(&format!(r#","n_groups":{}"#, n_groups));
    }
    
    if let Some(n_total) = result.n_total {
        json.push_str(&format!(r#","n_total":{}"#, n_total));
    }
    
    if let Some(ref error) = result.error_message {
        json.push_str(&format!(r#","error_message":"{}""#, error));
    }
    
    json.push('}');
    json.push(',');
    
    // Format comparisons array
    json.push('[');
    for (i, comp) in comparisons.iter().enumerate() {
        if i > 0 {
            json.push(',');
        }
        json.push('{');
        json.push_str(&format!(r#""group1":"{}","group2":"{}""#, comp.group1, comp.group2));
        
        if let Some(mean_diff) = comp.mean_difference {
            json.push_str(&format!(r#","mean_difference":{}"#, format_json_number(mean_diff)));
        }
        
        if let Some(se) = comp.std_error {
            json.push_str(&format!(r#","std_error":{}"#, format_json_number(se)));
        }
        
        if let Some(stat) = comp.test_statistic {
            json.push_str(&format!(r#","test_statistic":{}"#, format_json_number(stat)));
        }
        
        if let Some(p) = comp.p_value {
            json.push_str(&format!(r#","p_value":{}"#, format_json_number(p)));
        }
        
        if let Some(ci_l) = comp.ci_lower {
            json.push_str(&format!(r#","ci_lower":{}"#, format_json_number(ci_l)));
        }
        
        if let Some(ci_u) = comp.ci_upper {
            json.push_str(&format!(r#","ci_upper":{}"#, format_json_number(ci_u)));
        }
        
        if let Some(sig) = comp.significant {
            json.push_str(&format!(r#","significant":{}"#, sig));
        }
        
        if let Some(adj_p) = comp.adjusted_p_value {
            json.push_str(&format!(r#","adjusted_p_value":{}"#, format_json_number(adj_p)));
        }
        
        json.push('}');
    }
    json.push(']');
    
    json.push(']');
    json
}