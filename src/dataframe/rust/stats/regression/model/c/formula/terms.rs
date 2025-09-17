//! Model terms handling
//!
//! This file contains functions for working with model terms objects,
//! equivalent to R's terms.R file.

use std::collections::HashMap;

/// Generic terms function
///
/// This is the main entry point for extracting terms from model objects.
/// It dispatches to the appropriate method based on the object type.
///
/// # Arguments
///
/// * `x` - The model object
///
/// # Returns
///
/// * `Result<Terms, String>` - The terms object or error
pub fn terms<T>(x: &T) -> Result<Terms, String>
where
    T: HasTerms,
{
    x.terms()
}

/// Default implementation for terms extraction
pub fn terms_default(x: &dyn HasTerms) -> Result<Terms, String> {
    x.terms()
}

/// Extract terms from a terms object (identity function)
pub fn terms_terms(terms: &Terms) -> Result<Terms, String> {
    Ok(terms.clone())
}

/// Print terms object
pub fn print_terms(terms: &Terms) {
    println!("{:?}", terms);
}

/// Get term labels from terms object
pub fn labels_terms(terms: &Terms) -> Vec<String> {
    terms.term_labels.clone()
}

/// Delete response from terms object
///
/// This is equivalent to R's delete.response() function
pub fn delete_response(terms: &Terms) -> Terms {
    let mut new_terms = terms.clone();

    if new_terms.response {
        // Remove response variable from variables list
        if !new_terms.variables.is_empty() {
            new_terms.variables.remove(0);
        }

        // Remove response from predvars
        if !new_terms.predvars.is_empty() {
            new_terms.predvars.remove(0);
        }

        // Update factors matrix by removing first row
        if !new_terms.factors.is_empty() {
            new_terms.factors.remove(0);
        }

        // Update offset indices
        new_terms.offset = new_terms
            .offset
            .iter()
            .map(|&idx| if idx > 0 { idx - 1 } else { idx })
            .collect();

        // Update specials indices
        for (_, indices) in new_terms.specials.iter_mut() {
            *indices = indices
                .iter()
                .map(|&idx| if idx > 0 { idx - 1 } else { idx })
                .collect();
        }

        // Set response to false
        new_terms.response = false;
    }

    new_terms
}

/// Reformulate function
///
/// This is equivalent to R's reformulate() function
pub fn reformulate(
    term_labels: Vec<String>,
    response: Option<String>,
    intercept: bool,
    env: Option<String>,
) -> Result<String, String> {
    if term_labels.is_empty() && intercept {
        return Ok("~ 1".to_string());
    }

    let mut formula_parts = Vec::new();

    // Add response if provided
    if let Some(resp) = response {
        formula_parts.push(resp);
    }

    // Add tilde
    formula_parts.push("~".to_string());

    // Add terms
    if term_labels.is_empty() {
        if intercept {
            formula_parts.push("1".to_string());
        } else {
            return Err("Cannot create formula with no terms and no intercept".to_string());
        }
    } else {
        let terms_str = if intercept {
            term_labels.join(" + ")
        } else {
            format!("{} - 1", term_labels.join(" + "))
        };
        formula_parts.push(terms_str);
    }

    Ok(formula_parts.join(" "))
}

/// Drop terms function
///
/// This is equivalent to R's drop.terms() function
pub fn drop_terms(
    term_obj: &Terms,
    dropx: Option<Vec<usize>>,
    keep_response: bool,
) -> Result<Terms, String> {
    if dropx.is_none() {
        return if keep_response {
            Ok(term_obj.clone())
        } else {
            Ok(delete_response(term_obj))
        };
    }

    let drop_indices = dropx.unwrap();
    let mut new_terms = term_obj.clone();

    // Remove dropped terms from term labels
    let mut new_term_labels = Vec::new();
    for (i, label) in new_terms.term_labels.iter().enumerate() {
        if !drop_indices.contains(&i) {
            new_term_labels.push(label.clone());
        }
    }
    new_terms.term_labels = new_term_labels;

    // Update factors matrix
    let mut new_factors = Vec::new();
    for (i, factor_row) in new_terms.factors.iter().enumerate() {
        if !drop_indices.contains(&i) {
            new_factors.push(factor_row.clone());
        }
    }
    new_terms.factors = new_factors;

    // Update order
    let mut new_order = Vec::new();
    for (i, &order) in new_terms.order.iter().enumerate() {
        if !drop_indices.contains(&i) {
            new_order.push(order);
        }
    }
    new_terms.order = new_order;

    // Update predvars
    let mut new_predvars = Vec::new();
    for (i, predvar) in new_terms.predvars.iter().enumerate() {
        if !drop_indices.contains(&i) {
            new_predvars.push(predvar.clone());
        }
    }
    new_terms.predvars = new_predvars;

    // Update data classes
    let mut new_data_classes = std::collections::HashMap::new();
    for (i, (key, value)) in new_terms.data_classes.iter().enumerate() {
        if !drop_indices.contains(&i) {
            new_data_classes.insert(key.clone(), value.clone());
        }
    }
    new_terms.data_classes = new_data_classes;

    Ok(new_terms)
}

