use super::kendall_correlation_test::kendall_test;
use super::pearson_correlation_test::pearson_test;
use super::spearman_correlation_test::spearman_test;
use crate::stats::helpers::wasm_helpers::parse_alternative;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn pearson_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> Result<JsValue, JsValue> {
    let alt_type = parse_alternative(alternative);
    let result = pearson_test(x, y, alt_type, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn spearman_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
) -> Result<JsValue, JsValue> {
    let alt_type = parse_alternative(alternative);
    let result = spearman_test(x, y, alt_type, alpha)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn kendall_correlation_test(
    x: &[f64],
    y: &[f64],
    alternative: &str,
    alpha: f64,
    exact: Option<bool>,
) -> Result<JsValue, JsValue> {
    let alt_type = parse_alternative(alternative);
    let result = kendall_test(x, y, alt_type, alpha, exact)
        .map_err(|e| JsValue::from_str(&e))?;
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