/// Terms indexing function
///
/// This is equivalent to R's [.terms function
pub fn terms_index(term_obj: &Terms, i: Vec<usize>) -> Result<Terms, String> {
    if i.is_empty() {
        return Err("Index vector cannot be empty".to_string());
    }

    let mut new_terms = term_obj.clone();

    // Get response if it exists
    let response = if new_terms.response {
        Some(new_terms.variables[0].clone())
    } else {
        None
    };

    // Create new term labels from indices
    let mut new_term_labels = Vec::new();
    for &idx in &i {
        if idx < new_terms.term_labels.len() {
            new_term_labels.push(new_terms.term_labels[idx].clone());
        } else {
            return Err(format!("Index {} out of bounds", idx));
        }
    }
    new_terms.term_labels = new_term_labels;

    // Update factors matrix
    let mut new_factors = Vec::new();
    for &idx in &i {
        if idx < new_terms.factors.len() {
            new_factors.push(new_terms.factors[idx].clone());
        }
    }
    new_terms.factors = new_factors;

    // Update order
    let mut new_order = Vec::new();
    for &idx in &i {
        if idx < new_terms.order.len() {
            new_order.push(new_terms.order[idx]);
        }
    }
    new_terms.order = new_order;

    // Update predvars
    let mut new_predvars = Vec::new();
    for &idx in &i {
        if idx < new_terms.predvars.len() {
            new_predvars.push(new_terms.predvars[idx].clone());
        }
    }
    new_terms.predvars = new_predvars;

    // Update data classes
    let mut new_data_classes = std::collections::HashMap::new();
    for &idx in &i {
        if idx < new_terms.data_classes.len() {
            let key = new_terms.data_classes.keys().nth(idx).unwrap();
            let value = new_terms.data_classes.get(key).unwrap();
            new_data_classes.insert(key.clone(), value.clone());
        }
    }
    new_terms.data_classes = new_data_classes;

    // If no terms left, add intercept
    if new_terms.term_labels.is_empty() {
        new_terms.term_labels.push("1".to_string());
        new_terms.intercept = true;
    }

    Ok(new_terms)
}

/// Terms formula function
pub fn terms_formula(
    x: &str,
    specials: Option<Vec<String>>,
    data: Option<&HashMap<String, Vec<f64>>>,
    neg_out: bool,
    keep_order: bool,
    simplify: bool,
    allow_dot_as_name: bool,
) -> Result<Terms, String> {
    // TODO: Implement actual terms.formula functionality
    // This is a placeholder that matches the R function signature
    Ok(Terms {
        formula: x.to_string(),
        variables: vec!["y".to_string(), "x1".to_string(), "x2".to_string()],
        term_labels: vec!["x1".to_string(), "x2".to_string()],
        factors: vec![vec![0, 1, 0], vec![0, 0, 1]],
        response: true,
        intercept: true,
        order: vec![1, 1],
        specials: HashMap::new(),
        offset: vec![],
        data_classes: HashMap::new(),
        predvars: vec!["x1".to_string(), "x2".to_string()],
        xlevels: HashMap::new(),
    })
}

/// Model terms object
#[derive(Debug, Clone)]
pub struct Terms {
    pub formula: String,
    pub variables: Vec<String>,
    pub term_labels: Vec<String>,
    pub factors: Vec<Vec<usize>>,
    pub response: bool,
    pub intercept: bool,
    pub order: Vec<usize>,
    pub specials: HashMap<String, Vec<usize>>,
    pub offset: Vec<usize>,
    pub data_classes: HashMap<String, String>,
    pub predvars: Vec<String>,
    pub xlevels: HashMap<String, Vec<String>>,
}

/// Trait for objects that have terms
pub trait HasTerms {
    fn terms(&self) -> Result<Terms, String>;
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_terms_creation() {
        let terms = Terms {
            formula: "y ~ x1 + x2".to_string(),
            variables: vec!["y".to_string(), "x1".to_string(), "x2".to_string()],
            term_labels: vec!["x1".to_string(), "x2".to_string()],
            factors: vec![vec![0, 1, 0], vec![0, 0, 1]],
            response: true,
            intercept: true,
            order: vec![1, 1],
            specials: HashMap::new(),
            offset: vec![],
            data_classes: HashMap::new(),
            predvars: vec!["x1".to_string(), "x2".to_string()],
            xlevels: HashMap::new(),
        };

        assert_eq!(terms.formula, "y ~ x1 + x2");
        assert_eq!(terms.variables.len(), 3);
        assert_eq!(terms.term_labels.len(), 2);
        assert!(terms.response);
        assert!(terms.intercept);
    }
}
